'use client';

import { ChangeEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ShortCourseShell } from '@/components/admin/short-courses/short-course-shell';

export default function ShortCourseCardImagesPage() {
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageCaption, setImageCaption] = useState('');

  async function readImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => setImageUrl(String(reader.result || ''));
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  const snippet = JSON.stringify({ imageUrl, imageAlt, imageCaption }, null, 2);

  return (
    <ShortCourseShell title="Card image helper" description="Upload an explanatory image and copy the generated JSON fields into any lesson card before review and publishing.">
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Upload card image</CardTitle>
            <CardDescription>For launch, images are added manually by admins. Keep images small and focused on one concept.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Image file</Label>
              <Input type="file" accept="image/*" onChange={readImage} />
            </div>
            <div className="space-y-2">
              <Label>Alt text</Label>
              <Input value={imageAlt} onChange={(event) => setImageAlt(event.target.value)} placeholder="Example: Diagram showing the slope of a line" />
            </div>
            <div className="space-y-2">
              <Label>Caption</Label>
              <Input value={imageCaption} onChange={(event) => setImageCaption(event.target.value)} placeholder="Example: The slope is rise divided by run." />
            </div>
            <Button type="button" variant="outline" onClick={() => { setImageUrl(''); setImageAlt(''); setImageCaption(''); }}>Clear</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Copy into a card</CardTitle>
            <CardDescription>Paste these fields inside any lesson card object in the AI builder JSON.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {imageUrl ? <img src={imageUrl} alt={imageAlt || 'Lesson card image preview'} className="max-h-80 w-full rounded-2xl border object-contain" /> : <div className="rounded-2xl border p-8 text-center text-sm text-muted-foreground">Image preview appears here.</div>}
            <Textarea className="font-mono text-xs" rows={10} value={snippet} readOnly />
            <p className="text-sm text-muted-foreground">Example: add these fields next to <code>type</code>, <code>title</code>, and <code>body</code> in a card. The learner lesson player will show the image under that card.</p>
          </CardContent>
        </Card>
      </div>
    </ShortCourseShell>
  );
}
