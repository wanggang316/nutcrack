import { createHash } from "node:crypto";

import { beforeAll, beforeEach, describe, expect, it } from "vitest";

// IMPORTANT: set DATABASE_URL BEFORE importing @nutcrack/db so the cached
// singleton points at a fresh in-memory database for this test file.
process.env.DATABASE_URL = ":memory:";

const { runMigrations, getDb, schema } = await import("@nutcrack/db");
const auth = await import("../lib/auth-service.js");

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

beforeAll(() => {
  runMigrations();
});

beforeEach(async () => {
  const db = getDb();
  // sessions has FK -> users with cascade, but explicit clear keeps intent clear.
  await db.delete(schema.sessions);
  await db.delete(schema.users);
});

describe("createUser", () => {
  it("normalizes email to lowercase and trims whitespace", async () => {
    const user = await auth.createUser({
      email: "  Mixed.Case@Example.COM  ",
      password: "pw-123456",
    });
    expect(user.email).toBe("mixed.case@example.com");
  });

  it("defaults role to 'user' and stores user_metadata", async () => {
    const user = await auth.createUser({
      email: "u1@example.com",
      password: "pw-123456",
      user_metadata: { source: "test" },
    });
    expect(user.role).toBe("user");
    expect(user.user_metadata).toEqual({ source: "test" });
  });

  it("rejects duplicate email", async () => {
    await auth.createUser({ email: "dup@example.com", password: "pw-1" });
    await expect(
      auth.createUser({ email: "dup@example.com", password: "pw-2" }),
    ).rejects.toThrow(/already exists/);
  });

  it("rejects duplicate email regardless of case", async () => {
    await auth.createUser({ email: "case@example.com", password: "pw-1" });
    await expect(
      auth.createUser({ email: "CASE@example.com", password: "pw-2" }),
    ).rejects.toThrow(/already exists/);
  });

  it("stores password as bcrypt hash, not plaintext", async () => {
    const password = "super-secret-123";
    await auth.createUser({ email: "hash@example.com", password });
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.users)
      .where(eqUserEmail("hash@example.com"));
    expect(rows[0].passwordHash).not.toBe(password);
    // bcryptjs hashes start with a $2 prefix.
    expect(rows[0].passwordHash.startsWith("$2")).toBe(true);
  });
});

describe("verifyPassword", () => {
  beforeEach(async () => {
    await auth.createUser({
      email: "verify@example.com",
      password: "correct-horse",
    });
  });

  it("returns user on correct password", async () => {
    const user = await auth.verifyPassword(
      "verify@example.com",
      "correct-horse",
    );
    expect(user).not.toBeNull();
    expect(user?.email).toBe("verify@example.com");
  });

  it("returns null on wrong password", async () => {
    const user = await auth.verifyPassword("verify@example.com", "wrong-horse");
    expect(user).toBeNull();
  });

  it("returns null on unknown email", async () => {
    const user = await auth.verifyPassword("nobody@example.com", "anything");
    expect(user).toBeNull();
  });

  it("is case-insensitive on email", async () => {
    const user = await auth.verifyPassword(
      "VERIFY@Example.com",
      "correct-horse",
    );
    expect(user).not.toBeNull();
    expect(user?.email).toBe("verify@example.com");
  });
});

describe("createSession + getUserBySessionToken", () => {
  it("creates and retrieves a session", async () => {
    const user = await auth.createUser({
      email: "session@example.com",
      password: "pw-1",
    });
    const session = await auth.createSession(user.id);
    const fetched = await auth.getUserBySessionToken(session.access_token);
    expect(fetched?.id).toBe(user.id);
  });

  it("returns null for unknown token", async () => {
    const fetched = await auth.getUserBySessionToken("does-not-exist");
    expect(fetched).toBeNull();
  });

  it("returns null for empty token", async () => {
    const fetched = await auth.getUserBySessionToken("");
    expect(fetched).toBeNull();
  });

  it("returns null for expired access token", async () => {
    const user = await auth.createUser({
      email: "expired@example.com",
      password: "pw-1",
    });
    const db = getDb();
    const rawAccess = "raw-expired-access";
    const rawRefresh = "raw-expired-refresh";
    const past = new Date(Date.now() - 1000).toISOString();
    const future = new Date(Date.now() + 60_000).toISOString();
    await db.insert(schema.sessions).values({
      accessTokenHash: hashToken(rawAccess),
      refreshTokenHash: hashToken(rawRefresh),
      userId: user.id,
      expiresAt: past,
      refreshExpiresAt: future,
      createdAt: new Date().toISOString(),
    });
    const fetched = await auth.getUserBySessionToken(rawAccess);
    expect(fetched).toBeNull();
  });
});

describe("refreshSession", () => {
  it("rotates the session: old access token invalid, new pair valid", async () => {
    const user = await auth.createUser({
      email: "rotate@example.com",
      password: "pw-1",
    });
    const original = await auth.createSession(user.id);
    const rotated = await auth.refreshSession(original.refresh_token);
    expect(rotated).not.toBeNull();
    expect(rotated!.access_token).not.toBe(original.access_token);
    expect(rotated!.refresh_token).not.toBe(original.refresh_token);

    // Old access token is no longer valid.
    expect(await auth.getUserBySessionToken(original.access_token)).toBeNull();
    // New access token resolves to the same user.
    const fetched = await auth.getUserBySessionToken(rotated!.access_token);
    expect(fetched?.id).toBe(user.id);
  });

  it("returns null on empty refresh token", async () => {
    expect(await auth.refreshSession("")).toBeNull();
  });

  it("returns null on unknown refresh token", async () => {
    expect(await auth.refreshSession("never-issued")).toBeNull();
  });

  it("returns null when refresh token expired", async () => {
    const user = await auth.createUser({
      email: "refresh-exp@example.com",
      password: "pw-1",
    });
    const db = getDb();
    const rawAccess = "rA";
    const rawRefresh = "rR";
    const past = new Date(Date.now() - 1000).toISOString();
    await db.insert(schema.sessions).values({
      accessTokenHash: hashToken(rawAccess),
      refreshTokenHash: hashToken(rawRefresh),
      userId: user.id,
      expiresAt: past,
      refreshExpiresAt: past,
      createdAt: new Date().toISOString(),
    });
    expect(await auth.refreshSession(rawRefresh)).toBeNull();
    // Expired row was cleaned up.
    const remaining = await db.select().from(schema.sessions);
    expect(remaining.length).toBe(0);
  });

  it("returns null when refresh token already rotated (race-loser)", async () => {
    const user = await auth.createUser({
      email: "race@example.com",
      password: "pw-1",
    });
    const original = await auth.createSession(user.id);

    // Simulate concurrent rotation by deleting the row before our call.
    const db = getDb();
    await db.delete(schema.sessions);

    const result = await auth.refreshSession(original.refresh_token);
    expect(result).toBeNull();
  });
});

describe("revokeSession + revokeAllSessionsForUser", () => {
  it("revokeSession invalidates exactly one session", async () => {
    const user = await auth.createUser({
      email: "revoke@example.com",
      password: "pw-1",
    });
    const a = await auth.createSession(user.id);
    const b = await auth.createSession(user.id);
    await auth.revokeSession(a.access_token);
    expect(await auth.getUserBySessionToken(a.access_token)).toBeNull();
    expect(await auth.getUserBySessionToken(b.access_token)).not.toBeNull();
  });

  it("revokeAllSessionsForUser invalidates every session for that user", async () => {
    const u1 = await auth.createUser({
      email: "u1@example.com",
      password: "p",
    });
    const u2 = await auth.createUser({
      email: "u2@example.com",
      password: "p",
    });
    const s1a = await auth.createSession(u1.id);
    const s1b = await auth.createSession(u1.id);
    const s2 = await auth.createSession(u2.id);
    await auth.revokeAllSessionsForUser(u1.id);
    expect(await auth.getUserBySessionToken(s1a.access_token)).toBeNull();
    expect(await auth.getUserBySessionToken(s1b.access_token)).toBeNull();
    expect(await auth.getUserBySessionToken(s2.access_token)).not.toBeNull();
  });
});

describe("hasInitializedAdmin", () => {
  it("returns false initially", async () => {
    expect(await auth.hasInitializedAdmin()).toBe(false);
  });

  it("returns false when users exist but none is initialized", async () => {
    await auth.createUser({ email: "plain@example.com", password: "p" });
    expect(await auth.hasInitializedAdmin()).toBe(false);
  });

  it("returns true after admin_password_initialized is set in user_metadata", async () => {
    await auth.createUser({
      email: "admin@example.com",
      password: "p",
      role: "admin",
      user_metadata: { admin_password_initialized: true },
    });
    expect(await auth.hasInitializedAdmin()).toBe(true);
  });
});

describe("updateUser", () => {
  it("rotates password hash on password change", async () => {
    const user = await auth.createUser({
      email: "pwchange@example.com",
      password: "old-pw",
    });
    const db = getDb();
    const beforeRows = await db
      .select()
      .from(schema.users)
      .where(eqUserEmail("pwchange@example.com"));
    const oldHash = beforeRows[0].passwordHash;

    await auth.updateUser(user.id, { password: "new-pw" });

    const afterRows = await db
      .select()
      .from(schema.users)
      .where(eqUserEmail("pwchange@example.com"));
    expect(afterRows[0].passwordHash).not.toBe(oldHash);

    // Old password no longer verifies; new one does.
    expect(
      await auth.verifyPassword("pwchange@example.com", "old-pw"),
    ).toBeNull();
    expect(
      await auth.verifyPassword("pwchange@example.com", "new-pw"),
    ).not.toBeNull();
  });

  it("replaces user_metadata wholesale (does not merge)", async () => {
    // Observation: the implementation in lib/auth-service.ts assigns the
    // passed user_metadata directly, replacing previous fields. Callers that
    // need a merge must spread `existing.user_metadata` themselves (see the
    // /setup-password handler).
    const user = await auth.createUser({
      email: "meta@example.com",
      password: "p",
      user_metadata: { role: "admin", foo: "bar" },
    });
    const updated = await auth.updateUser(user.id, {
      user_metadata: { admin_password_initialized: true },
    });
    expect(updated.user_metadata).toEqual({ admin_password_initialized: true });
    expect(updated.user_metadata.foo).toBeUndefined();
  });

  it("throws when user does not exist", async () => {
    await expect(
      auth.updateUser("no-such-id", { password: "x" }),
    ).rejects.toThrow(/not found/);
  });
});

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function eqUserEmail(email: string) {
  // Lazy import to keep top-of-file imports concentrated on the public API.
  // drizzle's `eq` is purely functional — safe to import once at module scope.
  return drizzleEq(schema.users.email, email);
}

// Import drizzle's `eq` once after the dynamic @nutcrack/db import above.
const { eq: drizzleEq } = await import("drizzle-orm");
