"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deletePost } from "@/lib/actions/thread.actions";

interface Props {
  postId: string;
}

const DeleteButton: React.FC<Props> = ({ postId }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deletePost(postId);
      router.refresh(); // Refresh the page to show updated data
    } catch (error) {
      console.error("Failed to delete post:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="bg-red-500 text-white px-4 py-2 rounded"
    >
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  );
};

export default DeleteButton;
