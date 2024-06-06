import React from 'react';
import Link from 'next/link';

interface ReplyButtonProps {
  threadId: string;
  commentsCount: number;
}

const ReplyButton: React.FC<ReplyButtonProps> = ({ threadId, commentsCount }) => {

  return (
    <div className="flex items-center">
        <Link href={`/thread/${threadId}`}>
      <img
        src='/assets/reply.svg'
        alt='reply'
        width={24}
        height={24}
        className='cursor-pointer'
      />
      </Link>
      <span className="ml-2" style={{ color: 'grey' }}>{commentsCount}</span>
    </div>
  );
};

export default ReplyButton;
