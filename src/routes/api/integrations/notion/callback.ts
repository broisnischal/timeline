import { createFileRoute } from "@tanstack/react-router";

import { env } from "@/env/server";
import { getUserIdFromRequestSession } from "@/lib/auth/request-user.server";
import { exchangeNotionOAuthCode } from "@/lib/notion/client.server";
import { consumeNotionOauthState, upsertNotionConnection } from "@/lib/notion/repo.server";

function profileUrl() {
  const origin = env.VITE_BASE_URL.replace(/\/$/, "");
  return `${origin}/app/profile`;
}

export const Route = createFileRoute("/api/integrations/notion/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const userId = await getUserIdFromRequestSession(request);
        if (!userId) {
          return Response.redirect(`${profileUrl()}?notion=auth_required`, 302);
        }
        if (!env.NOTION_CLIENT_ID || !env.NOTION_CLIENT_SECRET || !env.NOTION_OAUTH_REDIRECT_URI) {
          return Response.redirect(`${profileUrl()}?notion=env_missing`, 302);
        }

        const url = new URL(request.url);
        const err = url.searchParams.get("error");
        if (err) {
          return Response.redirect(`${profileUrl()}?notion=oauth_error`, 302);
        }
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        if (!code || !state) {
          return Response.redirect(`${profileUrl()}?notion=bad_callback`, 302);
        }
        const stateOk = await consumeNotionOauthState(userId, state);
        if (!stateOk) {
          return Response.redirect(`${profileUrl()}?notion=invalid_state`, 302);
        }

        try {
          const token = await exchangeNotionOAuthCode({
            clientId: env.NOTION_CLIENT_ID,
            clientSecret: env.NOTION_CLIENT_SECRET,
            code,
            redirectUri: env.NOTION_OAUTH_REDIRECT_URI,
          });
          await upsertNotionConnection({
            userId,
            workspaceId: token.workspace_id,
            workspaceName: token.workspace_name,
            workspaceIcon: token.workspace_icon,
            botId: token.bot_id,
            tokenType: token.token_type,
            accessToken: token.access_token,
            refreshToken: token.refresh_token ?? null,
          });
          return Response.redirect(`${profileUrl()}?notion=connected`, 302);
        } catch {
          return Response.redirect(`${profileUrl()}?notion=exchange_failed`, 302);
        }
      },
    },
  },
});
