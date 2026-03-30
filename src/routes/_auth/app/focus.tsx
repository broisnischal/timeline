import { createFileRoute, getRouteApi } from "@tanstack/react-router";

import { FocusScreen } from "@/components/focus/focus-screen";
import { appSearchSchema } from "@/lib/timeline/app-search";
import {
  recentActivityQueryOptions,
  spacesQueryOptions,
  tasksQueryOptions,
  yearActivityQueryOptions,
} from "@/lib/timeline/queries";
import { defaultTaskRange } from "@/lib/timeline/range";

const appRouteApi = getRouteApi("/_auth/app");

export const Route = createFileRoute("/_auth/app/focus")({
  component: FocusPage,
  loader: async ({ context, location }) => {
    const search = appSearchSchema.parse(location.search ?? {});
    const range = defaultTaskRange();
    const year = new Date().getUTCFullYear();
    await Promise.all([
      context.queryClient.ensureQueryData(spacesQueryOptions()),
      context.queryClient.ensureQueryData(
        tasksQueryOptions({
          ...range,
          ...(search.space ? { spaceId: search.space } : {}),
        }),
      ),
      context.queryClient.ensureQueryData(yearActivityQueryOptions(year)),
      context.queryClient.ensureQueryData(recentActivityQueryOptions(48)),
    ]);
    return { range };
  },
});

function FocusPage() {
  const { range } = Route.useLoaderData();
  const search = appRouteApi.useSearch();
  return <FocusScreen range={range} search={search} />;
}
