import Image from "next/image";
import Link from "next/link";

interface Props {
  id: string;
  content: string;
  author: {
    name: string;
    image: string;
    id: string;
  };
  tags: string[];
  likes: string[];
  comments: any[]; // Add comments property
  currentUserImg: string; // Add currentUserImg property
  currentUserId: string; // Add currentUserId property
}

const PostCard: React.FC<Props> = ({ id, content, author, tags, likes, comments, currentUserImg, currentUserId }) => {
  console.log('PostCard author field: ', author);
  return (
    <article className='flex w-full flex-col rounded-xl bg-dark-2 p-7'>
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
            <Link href={`/thread/${id}`}>
              <p className='mt-2 text-small-regular text-light-2'>{content}</p>
            </Link>
            <div className='mt-5 flex flex-col gap-3'>
              <div className='flex gap-3.5'>
                {/* Add Like button and other actions here */}
                <span className="mt-2 text-small-regular text-light-2" style={{ color: 'grey' }}>Likes: {likes.length}</span>
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

              {comments.length > 0 && (
                <div className='mt-3 flex flex-col gap-2'>
                  {comments.map(comment => (
                    <div key={comment.id} className='bg-gray-100 text-gray-800 p-2 rounded'>
                      <p>{comment.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default PostCard;