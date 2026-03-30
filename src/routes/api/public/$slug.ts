import { createFileRoute } from "@tanstack/react-router";

import { getPublicTasksBySlug } from "@/lib/timeline/repo.server";

export const Route = createFileRoute("/api/public/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const data = await getPublicTasksBySlug(params.slug);
        if (!data) {
          return new Response(JSON.stringify({ error: "not_found" }), {
            status: 404,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }
        return new Response(JSON.stringify(data), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      },
    },
  },
});
