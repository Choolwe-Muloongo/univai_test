import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createLecturerApplication, getPrograms } from '@/lib/api';

export default async function LecturerApplyPage() {
  const programs = await getPrograms();

  async function handleSubmit(formData: FormData) {
    'use server';
    await createLecturerApplication({
      fullName: String(formData.get('fullName') || ''),
      email: String(formData.get('email') || ''),
      phone: String(formData.get('phone') || ''),
      department: String(formData.get('department') || ''),
      specialization: String(formData.get('specialization') || ''),
      highestQualification: String(formData.get('highestQualification') || ''),
      yearsExperience: Number(formData.get('yearsExperience') || 0),
      programInterest: String(formData.get('programInterest') || ''),
      documents: {
        cv: String(formData.get('cvLink') || ''),
        certificates: String(formData.get('certLink') || ''),
      },
    });
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center p-6">
      <Card>
        <CardHeader>
          <CardTitle>Lecturer Application</CardTitle>
          <CardDescription>
            Apply to join UnivAI as a lecturer. Our academic team will review your profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" name="fullName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" name="department" placeholder="School of ICT" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input id="specialization" name="specialization" placeholder="Software Engineering" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="highestQualification">Highest Qualification</Label>
                <Input id="highestQualification" name="highestQualification" placeholder="MSc / PhD" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearsExperience">Years Experience</Label>
                <Input id="yearsExperience" name="yearsExperience" type="number" min="0" defaultValue="0" />
              </div>
              <div className="space-y-2">
                <Label>Program of Interest</Label>
                <Select name="programInterest" defaultValue={programs[0]?.id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio / Teaching Summary</Label>
              <Textarea id="bio" name="bio" placeholder="Your teaching background and focus." />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cvLink">CV Link</Label>
                <Input id="cvLink" name="cvLink" placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certLink">Certificates Link</Label>
                <Input id="certLink" name="certLink" placeholder="https://..." />
              </div>
            </div>

            <Button type="submit" className="w-full">Submit Lecturer Application</Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>Already approved?</span>
          <Button variant="outline" asChild>
            <Link href="/login/lecturer">Lecturer Login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
