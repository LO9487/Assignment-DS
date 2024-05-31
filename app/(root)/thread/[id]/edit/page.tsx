import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import EditPost from "@/components/forms/EditPost";
import { fetchUser } from "@/lib/actions/user.actions";
import { fetchThreadById } from "@/lib/actions/thread.actions";

interface Thread {
    _id: string;
    text: string;
    author: {
        id: string;
        name: string;
        image: string;
    };
    tags: string[];
  }

interface PageProps {
  postId: string;
  post: Thread;
  userInfo: any;
}

 async function Page({ params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const post = await fetchThreadById(params.id);
  if (!post) {
    return <div>Post not found</div>;
  }

  return <EditPostPage post={post} currentUserId={userInfo._id} />;
}

const EditPostPage = ({ post, currentUserId }: { post: Thread; currentUserId: string }) => {
  return (
    <>
      <h1 className="head-text">Edit Post</h1>
      <EditPost post={post} currentUserId={currentUserId} />
    </>
  );
};

export default Page;