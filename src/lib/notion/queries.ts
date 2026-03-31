import { queryOptions } from "@tanstack/react-query";

import { $getNotionStatus } from "./functions";

export const notionStatusQueryOptions = () =>
  queryOptions({
    queryKey: ["notionStatus"] as const,
    queryFn: ({ signal }) => $getNotionStatus({ signal }),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
