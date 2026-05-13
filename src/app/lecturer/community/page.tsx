'use client';

import { MessageSquare, PlusCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getDiscussions } from '@/lib/api';
import type { Discussion } from '@/lib/api/types';
import { PageError, PageLoading } from '@/components/ui/page-feedback';

export default function CommunityPage() {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDiscussions() {
      try {
        const nextDiscussions = await getDiscussions();
        if (!isMounted) return;
        setDiscussions(nextDiscussions);
        setError(null);
      } catch (err) {
        console.error('Failed to load lecturer community', err);
        if (isMounted) {
          setDiscussions([]);
          setError('Community discussions are unavailable. Please refresh and try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDiscussions();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Community Hub</h1>
          <p className="text-muted-foreground">
            Connect with peers, ask questions, and collaborate on projects.
          </p>
        </div>
        <Button asChild>
          <Link href="/lecturer/community/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Start a Discussion
          </Link>
        </Button>
      </div>

      {loading ? <PageLoading message="Loading community discussions..." /> : null}
      {error ? <PageError message={error} actionHref="/lecturer/dashboard" actionLabel="Back to Dashboard" /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Active Discussions</CardTitle>
        </CardHeader>
        <CardContent>
          {!loading && !error && discussions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No discussions yet.</p>
          ) : (
            <ul className="space-y-4">
              {discussions.map((discussion) => (
                <li key={discussion.id}>
                  <Link href={`/lecturer/community/${discussion.id}`} className="block rounded-lg border p-4 transition-all hover:bg-muted/50 hover:shadow-md">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={discussion.avatar} alt={discussion.author} />
                        <AvatarFallback>
                          {discussion.author.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{discussion.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {discussion.snippet}
                        </p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          <span>By {discussion.author}</span>
                          <span>{discussion.timestamp}</span>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            <span>{discussion.comments.length} comments</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
