import type { Context } from "hono";

export type AppVariables = {
  userId: string;
  userEmail: string;
  tokenId: string;
  tokenCreatedBy: string;
  tokenName: string;
  tokenPermissions: string[];
  tokenExpiresAt: string | null;
};

export type AppContext = Context<{ Variables: AppVariables }>;
