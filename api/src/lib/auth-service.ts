import { createHash, randomBytes } from "node:crypto";

import bcrypt from "bcryptjs";
import { eq, lt } from "drizzle-orm";
import { v4 as uuid } from "uuid";

import { getDb, schema } from "@nutcrack/db";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const BCRYPT_COST = 10;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  email: string;
  role: "admin" | "user";
  user_metadata: Record<string, unknown>;
}

export interface CreatedSession {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  refresh_expires_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function generateOpaqueToken(): string {
  return randomBytes(32).toString("hex"); // 64 hex chars
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function rowToAuthUser(row: schema.User): AuthUser {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    user_metadata: (row.userMetadata ?? {}) as Record<string, unknown>,
  };
}

// ---------------------------------------------------------------------------
// User CRUD
// ---------------------------------------------------------------------------

export async function createUser(input: {
  email: string;
  password: string;
  role?: "admin" | "user";
  user_metadata?: Record<string, unknown>;
}): Promise<AuthUser> {
  const email = normalizeEmail(input.email);
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
  const now = new Date().toISOString();
  const row: schema.NewUser = {
    id: uuid(),
    email,
    passwordHash,
    role: input.role ?? "user",
    userMetadata: input.user_metadata ?? {},
    createdAt: now,
    updatedAt: now,
  };

  const db = getDb();
  try {
    const inserted = await db.insert(schema.users).values(row).returning();
    return rowToAuthUser(inserted[0]);
  } catch (err) {
    const message = (err as Error).message || "";
    if (message.includes("UNIQUE") && message.includes("users.email")) {
      throw new Error(`User with email '${email}' already exists`);
    }
    throw err;
  }
}

export async function updateUser(
  id: string,
  patch: {
    password?: string;
    user_metadata?: Record<string, unknown>;
    role?: "admin" | "user";
  },
): Promise<AuthUser> {
  const db = getDb();
  const updates: Partial<schema.NewUser> = {
    updatedAt: new Date().toISOString(),
  };

  if (patch.password !== undefined) {
    updates.passwordHash = await bcrypt.hash(patch.password, BCRYPT_COST);
  }
  if (patch.user_metadata !== undefined) {
    updates.userMetadata = patch.user_metadata;
  }
  if (patch.role !== undefined) {
    updates.role = patch.role;
  }

  const result = await db
    .update(schema.users)
    .set(updates)
    .where(eq(schema.users.id, id))
    .returning();

  if (result.length === 0) {
    throw new Error(`User '${id}' not found`);
  }
  return rowToAuthUser(result[0]);
}

export async function findUserByEmail(email: string): Promise<AuthUser | null> {
  const db = getDb();
  const normalized = normalizeEmail(email);
  const rows = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, normalized))
    .limit(1);
  return rows[0] ? rowToAuthUser(rows[0]) : null;
}

export async function findUserById(id: string): Promise<AuthUser | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1);
  return rows[0] ? rowToAuthUser(rows[0]) : null;
}

export async function listUsers(): Promise<AuthUser[]> {
  const db = getDb();
  const rows = await db.select().from(schema.users);
  return rows.map(rowToAuthUser);
}

export async function hasAnyUser(): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .limit(1);
  return rows.length > 0;
}

export async function hasInitializedAdmin(): Promise<boolean> {
  const users = await listUsers();
  return users.some(
    (u) => u.user_metadata?.admin_password_initialized === true,
  );
}

// ---------------------------------------------------------------------------
// Password verification
// ---------------------------------------------------------------------------

export async function verifyPassword(
  email: string,
  password: string,
): Promise<AuthUser | null> {
  const db = getDb();
  const normalized = normalizeEmail(email);
  const rows = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, normalized))
    .limit(1);
  const row = rows[0];
  if (!row) {
    return null;
  }
  const ok = await bcrypt.compare(password, row.passwordHash);
  if (!ok) {
    return null;
  }
  return rowToAuthUser(row);
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

async function pruneExpiredSessions(): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();
  try {
    await db
      .delete(schema.sessions)
      .where(lt(schema.sessions.refreshExpiresAt, now));
  } catch {
    // Opportunistic cleanup; never let pruning fail the caller.
  }
}

export async function createSession(userId: string): Promise<CreatedSession> {
  const db = getDb();
  const accessToken = generateOpaqueToken();
  const refreshToken = generateOpaqueToken();
  const now = Date.now();
  const expiresAt = new Date(now + ACCESS_TOKEN_TTL_MS).toISOString();
  const refreshExpiresAt = new Date(now + REFRESH_TOKEN_TTL_MS).toISOString();

  await db.insert(schema.sessions).values({
    accessTokenHash: hashToken(accessToken),
    refreshTokenHash: hashToken(refreshToken),
    userId,
    expiresAt,
    refreshExpiresAt,
    createdAt: new Date(now).toISOString(),
  });

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: expiresAt,
    refresh_expires_at: refreshExpiresAt,
  };
}

export async function getUserBySessionToken(
  accessToken: string,
): Promise<AuthUser | null> {
  if (!accessToken) {
    return null;
  }
  // Opportunistic cleanup of expired rows.
  await pruneExpiredSessions();

  const db = getDb();
  const tokenHash = hashToken(accessToken);
  const rows = await db
    .select({
      session: schema.sessions,
      user: schema.users,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(eq(schema.sessions.accessTokenHash, tokenHash))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }
  if (new Date(row.session.expiresAt).getTime() <= Date.now()) {
    return null;
  }
  return rowToAuthUser(row.user);
}

export async function refreshSession(
  refreshToken: string,
): Promise<CreatedSession | null> {
  if (!refreshToken) {
    return null;
  }
  const db = getDb();
  const refreshHash = hashToken(refreshToken);

  // Pre-check: look up the session by its refresh-token hash so we have the
  // user id and refresh expiry before we attempt to atomically claim the row.
  const existing = await db
    .select()
    .from(schema.sessions)
    .where(eq(schema.sessions.refreshTokenHash, refreshHash))
    .limit(1);
  const session = existing[0];
  if (!session) {
    return null;
  }

  // Reject if the refresh token is expired. Opportunistically drop the row.
  if (new Date(session.refreshExpiresAt).getTime() <= Date.now()) {
    await db
      .delete(schema.sessions)
      .where(eq(schema.sessions.accessTokenHash, session.accessTokenHash));
    return null;
  }

  // Generate the new token pair before opening the transaction so that
  // the txn body stays small and purely synchronous.
  const newAccessToken = generateOpaqueToken();
  const newRefreshToken = generateOpaqueToken();
  const now = Date.now();
  const expiresAt = new Date(now + ACCESS_TOKEN_TTL_MS).toISOString();
  const refreshExpiresAt = new Date(now + REFRESH_TOKEN_TTL_MS).toISOString();

  // Atomic rotation: in a single transaction, DELETE ... RETURNING the old
  // row by its primary key, and INSERT the new row. If a concurrent /refresh
  // already claimed the row, our DELETE returns zero rows and we throw a
  // sentinel error to roll back. Any other failure propagates.
  let raceLost = false;
  try {
    db.transaction((tx) => {
      const deleted = tx
        .delete(schema.sessions)
        .where(eq(schema.sessions.accessTokenHash, session.accessTokenHash))
        .returning({ id: schema.sessions.accessTokenHash })
        .all();
      if (deleted.length === 0) {
        raceLost = true;
        throw new Error("REFRESH_RACE_LOST");
      }
      tx.insert(schema.sessions)
        .values({
          accessTokenHash: hashToken(newAccessToken),
          refreshTokenHash: hashToken(newRefreshToken),
          userId: session.userId,
          expiresAt,
          refreshExpiresAt,
          createdAt: new Date(now).toISOString(),
        })
        .run();
    });
  } catch (err) {
    if (raceLost) {
      return null;
    }
    throw err;
  }

  return {
    access_token: newAccessToken,
    refresh_token: newRefreshToken,
    expires_at: expiresAt,
    refresh_expires_at: refreshExpiresAt,
  };
}

export async function revokeSession(accessToken: string): Promise<void> {
  if (!accessToken) {
    return;
  }
  const db = getDb();
  await db
    .delete(schema.sessions)
    .where(eq(schema.sessions.accessTokenHash, hashToken(accessToken)));
}

export async function revokeAllSessionsForUser(userId: string): Promise<void> {
  const db = getDb();
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, userId));
}
