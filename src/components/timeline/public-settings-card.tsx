import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CopyIcon, ExternalLinkIcon, Link2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { env } from "@/env/client";
import { $updatePublicProfile } from "@/lib/timeline/functions";
import { publicProfileQueryOptions, spacesQueryOptions } from "@/lib/timeline/queries";

type Draft = { slug: string; enabled: boolean };

export function PublicSettingsCard() {
  const qc = useQueryClient();
  const { data: profile, isPending } = useQuery(publicProfileQueryOptions());
  const { data: spaces } = useQuery(spacesQueryOptions());
  const [draft, setDraft] = useState<Draft | null>(null);

  const base = profile ?? { slug: "", enabled: false };
  const slug = draft?.slug ?? base.slug;
  const enabled = draft?.enabled ?? base.enabled;

  const save = useMutation({
    mutationFn: (payload: Draft) =>
      $updatePublicProfile({ data: { slug: payload.slug.trim(), enabled: payload.enabled } }),
    onSuccess: () => {
      toast.success("Sharing settings saved");
      setDraft(null);
      void qc.invalidateQueries({ queryKey: ["publicProfile"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not save"),
  });

  const origin = env.VITE_BASE_URL.replace(/\/$/, "");
  const publicUrl = slug ? `${origin}/p/${slug}` : "";
  const publicSpaces = (spaces ?? []).filter((s) => s.isPublic && s.publicSlug);
  const onToggleEnabled = (checked: boolean) => {
    const nextSlug = (draft?.slug ?? base.slug).trim();
    if (!nextSlug) {
      toast.error("Set a URL slug first");
      return;
    }
    const nextDraft: Draft = {
      slug: nextSlug,
      enabled: checked,
    };
    setDraft((prev) => ({
      ...(prev ?? { slug: base.slug, enabled: base.enabled }),
      enabled: checked,
    }));
    save.mutate(nextDraft);
  };
  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Could not copy link");
    }
  };

  if (isPending) {
    return (
      <section className="space-y-4 border-t border-border/60 pt-6">
        <h2 className="text-sm font-semibold tracking-tight">Public list</h2>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </section>
    );
  }

  return (
    <section className="space-y-5 border-t border-border/60 pt-6">
      <div className="space-y-2">
        <h2 className="text-sm font-semibold tracking-tight">Public list</h2>
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
          Optional share link for tasks you mark as public. A JSON API lives at{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground/90">
            /api/public/&lt;slug&gt;
          </code>
          , with optional feeds at{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground/90">
            ?format=raw
          </code>{" "}
          and{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground/90">
            ?format=rss
          </code>
          .
        </p>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
        <Label htmlFor="public-enabled" className="text-sm font-medium">
          Enable public page
        </Label>
        <Switch
          id="public-enabled"
          checked={enabled}
          disabled={save.isPending}
          onCheckedChange={onToggleEnabled}
        />
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
      {publicUrl && publicSpaces.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Public spaces
          </p>
          <ul className="divide-y divide-border/60 rounded-lg border border-border/60 bg-muted/5">
            {publicSpaces.map((space) => {
              const scope = `space=${encodeURIComponent(space.publicSlug!)}`;
              const page = `${origin}/p/${slug}?${scope}`;
              const json = `${origin}/api/public/${slug}?${scope}`;
              const raw = `${json}&format=raw`;
              const rss = `${json}&format=rss`;
              return (
                <li key={space.id} className="space-y-2 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{space.name}</p>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {space.publicSlug}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                    <a
                      href={page}
                      className="inline-flex items-center gap-1 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      <ExternalLinkIcon className="size-3.5" />
                      Page
                    </a>
                    <a
                      href={json}
                      className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      JSON
                    </a>
                    <a
                      href={raw}
                      className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      Raw
                    </a>
                    <a
                      href={rss}
                      className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      RSS
                    </a>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      onClick={() => copy(page, `${space.name} page link`)}
                    >
                      <CopyIcon className="size-3.5" />
                      Copy
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      <Button
        type="button"
        size="sm"
        disabled={save.isPending || !slug.trim()}
        onClick={() => save.mutate({ slug, enabled })}
      >
        Save sharing
      </Button>
    </section>
  );
}
