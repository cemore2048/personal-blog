import PostForm from "@/components/PostForm";
import { requireAdminUser } from "@/lib/auth";

export default async function AdminNewPostPage() {
  await requireAdminUser();

  return <PostForm heading="New post" />;
}
