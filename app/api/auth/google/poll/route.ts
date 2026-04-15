import { NextRequest, NextResponse } from "next/server";
import { getOAuthToken } from "@/lib/poll-store";

export async function GET(req: NextRequest) {
    const key = req.nextUrl.searchParams.get("key");

    if (!key) {
        return NextResponse.json({ error: "Missing key" }, { status: 400 });
    }

    // Now async as it hits the database
    const result = await getOAuthToken(key);

    if (!result) {
        // Not ready yet or consumed — app should keep polling or will timeout
        return NextResponse.json({ status: "pending" }, { status: 202 });
    }

    // Success — return token
    return NextResponse.json({ token: result.token }, { status: 200 });
}