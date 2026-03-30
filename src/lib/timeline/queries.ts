import { queryOptions } from "@tanstack/react-query";

import {
  $getPublicProfile,
  $getStreakStats,
  $getTask,
  $getYearActivityGrid,
  $listRecentActivity,
  $listSpaces,
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

export const tasksQueryOptions = (filters: { spaceId?: string; from?: string; to?: string }) =>
  queryOptions({
    queryKey: ["tasks", filters] as const,
    queryFn: ({ signal }) => $listTasks({ data: filters, signal }),
  });

export const taskQueryOptions = (taskId: string) =>
  queryOptions({
    queryKey: ["task", taskId] as const,
    queryFn: ({ signal }) => $getTask({ data: { taskId }, signal }),
  });
