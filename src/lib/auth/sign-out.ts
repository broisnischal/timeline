import type { QueryClient } from "@tanstack/react-query";
import type { RegisteredRouter } from "@tanstack/react-router";

import authClient from "@/lib/auth/auth-client";
import { authQueryOptions } from "@/lib/auth/queries";

export async function signOutSession(
  queryClient: QueryClient,
  router: Pick<RegisteredRouter, "invalidate">,
) {
  await authClient.signOut({
    fetchOptions: {
      onResponse: async () => {
        queryClient.setQueryData(authQueryOptions().queryKey, null);
        await router.invalidate();
      },
    },
  });
}
