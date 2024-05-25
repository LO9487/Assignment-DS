import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDB } from '@/lib/mongoose';
import Thread from '@/lib/models/thread.model';
import User from '@/lib/models/user.model';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const { method } = req;

  await connectToDB();

  switch (method) {
    case 'POST':
      try {
        const post = await Thread.findById(id);
        if (!post) {
          return res.status(404).json({ error: 'Post not found' });
        }

        post.likes += 1;
        await post.save();

        res.status(200).json(post);
      } catch (error) {
        res.status(500).json({ error: 'Unable to like post' });
      }
      break;
    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
