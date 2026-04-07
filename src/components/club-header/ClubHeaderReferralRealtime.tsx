"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { pusherClient } from "@/lib/pusher";

/** Subscribes to `header-{id}` and refreshes server-rendered data when a new referral is recorded. */
export function ClubHeaderReferralRealtime({
  headerId,
  children,
}: {
  headerId: string;
  children: ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const client = pusherClient;
    if (!client || !headerId) return;
    const channelName = `header-${headerId}`;
    const channel = client.subscribe(channelName);
    const onNewMember = () => {
      router.refresh();
    };
    channel.bind("new-member", onNewMember);
    return () => {
      channel.unbind("new-member", onNewMember);
      client.unsubscribe(channelName);
    };
  }, [headerId, router]);

  return <>{children}</>;
}
