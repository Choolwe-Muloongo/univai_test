// src/app/(app)/community/[id]/page.tsx
'use client'

import { notFound, useParams } from 'next/navigation';
import { type DiscussionComment } from '@/lib/data';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { CornerDownRight, MessageSquare, ThumbsUp } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getDiscussionById } from '@/lib/api';

export default function DiscussionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [discussion, setDiscussion] = useState<any | null>(null);

  // Component state
  const [isClient, setIsClient] = useState(false);
  const [comments, setComments] = useState<DiscussionComment[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    setIsClient(true);
    const loadDiscussion = async () => {
      const data = await getDiscussionById(id);
      if (!data) {
        setDiscussion(null);
        return;
      }
      setDiscussion(data);
      setComments(data.comments || []);
    };
    loadDiscussion();
  }, [id]);

  const handlePostComment = () => {
    if (!newComment.trim()) return;

    const commentToAdd: DiscussionComment = {
      id: `c${Date.now()}`,
      author: 'Premium Student', // Placeholder for logged-in user
      avatar: 'https://i.pravatar.cc/40?u=student-premium',
      content: newComment,
      timestamp: 'Just now',
      upvotes: 0,
    };

    setComments([commentToAdd, ...comments]);
    setNewComment('');
  };


  if (!isClient) {
    // Render nothing or a skeleton on the server
    return null;
  }

  if (!discussion) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto">
        <Button variant="outline" asChild className='mb-4'>
            <Link href="/student/community">Back to Discussions</Link>
        </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{discussion.title}</CardTitle>
          <CardDescription>
            Started by {discussion.author} - {discussion.timestamp}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={discussion.avatar} alt={discussion.author} />
              <AvatarFallback>{discussion.author.charAt(0)}</AvatarFallback>
            </Avatar>
            <p className="text-base text-muted-foreground mt-2 whitespace-pre-wrap">{discussion.snippet}</p>
          </div>

          <Separator className="my-6" />

          <div className="space-y-6">
            <h3 className="text-xl font-semibold flex items-center gap-2">
                <MessageSquare className='w-5 h-5'/>
                Comments ({comments.length})
            </h3>
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-4">
                <Avatar>
                  <AvatarImage src={comment.avatar} alt={comment.author} />
                  <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className='flex-1'>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{comment.author}</p>
                    <p className="text-xs text-muted-foreground">{comment.timestamp}</p>
                  </div>
                  <p className="text-muted-foreground">{comment.content}</p>
                   <div className="flex items-center gap-2 mt-2">
                    <Button variant="ghost" size="sm" className="flex items-center gap-1 text-muted-foreground hover:text-primary">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{comment.upvotes}</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
             {comments.length === 0 && (
                <p className='text-muted-foreground text-center py-4'>No comments yet. Be the first to reply!</p>
             )}
          </div>
        </CardContent>
        <CardFooter>
            <div className='w-full space-y-4'>
                <div className='flex items-center gap-2'>
                    <CornerDownRight className='w-5 h-5 text-muted-foreground'/>
                    <h4 className='text-lg font-semibold'>Leave a Reply</h4>
                </div>
                <Textarea 
                  placeholder="Write your comment here..." 
                  className='min-h-24'
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <Button onClick={handlePostComment}>Post Comment</Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
