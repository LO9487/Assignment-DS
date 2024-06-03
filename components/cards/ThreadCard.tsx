"use client"
import React from "react";
import Link from "next/link";
import LikeButton from "../ui/LikeButton";
import { usePathname } from "next/navigation";
import DeleteButton from "../ui/DeleteButton"; // Import DeleteButton

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
  // Determine if the current user is the author of the thread
  const isAuthor = author && author.id === currentUserId;
  const authorIds = comments.map(comment => comment.author.id);
  const isCommentAuthor = authorIds.includes(currentUserId);
  
   // Determine if the current path is a profile page and belongs to the comment author
   const isProfilePage = pathname ? pathname.startsWith('/profile/') : false;
   const isProfileOwner = isProfilePage && pathname?.includes(currentUserId);
  if (isProfileOwner){
    console.log('isprofileowner');
  }
  if (isComment) {
    console.log('isComment');
  }
  

   // If the post is deleted, show only on the profile page of the replying user
   if (deleted && !isProfileOwner && !isAuthor) {
    console.log('returned null threadcard');
     return null; // Hide the post from the main view
   } 

  console.log('likes field in ThreadCard.tsx: ', likes);
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
              <Link href={`/profile/${author.id}`} className='w-fit'>
                <h4 className='cursor-pointer text-base-semibold text-light-1'>
                  {author.name}
                </h4>
              </Link>
            )}
             {isCurrentThread ? (
              <p className={`mt-2 text-small-regular ${deleted ? 'text-red-500' : 'text-light-2'}`} >{content}</p>
             ) : (
              <Link href={`/thread/${id}`}>
                <p className={`mt-2 text-small-regular ${deleted ? 'text-red-500' : 'text-light-2'}`}>
              {content}
            </p>
              </Link>
            )}
            <div className='mt-5 flex flex-col gap-3'>
              <div className='flex gap-3.5 items-center'>
                <LikeButton postId={id} userId={currentUserId} initialLikes={likes} />
                <Link href={`/thread/${id}`}>
                  <img
                    src='/assets/reply.svg'
                    alt='reply'
                    width={24}
                    height={24}
                    className='cursor-pointer'
                  />
                </Link>
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
              <div className='flex gap-2'>
                {tags.map((tag, index) => (
                  <span key={index} className='tag blue-tag'>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {author?.id === currentUserId && !deleted && (
        <div className='absolute bottom-3 right-3'>
          <DeleteButton postId={id} /> {/* Add DeleteButton */}
        </div>
      )}
    </article>
  );
};

export default ThreadCard;
