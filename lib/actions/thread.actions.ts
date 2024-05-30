"use server";
import { Types } from "mongoose";
import { revalidatePath } from "next/cache";
import { connectToDB } from "../mongoose";
import User from "../models/user.model";
import Thread from "../models/thread.model";
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

    const createdThread = await Thread.create({
      text,
      author,
      community: communityId ? communityId : null,
      tags,
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
          select: "_id name parentId image",
        },
      });

    const totalPostsCount = await Thread.countDocuments({
      parentId: { $in: [null, undefined] },
    });

    const posts = await postsQuery.exec();
    const isNext = totalPostsCount > skipAmount + posts.length;

    return { posts, isNext };
  } catch (error: any) {
    console.error("Error fetching posts:", error);
    throw new Error(`Failed to fetch posts: ${error.message}`);
  }
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


export async function addCommentToThread(threadId: string, commentText: string, userId: string, path: string) {
  connectToDB();

  try {
    const originalThread = await Thread.findById(threadId);

    if (!originalThread) {
      throw new Error("Thread not found");
    }

    const commentThread = new Thread({
      text: commentText,
      author: userId,
      parentId: threadId,
    });

    const savedCommentThread = await commentThread.save();

    originalThread.children.push(savedCommentThread._id);
    await originalThread.save();

    revalidatePath(path);

    // Return the newly created comment
    return await savedCommentThread.populate({
      path: "author",
      model: User,
      select: "_id name image",
    }).execPopulate();
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
    
    // Use the utility function to validate and convert the thread ID
    const objectIdThreadId = validateObjectId(threadId);

    // Removes the existing like interaction from the User
    await User.findOneAndUpdate(
      { id: userId },
      {
        $pull: {
          interactions: {
            postId: objectIdThreadId,
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
    
    // Use the utility function to validate and convert the thread ID
    const objectIdThreadId = validateObjectId(threadId);

    
    // Update user interactions without casting userId to ObjectId
    await User.findOneAndUpdate(
      { id: userId },
      {
        $push: {
          interactions: {
            postId: objectIdThreadId,
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

    return recommendedPosts;
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
        select: "_id name image",
      })
      .populate({
        path: "children",
        model: Thread,
        populate: {
          path: "author",
          model: User,
          select: "_id name image",
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

async function fetchAllChildThreads(threadId: string): Promise<any[]> {
  const childThreads = await Thread.find({ parentId: threadId });

  const descendantThreads = [];
  for (const childThread of childThreads) {
    const descendants = await fetchAllChildThreads(childThread._id);
    descendantThreads.push(childThread, ...descendants);
  }

  return descendantThreads;
}

export async function deleteThread(id: string, path: string): Promise<void> {
  try {
    connectToDB();

    // Find the thread to be deleted (the main thread)
    const mainThread = await Thread.findById(id).populate("author community");

    if (!mainThread) {
      throw new Error("Thread not found");
    }

    // Fetch all child threads and their descendants recursively
    const descendantThreads = await fetchAllChildThreads(id);

    // Get all descendant thread IDs including the main thread ID and child thread IDs
    const descendantThreadIds = [
      id,
      ...descendantThreads.map((thread) => thread._id),
    ];

    // Extract the authorIds and communityIds to update User and Community models respectively
    const uniqueAuthorIds = new Set(
      [
        ...descendantThreads.map((thread) => thread.author?._id?.toString()), // Use optional chaining to handle possible undefined values
        mainThread.author?._id?.toString(),
      ].filter((id) => id !== undefined)
    );

    const uniqueCommunityIds = new Set(
      [
        ...descendantThreads.map((thread) => thread.community?._id?.toString()), // Use optional chaining to handle possible undefined values
        mainThread.community?._id?.toString(),
      ].filter((id) => id !== undefined)
    );

    // Recursively delete child threads and their descendants
    await Thread.deleteMany({ _id: { $in: descendantThreadIds } });

    // Update User model
    await User.updateMany(
      { _id: { $in: Array.from(uniqueAuthorIds) } },
      { $pull: { threads: { $in: descendantThreadIds } } }
    );


    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to delete thread: ${error.message}`);
  }
}