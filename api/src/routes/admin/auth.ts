import { Hono } from "hono";

import {
  createSession,
  createUser,
  findUserByEmail,
  getUserBySessionToken,
  hasInitializedAdmin,
  normalizeEmail,
  refreshSession,
  revokeSession,
  updateUser,
  verifyPassword,
} from "../../lib/auth-service.js";
import { successResponse, errorResponse } from "../../lib/utils.js";
import { logError, logInfo } from "../../lib/logger.js";

const app = new Hono();

// POST /api/admin/auth/login
app.post("/login", async (c) => {
  const { email, password } = await c.req.json();
  try {
    if (!email || !password) {
      return c.json(
        errorResponse("VALIDATION_ERROR", "Email and password are required"),
        400,
      );
    }

    const user = await verifyPassword(String(email), String(password));
    if (!user) {
      return c.json(
        errorResponse("UNAUTHORIZED", "Invalid email or password"),
        401,
      );
    }

    const session = await createSession(user.id);

    return c.json(
      successResponse({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        user: {
          id: user.id,
          email: user.email,
        },
      }),
    );
  } catch (err) {
    logError("Login error", { error: err, email });
    return c.json(errorResponse("INTERNAL_ERROR", "Login failed"), 500);
  }
});

// POST /api/admin/auth/logout
app.post("/logout", async (c) => {
  const authorization = c.req.header("Authorization");
  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.slice(7);
    try {
      await revokeSession(token);
    } catch (err) {
      logError("Logout revoke error", { error: err });
      // Always return success to clients regardless of revoke outcome.
    }
  }
  return c.json(successResponse(null), 200);
});

// GET /api/admin/auth/me
app.get("/me", async (c) => {
  const authorization = c.req.header("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return c.json(errorResponse("UNAUTHORIZED", "Not authenticated"), 401);
  }

  const token = authorization.slice(7);
  const user = await getUserBySessionToken(token);

  if (!user) {
    return c.json(
      errorResponse("UNAUTHORIZED", "Invalid or expired session"),
      401,
    );
  }

  return c.json(
    successResponse({
      id: user.id,
      email: user.email,
    }),
  );
});

// GET /api/admin/auth/check-init
app.get("/check-init", async (c) => {
  try {
    const initialized = await hasInitializedAdmin();
    return c.json(
      successResponse({
        initialized,
      }),
    );
  } catch (err) {
    const error = err as Error;
    logError("Check init error", {
      message: error.message,
      stack: error.stack,
    });
    return c.json(
      errorResponse("INTERNAL_ERROR", "Failed to check initialization status"),
      500,
    );
  }
});

// POST /api/admin/auth/setup-password
app.post("/setup-password", async (c) => {
  let normalizedEmail = "";

  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json(
        errorResponse("VALIDATION_ERROR", "Email and password are required"),
        400,
      );
    }

    if (String(password).length < 6) {
      return c.json(
        errorResponse(
          "VALIDATION_ERROR",
          "Password must be at least 6 characters",
        ),
        400,
      );
    }

    normalizedEmail = normalizeEmail(String(email));

    if (await hasInitializedAdmin()) {
      return c.json(
        errorResponse("FORBIDDEN", "Admin password is already initialized"),
        403,
      );
    }

    const existingUser = await findUserByEmail(normalizedEmail);

    let userId: string;
    if (existingUser) {
      const updated = await updateUser(existingUser.id, {
        password: String(password),
        user_metadata: {
          ...(existingUser.user_metadata || {}),
          admin_password_initialized: true,
        },
      });
      userId = updated.id;
    } else {
      const created = await createUser({
        email: normalizedEmail,
        password: String(password),
        role: "admin",
        user_metadata: {
          role: "admin",
          admin_password_initialized: true,
        },
      });
      userId = created.id;
    }

    logInfo("Admin password setup completed", {
      email: normalizedEmail,
      userId,
    });

    return c.json(successResponse({ initialized: true }));
  } catch (err) {
    const error = err as Error;
    logError("Setup password error", {
      email: normalizedEmail,
      message: error.message,
      stack: error.stack,
      error: String(err),
    });
    return c.json(
      errorResponse("INTERNAL_ERROR", "Failed to setup password"),
      500,
    );
  }
});

// POST /api/admin/auth/refresh
app.post("/refresh", async (c) => {
  try {
    const { refresh_token: refreshToken } = await c.req.json();
    if (!refreshToken) {
      return c.json(
        errorResponse("VALIDATION_ERROR", "refresh_token is required"),
        400,
      );
    }
    const rotated = await refreshSession(String(refreshToken));
    if (!rotated) {
      return c.json(
        errorResponse("UNAUTHORIZED", "Invalid refresh token"),
        401,
      );
    }
    return c.json(
      successResponse({
        access_token: rotated.access_token,
        refresh_token: rotated.refresh_token,
        expires_at: rotated.expires_at,
        refresh_expires_at: rotated.refresh_expires_at,
      }),
    );
  } catch (err) {
    logError("Refresh session error", { error: err });
    return c.json(
      errorResponse("INTERNAL_ERROR", "Failed to refresh session"),
      500,
    );
  }
});

export default app;
