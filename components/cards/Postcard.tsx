import Image from "next/image";
import Link from "next/link";
import DeleteButton from '../ui/DeleteButton'; // Import DeleteButton

interface Props {
  id: string;
  content: string;
  author: {
    name: string;
    image: string;
    id: string;
  };
  tags: string[];
  likes: number;
  comments: any[]; // Define comments
  currentUserImg: string;
  currentUserId: string;
  deleted?: boolean; // Add deleted prop
}

const PostCard: React.FC<Props> = ({ id, content, author, tags, likes, comments, currentUserImg, currentUserId, deleted = false }) => {
  return (
    <article className='relative flex w-full flex-col rounded-xl bg-dark-2 p-7'>
      <div className='flex items-start justify-between'>
        <div className='flex w-full flex-1 flex-row gap-4'>
          <div className='flex flex-col items-center'>
            <Link href={`/profile/${author.id}`} className='relative h-11 w-11'>
              <Image
                src={author.image}
                alt='user_image'
                fill
                className='cursor-pointer rounded-full'
              />
            </Link>
          </div>

          <div className='flex w-full flex-col'>
            <Link href={`/profile/${author.id}`} className='w-fit'>
              <h4 className='cursor-pointer text-base-semibold text-light-1'>
                {author.name}
              </h4>
            </Link>

            <p className={`mt-2 text-small-regular ${deleted ? 'text-red-500' : 'text-light-2'}`}>
              {content}
            </p>

            <div className='mt-5 flex flex-col gap-3'>
              <div className='flex gap-3.5'>
                {/* Add Like button and other actions here */}
                <span>Likes: {likes}</span>
              </div>

              {tags.length > 0 && (
                <div className='mt-3 flex gap-2'>
                  {tags.map(tag => (
                    <span key={tag} className='bg-gray-200 text-gray-800 px-2 py-1 rounded'>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Display comments */}
              <div className='mt-5'>
                {comments.map((comment) => (
                  <div key={comment._id} className='flex items-start gap-3'>
                    <Link href={`/profile/${comment.author.id}`}>
                      <Image
                        src={comment.author.image}
                        alt='comment_author_image'
                        width={24}
                        height={24}
                        className='rounded-full'
                      />
                    </Link>
                    <p className='text-small-regular text-light-2'>{comment.text}</p>
                  </div>
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

export default PostCard;
