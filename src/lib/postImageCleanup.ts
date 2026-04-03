import { deleteCloudinaryByUrl } from "@/lib/cloudinary";

/** Remove stored image from Cloudinary when a post is removed or image replaced. Fire-and-forget safe. */
export async function removeStoredPostImage(url: string | null | undefined): Promise<void> {
  await deleteCloudinaryByUrl(url);
}
