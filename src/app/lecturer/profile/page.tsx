// src/app/(app)/lecturer/profile/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload } from 'lucide-react';

export default function LecturerProfilePage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Lecturer Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details and department.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" defaultValue="Dr. Evelyn Reed" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" defaultValue="lecturer@univai.edu" readOnly />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select>
              <SelectTrigger id="department">
                <SelectValue placeholder="Select your department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ict">School of ICT</SelectItem>
                <SelectItem value="business">School of Business</SelectItem>
                <SelectItem value="nursing">School of Nursing</SelectItem>
                <SelectItem value="eng">School of Engineering</SelectItem>
                <SelectItem value="edu">School of Education</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verification Documents</CardTitle>
          <CardDescription>Upload your Curriculum Vitae (CV) and a form of ID for verification.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="cv">Curriculum Vitae (CV)</Label>
            <div className="flex items-center gap-4">
              <Input id="cv" type="file" className="flex-1" />
              <Button variant="outline"><Upload className="mr-2 h-4 w-4"/> Upload</Button>
            </div>
            <p className="text-xs text-muted-foreground">PDF, DOC, or DOCX formats accepted.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="id-document">Identification Document</Label>
            <div className="flex items-center gap-4">
              <Input id="id-document" type="file" className="flex-1" />
              <Button variant="outline"><Upload className="mr-2 h-4 w-4"/> Upload</Button>
            </div>
            <p className="text-xs text-muted-foreground">PDF, JPG, or PNG formats accepted.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
