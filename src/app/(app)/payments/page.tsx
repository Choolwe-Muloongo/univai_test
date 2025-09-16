// src/app/(app)/payments/page.tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, Landmark, Globe, GraduationCap, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function PaymentsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payments & Finances</h1>
        <p className="text-muted-foreground">
          Manage your tuition, remittances, and student loans, powered by RemitSmart.
        </p>
      </div>

      <Tabs defaultValue="tuition" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tuition">
            <Landmark className="mr-2 h-4 w-4" /> Tuition
          </TabsTrigger>
          <TabsTrigger value="remittances">
            <Globe className="mr-2 h-4 w-4" /> Remittances
          </TabsTrigger>
          <TabsTrigger value="loans">
            <GraduationCap className="mr-2 h-4 w-4" /> Student Loans
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tuition">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Tuition Payments</CardTitle>
              <CardDescription>Pay your tuition fees securely using fiat or AFTACOIN.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardDescription>Next Payment Due</CardDescription>
                        <CardTitle>$2,500.00</CardTitle>
                    </CardHeader>
                    <CardFooter>
                        <p className="text-sm text-muted-foreground">Due Date: 2024-09-01</p>
                    </CardFooter>
                </Card>
                <div className='flex gap-4'>
                    <Button className="w-full" size="lg">Pay with Fiat</Button>
                    <Button className="w-full" size="lg" variant="secondary">Pay with AFTACOIN</Button>
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="remittances">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Cross-Border Remittances</CardTitle>
              <CardDescription>Send and receive funds globally with ease.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className='text-muted-foreground'>This feature is a simulation. In a real application, you would be able to send and receive funds across borders seamlessly through our integration with RemitSmart.</p>
                <div className='flex gap-4'>
                    <Button className="w-full" size="lg" variant="outline">Send Funds</Button>
                    <Button className="w-full" size="lg" variant="outline">Receive Funds</Button>
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loans">
            <Card className="mt-4">
                <CardHeader>
                <CardTitle>Student Loan Disbursements</CardTitle>
                <CardDescription>Manage your student loan applications and disbursements.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className='text-muted-foreground'>This feature is a simulation. In a real application, you would manage your student loans seamlessly through our integration with RemitSmart.</p>
                    <div className='flex gap-4'>
                        <Button className="w-full" size="lg" variant="outline">Apply for Loan</Button>
                        <Button className="w-full" size="lg" variant="outline">View Disbursements</Button>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
