import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

import PostCard from "@/components/cards/Postcard";
import Searchbar from "@/components/shared/Searchbar";
import Pagination from "@/components/shared/Pagination";

import { fetchUser } from "@/lib/actions/user.actions";
import { searchPosts } from "@/lib/actions/thread.actions";

async function Page({
  searchParams
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const pageNumber = searchParams?.page ? +searchParams.page : 1;
  const result = await searchPosts(searchParams.q || '', pageNumber);


  return (
    <section>
      <h1 className='head-text mb-10'>Search</h1>

      <Searchbar routeType='search' />

      <div className='mt-14 flex flex-col gap-9'>
        {result.posts.length === 0 ? (
          <p className='no-result'>No Result</p>
        ) : (
          <>
            {result.posts.map((post: any) => ( // Explicitly define type for 'post'
              <PostCard
                key={post._id}
                id={post._id}
                content={post.text}
                author={post.author}
                tags={post.tags}
                likes={post.likedBy}
                comments={post.children} // Pass comments to PostCard
                currentUserImg={userInfo.image} // Pass current user image
                currentUserId={userInfo._id} // Pass current user ID
                deleted={post.deleted}
                parentId={post.parentId}
              />
            ))}
          </>
        )}
      </div>

      <Pagination
        path='search'
        pageNumber={pageNumber}
        isNext={result.isNext}
      />
    </section>
  );
}

export default Page;
