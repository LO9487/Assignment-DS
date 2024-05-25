import * as z from "zod";

export const ThreadValidation = z.object({
  thread: z.string().nonempty().min(3, { message: "Minimum 3 characters." }),
  accountId: z.string(),
  tags: z.string().optional().transform((val) => val ? val.split(',').map(tag => tag.trim()) : []),
});

export const CommentValidation = z.object({
  thread: z.string().nonempty().min(3, { message: "Minimum 3 characters." }),
});
