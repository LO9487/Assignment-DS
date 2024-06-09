"use server";

import Thread from "../models/thread.model";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";
import { revalidatePath } from "next/cache";
import { FilterQuery, SortOrder } from "mongoose";

interface Params {
  userId: string;
  username: string;
  name: string;
  bio: string;
  image: string;
  path: string;
}

export async function updateUser({
  userId,
  bio,
  name,
  path,
  username,
  image,
}: Params): Promise<void> {
  try {
    connectToDB();

    await User.findOneAndUpdate(
      { id: userId },
      {
        username: username.toLowerCase(),
        name,
        bio,
        image,
        onboarded: true,
      },
      { upsert: true }
    );

    if (path === "/profile/edit") {
      revalidatePath(path);
    }
  } catch (error: any) {
    throw new Error(`Failed to create/update user: ${error.message}`);
  }
}

export async function fetchUser(userId: string) {
  try {
    connectToDB();

    return await User.findOne({ id: userId });
  } catch (error: any) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
}

export async function fetchUserPosts(userId: string) {
  try {
    connectToDB();

    const threads = await User.findOne({ id: userId }).populate({
      path: "threads",
      model: Thread,
      populate: [
        {
          path: "children",
          model: Thread,
          populate: {
            path: "author",
            model: User,
            select: "name image id",
          },
        },
      ],
    });
    return threads ? JSON.parse(JSON.stringify(threads)) : null;
  } catch (error) {
    console.error("Error fetching user threads:", error);
    throw error;
  }
}

export async function fetchUsers({
  userId,
  searchString = "",
  pageNumber = 1,
  pageSize = 20,
  sortBy = "desc",
}: {
  userId: string;
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: SortOrder;
}) {
  try {
    connectToDB();

    // Calculate the number of users to skip based on the page number and page size.
    const skipAmount = (pageNumber - 1) * pageSize;

    // Create a case-insensitive regular expression for the provided search string.
    const regex = new RegExp(searchString, "i");

    // Create an initial query object to filter users.
    const query: FilterQuery<typeof User> = {
      id: { $ne: userId }, // Exclude the current user from the results.
    };

    // If the search string is not empty, add the $or operator to match either username or name fields.
    if (searchString.trim() !== "") {
      query.$or = [
        { username: { $regex: regex } },
        { name: { $regex: regex } },
      ];
    }

    // Define the sort options for the fetched users based on createdAt field and provided sort order.
    const sortOptions = { createdAt: sortBy };

    const usersQuery = User.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize);

    // Count the total number of users that match the search criteria (without pagination).
    const totalUsersCount = await User.countDocuments(query);

    const users = await usersQuery.exec();

    // Check if there are more users beyond the current page.
    const isNext = totalUsersCount > skipAmount + users.length;

    return { users, isNext };
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}

export async function getActivity(userId: string) {
  try {
    connectToDB();

    // Find all threads created by the user
    const userThreads = await Thread.find({ author: userId });

    // Collect all the child thread ids (replies) from the 'children' field of each user thread
    const childThreadIds = userThreads.reduce((acc, userThread) => {
      return acc.concat(userThread.children);
    }, []);

    // Find and return the child threads (replies) excluding the ones created by the same user
    const replies = await Thread.find({
      _id: { $in: childThreadIds },
      author: { $ne: userId }, // Exclude threads authored by the same user
    }).populate({
      path: "author",
      model: User,
      select: "name image _id",
    });

    return replies ? JSON.parse(JSON.stringify(replies)) : null;
  } catch (error) {
    console.error("Error fetching replies: ", error);
    throw error;
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

export async function fetchUserReplies(userId: string) { // New function to fetch user replies
  try {
    connectToDB();

    const user = await User.findOne({ id: userId }).populate({
      path: "replies",
      model: Thread,
      populate: [
        {
          path: "author",
          model: User,
          select: "name image id",
        },
      ],
    });
    return user ? JSON.parse(JSON.stringify(user.replies)) : null;
  } catch (error) {
    console.error("Error fetching user replies:", error);
    throw error;
  }
}

export async function saveCommentToUserProfile(userId: string, commentId: string, originalPostId: string) {
  try {
    await connectToDB();
    await User.findByIdAndUpdate(userId, {
      $push: { 
        replies: commentId,
        interactions: {
          postId: originalPostId,
          interactionType: "comment",
        }
      },
    });
  } catch (err) {
    console.error("Error saving comment to user profile:", err);
    throw new Error("Unable to save comment to user profile");
  }
}