import { createFileRoute } from "@tanstack/react-router";

import { env } from "@/env/server";
import { getUserIdFromRequestSession } from "@/lib/auth/request-user.server";
import { getNotionAuthorizeUrl } from "@/lib/notion/client.server";
import { createNotionOauthState } from "@/lib/notion/repo.server";

export const Route = createFileRoute("/api/integrations/notion/connect")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const userId = await getUserIdFromRequestSession(request);
        if (!userId) {
          return new Response("Unauthorized", { status: 401 });
        }
        if (!env.NOTION_CLIENT_ID || !env.NOTION_OAUTH_REDIRECT_URI) {
          return new Response("Notion OAuth env vars are missing.", { status: 500 });
        }
        const state = crypto.randomUUID();
        await createNotionOauthState(userId, state);
        const url = getNotionAuthorizeUrl({
          clientId: env.NOTION_CLIENT_ID,
          redirectUri: env.NOTION_OAUTH_REDIRECT_URI,
          state,
        });
        return Response.redirect(url, 302);
      },
    },
  },
});
