import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

export default function EmployerProfilePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Company Profile</h1>
        <p className="text-muted-foreground">Manage your organization details and hiring preferences.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
            <CardDescription>Keep your profile accurate for students and alumni.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" defaultValue="Innovate Solutions" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input id="industry" defaultValue="Technology & Product" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" defaultValue="https://innovate.example" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="size">Company Size</Label>
              <Input id="size" defaultValue="51-200" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Company Description</Label>
              <Textarea id="description" className="min-h-28" defaultValue="We build product experiences for global fintech and education clients." />
            </div>
            <Button className="md:col-span-2">Save Changes</Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Primary Contact</CardTitle>
              <CardDescription>Who should students reach out to?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name</Label>
                <Input id="contactName" defaultValue="Avery Cole" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input id="contactEmail" type="email" defaultValue="hiring@innovate.example" />
              </div>
              <Button variant="outline" className="w-full">Update Contact</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verification Status</CardTitle>
              <CardDescription>Boost trust with verified information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <Badge className="w-fit">Verified Employer</Badge>
              <p>Verification valid through December 2026.</p>
              <Button variant="outline" className="w-full">Request Update</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
