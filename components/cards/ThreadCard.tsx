"use client"
import React from "react";
import Link from "next/link";
import LikeButton from "../ui/LikeButton";
import { usePathname } from "next/navigation";
import DeleteButton from "../ui/DeleteButton"; // Import DeleteButton
import ReplyButton from "../ui/ReplyButton";

interface Props {
  id: string;
  currentUserId: string;
  parentId: string | null;
  content: string;
  author: {
    name: string;
    image: string;
    id: string;
  } | null;
  community: {
    id: string;
    name: string;
    image: string;
  } | null;
  createdAt: string;
  comments: {
    author: {
      id : string;
      image: string;
    };
  }[];
  likes: string[];
  isComment?: boolean;
  tags?: string[];
  deleted?: boolean; // Add deleted prop
}

const ThreadCard: React.FC<Props> = ({
  id,
  currentUserId,
  parentId,
  content,
  author,
  community,
  createdAt,
  comments,
  likes,
  isComment,
  tags = [],
  deleted = false, // Default to false
}) => {
  const pathname = usePathname();
  const isCurrentThread = pathname ? pathname.includes(id) : false;
  const isHome = pathname ? pathname === '/' : false;


  // Determine if the current user is the author of the thread
  const isAuthor = author && author.id === currentUserId;
  
  const isThreadPage = pathname ? pathname.startsWith('/thread/') : false;

   // Determine if the current path is a profile page and belongs to the comment author
   const isProfilePage = pathname ? pathname.startsWith('/profile/') : false;
   const isProfileOwner = isProfilePage && pathname?.includes(currentUserId);


   const highlightHashtags = (content: string) => {
    const hashtagRegex = /#[\w'-]+/g;
    return content.replace(hashtagRegex, (match) => `<span style="color: #3b82f6;">${match}</span>`);
  };
  
  const highlightedContent = highlightHashtags(content);

   // If the post is deleted, show only on the profile page of the replying user
   if (deleted && !isProfileOwner) {
    if (isThreadPage){

      return (
      <article className={`relative flex w-full flex-col rounded-xl ${isComment ? 'px-0 xs:px-7' : 'bg-dark-2 p-7'}`}>
        <div className='flex items-start justify-between'>
          <div className='flex w-full flex-1 flex-row gap-4'>
            <div className='flex flex-col items-center'>
              {author && (
                <Link href={`/profile/${author.id}`} className='relative h-11 w-11'>
                  <img
                    src={author.image}
                    alt='user_community_image'
                    className='cursor-pointer rounded-full h-11 w-11'
                  />
                </Link>
              )}
              <div className='thread-card_bar' />
            </div>
            <div className='flex w-full flex-col'>
            {author && (
              <div className='flex items-center'>
                <Link href={`/profile/${author.id}`} className='w-fit'>
                  <h4 className='cursor-pointer text-base-semibold text-light-1'>
                    {author.name}
                  </h4>
                </Link>
                {isComment && (
                  <Link href={`/thread/${parentId}`} className='w-fit ml-2'>
                    <div className='cursor-pointer text-tiny-semibold text-light-1'>
                      See original post
                    </div>
                  </Link>
                )}
              </div>
            )}
                <p className={`mt-2 text-small-regular text-red-500`} >This post has been deleted by the author.</p>
              <div className='mt-5 flex flex-col gap-3'>
                <div className='flex gap-3.5 items-center'>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
      );
    } else{// If at thread/{id} of a deleted post display something
    console.log('returned null threadcard');
    return null; // Hide the post from the main view
    };
   } 
  return (
    <article className={`relative flex w-full flex-col rounded-xl ${(isComment && !isHome) ? 'px-0 xs:px-7' : 'bg-dark-2 p-7'}`}>
      <div className='flex items-start justify-between'>
        <div className='flex w-full flex-1 flex-row gap-4'>
          <div className='flex flex-col items-center'>
            {author && (
              <Link href={`/profile/${author.id}`} className='relative h-11 w-11'>
                <img
                  src={author.image}
                  alt='user_community_image'
                  className='cursor-pointer rounded-full h-11 w-11'
                />
              </Link>
            )}
            <div className='thread-card_bar' />
          </div>
          <div className='flex w-full flex-col'>
          {author && (
            <div className='flex items-center'>
              <Link href={`/profile/${author.id}`} className='w-fit'>
                <h4 className='cursor-pointer text-base-semibold text-light-1'>
                  {author.name}
                </h4>
              </Link>
              {isComment && (isCurrentThread || !isThreadPage) && (
                <Link href={`/thread/${parentId}`} className='w-fit ml-2'>
                  <div className=' text-small-regular text-gray-1'>
                    See original post
                  </div>
                </Link>
              )}
            </div>
          )}
             {isCurrentThread ? (
             <p
             className={`mt-2 text-small-regular ${deleted ? 'text-red-500' : 'text-light-2'}`}
             dangerouslySetInnerHTML={{ __html: highlightedContent }}
           />
             ) : (
              <Link href={`/thread/${id}`}>
                <p
                  className={`mt-2 text-small-regular ${deleted ? 'text-red-500' : 'text-light-2'}`}
                  dangerouslySetInnerHTML={{ __html: highlightedContent }}
                />
              </Link>
            )}
            <div className='mt-5 flex flex-col gap-3'>
              <div className='flex gap-3.5 items-center'>
              {!deleted && (
                <>
                  <LikeButton postId={id} userId={currentUserId} initialLikes={likes} />
                  <ReplyButton threadId={id} commentsCount={comments ? comments.length : 0} />
                </>
              )}
                {isAuthor && isCurrentThread && !deleted && (
                  <div className='flex gap-3.5 items-center'>
                  <Link href={`/thread/${id}/edit`}>
                  <img
                    src='/assets/edit.svg'
                    alt='edit'
                    width={20}
                    height={20}
                    className='edit-button'
                  />
                </Link>
                  </div>
              )}
              </div>
              <div className='flex gap-2 items-center'>
                {tags.map((tag, index) => (
                  <span key={index} className={` mt-2 text-base-regular`} style={{ color: '#3b82f6' }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {author?.id === currentUserId && !deleted && isCurrentThread && (
        <div className='absolute bottom-3 right-3'>
          <DeleteButton postId={id} /> {/* Add DeleteButton */}
        </div>
      )}
    </article>
  );
};

export default ThreadCard;
