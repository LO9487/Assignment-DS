"use client";

import { useState } from "react";
import { likePost, unlikePost } from "@/lib/actions/thread.actions";

interface LikeButtonProps {
  postId: string;
  userId: string;
  initialLikes: string[];
}

const LikeButton: React.FC<LikeButtonProps> = ({ postId, userId, initialLikes = [] }) => {
  const [likes, setLikes] = useState<String[]>(initialLikes);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async () => {
    setIsLoading(true);
    try {
      if (likes.includes(userId)){
        // User has already liked the post, so unlike it
        await unlikePost(userId, postId);
        setLikes(prevLikes => prevLikes.filter(like => like !== userId)); // Remove userId from likes
      } else {
        // User hasn't already liked the post, so like it
        await likePost(userId, postId);
        setLikes(prevLikes => [...prevLikes, userId]); // Add userId to likes
      }
      
    } finally {
      setIsLoading(false);
    }
  };

  const isLiked = likes.includes(userId);

  return (
    <div className="flex items-center">
      <img
        src={isLiked ? '/assets/heart-filled.svg' : '/assets/heart-gray.svg'} // Change icon based on liked state
        alt='heart'
        width={24}
        height={24}
        className={`cursor-pointer object-contain ${isLiked ? 'highlighted' : ''}`} // Apply highlighted class if liked
        onClick={handleLike}
        style={{ opacity: isLoading ? 0.5 : 1 }}
      />
      <span className="ml-2" style={{ color: 'grey' }}>{likes ? likes.length:0}</span>
    </div>
  );
};

export default LikeButton;
