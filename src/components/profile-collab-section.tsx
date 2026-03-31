import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, MailIcon, UsersIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { $respondToSpaceInvite } from "@/lib/timeline/functions";
import { myPendingInvitesQueryOptions, spacesQueryOptions } from "@/lib/timeline/queries";

export function ProfileCollabSection() {
  const qc = useQueryClient();
  const { data: invites, isPending } = useQuery(myPendingInvitesQueryOptions());

  const respondMut = useMutation({
    mutationFn: (input: { inviteId: string; action: "accept" | "decline" }) =>
      $respondToSpaceInvite({ data: input }),
    onSuccess: (_, vars) => {
      toast.success(vars.action === "accept" ? "Invite accepted" : "Invite declined");
      void qc.invalidateQueries({ queryKey: myPendingInvitesQueryOptions().queryKey });
      void qc.invalidateQueries({ queryKey: spacesQueryOptions().queryKey });
      void qc.invalidateQueries({ queryKey: ["tasks"] });
      void qc.invalidateQueries({ queryKey: ["timelineInfinite"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not respond to invite"),
  });

  return (
    <section className="space-y-4 border-t border-border/60 pt-6">
      <div className="flex items-center gap-2">
        <UsersIcon className="size-4 text-muted-foreground" aria-hidden />
        <h2 className="text-sm font-medium">Collaboration invites</h2>
      </div>
      {isPending ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" aria-hidden />
          Loading invites...
        </div>
      ) : invites && invites.length > 0 ? (
        <div className="space-y-3">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="rounded-xl border border-border/60 bg-card/35 p-3 sm:p-4"
            >
              <p className="text-sm font-medium">{invite.spaceName}</p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <MailIcon className="size-3.5" aria-hidden />
                {invite.inviterName || invite.inviterEmail}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  className="h-8 rounded-full"
                  disabled={respondMut.isPending}
                  onClick={() => respondMut.mutate({ inviteId: invite.id, action: "accept" })}
                >
                  Accept
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-full"
                  disabled={respondMut.isPending}
                  onClick={() => respondMut.mutate({ inviteId: invite.id, action: "decline" })}
                >
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No pending invites.</p>
      )}
    </section>
  );
}
