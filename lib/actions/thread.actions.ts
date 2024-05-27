"use server";
import { Types } from "mongoose";
import { revalidatePath } from "next/cache";
import { connectToDB } from "../mongoose";
import User from "../models/user.model";
import Thread from "../models/thread.model";

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
      likes: 0, // Initialize likes
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
  connectToDB();

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
      .exec();

      return thread ? thread.toObject() : null;
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
  } catch (err) {
    console.error("Error while adding comment:", err);
    throw new Error("Unable to add comment");
  }
}

export async function likePost(userId: string, threadId: string) {
  await connectToDB();

  try {
    // Ensure the userId is in the correct format
    const objectIdUserId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : userId;

    const post = await Thread.findById(threadId);
    if (!post) {
      throw new Error("Post not found");
    }

    post.likes += 1;
    await post.save();

    await User.findByIdAndUpdate(objectIdUserId, {
      $push: {
        interactions: {
          postId: post._id,
          interactionType: "like",
        },
      },
    });
  } catch (err) {
    console.error("Error while liking post:", err);
    throw new Error("Unable to like post");
  }
}

export async function recommendPosts(userId: string) {
  connectToDB();

  try {
    const user = await User.findById(userId).populate({
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

export async function searchPosts(searchString: string) {
  connectToDB();

  try {
    const regex = new RegExp(searchString, "i");

    const posts = await Thread.find({
      $or: [
        { text: { $regex: regex } },
        { tags: { $regex: regex } },
      ],
    })
      .populate({
        path: "author",
        model: User,
        select: "_id name image",
      })
      .exec();

    return posts;
  } catch (err) {
    console.error("Error while searching posts:", err);
    throw new Error("Unable to search posts");
  }
}
