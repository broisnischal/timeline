import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DatabaseIcon, Loader2Icon, RefreshCwIcon, UnplugIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  $disconnectNotion,
  $importFromNotion,
  $pushToNotion,
  $setNotionDatabase,
} from "@/lib/notion/functions";
import { notionStatusQueryOptions } from "@/lib/notion/queries";

export function ProfileNotionSection() {
  const qc = useQueryClient();
  const { data, isPending } = useQuery(notionStatusQueryOptions());
  const [databaseId, setDatabaseId] = useState("");

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: notionStatusQueryOptions().queryKey });
  };

  const saveDbMut = useMutation({
    mutationFn: () => $setNotionDatabase({ data: { databaseId: databaseId.trim() } }),
    onSuccess: async () => {
      await invalidate();
      toast.success("Database ID saved.");
    },
    onError: (e: Error) => toast.error(e.message || "Could not save database ID."),
  });

  const importMut = useMutation({
    mutationFn: () => $importFromNotion({ data: { databaseId: databaseId.trim() || undefined } }),
    onSuccess: async (res) => {
      await invalidate();
      toast.success(`Imported ${res.imported}, updated ${res.updated} from Notion.`);
    },
    onError: (e: Error) => toast.error(e.message || "Import failed."),
  });

  const pushMut = useMutation({
    mutationFn: () => $pushToNotion({ data: { databaseId: databaseId.trim() || undefined } }),
    onSuccess: async (res) => {
      await invalidate();
      toast.success(`Synced ${res.updated} updates and ${res.created} new pages.`);
    },
    onError: (e: Error) => toast.error(e.message || "Sync failed."),
  });

  const disconnectMut = useMutation({
    mutationFn: () => $disconnectNotion(),
    onSuccess: async () => {
      await invalidate();
      setDatabaseId("");
      toast.success("Notion disconnected.");
    },
    onError: (e: Error) => toast.error(e.message || "Could not disconnect."),
  });

  const busy =
    saveDbMut.isPending || importMut.isPending || pushMut.isPending || disconnectMut.isPending;

  if (isPending) {
    return (
      <section className="space-y-4 border-t border-border/60 pt-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Loading Notion status...
        </div>
      </section>
    );
  }

  const connected = !!data?.connected;
  const connectUrl = data?.connectUrl ?? "/api/integrations/notion/connect";
  const effectiveDbId = databaseId || (connected ? (data.selectedDatabaseId ?? "") : "");

  return (
    <section className="space-y-4 border-t border-border/60 pt-6">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Notion Sync</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Connect OAuth, set a Notion database ID, then import from Notion or sync your timeline
          into Notion.
        </p>
      </div>

      {!connected ? (
        <Button
          type="button"
          onClick={() => {
            window.location.href = connectUrl;
          }}
        >
          Connect to Notion
        </Button>
      ) : (
        <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground">
            Connected to workspace{" "}
            <span className="font-medium text-foreground">
              {data.workspaceName || data.workspaceId}
            </span>
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={databaseId}
              onChange={(e) => setDatabaseId(e.target.value)}
              placeholder={data.selectedDatabaseId || "Notion database ID"}
            />
            <Button
              type="button"
              variant="secondary"
              className="gap-1.5"
              disabled={busy || !databaseId.trim()}
              onClick={() => void saveDbMut.mutateAsync()}
            >
              <DatabaseIcon className="size-4" />
              Save DB
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={busy || !effectiveDbId}
              onClick={() => void importMut.mutateAsync()}
            >
              {importMut.isPending ? (
                <Loader2Icon className="mr-1.5 size-4 animate-spin" />
              ) : (
                <RefreshCwIcon className="mr-1.5 size-4" />
              )}
              Import from Notion
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy || !effectiveDbId}
              onClick={() => void pushMut.mutateAsync()}
            >
              {pushMut.isPending ? (
                <Loader2Icon className="mr-1.5 size-4 animate-spin" />
              ) : (
                <RefreshCwIcon className="mr-1.5 size-4" />
              )}
              Sync timeline to Notion
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="gap-1.5 text-muted-foreground"
              disabled={busy}
              onClick={() => void disconnectMut.mutateAsync()}
            >
              <UnplugIcon className="size-4" />
              Disconnect
            </Button>
          </div>

          <div className="grid gap-1 text-xs text-muted-foreground">
            <p>
              Last import:{" "}
              {data.lastImportedAt ? new Date(data.lastImportedAt).toLocaleString() : "Never"}
            </p>
            <p>
              Last push:{" "}
              {data.lastPushedAt ? new Date(data.lastPushedAt).toLocaleString() : "Never"}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
