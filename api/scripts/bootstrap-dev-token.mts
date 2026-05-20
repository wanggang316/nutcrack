// One-shot dev helper: ensure a local user exists and emit a fresh API token
// for CLI smoke testing. Prints the raw token to stdout — capture it once;
// only the hash is stored.
//
// Run from repo root:
//   pnpm --filter api exec tsx scripts/bootstrap-dev-token.mts

import { randomUUID } from "node:crypto";

const { runMigrations, getDb, schema } = await import("@nutcrack/db");
const { eq } = await import("drizzle-orm");
const { createToken } = await import("../src/services/tokens.js");

runMigrations();

const db = getDb();
const DEV_EMAIL = "dev@local";

let user = db
  .select()
  .from(schema.users)
  .where(eq(schema.users.email, DEV_EMAIL))
  .get();

if (!user) {
  const id = randomUUID();
  db.insert(schema.users)
    .values({
      id,
      email: DEV_EMAIL,
      passwordHash: "dev-only-no-login",
    })
    .run();
  user = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .get();
  console.log(`Created dev user ${DEV_EMAIL} (id=${id}).`);
} else {
  console.log(`Reusing existing dev user ${DEV_EMAIL} (id=${user.id}).`);
}

const { raw_token, token } = await createToken("cli-dev", user!.id);
console.log("");
console.log(`Token id: ${token.id}`);
console.log(`Token prefix: ${token.prefix}`);
console.log(`Token permissions: ${JSON.stringify(token.permissions)}`);
console.log("");
console.log(`RAW TOKEN (capture now; not recoverable):`);
console.log(raw_token);
