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
  likes: string[];
  comments: any[]; // Define comments
  currentUserImg: string;
  currentUserId: string;
  deleted?: boolean; // Add deleted prop
  parentId?: string; 
}

const PostCard: React.FC<Props> = ({ id, content, author, tags, likes, comments, currentUserImg, currentUserId, deleted = false , parentId}) => {

  const highlightHashtags = (content: string) => {
    const hashtagRegex = /#[\w'-]+/g;
    return content.replace(hashtagRegex, (match) => `<span style="color: #3b82f6;">${match}</span>`);
  };
  
  const highlightedContent = highlightHashtags(content);

  if (deleted)
    return null;

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
          <div className='flex items-center'>
            <Link href={`/profile/${author.id}`} className='w-fit'>
              <h4 className='cursor-pointer text-base-semibold text-light-1'>
                {author.name}
              </h4>
            </Link>
            {parentId && (
                  <Link href={`/thread/${parentId}`} className='w-fit ml-2'>
                    <p className=' text-tiny-medium text-gray-1'>
                      See original post
                    </p>
                  </Link>
                )}
            </div>
            <Link href={`/thread/${id}`}>
              <p
                className={`mt-2 text-small-regular text-light-2`}
                dangerouslySetInnerHTML={{ __html: highlightedContent }}
              />
            </Link>
            <div className='mt-5 flex flex-col gap-3'>
              <div className='flex gap-3.5'>
                {/* Add Like button and other actions here */}
                <span className="mt-2 text-small-regular text-gray-1">Likes: {likes.length}</span>
              </div>

              {tags.length > 0 && (
               <div className='flex gap-2 items-center'>
               {tags.map((tag, index) => (
                 <span key={index} className={` mt-2 text-base-regular`} style={{ color: '#3b82f6' }}>
                   #{tag}
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
                    <p
                      className={`mt-2 text-small-regular text-light-2`}
                      dangerouslySetInnerHTML={{ __html:  highlightHashtags(comment.text)}}
                    />
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
