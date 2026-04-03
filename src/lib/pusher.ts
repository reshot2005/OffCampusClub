import Pusher from "pusher";
import PusherClient from "pusher-js";

export function isPusherServerConfigured(): boolean {
  return !!(
    process.env.PUSHER_APP_ID?.trim() &&
    process.env.PUSHER_KEY?.trim() &&
    process.env.PUSHER_SECRET?.trim()
  );
}

let pusherInstance: Pusher | null = null;

function getPusherServer(): Pusher | null {
  if (!isPusherServerConfigured()) return null;
  if (!pusherInstance) {
    pusherInstance = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER || "ap2",
      useTLS: true,
    });
  }
  return pusherInstance;
}

/**
 * Only calls Pusher when credentials exist — avoids 404s to `.../apps//events` when env is empty (local dev).
 */
export const pusherServer = {
  async trigger(channel: string | string[], event: string, data: object): Promise<void> {
    const p = getPusherServer();
    if (!p) return;
    await p.trigger(channel, event, data);
  },
};

const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY?.trim();

export const pusherClient =
  typeof window !== "undefined" && pusherKey
    ? new PusherClient(pusherKey, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2",
      })
    : null;
