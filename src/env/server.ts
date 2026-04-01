import "@tanstack/react-start/server-only";
import { createEnv } from "@t3-oss/env-core";
import * as z from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    VITE_BASE_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(1),

    // OAuth2 providers, optional, update as needed
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    NOTION_CLIENT_ID: z.string().optional(),
    NOTION_CLIENT_SECRET: z.string().optional(),
    NOTION_OAUTH_REDIRECT_URI: z.url().optional(),
    NOTION_TOKEN_ENCRYPTION_KEY: z.string().optional(),
  },
  runtimeEnv: process.env,
});
