import { queryOptions } from "@tanstack/react-query";

import { $getMcpAccess } from "./functions";

export const mcpAccessQueryOptions = () =>
  queryOptions({
    queryKey: ["mcpAccess"] as const,
    queryFn: ({ signal }) => $getMcpAccess({ signal }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
