// src/app/(app)/payments/page.tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Check, Star, X } from 'lucide-react';

const freemiumFeatures = [
  { text: 'Access to introductory modules of all courses', included: true },
  { text: 'Read-only access to community discussions', included: true },
  { text: 'AI Tutor and Study Planner', included: false },
  { text: 'Verified Certificate upon completion', included: false },
  { text: 'Full access to Career & Job Hub', included: false },
  { text: 'Ability to post in community and message peers', included: false },
];

const premiumFeatures = [
  { text: 'Unlimited access to all course content', included: true },
  { text: 'Full access to AI Tutor and Study Planner', included: true },
  { text: 'Verified Certificate upon completion', included: true },
  { text: 'Full community access (posting, messaging)', included: true },
  { text: 'Full access to Career & Job Hub', included: true },
  { text: 'Eligible for AFTACOIN rewards', included: true },
];

export default function PaymentsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Choose Your Plan</h1>
        <p className="text-muted-foreground">
          Start your learning journey with a plan that fits your needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Freemium Plan */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Freemium</CardTitle>
            <CardDescription>Get a taste of our platform with limited access.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-4xl font-bold">Free</p>
            <ul className="space-y-3">
              {freemiumFeatures.map((feature, index) => (
                <li key={index} className={`flex items-center gap-3 ${!feature.included && 'text-muted-foreground'}`}>
                  {feature.included ? <Check className="h-5 w-5 text-green-500" /> : <X className="h-5 w-5" />}
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" size="lg">
              Continue with Free Plan
            </Button>
          </CardFooter>
        </Card>

        {/* Premium Plan */}
        <Card className="border-2 border-primary shadow-lg shadow-primary/20 relative">
            <div className="absolute top-0 right-4 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                <Star className='w-4 h-4'/>
                Best Value
            </div>
          <CardHeader>
            <CardTitle className="text-2xl">Premium</CardTitle>
            <CardDescription>Unlock your full potential with complete access.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
                <span className="text-4xl font-bold">$250</span>
                <span className="text-muted-foreground"> / year</span>
            </div>
             <ul className="space-y-3">
              {premiumFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-primary">
                <Star className="h-5 w-5 flex-shrink-0" />
                <p><span className='font-semibold'>Earn a Reward:</span> 40% of your fee ($100) will be rewarded to your wallet as AFTACOIN upon program completion.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" size="lg">
              Upgrade to Premium
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
