"use server";
import { revalidatePath } from "next/cache";
import { connectToDB } from "../mongoose";
import User from "../models/user.model";
import Thread from "../models/thread.model";
import { saveCommentToUserProfile } from "../actions/user.actions";
import { validateObjectId } from "../utils";

interface Params {
  text: string;
  author: string;
  communityId: string | null;
  path: string;
  tags?: string[];
}

export async function createThread({ text, author, communityId, path, tags = [] }: Params) {
  try {
    await connectToDB();

    const hashtags = text.match(/#[\w'-]+/g) || [];


    const createdThread = await Thread.create({
      text,
      author,
      community: communityId ? communityId : null,
      tags: hashtags.map(tag => tag.substring(1)),
      likes: [], // Initialize likes
    });

    await User.findByIdAndUpdate(author, {
      $push: { threads: createdThread._id },
    });

    if (path) {
      revalidatePath(path);
    }
  } catch (error: any) {
    throw new Error(`Failed to create thread: ${error.message}`);
  }
}
export async function fetchPosts(pageNumber = 1, pageSize = 20) {
  try {
    await connectToDB();

    const skipAmount = (pageNumber - 1) * pageSize;

    const postsQuery = Thread.find({ parentId: { $in: [null, undefined] } })
      .sort({ createdAt: "desc" })
      .skip(skipAmount)
      .limit(pageSize)
      .populate({
        path: "author",
        model: User,
      })
      .populate({
      path: "children",
      populate: {
        path: "author",
        model: User,
        select: "_id id name parentId image",
      },
    });

    const totalPostsCount = await Thread.countDocuments({
      parentId: { $in: [null, undefined] },
    });
  
    const postResults = await postsQuery.exec();
    const shuffledPosts = shuffleArray(postResults); // Shuffle the postResults array
    const isNext = totalPostsCount > skipAmount + postResults.length;
    const posts = JSON.parse(JSON.stringify(shuffledPosts));

    return { posts, isNext };
  } catch (error: any) {
    console.error("Error fetching posts:", error);
    throw new Error(`Failed to fetch posts: ${error.message}`);
  }
}

function shuffleArray(array: any[]) {
  // Fisher-Yates shuffle algorithm
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
export async function fetchThreadById(threadId: string) {
  await connectToDB();

  try {
    const thread = await Thread.findById(threadId)
      .populate({
        path: "author",
        model: User,
        select: "_id id name image",
      })
      .populate({
        path: "children",
        populate: [
          {
            path: "author",
            model: User,
            select: "_id id name parentId image",
          },
          {
            path: "children",
            model: Thread,
            populate: {
              path: "author",
              model: User,
              select: "_id id name parentId image",
            },
          },
        ],
      })
      .lean() // Convert to plain JavaScript object
      .exec();

    return thread ? JSON.parse(JSON.stringify(thread)) : null; // Ensure no circular references
  } catch (err) {
    console.error("Error while fetching thread:", err);
    throw new Error("Unable to fetch thread");
  }
}

export async function updateThread(threadId: string, data: { text: string, tags: string[] }) {
  try {
    const thread = await Thread.findByIdAndUpdate(threadId, data, { new: true }).lean().exec();
    console.log(`Updated thread ${threadId} successfully`);
    return thread ? JSON.parse(JSON.stringify(thread)) : null;
  } catch (error) {
    console.error("Error updating thread:", error);
    throw new Error("Unable to update thread");
  }
}

export async function addCommentToThread(threadId: string, commentText: string, userId: string, path: string) {
  await connectToDB();

  try {
    const validatedThreadId = validateObjectId(threadId);
    const validatedUserId = validateObjectId(userId);

    const originalThread = await Thread.findById(validatedThreadId).lean();

    if (!originalThread) {
      throw new Error("Thread not found");
    }

    const hashtags = commentText.match(/#[\w'-]+/g) || [];

    const commentThread = new Thread({
      text: commentText,
      author: validatedUserId,
      parentId: validatedThreadId,
      tags: hashtags.map(tag => tag.substring(1)), // Remove the '#' from each tag
    });

    const savedCommentThread = await commentThread.save();

    await Thread.findByIdAndUpdate(validatedThreadId, { $push: { children: savedCommentThread._id } });

    // Save the comment to the user's profile
    await saveCommentToUserProfile(validatedUserId, savedCommentThread._id, validatedThreadId);

    revalidatePath(path);

    const populatedCommentThread = await Thread.findById(savedCommentThread._id)
      .populate({
        path: "author",
        model: User,
        select: "_id name image",
      })
      .lean()
      .exec();

    return populatedCommentThread ? JSON.parse(JSON.stringify(populatedCommentThread)) : null;
  } catch (err) {
    console.error("Error while adding comment:", err);
    throw new Error("Unable to add comment");
  }
}

export async function unlikePost(userId: string, threadId: string) {
  await connectToDB();

  try {
    const post = await Thread.findById(threadId);
    if (!post) {
      throw new Error("Post not found");
    }

    await Thread.findByIdAndUpdate(
      threadId,
      { $pull: { likedBy: userId } }, // Use $pull to remove the userId from the likedBy array
      { new: true }
    );

    // Remove the existing like interaction from the User
    await User.findOneAndUpdate(
      { id: userId },
      {
        $pull: {
          interactions: {
            postId: threadId,
            interactionType: "like",
          },
        },
      }
    );
    console.log(`User ${userId} unliked thread ${threadId}`);
  } catch (err) {
    console.error("Error while unliking post:", err);
    throw new Error("Unable to unlike post");
  }
}

export async function likePost(userId: string, threadId: string) {
  await connectToDB();

  try {
    const post = await Thread.findById(threadId);
    if (!post) {
      throw new Error("Post not found");
    }

    await Thread.findByIdAndUpdate(
      threadId,
      { $addToSet: { likedBy: userId } }, // Use $addToSet to avoid duplicates
      { upsert: true, new: true } // Ensure the document is created if it doesn't exist
    );

    // Update user interactions without casting userId to ObjectId
    await User.findOneAndUpdate(
      { id: userId },
      {
        $push: {
          interactions: {
            postId: threadId,
            interactionType: "like",
          },
        },
      },
      { upsert: true } // Ensure the update creates the document if it doesn't exist
    );
    console.log(`User ${userId} liked thread ${threadId}`);
  } catch (err) {
    console.error("Error while liking post:", err);
    throw new Error("Unable to like post");
  }
}

export async function recommendPosts(userId: string) {
  await connectToDB();

  try {
    const user = await User.findOne({ id: userId }).populate({
      path: "interactions.postId",
      model: Thread,
    });

    if (!user) {
      throw new Error("User not found");
    }

    const tagWeights = new Map<string, number>();

    user.interactions.forEach((interaction: any) => {
      const tags = interaction.postId.tags;
      tags.forEach((tag: string) => {
        const weight = interaction.interactionType === "like" ? 1 : 0.5;
        if (tagWeights.has(tag)) {
          tagWeights.set(tag, tagWeights.get(tag)! + weight);
        } else {
          tagWeights.set(tag, weight);
        }
      });
    });

    const sortedTags = Array.from(tagWeights.entries()).sort((a, b) => b[1] - a[1]);
    const topTags = sortedTags.slice(0, 5).map((entry) => entry[0]);

    const recommendedPosts = await Thread.find({ tags: { $in: topTags } }).populate({
      path: "author",
      model: User,
    });

    return JSON.parse(JSON.stringify(recommendedPosts));
  } catch (err) {
    console.error("Error while recommending posts:", err);
    throw new Error("Unable to recommend posts");
  }
}

export async function searchPosts(searchString: string, pageNumber = 1, pageSize = 20) {
  connectToDB();

  try {
    const regex = new RegExp(searchString, "i");

    const skipAmount = (pageNumber - 1) * pageSize;

    const postsQuery = Thread.find({
      $or: [
        { text: { $regex: regex } },
        { tags: { $regex: regex } },
      ],
    })
      .skip(skipAmount)
      .limit(pageSize)
      .populate({
        path: "author",
        model: User,
        select: "id name image",
      })
      .populate({
        path: "children",
        model: Thread,
        populate: {
          path: "author",
          model: User,
          select: "id name image",
        },
      });

    const totalPostsCount = await Thread.countDocuments({
      $or: [
        { text: { $regex: regex } },
        { tags: { $regex: regex } },
      ],
    });

    const posts = await postsQuery.exec();
    const isNext = totalPostsCount > skipAmount + posts.length;

    return { posts, isNext };
  } catch (err) {
    console.error("Error while searching posts:", err);
    throw new Error("Unable to search posts");
  }
}

export async function deletePost(postId: string) {
  await connectToDB();

  try {
    const post = await Thread.findById(postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Mark post as deleted
    post.text = "This post has been deleted.";
    post.deleted = true;
    await post.save();
  } catch (err) {
    console.error("Error while deleting post:", err);
    throw new Error("Unable to delete post");
  }
}

export async function saveComment(threadId: string, comment: string) {
  await connectToDB();

  // Find the thread by threadId
  const thread = await Thread.findById(threadId);
  if (!thread) {
    throw new Error("Thread not found");
  }

  // Add comment to the thread
  thread.comments.push(comment);
  await thread.save();

  // Revalidate path to update the UI
  revalidatePath(`/thread/${thread.id}`);
}
