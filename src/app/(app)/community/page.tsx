import { MessageSquare } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { discussions } from '@/lib/data';
import Link from 'next/link';

export default function CommunityPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Community Hub</h1>
        <p className="text-muted-foreground">
          Connect with peers, ask questions, and collaborate on projects.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Discussions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {discussions.map((discussion) => (
              <li key={discussion.id}>
                <Link href="#" className="block rounded-lg p-4 transition-colors hover:bg-muted">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarImage src={discussion.avatar} alt={discussion.author} />
                      <AvatarFallback>
                        {discussion.author.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{discussion.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {discussion.snippet}
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>By {discussion.author}</span>
                        <span>{discussion.timestamp}</span>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>{discussion.comments} comments</span>
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
