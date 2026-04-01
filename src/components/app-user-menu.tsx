import { SiGithub } from "@icons-pack/react-simple-icons";
import { useHotkeys } from "@tanstack/react-hotkeys";
import { useQueryClient } from "@tanstack/react-query";
import { getRouteApi, useRouter } from "@tanstack/react-router";
import {
  BookOpenIcon,
  CommandIcon,
  GraduationCapIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  PaletteIcon,
  SettingsIcon,
  SunIcon,
  UserIcon,
} from "lucide-react";
import { useState } from "react";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { useAuth } from "@/lib/auth/hooks";
import { signOutSession } from "@/lib/auth/sign-out";
import { SITE_GITHUB_URL } from "@/lib/site";

const appRouteApi = getRouteApi("/_auth/app");

export function AppUserMenu() {
  const qc = useQueryClient();
  const router = useRouter();
  const search = appRouteApi.useSearch();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useHotkeys(
    [
      {
        hotkey: "Mod+Shift+K",
        callback: () => setShortcutsOpen(true),
      },
    ],
    { preventDefault: true },
  );

  return (
    <>
      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Keyboard shortcuts</DialogTitle>
            <DialogDescription>Quick commands for faster navigation and actions.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
              <span>Profile</span>
              <KbdGroup>
                <Kbd>Mod</Kbd>
                <Kbd>Shift</Kbd>
                <Kbd>P</Kbd>
              </KbdGroup>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
              <span>Home</span>
              <KbdGroup>
                <Kbd>Mod</Kbd>
                <Kbd>Shift</Kbd>
                <Kbd>H</Kbd>
              </KbdGroup>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
              <span>Timeline</span>
              <KbdGroup>
                <Kbd>Mod</Kbd>
                <Kbd>Shift</Kbd>
                <Kbd>T</Kbd>
              </KbdGroup>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
              <span>Focus</span>
              <KbdGroup>
                <Kbd>Mod</Kbd>
                <Kbd>Shift</Kbd>
                <Kbd>F</Kbd>
              </KbdGroup>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
              <span>Learning page</span>
              <KbdGroup>
                <Kbd>Mod</Kbd>
                <Kbd>Shift</Kbd>
                <Kbd>L</Kbd>
              </KbdGroup>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
              <span>Shortcuts page / dialog</span>
              <KbdGroup>
                <Kbd>Mod</Kbd>
                <Kbd>Shift</Kbd>
                <Kbd>K</Kbd>
              </KbdGroup>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
              <span>Timeline assistant</span>
              <KbdGroup>
                <Kbd>Mod</Kbd>
                <Kbd>I</Kbd>
              </KbdGroup>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-full border-border/60 bg-background/90 transition-[background-color,border-color] hover:border-border hover:bg-muted/40"
              aria-label="Settings and account"
            />
          }
        >
          {user?.image ? (
            <img
              src={user.image}
              alt={`${user.name ?? "User"} profile`}
              className="size-6 rounded-full object-cover"
            />
          ) : (
            <SettingsIcon className="size-4 text-muted-foreground" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 rounded-2xl p-1.5">
          <div className="px-2 py-2.5">
            <p className="truncate text-sm font-medium">{user?.name ?? "User"}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email ?? ""}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal text-muted-foreground">
              Account
            </DropdownMenuLabel>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {
                void router.navigate({ to: "/app/profile", search });
              }}
            >
              <UserIcon className="size-4" />
              Profile
              <DropdownMenuShortcut>Mod+Shift+P</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {
                void router.navigate({ to: "/app/learning", search });
              }}
            >
              <GraduationCapIcon className="size-4" />
              Learning
              <DropdownMenuShortcut>Mod+Shift+L</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {
                void router.navigate({ to: "/app/shortcuts", search });
              }}
            >
              <CommandIcon className="size-4" />
              Shortcuts
              <DropdownMenuShortcut>Mod+Shift+K</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => setShortcutsOpen(true)}>
              <CommandIcon className="size-4" />
              View shortcuts dialog
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex flex-col gap-1 font-normal text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <PaletteIcon className="size-3.5 opacity-70" aria-hidden />
                Appearance
              </span>
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={theme}
              onValueChange={(v) => setTheme(v as "light" | "dark" | "system")}
            >
              <DropdownMenuRadioItem value="light" className="cursor-pointer">
                <SunIcon className="size-4" />
                Light
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark" className="cursor-pointer">
                <MoonIcon className="size-4" />
                Dark
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system" className="cursor-pointer">
                <MonitorIcon className="size-4" />
                System
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal text-muted-foreground">
              Links
            </DropdownMenuLabel>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {
                void router.navigate({ to: "/app/about", search });
              }}
            >
              <BookOpenIcon className="size-4" />
              About
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {
                window.open(SITE_GITHUB_URL, "_blank", "noopener,noreferrer");
              }}
            >
              <SiGithub className="size-4" />
              GitHub
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            className="cursor-pointer"
            onClick={() => {
              void signOutSession(qc, router);
            }}
          >
            <LogOutIcon className="size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
