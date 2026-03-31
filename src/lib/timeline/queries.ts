import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

import {
  $getPublicProfile,
  $getStreakStats,
  $getTask,
  $getYearActivityGrid,
  $listMyPendingSpaceInvites,
  $listRecentActivity,
  $listSpaceCollaborators,
  $listSpaces,
  $listTimelinePage,
  $listTasks,
} from "./functions";

export const spacesQueryOptions = () =>
  queryOptions({
    queryKey: ["spaces"],
    queryFn: ({ signal }) => $listSpaces({ signal }),
  });

export const streakQueryOptions = () =>
  queryOptions({
    queryKey: ["streak"],
    queryFn: ({ signal }) => $getStreakStats({ signal }),
  });

export const yearActivityQueryOptions = (year?: number) =>
  queryOptions({
    queryKey: ["yearActivity", year ?? "current"] as const,
    queryFn: ({ signal }) => $getYearActivityGrid({ data: { year }, signal }),
  });

export const recentActivityQueryOptions = (limit?: number) =>
  queryOptions({
    queryKey: ["recentActivity", limit ?? 40] as const,
    queryFn: ({ signal }) => $listRecentActivity({ data: { limit }, signal }),
  });

export const publicProfileQueryOptions = () =>
  queryOptions({
    queryKey: ["publicProfile"],
    queryFn: ({ signal }) => $getPublicProfile({ signal }),
  });

export const myPendingInvitesQueryOptions = () =>
  queryOptions({
    queryKey: ["myPendingInvites"],
    queryFn: ({ signal }) => $listMyPendingSpaceInvites({ data: {}, signal }),
  });

export const spaceCollaboratorsQueryOptions = (spaceId: string) =>
  queryOptions({
    queryKey: ["spaceCollaborators", spaceId] as const,
    queryFn: ({ signal }) => $listSpaceCollaborators({ data: { spaceId }, signal }),
  });

export const tasksQueryOptions = (filters: { spaceId?: string; from?: string; to?: string }) =>
  queryOptions({
    queryKey: ["tasks", filters] as const,
    queryFn: ({ signal }) => $listTasks({ data: filters, signal }),
  });

export const timelineInfiniteQueryOptions = (filters: {
  spaceId?: string;
  from?: string;
  to?: string;
}) =>
  infiniteQueryOptions({
    queryKey: ["timelineInfinite", filters] as const,
    queryFn: ({ signal, pageParam }) =>
      $listTimelinePage({
        data: { ...filters, cursor: pageParam as string | undefined, limit: 40 },
        signal,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

export const taskQueryOptions = (taskId: string) =>
  queryOptions({
    queryKey: ["task", taskId] as const,
    queryFn: ({ signal }) => $getTask({ data: { taskId }, signal }),
  });
