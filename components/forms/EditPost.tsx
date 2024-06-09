"use client";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "../ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { updateThread } from "@/lib/actions/thread.actions";
import { ThreadValidation } from "@/lib/validations/thread";

interface Props {
  post: {
    _id: string;
    text: string;
    author: {
      id: string;
      name: string;
      image: string;
    };
    tags: string[];
  };
  currentUserId: string;
  onUpdate?: (updatedPost: any) => void;
}

const ThreadValidationWithTags = ThreadValidation.extend({
  tags: z.string().optional().transform((val) => (val ? val.split(',').map(tag => tag.trim()) : [])),
  accountId: z.string(),
});

function EditThread({ post, currentUserId, onUpdate }: Props) {
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(ThreadValidationWithTags),
    defaultValues: {
      thread: post.text,
      accountId: currentUserId,
    },
  });

  useEffect(() => {
    form.reset({
      thread: post.text,
      accountId: currentUserId,
    });
  }, [post.text, currentUserId, form]);

  const onSubmit = async (values: z.infer<typeof ThreadValidation>) => {
    try {
      const hashtags = values.thread.match(/#[\w'-]+/g) || [];
      const updatedPost = await updateThread(post._id, {
        text: values.thread,
        tags: hashtags.map(tag => tag.substring(1)),
      });

      if (onUpdate) {
        onUpdate(updatedPost);
      }
      router.push(`/thread/${post._id}`); // Navigate to the current path to reflect changes
    } catch (error) {
      console.error("Error updating thread:", error);
    }
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
          Update
        </Button>
      </form>
    </Form>
  );
}

export default EditThread;
