import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CopyIcon, KeyRoundIcon, Loader2Icon } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { env } from "@/env/client";
import { $enableMcpAccess, $revokeMcpAccess, $rotateMcpKey } from "@/lib/mcp/functions";
import { mcpKeyFingerprint } from "@/lib/mcp/key-display";
import { mcpAccessQueryOptions } from "@/lib/mcp/queries";
import { cn } from "@/lib/utils";

type McpAccessData = {
  enabled: boolean;
  keyPrefix: string | null;
  createdAt: string | null;
};

function CopyRow({
  label,
  value,
  copyLabel,
  className,
}: {
  label: string;
  value: string;
  copyLabel: string;
  className?: string;
}) {
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied");
    } catch {
      toast.error("Could not copy");
    }
  }, [value]);

  return (
    <div
      className={cn(
        "flex items-stretch overflow-hidden rounded-lg border border-border/80 bg-muted/25 dark:bg-muted/20",
        className,
      )}
    >
      <div className="min-w-0 flex-1 px-3 py-2.5">
        <p className="text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
          {label}
        </p>
        <p className="mt-1 font-mono text-[13px] leading-snug break-all text-foreground">{value}</p>
      </div>
      <button
        type="button"
        onClick={() => void copy()}
        aria-label={copyLabel}
        className="flex w-11 shrink-0 items-center justify-center border-l border-border/60 bg-muted/40 text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
      >
        <CopyIcon className="size-4" />
      </button>
    </div>
  );
}

function McpSetupGuide({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const origin = env.VITE_BASE_URL.replace(/\/$/, "");
  const streamUrl = `${origin}/v1/mcp`;
  const apiBase = `${origin}/api/mcp/v1`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex max-h-[min(90vh,34rem)] w-full max-w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <DialogHeader className="shrink-0 border-b border-border/50 px-5 py-4">
          <DialogTitle className="text-lg">MCP in Cursor</DialogTitle>
          <DialogDescription className="text-sm">
            Use the Streamable HTTP endpoint below with your Profile secret in{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[12px]">
              Authorization
            </code>
            . REST tools for scripts live at{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">{apiBase}</code>.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <ol className="list-none space-y-0">
            <li className="flex gap-3 border-b border-border/40 py-4 first:pt-0">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold text-primary tabular-nums"
                aria-hidden
              >
                1
              </span>
              <div className="min-w-0 space-y-1 pt-0.5">
                <p className="font-medium text-foreground">Secret</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Turn MCP on below, then copy the token from the amber box (once per rotation).
                </p>
              </div>
            </li>
            <li className="flex gap-3 py-4">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold text-primary tabular-nums"
                aria-hidden
              >
                2
              </span>
              <div className="min-w-0 space-y-3 pt-0.5">
                <p className="font-medium text-foreground">Cursor: URL + Bearer</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  In Cursor → Settings → MCP, add a server whose URL is your Streamable MCP endpoint
                  and pass the same Bearer token you copied. Exact field names depend on your Cursor
                  version (often{" "}
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">url</code> +{" "}
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                    headers
                  </code>
                  ).
                </p>
                <pre className="rounded-lg border border-border/60 bg-muted/40 p-3 font-mono text-[11px] leading-relaxed break-all text-foreground">{`{
  "mcpServers": {
    "timeline": {
      "url": "${streamUrl}",
      "headers": {
        "Authorization": "Bearer <paste secret from Profile>"
      }
    }
  }
}`}</pre>
              </div>
            </li>
            <li className="flex gap-3 border-t border-border/40 py-4">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/80 text-sm font-semibold text-muted-foreground tabular-nums"
                aria-hidden
              >
                3
              </span>
              <div className="min-w-0 space-y-1 pt-0.5">
                <p className="font-medium text-foreground">Optional: stdio</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-[12px]">
                    bun run mcp:timeline
                  </code>{" "}
                  in this repo runs the same tools over stdio with{" "}
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                    TIMELINE_API_URL
                  </code>{" "}
                  and{" "}
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                    TIMELINE_API_KEY
                  </code>{" "}
                  — only if you prefer a subprocess instead of the URL above.
                </p>
              </div>
            </li>
          </ol>
        </div>

        <div className="shrink-0 border-t border-border/50 bg-muted/20 px-5 py-3">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Revoking access invalidates the secret immediately. Endpoint:{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">{streamUrl}</code>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const ProfileMcpSection = memo(function ProfileMcpSection() {
  const qc = useQueryClient();
  const { data, isPending } = useQuery(mcpAccessQueryOptions());
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  const setMcpCache = useCallback(
    (next: McpAccessData) => {
      qc.setQueryData(["mcpAccess"], next);
    },
    [qc],
  );

  const enableMut = useMutation({
    mutationFn: () => $enableMcpAccess({ data: {} }),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["mcpAccess"] });
      const prev = qc.getQueryData(["mcpAccess"]) as McpAccessData | undefined;
      setMcpCache({
        enabled: true,
        keyPrefix: prev?.keyPrefix ?? null,
        createdAt: prev?.createdAt ?? new Date().toISOString(),
      });
    },
    onSuccess: (res) => {
      if (res.kind === "created") {
        setRevealedKey(res.apiKey);
        setMcpCache({
          enabled: true,
          keyPrefix: mcpKeyFingerprint(res.apiKey),
          createdAt: new Date().toISOString(),
        });
        toast.success("Secret ready — copy it from the box below.");
      } else {
        void qc.invalidateQueries({ queryKey: ["mcpAccess"] });
        toast.message("Already on");
      }
    },
    onError: (e: Error) => {
      void qc.invalidateQueries({ queryKey: ["mcpAccess"] });
      toast.error(e.message || "Could not turn on MCP");
    },
  });

  const rotateMut = useMutation({
    mutationFn: () => $rotateMcpKey({ data: {} }),
    onSuccess: (res) => {
      setRevealedKey(res.apiKey);
      setMcpCache({
        enabled: true,
        keyPrefix: mcpKeyFingerprint(res.apiKey),
        createdAt: new Date().toISOString(),
      });
      toast.success("New secret below — copy it now.");
    },
    onError: (e: Error) => toast.error(e.message || "Could not rotate"),
  });

  const revokeMut = useMutation({
    mutationFn: () => $revokeMcpAccess({ data: {} }),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["mcpAccess"] });
      setMcpCache({ enabled: false, keyPrefix: null, createdAt: null });
    },
    onSuccess: () => {
      setRevealedKey(null);
      toast.success("MCP turned off");
    },
    onError: (e: Error) => {
      void qc.invalidateQueries({ queryKey: ["mcpAccess"] });
      toast.error(e.message || "Could not revoke");
    },
  });

  const enabled = data?.enabled ?? false;
  const busy = enableMut.isPending || rotateMut.isPending || revokeMut.isPending;
  const origin = env.VITE_BASE_URL.replace(/\/$/, "");
  const mcpStreamUrl = `${origin}/v1/mcp`;
  const apiBase = `${origin}/api/mcp/v1`;
  const bearerExample = "Authorization: Bearer <token>";

  if (isPending) {
    return (
      <section className="relative overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm">
        <div className="absolute inset-y-0 left-0 w-[3px] bg-primary/80" aria-hidden />
        <div className="flex items-center gap-2 px-5 py-6 pl-6 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 shrink-0 animate-spin" aria-hidden />
          Loading…
        </div>
      </section>
    );
  }

  return (
    <>
      <McpSetupGuide open={guideOpen} onOpenChange={setGuideOpen} />

      <section className="relative overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm">
        <div className="absolute inset-y-0 left-0 w-[3px] bg-primary/80" aria-hidden />

        <div className="px-5 py-5 pl-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">MCP</h2>
                {busy ? (
                  <Loader2Icon
                    className="size-4 shrink-0 animate-spin text-muted-foreground"
                    aria-hidden
                  />
                ) : null}
              </div>
              <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
                Cursor: MCP URL + Bearer token. Open the guide for the JSON snippet.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-1 h-8 rounded-lg border-dashed"
                onClick={() => setGuideOpen(true)}
              >
                How to use
              </Button>
            </div>

            <div className="flex shrink-0 items-center gap-3 rounded-lg border border-border/50 bg-muted/15 px-3 py-2 sm:flex-col sm:items-end sm:py-3">
              <Label htmlFor="mcp-enabled" className="text-sm font-medium sm:sr-only">
                Access
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground sm:hidden">Off / on</span>
                <Switch
                  id="mcp-enabled"
                  checked={enabled}
                  disabled={busy}
                  onCheckedChange={(on) => {
                    if (on) {
                      void enableMut.mutateAsync();
                    } else {
                      if (
                        typeof window !== "undefined" &&
                        !window.confirm("Turn off MCP? Existing clients will stop working.")
                      ) {
                        return;
                      }
                      void revokeMut.mutateAsync();
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {enabled ? (
            <div className="mt-6 space-y-3 border-t border-border/50 pt-6">
              <CopyRow
                label="MCP stream (Cursor)"
                value={mcpStreamUrl}
                copyLabel="Copy MCP stream URL"
              />

              <CopyRow label="REST API base" value={apiBase} copyLabel="Copy REST API base URL" />

              <CopyRow
                label="Auth header"
                value={bearerExample}
                copyLabel="Copy Authorization header pattern"
              />

              {data?.keyPrefix ? (
                <div className="space-y-2">
                  <CopyRow
                    label="Key fingerprint"
                    value={data.keyPrefix}
                    copyLabel="Copy fingerprint"
                  />
                  <p className="text-xs text-muted-foreground">
                    Matches the active secret. The full token is not stored here — only shown once
                    in the box below after you turn access on or rotate.
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-8 gap-1.5 rounded-lg"
                    disabled={busy}
                    onClick={() => void rotateMut.mutateAsync()}
                  >
                    <KeyRoundIcon className="size-3.5" />
                    Rotate secret
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {revealedKey ? (
            <div className="mt-6 space-y-3 border-t border-dashed border-amber-500/40 pt-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-amber-950 dark:text-amber-100">
                  Secret token
                </p>
                <span className="text-[11px] text-amber-800/80 dark:text-amber-200/75">
                  Copy now — won’t repeat
                </span>
              </div>
              <div className="overflow-hidden rounded-lg border border-amber-500/35 bg-amber-500/[0.07] dark:border-amber-500/30 dark:bg-amber-950/25">
                <div className="flex items-stretch">
                  <p className="min-w-0 flex-1 px-3 py-3 font-mono text-[13px] leading-relaxed break-all text-amber-950 dark:text-amber-50">
                    {revealedKey}
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(revealedKey);
                        toast.success("Copied");
                      } catch {
                        toast.error("Could not copy");
                      }
                    }}
                    aria-label="Copy secret token"
                    className="flex w-11 shrink-0 items-center justify-center border-l border-amber-500/30 bg-amber-500/10 text-amber-900 transition-colors hover:bg-amber-500/20 dark:text-amber-100"
                  >
                    <CopyIcon className="size-4" />
                  </button>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-muted-foreground"
                onClick={() => setRevealedKey(null)}
              >
                Hide
              </Button>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
});
