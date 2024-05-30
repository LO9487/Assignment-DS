"use client";

import Link from 'next/link';
import LikeButton from '../ui/LikeButton';
import { usePathname } from 'next/navigation';

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
      image: string;
    };
  }[];
  likes: string[] ;
  isComment?: boolean;
  tags?: string[]; 
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
  tags = [] 
}) => {
  const pathname = usePathname();
  const isCurrentThread = pathname ? pathname.includes(id) : false;

  console.log('likes field in ThreadCard.tsx: ', likes);
  return (
    <article className={`flex w-full flex-col rounded-xl ${isComment ? 'px-0 xs:px-7' : 'bg-dark-2 p-7'}`}>
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
              <p className='mt-2 text-small-regular text-light-2'>{content}</p>
            ) : (
              <Link href={`/thread/${id}`}>
                <p className='mt-2 text-small-regular text-light-2'>{content}</p>
              </Link>
            )}
            <div className='mt-5 flex flex-col gap-3'>
              <div className='flex gap-3.5'>
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
    </article>
  );
};

export default ThreadCard;
