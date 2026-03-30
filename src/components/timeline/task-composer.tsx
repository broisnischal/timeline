import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { $createTask } from "@/lib/timeline/functions";

function dateToIsoDayStart(value: string) {
  if (!value) return undefined;
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function TaskComposer({ activeSpaceId }: { readonly activeSpaceId: string }) {
  const qc = useQueryClient();
  const formId = useId();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [startDay, setStartDay] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [makePublic, setMakePublic] = useState(false);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["tasks"] });
    void qc.invalidateQueries({ queryKey: ["spaces"] });
    void qc.invalidateQueries({ queryKey: ["streak"] });
    void qc.invalidateQueries({ queryKey: ["publicProfile"] });
  };

  const createTaskMut = useMutation({
    mutationFn: () =>
      $createTask({
        data: {
          spaceId: activeSpaceId,
          title: title.trim(),
          notes: notes.trim() || undefined,
          startsAt: dateToIsoDayStart(startDay),
          dueAt: dateToIsoDayStart(dueDay),
          isPublic: makePublic,
        },
      }),
    onSuccess: () => {
      setTitle("");
      setNotes("");
      setStartDay("");
      setDueDay("");
      setMakePublic(false);
      toast.success("Added");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Could not create task"),
  });

  const onSubmit: React.ComponentProps<"form">["onSubmit"] = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Add a title");
      return;
    }
    if (!activeSpaceId) {
      toast.error("Wait for categories to load");
      return;
    }
    createTaskMut.mutate();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-sm font-medium tracking-tight">Add a task</h2>
        <p className="text-xs text-muted-foreground">Category is chosen in the bar above.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${formId}-title`} className="sr-only">
          Title
        </Label>
        <Input
          id={`${formId}-title`}
          value={title}
          onChange={(ev) => setTitle(ev.target.value)}
          placeholder="What needs to happen?"
          className="border-0 border-b border-transparent px-0 text-lg font-medium shadow-none ring-0 focus-visible:border-border focus-visible:ring-0"
          autoComplete="off"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${formId}-start`} className="text-xs text-muted-foreground">
            Start (optional)
          </Label>
          <Input
            id={`${formId}-start`}
            type="date"
            value={startDay}
            onChange={(ev) => setStartDay(ev.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${formId}-due`} className="text-xs text-muted-foreground">
            Complete by (optional)
          </Label>
          <Input
            id={`${formId}-due`}
            type="date"
            value={dueDay}
            onChange={(ev) => setDueDay(ev.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${formId}-notes`} className="text-xs text-muted-foreground">
          Notes (optional)
        </Label>
        <Textarea
          id={`${formId}-notes`}
          value={notes}
          onChange={(ev) => setNotes(ev.target.value)}
          placeholder="Links, context…"
          rows={2}
          className="min-h-0 resize-none text-sm"
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={makePublic}
            onChange={(ev) => setMakePublic(ev.target.checked)}
            className="size-3.5 rounded border accent-foreground"
          />
          Public on your share page
        </label>
      </div>

      <Button type="submit" size="sm" disabled={createTaskMut.isPending || !activeSpaceId}>
        <PlusIcon className="size-4" />
        Add
      </Button>
    </form>
  );
}
