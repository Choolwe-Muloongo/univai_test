// src/app/(app)/community/page.tsx
import { MessageSquare, PlusCircle } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getDiscussions } from '@/lib/api';

export default async function CommunityPage() {
  const discussions = await getDiscussions();
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
            <Link href="/student/community/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Start a Discussion
            </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link href="/student/community/groups">Groups</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/student/community/events">Events</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Active Discussions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {discussions.map((discussion) => (
              <li key={discussion.id}>
                <Link href={`/student/community/${discussion.id}`} className="block rounded-lg border p-4 transition-all hover:bg-muted/50 hover:shadow-md">
                  <div className="flex items-start gap-4">
                    <Avatar className='h-12 w-12'>
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
        </CardContent>
      </Card>
    </div>
  );
}
