import { requireUser } from "@/lib/auth";
import { HeaderProfileClient } from "@/components/club-header/HeaderProfileClient";

export default async function HeaderProfilePage() {
  const user = await requireUser();

  return (
    <HeaderProfileClient
      initialValues={{
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber as string | null,
        collegeName: user.collegeName,
        city: user.city ?? "",
        bio: user.bio ?? "",
        avatar: user.avatar ?? "",
        clubName: user.clubManaged?.name ?? "Your Club",
      }}
    />
  );
}
