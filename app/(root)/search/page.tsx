import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

import UserCard from "@/components/cards/UserCard";
import ThreadCard from "@/components/cards/ThreadCard"; // Import ThreadCard
import { fetchUser, fetchUsers, searchPosts } from "@/lib/actions/user.actions"; // Correctly import searchPosts

async function Page({ searchParams }: { searchParams: { [key: string]: string | undefined } }) {
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const result = await fetchUsers({
    userId: user.id,
    searchString: searchParams.q || "", 
    pageNumber: searchParams?.page ? +searchParams.page : 1,
    pageSize: 25,
  });

  const postsResult = await searchPosts(searchParams.q || ""); 

  return (
    <section>
      <h1 className='head-text mb-10'>Search</h1>
      <div className='mt-14 flex flex-col gap-9'>
        {result.users.length === 0 && postsResult.length === 0 ? (
          <p className='no-result'>No Result</p>
        ) : (
          <>
            {postsResult.map((post: any) => ( // Explicitly define type for 'post'
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
                tags={post.tags} // Include tags
                likes={post.likes} // Include likes
              />
            ))}
          </>
        )}
      </div>
    </section>
  );
}

export default Page;
