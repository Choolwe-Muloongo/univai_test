// src/app/(app)/checkout/page.tsx
'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, Wallet, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { completeCheckout } from '@/lib/api';
import { useSession } from '@/components/providers/session-provider';

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const { refresh } = useSession();

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      await completeCheckout('premium-student');
      await refresh();
      toast({
        title: 'Upgrade Successful!',
        description: 'Welcome to Premium. You now have access to all features.',
      });
      router.push('/student/dashboard');
    } catch (error) {
      console.error('Checkout error', error);
      toast({
        title: 'Payment failed',
        description: 'Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Checkout</CardTitle>
          <CardDescription>
            You are one step away from unlocking your full potential.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handlePayment}>
            <CardContent className="space-y-6">
                <Card className="bg-muted/50">
                    <CardHeader>
                        <CardTitle className="text-xl">Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-between items-center">
                        <p className='font-semibold'>UnivAI Premium Plan (1 Year)</p>
                        <p className='text-2xl font-bold'>$250</p>
                    </CardContent>
                </Card>

                <div className='space-y-4'>
                     <h3 className="text-lg font-semibold">Payment Method</h3>
                     <RadioGroup defaultValue="card" className="space-y-2">
                        <Label htmlFor="card" className="flex items-center gap-4 rounded-md border p-4 has-[:checked]:border-primary">
                            <RadioGroupItem value="card" id="card" />
                            <CreditCard className="h-6 w-6" />
                            <div className="grid gap-1.5 leading-none">
                                <span className='font-semibold'>Pay with Card or Bank</span>
                                <span className='text-sm text-muted-foreground'>Card, bank transfer, or mobile money</span>
                            </div>
                        </Label>
                         <Label htmlFor="aftacoin" className="flex items-center gap-4 rounded-md border p-4 has-[:checked]:border-primary">
                            <RadioGroupItem value="aftacoin" id="aftacoin" />
                            <Wallet className="h-6 w-6" />
                            <div className="grid gap-1.5 leading-none">
                                <span className='font-semibold'>Pay with AFTACOIN</span>
                                <span className='text-sm text-muted-foreground'>Use your existing wallet balance</span>
                            </div>
                        </Label>
                    </RadioGroup>
                </div>
                 <div className='space-y-4'>
                    <h3 className="text-lg font-semibold">Billing Information</h3>
                     <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" defaultValue="Premium Student" required/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" defaultValue="student.premium@univai.edu" required/>
                    </div>
                </div>

            </CardContent>
            <CardFooter>
                <Button className="w-full" size="lg" type="submit" disabled={isProcessing}>
                    {isProcessing ? (
                        <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing Payment...
                        </>
                    ) : (
                        'Confirm Payment of $250'
                    )}
                </Button>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
}
