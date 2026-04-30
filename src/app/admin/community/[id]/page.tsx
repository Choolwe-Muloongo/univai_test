// src/app/admin/community/[id]/page.tsx
'use client';

import { notFound, useParams } from 'next/navigation';
import { type DiscussionComment } from '@/lib/api/types';
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
import { createDiscussionComment, getDiscussionById } from '@/lib/api';
import { AdminActionPanel } from '@/components/admin/admin-action-panel';
import { useToast } from '@/hooks/use-toast';

export default function DiscussionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [discussion, setDiscussion] = useState<any | null>(null);
  const { toast } = useToast();

  const [isClient, setIsClient] = useState(false);
  const [comments, setComments] = useState<DiscussionComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);

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

  if (!isClient) {
    return null;
  }

  if (!discussion) {
    notFound();
  }

  const captureModerationAction = (action: string) => {
    toast({
      title: `Moderation action captured: ${action}`,
      description: 'Review the discussion context and document the final decision in the moderation log.',
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button variant="outline" asChild className="mb-4">
        <Link href="/admin/community">Back to Discussions</Link>
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
            <p className="mt-2 whitespace-pre-wrap text-base text-muted-foreground">{discussion.snippet}</p>
          </div>

          <Separator className="my-6" />

          <div className="space-y-6">
            <h3 className="flex items-center gap-2 text-xl font-semibold">
              <MessageSquare className="h-5 w-5" />
              Comments ({comments.length})
            </h3>
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-4">
                <Avatar>
                  <AvatarImage src={comment.avatar} alt={comment.author} />
                  <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{comment.author}</p>
                    <p className="text-xs text-muted-foreground">{comment.timestamp}</p>
                  </div>
                  <p className="text-muted-foreground">{comment.content}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="flex items-center gap-1 text-muted-foreground hover:text-primary">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{comment.upvotes}</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="py-4 text-center text-muted-foreground">No comments yet. Next action: add the first moderator response below.</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <div className="w-full space-y-4">
            <div className="flex items-center gap-2">
              <CornerDownRight className="h-5 w-5 text-muted-foreground" />
              <h4 className="text-lg font-semibold">Leave a Reply</h4>
            </div>
            <Textarea
              placeholder="Share your perspective or ask a follow-up..."
              className="min-h-24"
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              disabled={posting}
            />
            <Button
              disabled={posting || !commentText.trim()}
              onClick={async () => {
                setPosting(true);
                try {
                  const newComment = await createDiscussionComment(id, commentText.trim());
                  setComments((prev) => [...prev, newComment]);
                  setCommentText('');
                } finally {
                  setPosting(false);
                }
              }}
            >
              Post Comment
            </Button>
          </div>
        </CardFooter>
      </Card>

      <AdminActionPanel
        title="Community Moderation Panel"
        description="Use this panel to guide moderation decisions for community safety and escalation."
        scenarios={['suspicious_account_activity']}
      />

      <Card>
        <CardHeader>
          <CardTitle>Moderation Actions</CardTitle>
          <CardDescription>Capture the moderation direction for this discussion.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={() => captureModerationAction('approve post')}>Approve Post</Button>
          <Button variant="outline" onClick={() => captureModerationAction('request clarification')}>Request Clarification</Button>
          <Button variant="secondary" onClick={() => captureModerationAction('escalate to trust and safety')}>Escalate</Button>
          <Button variant="destructive" onClick={() => captureModerationAction('remove post')}>Remove Post</Button>
        </CardContent>
      </Card>
    </div>
  );
}
