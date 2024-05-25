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
    resolver: zodResolver(ThreadValidationWithTags),
    defaultValues: {
      thread: '',
      tags: [], // Default value as an array of strings
      accountId: userId,
    },
  });

  const onSubmit = async (values: z.infer<typeof ThreadValidationWithTags>) => {
    await createThread({
      text: values.thread,
      author: userId,
      communityId: null,
      path: pathname,
      tags: values.tags,
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
        <FormField
          control={form.control}
          name='tags'
          render={({ field }) => (
            <FormItem className='flex w-full flex-col gap-3'>
              <FormLabel className='text-base-semibold text-light-2'>
                Tags (comma separated)
              </FormLabel>
              <FormControl className='no-focus border border-dark-4 bg-dark-3 text-light-1'>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit' className='bg-primary-500'>
          Post
        </Button>
      </form>
    </Form>
  );
}

export default PostThread;
