import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ProgressChart } from '@/components/dashboard/progress-chart';
import { QuickLinks } from '@/components/dashboard/quick-links';

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Welcome Back, Student!</CardTitle>
            <CardDescription>Here's your progress overview.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressChart />
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <QuickLinks />
      </div>
    </div>
  );
}
