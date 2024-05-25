"use client";

import { useState } from "react";
import axios from "axios"; // Ensure axios is imported correctly
import { likePost } from "@/lib/actions/thread.actions";

interface LikeButtonProps {
  postId: string;
  userId: string;
  initialLikes: number;
}

const LikeButton: React.FC<LikeButtonProps> = ({ postId, userId, initialLikes }) => {
  const [likes, setLikes] = useState(initialLikes);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async () => {
    setIsLoading(true);
    try {
      await axios.post(`/api/posts/${postId}/like`);
      setLikes(likes + 1); // Increment the like count
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center">
      <img
        src='/assets/heart-gray.svg'
        alt='heart'
        width={24}
        height={24}
        className='cursor-pointer object-contain'
        onClick={handleLike}
        style={{ opacity: isLoading ? 0.5 : 1 }}
      />
      <span className="ml-2">{likes}</span>
    </div>
  );
};

export default LikeButton;
