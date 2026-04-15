import { prisma } from "./prisma";

/**
 * Stores an OAuth token in the database so it can be retrieved by the mobile app 
 * across different serverless instances.
 */
export async function storeOAuthToken(key: string, token: string, email: string) {
  try {
    await prisma.oAuthPoll.upsert({
      where: { key },
      create: { key, token, email },
      update: { token, email, createdAt: new Date() },
    });
    
    // Cleanup old sessions (older than 10 minutes) to keep the table small
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    prisma.oAuthPoll.deleteMany({
      where: { createdAt: { lt: tenMinutesAgo } }
    }).catch(e => console.error("[poll-store] cleanup error:", e));

  } catch (e) {
    console.error(`[poll-store] Failed to store token for key ${key}:`, e);
  }
}

/**
 * Retrieves and DELETES an OAuth token from the database.
 * Deletion ensures the token is only consumed once for security.
 */
export async function getOAuthToken(key: string | null) {
  if (!key) return null;

  try {
    const record = await prisma.oAuthPoll.findUnique({
      where: { key }
    });

    if (record) {
      // Consume the token immediately
      await prisma.oAuthPoll.delete({ where: { key } }).catch(() => {});
      return { token: record.token, email: record.email };
    }
  } catch (e) {
    console.error(`[poll-store] Failed to retrieve token for key ${key}:`, e);
  }

  return null;
}
