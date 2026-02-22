'use client';
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Award, Briefcase, FileText } from "lucide-react";
import { createPortfolioItem, getPortfolioItems } from "@/lib/api";
import type { PortfolioItem } from "@/lib/api/types";
import { useToast } from "@/hooks/use-toast";

export default function PortfolioPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [saving, setSaving] = useState(false);

  const loadItems = async () => {
    const data = await getPortfolioItems();
    setItems(data);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleAdd = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const item = await createPortfolioItem({
        title: title.trim(),
        description: description.trim() || undefined,
        link: link.trim() || undefined,
        status: 'draft',
      });
      setItems((prev) => [item, ...prev]);
      setTitle('');
      setDescription('');
      setLink('');
      toast({ title: 'Portfolio item added' });
    } catch (error: any) {
      toast({
        title: 'Failed to add item',
        description: error?.message ?? 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
        <p className="text-muted-foreground">
          Showcase verified projects, skills, and credentials to employers.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Strength</CardTitle>
            <CardDescription>Complete more items to unlock job matches.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">Profile completeness</span>
              <span className="text-muted-foreground">78%</span>
            </div>
            <Progress value={78} className="h-2" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  <p className="font-semibold">Credentials</p>
                </div>
                <p className="text-sm text-muted-foreground">No verified badges yet</p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <p className="font-semibold">Experience</p>
                </div>
                <p className="text-sm text-muted-foreground">No projects published yet</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/student/jobs">Explore Job Matches</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
            <CardDescription>Skills verified by lecturers and AI.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Skills will appear once your lecturers publish assessments.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projects & Evidence</CardTitle>
          <CardDescription>Keep your work organized and shareable.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Upload project files, reports, or demo links to strengthen your profile.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{item.title}</p>
                    <span className="text-xs text-muted-foreground">{item.status}</span>
                  </div>
                  {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
                  {item.link && (
                    <Link href={item.link} className="text-xs text-primary underline" target="_blank">
                      {item.link}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <div className="w-full space-y-3">
            <div className="grid gap-2">
              <Label>Project Title</Label>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g., Inventory Management App" />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What did you build and what was the impact?" />
            </div>
            <div className="grid gap-2">
              <Label>Demo Link</Label>
              <Input value={link} onChange={(event) => setLink(event.target.value)} placeholder="https://..." />
            </div>
            <Button variant="outline" className="gap-2" onClick={handleAdd} disabled={saving || !title.trim()}>
              <FileText className="h-4 w-4" />
              Add New Project
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

