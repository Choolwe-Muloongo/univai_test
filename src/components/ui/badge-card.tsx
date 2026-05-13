// src/components/ui/badge-card.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type Badge as BadgeType } from '@/lib/api/types';
import { Award, Star, Book, Users } from 'lucide-react';

const iconMap = {
    award: Award,
    star: Star,
    book: Book,
    users: Users
}

interface BadgeCardProps {
    badge: BadgeType;
}

export function BadgeCard({ badge }: BadgeCardProps) {
    const Icon = iconMap[badge.icon as keyof typeof iconMap] || Award;
    return (
        <Card className="text-center h-full hover:border-primary/50 hover:shadow-lg transition-all">
            <CardHeader className="items-center">
                <div className="p-4 bg-primary/10 rounded-full">
                    <Icon className="w-8 h-8 text-primary" />
                </div>
            </CardHeader>
            <CardContent>
                <CardTitle className="text-base">{badge.title}</CardTitle>
                <CardDescription className="text-xs mt-1">{badge.description}</CardDescription>
            </CardContent>
        </Card>
    )
}

