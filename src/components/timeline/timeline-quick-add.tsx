import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addDays } from "date-fns";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { $createTask } from "@/lib/timeline/functions";

function startOfDayLocal(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

function endOfDayLocal(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x.toISOString();
}

export function TimelineQuickAdd({ activeSpaceId }: { readonly activeSpaceId: string }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");

  const createMut = useMutation({
    mutationFn: () =>
      $createTask({
        data: {
          spaceId: activeSpaceId,
          title: title.trim(),
          startsAt: startOfDayLocal(new Date()),
          dueAt: endOfDayLocal(addDays(new Date(), 7)),
        },
      }),
    onSuccess: () => {
      toast.success("Task created");
      setTitle("");
      void qc.invalidateQueries({ queryKey: ["tasks"] });
      void qc.invalidateQueries({ queryKey: ["streak"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not add task"),
  });

  const submit = () => {
    if (!activeSpaceId) {
      toast.error("Pick a category first");
      return;
    }
    if (!title.trim()) {
      toast.error("Enter a title");
      return;
    }
    createMut.mutate();
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-muted/15 p-1 shadow-sm ring-1 ring-foreground/[0.03]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add something to work on…"
          className="h-11 flex-1 border-0 bg-transparent px-4 shadow-none focus-visible:ring-0"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          disabled={createMut.isPending}
        />
        <Button
          type="button"
          size="sm"
          className="mx-1 mb-1 shrink-0 rounded-xl sm:mr-1 sm:mb-0"
          disabled={createMut.isPending || !activeSpaceId}
          onClick={submit}
        >
          <PlusIcon className="size-4" aria-hidden />
          Add
        </Button>
      </div>
      <p className="px-4 pb-2 text-[11px] text-muted-foreground">
        Saves to the category in the bar above. Due date defaults to one week out — edit on the card
        if needed.
      </p>
    </div>
  );
}
