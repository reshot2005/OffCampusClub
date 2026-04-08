import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export default async function SharedPostPage({
  params,
}: {
  params: { id: string };
}) {
  await requireUser();

  const post = await prisma.post.findUnique({
    where: { id: params.id },
    select: { id: true, hidden: true },
  });

  if (!post || post.hidden) {
    redirect("/dashboard");
  }

  redirect(`/dashboard?post=${encodeURIComponent(params.id)}`);
}
