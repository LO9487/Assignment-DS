"use client";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "../ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { usePathname, useRouter } from "next/navigation";
import { createThread } from "@/lib/actions/thread.actions";
import { ThreadValidation } from "@/lib/validations/thread";

interface Props {
  userId: string;
}

const ThreadValidationWithTags = ThreadValidation.extend({
  tags: z.string().optional().transform((val) => val ? val.split(',').map(tag => tag.trim()) : [])
});

function PostThread({ userId }: Props) {
  const router = useRouter();
  const pathname = usePathname() ?? "";

  const form = useForm({
    resolver: zodResolver(ThreadValidation),
    defaultValues: {
      thread: '',
      accountId: userId,
    },
  });

  const onSubmit = async (values: z.infer<typeof ThreadValidation>) => {
    console.log('button clicked');
    const hashtags = values.thread.match(/#[\w'-]+/g) || [];
    await createThread({
      text: values.thread,
      author: userId,
      communityId: null,
      path: pathname,
      tags: hashtags.map(tag => tag.substring(1)),
    });

    router.push("/");
  };

  return (
    <Form {...form}>
      <form className='mt-10 flex flex-col justify-start gap-10' onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name='thread'
          render={({ field }) => (
            <FormItem className='flex w-full flex-col gap-3'>
              <FormLabel className='text-base-semibold text-light-2'>
                Content
              </FormLabel>
              <FormControl className='no-focus border border-dark-4 bg-dark-3 text-light-1'>
                <Textarea rows={15} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        /> 
        <Button type='submit' className='bg-primary-500'>
          Post
        </Button>
        <p className='mt-2 text-small-regular text-light-2'>You can add tags to your post by prefixing words with a '#' </p>
        
        
      </form>
    </Form>
  );
}

export default PostThread;
