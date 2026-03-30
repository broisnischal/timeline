import { Link } from "@tanstack/react-router";
import { ArrowRightIcon, ChevronDownIcon, FolderIcon } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { appSearchEmpty } from "@/lib/timeline/app-search";
import { cn } from "@/lib/utils";

type SpaceRow = { id: string; name: string };

type HomeNavbarProps = {
  readonly loggedIn: boolean;
  readonly authPending: boolean;
  readonly spaces: SpaceRow[] | undefined;
  readonly spacesPending: boolean;
  readonly activeSpaceId: string;
  readonly onSpaceChange: (spaceId: string) => void;
};

export function HomeNavbar({
  loggedIn,
  authPending,
  spaces,
  spacesPending,
  activeSpaceId,
  onSpaceChange,
}: HomeNavbarProps) {
  const hasSpaces = Boolean(spaces?.length);
  const currentName = spaces?.find((s) => s.id === activeSpaceId)?.name ?? "Category";

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
          <Link
            to="/"
            className="shrink-0 text-sm font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80"
          >
            Timeline
          </Link>

          {loggedIn && (spacesPending || hasSpaces) ? (
            <div className="max-w-[min(100%,14rem)] min-w-0 sm:max-w-xs">
              {spacesPending ? (
                <div className="h-8 w-full max-w-fit animate-pulse rounded-full bg-muted/60" />
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "h-8 w-full max-w-full justify-between gap-2 rounded-full px-3 font-normal",
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
                        Save new plans to
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuRadioGroup value={activeSpaceId} onValueChange={onSpaceChange}>
                        {spaces!.map((s) => (
                          <DropdownMenuRadioItem key={s.id} value={s.id} className="cursor-pointer">
                            {s.name}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          {authPending ? (
            <div className="h-8 w-24 animate-pulse rounded-full bg-muted/50" aria-hidden />
          ) : loggedIn ? (
            <Button
              nativeButton={false}
              render={<Link to="/app" search={() => appSearchEmpty} />}
              size="sm"
              className="gap-1.5 rounded-full"
            >
              Open app
              <ArrowRightIcon className="size-3.5 opacity-80" />
            </Button>
          ) : (
            <>
              <Button
                nativeButton={false}
                render={<Link to="/login" />}
                size="sm"
                variant="ghost"
                className="rounded-full"
              >
                Log in
              </Button>
              <Button
                nativeButton={false}
                render={<Link to="/signup" />}
                size="sm"
                className="rounded-full"
              >
                Sign up
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
