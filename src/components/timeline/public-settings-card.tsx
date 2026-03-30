import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { env } from "@/env/client";
import { $updatePublicProfile } from "@/lib/timeline/functions";
import { publicProfileQueryOptions } from "@/lib/timeline/queries";

type Draft = { slug: string; enabled: boolean };

export function PublicSettingsCard() {
  const qc = useQueryClient();
  const { data: profile, isPending } = useQuery(publicProfileQueryOptions());
  const [draft, setDraft] = useState<Draft | null>(null);

  const base = profile ?? { slug: "", enabled: false };
  const slug = draft?.slug ?? base.slug;
  const enabled = draft?.enabled ?? base.enabled;

  const save = useMutation({
    mutationFn: () => $updatePublicProfile({ data: { slug: slug.trim(), enabled } }),
    onSuccess: () => {
      toast.success("Sharing settings saved");
      setDraft(null);
      void qc.invalidateQueries({ queryKey: ["publicProfile"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not save"),
  });

  const origin = env.VITE_BASE_URL.replace(/\/$/, "");
  const publicUrl = slug ? `${origin}/p/${slug}` : "";

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Public list</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Public list</CardTitle>
        <CardDescription>
          Optional share link for tasks you mark as public. A JSON API lives at{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground/90">
            /api/public/&lt;slug&gt;
          </code>{" "}
          for extensions and MCP later.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(ev) =>
                setDraft((prev) => ({
                  ...(prev ?? { slug: base.slug, enabled: base.enabled }),
                  enabled: ev.target.checked,
                }))
              }
              className="size-4 rounded border accent-foreground"
            />
            Enable public page
          </label>
        </div>
        <div className="space-y-2">
          <Label htmlFor="public-slug">URL slug</Label>
          <Input
            id="public-slug"
            value={slug}
            onChange={(ev) =>
              setDraft((prev) => ({
                ...(prev ?? { slug: base.slug, enabled: base.enabled }),
                slug: ev.target.value.toLowerCase(),
              }))
            }
            placeholder="your-name"
            autoComplete="off"
          />
        </div>
        {publicUrl ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link2Icon className="size-3.5 shrink-0" />
            <a
              href={publicUrl}
              className="truncate text-foreground underline-offset-4 hover:underline"
            >
              {publicUrl}
            </a>
          </p>
        ) : null}
        <Button
          type="button"
          size="sm"
          disabled={save.isPending || !slug.trim()}
          onClick={() => save.mutate()}
        >
          Save sharing
        </Button>
      </CardContent>
    </Card>
  );
}
