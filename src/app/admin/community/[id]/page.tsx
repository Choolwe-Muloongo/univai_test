// src/app/(app)/community/[id]/page.tsx
'use client'

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

  // Component state
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
    // Render nothing or a skeleton on the server
    return null;
  }

  if (!discussion) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="outline" asChild className='mb-4'>
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
                <p className='text-muted-foreground text-center py-4'>No comments yet. Next action: add the first moderator response below.</p>
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
                  placeholder="Share your perspective or ask a follow-up..."
                  className='min-h-24'
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
        situationSummary={`Discussion "${discussion.title}" is under moderation review. Assess community safety risk before applying an action.`}
        evidence={[
          {
            id: 'thread-content',
            label: 'Thread content',
            detail: discussion.snippet,
            kind: 'document',
          },
          {
            id: 'engagement-log',
            label: 'Engagement history',
            detail: `${comments.length} comment(s) currently attached to this discussion.`,
            kind: 'history',
          },
          {
            id: 'moderation-signals',
            label: 'Moderation signals',
            detail: 'Use comment context and thread tone to determine whether escalation is needed.',
            kind: 'log',
          },
        ]}
        actions={[
          {
            id: 'approve',
            label: 'Approve Post',
            description: 'Keep the post visible with no restrictions.',
            consequenceHint: 'Thread remains public and continues to receive replies.',
            requiredNotifications: ['Thread author'],
            reversible: true,
            rollbackPath: 'Reopen moderation review if new abuse is reported.',
          },
          {
            id: 'reject',
            label: 'Remove Post',
            description: 'Take down the discussion for policy violation.',
            consequenceHint: 'Post is hidden from community feeds and author may appeal.',
            requiredNotifications: ['Thread author', 'Moderation appeals queue'],
            reversible: true,
            rollbackPath: 'Restore post from moderation archive after appeal approval.',
            sensitive: true,
            variant: 'destructive',
          },
          {
            id: 'request_info',
            label: 'Request Clarification',
            description: 'Ask the author to provide clarifying context.',
            consequenceHint: 'Thread review stays open and may be temporarily limited.',
            requiredNotifications: ['Thread author', 'Moderation queue'],
            reversible: true,
            rollbackPath: 'Close request once clarifications are reviewed.',
            variant: 'outline',
          },
          {
            id: 'escalate',
            label: 'Escalate to Trust & Safety',
            description: 'Escalate high-risk content for senior policy review.',
            consequenceHint: 'Final decision is blocked until trust & safety adjudicates.',
            requiredNotifications: ['Trust & Safety team', 'Moderation manager'],
            reversible: true,
            rollbackPath: 'Close escalation and return to local moderation queue.',
            sensitive: true,
            variant: 'secondary',
          },
        ]}
        onSubmitAction={(actionId, metadata) => {
          toast({
            title: `Moderation action captured: ${actionId.replace('_', ' ')}`,
            description: metadata.decisionReason
              ? `Reason logged: ${metadata.decisionReason}`
              : 'Moderation metadata captured.',
          });
        }}
      />
    </div>
  );
}
