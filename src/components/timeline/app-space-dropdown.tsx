import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRouteApi, useRouter, useRouterState } from "@tanstack/react-router";
import { ChevronDownIcon, FolderIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AccentColorPicker } from "@/components/timeline/accent-color-picker";
import { SpaceColorDot } from "@/components/timeline/space-color-dot";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AppSearch } from "@/lib/timeline/app-search";
import { $createSpace, $deleteSpace } from "@/lib/timeline/functions";
import { spacesQueryOptions } from "@/lib/timeline/queries";
import { isHexColor } from "@/lib/timeline/task-appearance";
import { cn } from "@/lib/utils";

const appRouteApi = getRouteApi("/_auth/app");

const ALL_VALUE = "__all__";
const DELETE_CONFIRM_WORD = "confirm";

function mergeSearch(current: AppSearch, spaceId: string | undefined): AppSearch {
  const { space: _omit, ...rest } = current;
  return spaceId ? { ...rest, space: spaceId } : rest;
}

export function AppSpaceDropdown() {
  const qc = useQueryClient();
  const router = useRouter();
  const search = appRouteApi.useSearch();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: spaces, isPending } = useQuery(spacesQueryOptions());
  const [newOpen, setNewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [name, setName] = useState("");
  const [pickedColor, setPickedColor] = useState<string | null>(null);

  const baseTo = pathname.startsWith("/app/timeline") ? "/app/timeline" : "/app";
  const activeSpace = search.space ?? "";
  const activeSpaceRow = activeSpace ? spaces?.find((s) => s.id === activeSpace) : undefined;
  const currentName = !activeSpace ? "All" : (activeSpaceRow?.name ?? "Space");
  const canDeleteActiveSpace = Boolean(activeSpace && activeSpaceRow && !activeSpaceRow.isDefault);

  const createMut = useMutation({
    mutationFn: () =>
      $createSpace({
        data: {
          name: name.trim(),
          ...(pickedColor && isHexColor(pickedColor) ? { color: pickedColor } : {}),
        },
      }),
    onSuccess: () => {
      setName("");
      setPickedColor(null);
      setNewOpen(false);
      toast.success("Space created");
      void qc.invalidateQueries({ queryKey: ["spaces"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not create"),
  });

  const deleteMut = useMutation({
    mutationFn: (spaceId: string) => $deleteSpace({ data: { id: spaceId } }),
    onSuccess: (_, spaceId) => {
      setDeleteOpen(false);
      setDeleteConfirmText("");
      toast.success("Space deleted");
      void qc.invalidateQueries({ queryKey: ["spaces"] });
      void qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.removeQueries({ queryKey: ["task"] });
      void qc.invalidateQueries({ queryKey: ["streak"] });
      if (search.space === spaceId) {
        void router.navigate({
          to: baseTo,
          search: mergeSearch(search, undefined),
        });
      }
    },
    onError: (e: Error) => toast.error(e.message || "Could not delete space"),
  });

  const navigateToSpace = (raw: string) => {
    const spaceId = raw === ALL_VALUE ? undefined : raw;
    void router.navigate({
      to: baseTo,
      search: mergeSearch(search, spaceId),
    });
  };

  if (isPending || !spaces) {
    return <div className="h-8 w-full max-w-fit animate-pulse rounded-full bg-muted/60" />;
  }

  return (
    <>
      <div className="max-w-[min(100%,10rem)] min-w-0 sm:max-w-xs">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 w-full max-w-fit justify-between gap-2 rounded-full px-3 font-normal",
                  "border-border/80 bg-background hover:bg-muted/60",
                )}
              />
            }
          >
            <span className="inline-flex min-w-0 items-center gap-1.5 text-muted-foreground">
              {!activeSpace ? (
                <FolderIcon className="size-3.5 shrink-0 opacity-70" aria-hidden />
              ) : isHexColor(activeSpaceRow?.color) ? (
                <SpaceColorDot color={activeSpaceRow?.color} />
              ) : (
                <FolderIcon className="size-3.5 shrink-0 opacity-70" aria-hidden />
              )}
              <span className="truncate">{currentName}</span>
            </span>
            <ChevronDownIcon
              className="size-3.5 shrink-0 text-muted-foreground opacity-70"
              aria-hidden
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-[min(100vw-2rem,15rem)] gap-0 p-1.5 sm:w-60"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-2.5 pt-1 pb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                Spaces
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={activeSpace || ALL_VALUE}
                onValueChange={navigateToSpace}
              >
                <DropdownMenuRadioItem value={ALL_VALUE} className="cursor-pointer gap-2 pr-2">
                  <span className="flex w-4 shrink-0 justify-center" aria-hidden>
                    <span className="size-2 rounded-full bg-muted-foreground/20" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">All</span>
                </DropdownMenuRadioItem>
                {spaces.map((s) => (
                  <DropdownMenuRadioItem
                    key={s.id}
                    value={s.id}
                    className="cursor-pointer gap-2 pr-2"
                  >
                    <span className="flex w-4 shrink-0 justify-center" aria-hidden>
                      <SpaceColorDot color={s.color} />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{s.name}</span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="my-1.5 bg-border/60" />
            {canDeleteActiveSpace ? (
              <DropdownMenuItem
                className="cursor-pointer gap-2 rounded-xl py-2 text-destructive focus:text-destructive"
                onClick={() => {
                  setDeleteConfirmText("");
                  setDeleteOpen(true);
                }}
              >
                <Trash2Icon className="size-3.5 opacity-90" aria-hidden />
                Delete this space…
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              className="cursor-pointer gap-2 rounded-xl py-2 text-muted-foreground focus:text-foreground"
              onClick={() => {
                setName("");
                setPickedColor(null);
                setNewOpen(true);
              }}
            >
              <PlusIcon className="size-3.5 opacity-80" aria-hidden />
              New space
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog
        open={newOpen}
        onOpenChange={(open) => {
          setNewOpen(open);
          if (!open) {
            setName("");
            setPickedColor(null);
          }
        }}
      >
        <DialogContent
          showCloseButton
          className="w-[min(100%,16rem)] max-w-[16rem] gap-0 overflow-hidden rounded-lg border border-border/40 p-0 shadow-[0_8px_30px_rgba(15,15,15,0.08)] ring-0 sm:max-w-[16rem] dark:border-border/50 dark:shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
        >
          <DialogHeader className="border-b border-border/40 px-4 py-3 pr-10">
            <p className="text-[10px] font-medium tracking-[0.1em] text-muted-foreground uppercase">
              New
            </p>
            <DialogTitle className="mt-1 text-sm font-semibold tracking-tight">Space</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              createMut.mutate();
            }}
            className="space-y-3 px-4 py-3"
          >
            <div className="space-y-1">
              <Label htmlFor="app-new-space-name" className="text-[11px] text-muted-foreground">
                Name
              </Label>
              <Input
                id="app-new-space-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                autoComplete="off"
                className="h-8 rounded-md text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-[11px] text-muted-foreground">Color (optional)</p>
              <AccentColorPicker
                compact
                value={pickedColor}
                onChange={setPickedColor}
                clearLabel="No color"
              />
            </div>
            <DialogFooter className="gap-2 border-t border-border/40 bg-muted/10 px-4 py-3 sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 rounded-md px-3 text-[13px] font-normal text-muted-foreground hover:text-foreground"
                onClick={() => setNewOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8 rounded-md px-4 text-[13px] font-medium shadow-none"
                disabled={!name.trim() || createMut.isPending}
              >
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeleteConfirmText("");
        }}
      >
        <DialogContent
          showCloseButton
          className={cn(
            "w-[min(100%,22rem)] max-w-[22rem] gap-0 overflow-hidden rounded-lg border border-border/40 p-0 shadow-[0_8px_30px_rgba(15,15,15,0.08)] ring-0",
            "sm:max-w-[22rem] dark:border-border/50 dark:shadow-[0_12px_40px_rgba(0,0,0,0.45)]",
          )}
        >
          <div className="px-5 pt-5 pr-11 pb-3">
            <p className="text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
              Delete space
            </p>
            <DialogTitle className="mt-1.5 text-[15px] leading-snug font-semibold tracking-tight">
              {activeSpaceRow?.name ?? "Space"}
            </DialogTitle>
            <DialogDescription className="mt-3 text-[13px] leading-[1.5] text-muted-foreground">
              Permanently deletes this space and every task in it—notes, dates, subtasks, and
              activity. This can&apos;t be undone.
            </DialogDescription>
          </div>

          {activeSpaceRow && activeSpaceRow.taskCount > 0 ? (
            <div className="mx-5 mb-1 flex items-baseline gap-2 border-l-2 border-border pl-3 text-[12px] leading-snug text-muted-foreground">
              <span className="font-mono text-[13px] font-medium text-foreground tabular-nums">
                {activeSpaceRow.taskCount}
              </span>
              <span>task{activeSpaceRow.taskCount === 1 ? "" : "s"} will be deleted</span>
            </div>
          ) : null}

          <div className="space-y-2 px-5 pb-1">
            <Label
              htmlFor="delete-space-confirm"
              className="text-[12px] leading-normal font-normal text-muted-foreground"
            >
              Type{" "}
              <kbd className="rounded border border-border/50 bg-muted/60 px-1.5 py-px font-mono text-[11px] text-foreground">
                {DELETE_CONFIRM_WORD}
              </kbd>{" "}
              to continue
            </Label>
            <Input
              id="delete-space-confirm"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              autoComplete="off"
              className="h-9 rounded-md border-border/40 bg-muted/25 font-mono text-[13px] shadow-none transition-colors focus-visible:border-border focus-visible:ring-1"
              placeholder={DELETE_CONFIRM_WORD}
            />
          </div>

          <DialogFooter className="mt-4 gap-2 border-t border-border/40 bg-muted/10 px-5 py-3 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 rounded-md px-3 text-[13px] font-normal text-muted-foreground hover:bg-transparent hover:text-foreground"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-8 rounded-md px-4 text-[13px] font-medium shadow-none"
              disabled={
                deleteConfirmText.trim().toLowerCase() !== DELETE_CONFIRM_WORD ||
                !activeSpace ||
                !canDeleteActiveSpace ||
                deleteMut.isPending
              }
              onClick={() => {
                if (!activeSpace || !canDeleteActiveSpace) return;
                deleteMut.mutate(activeSpace);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
