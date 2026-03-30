import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRouteApi, useRouter, useRouterState } from "@tanstack/react-router";
import { ChevronDownIcon, FolderIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { $createSpace } from "@/lib/timeline/functions";
import { spacesQueryOptions } from "@/lib/timeline/queries";
import { cn } from "@/lib/utils";

const appRouteApi = getRouteApi("/_auth/app");

const ALL_VALUE = "__all__";

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
  const [name, setName] = useState("");

  const baseTo = pathname.startsWith("/app/timeline") ? "/app/timeline" : "/app";
  const activeSpace = search.space ?? "";
  const currentName = !activeSpace
    ? "All"
    : (spaces?.find((s) => s.id === activeSpace)?.name ?? "Category");

  const createMut = useMutation({
    mutationFn: () => $createSpace({ data: { name: name.trim() } }),
    onSuccess: () => {
      setName("");
      setNewOpen(false);
      toast.success("Category added");
      void qc.invalidateQueries({ queryKey: ["spaces"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not create"),
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
              <FolderIcon className="size-3.5 shrink-0 opacity-70" aria-hidden />
              <span className="truncate">{currentName}</span>
            </span>
            <ChevronDownIcon
              className="size-3.5 shrink-0 text-muted-foreground opacity-70"
              aria-hidden
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 sm:w-60">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal text-muted-foreground">
                Focus
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={activeSpace || ALL_VALUE}
                onValueChange={navigateToSpace}
              >
                <DropdownMenuRadioItem value={ALL_VALUE} className="cursor-pointer">
                  All
                </DropdownMenuRadioItem>
                {spaces.map((s) => (
                  <DropdownMenuRadioItem key={s.id} value={s.id} className="cursor-pointer">
                    {s.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {
                setNewOpen(true);
              }}
            >
              <PlusIcon className="size-3.5" />
              New category
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New category</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              createMut.mutate();
            }}
          >
            <Label htmlFor="app-new-space-name">Name</Label>
            <Input
              id="app-new-space-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2"
              placeholder="e.g. Reading"
            />
            <DialogFooter className="mt-4">
              <Button type="button" variant="ghost" onClick={() => setNewOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim() || createMut.isPending}>
                Add
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
