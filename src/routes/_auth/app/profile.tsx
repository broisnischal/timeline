import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { ArrowLeftIcon, Loader2Icon, UploadIcon, UserIcon } from "lucide-react";
import { toast } from "sonner";

import { ProfileCollabSection } from "@/components/profile-collab-section";
import { ProfileMcpSection } from "@/components/profile-mcp-section";
import { ProfileNotionSection } from "@/components/profile-notion-section";
import { PublicSettingsCard } from "@/components/timeline/public-settings-card";
import { Button } from "@/components/ui/button";
import { $updateUserImage } from "@/lib/auth/functions";
import { useAuth } from "@/lib/auth/hooks";
import { authQueryOptions } from "@/lib/auth/queries";
import { mcpAccessQueryOptions } from "@/lib/mcp/queries";
import { notionStatusQueryOptions } from "@/lib/notion/queries";
import { myPendingInvitesQueryOptions, publicProfileQueryOptions } from "@/lib/timeline/queries";

const appRouteApi = getRouteApi("/_auth/app");

export const Route = createFileRoute("/_auth/app/profile")({
  component: ProfilePage,
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(authQueryOptions()),
      context.queryClient.ensureQueryData(mcpAccessQueryOptions()),
      context.queryClient.ensureQueryData(notionStatusQueryOptions()),
      context.queryClient.ensureQueryData(publicProfileQueryOptions()),
      context.queryClient.ensureQueryData(myPendingInvitesQueryOptions()),
    ]);
  },
});

function ProfilePage() {
  const qc = useQueryClient();
  const search = appRouteApi.useSearch();
  const { user } = useAuth();
  const initials = (user?.name ?? user?.email ?? "U").trim().slice(0, 1).toUpperCase();

  const updateImageMut = useMutation({
    mutationFn: async (imageDataUrl: string | null) => $updateUserImage({ data: { imageDataUrl } }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: authQueryOptions().queryKey });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not update profile image.");
    },
  });

  const onUploadFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be 2 MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result) {
        toast.error("Could not read selected image.");
        return;
      }
      updateImageMut.mutate(result, {
        onSuccess: () => toast.success("Profile image updated."),
      });
    };
    reader.onerror = () => toast.error("Could not read selected image.");
    reader.readAsDataURL(file);
  };

  return (
    <div className="scroll-mt-24 space-y-8">
      <div>
        <Button
          nativeButton={false}
          render={<Link to="/app" search={search} />}
          variant="ghost"
          size="sm"
          className="-ml-2 gap-1.5 text-muted-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          Back to app
        </Button>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 max-w-lg text-sm leading-relaxed text-muted-foreground">
          Public page, email, and MCP settings for your workspace.
        </p>
      </div>

      <div className="max-w-2xl">
        <PublicSettingsCard />
      </div>

      <div className="max-w-2xl">
        <ProfileMcpSection />
      </div>

      <div className="max-w-2xl">
        <ProfileNotionSection />
      </div>

      <div className="max-w-2xl">
        <ProfileCollabSection />
      </div>

      <section className="max-w-2xl space-y-4 border-t border-border/60 pt-6">
        <h2 className="text-sm font-medium">Profile image</h2>
        <div className="flex flex-wrap items-center gap-4">
          {user?.image ? (
            <img
              src={user.image}
              alt={`${user.name ?? "User"} avatar`}
              className="size-16 rounded-full border border-border/60 object-cover"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-full border border-border/60 bg-muted/35 text-sm font-medium text-muted-foreground">
              {initials || <UserIcon className="size-5" aria-hidden />}
            </div>
          )}
          <div className="space-y-2">
            <p className="text-xs leading-relaxed text-muted-foreground">
              GitHub or Google sign-in uses your provider photo automatically. If you signed up with
              email/password, you can upload your own image.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-full"
                disabled={updateImageMut.isPending}
                onClick={() => {
                  const input = document.getElementById("profile-image-upload");
                  if (input instanceof HTMLInputElement) input.click();
                }}
              >
                {updateImageMut.isPending ? (
                  <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <UploadIcon className="size-3.5" aria-hidden />
                )}
                Upload image
              </Button>
              <input
                id="profile-image-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="sr-only"
                onChange={(e) => {
                  onUploadFile(e.target.files?.[0]);
                  e.currentTarget.value = "";
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full"
                disabled={updateImageMut.isPending || !user?.image}
                onClick={() => {
                  updateImageMut.mutate(null, {
                    onSuccess: () => toast.success("Profile image removed."),
                  });
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      </section>

      <dl className="max-w-md space-y-4 border-t border-border/60 pt-6">
        <div>
          <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Email
          </dt>
          <dd className="mt-1 text-sm">{user?.email ?? "—"}</dd>
        </div>
      </dl>
    </div>
  );
}
