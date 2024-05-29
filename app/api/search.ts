import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDB } from '@/lib/mongoose';
import Thread from '@/lib/models/thread.model';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { q } = req.query;

  await connectToDB();

  try {
    const regex = new RegExp(q as string, 'i');
    const posts = await Thread.find({
      $or: [
        { text: { $regex: regex } },
        { tags: { $regex: regex } }
      ]
    }).populate({
      path: 'author',
      select: '_id name image'
    }).exec();

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching posts' });
  }
}
