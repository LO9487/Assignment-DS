import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import ThreadCard from "@/components/cards/ThreadCard";
import Pagination from "@/components/shared/Pagination";

import { fetchPosts, recommendPosts } from "@/lib/actions/thread.actions";
import { fetchUser } from "@/lib/actions/user.actions";

async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const pageNumber = searchParams.page ? +searchParams.page : 1;
  const postsResult = await fetchPosts(pageNumber, 30);

  const recommendedPosts = await recommendPosts(user.id);

  // Combine posts and remove duplicates
  const postMap = new Map();
  recommendedPosts.forEach((post: { _id: { toString: () => any; }; }) => postMap.set(post._id.toString(), post));
  postsResult.posts.forEach((post: { _id: { toString: () => any; }; }) => postMap.set(post._id.toString(), post));
  const combinedPosts = Array.from(postMap.values());

  return (
    <>
      <h1 className='head-text text-left'>Home</h1>

      <section className='mt-9 flex flex-col gap-10'>
        {combinedPosts.length === 0 ? (
          <p className='no-result'>No threads found</p>
        ) : (
          <>
            {combinedPosts.map((post) => (
              <ThreadCard
                key={post._id}
                id={post._id}
                currentUserId={user.id}
                parentId={post.parentId}
                content={post.text}
                author={post.author}
                community={post.community}
                createdAt={post.createdAt}
                comments={post.children}
                tags={post.tags}
                likes={post.likedBy}
                deleted={post.deleted}
                isComment={!!post.parentId}
              />
            ))}
          </>
        )}
      </section>

      <Pagination
        path='/'
        pageNumber={pageNumber}
        isNext={postsResult.isNext}
      />
    </>
  );
}

export default Home;
