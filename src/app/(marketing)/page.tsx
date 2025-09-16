// src/app/(marketing)/page.tsx
import Link from 'next/link';
import { Logo } from '@/components/icons/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Check, Star, ArrowRight, BookOpen, Lightbulb, FlaskConical, Briefcase, Users, GraduationCap, X } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

const features = [
  {
    icon: Lightbulb,
    title: 'AI-Powered Tutoring',
    description: 'Get instant, 24/7 help with course material. Our AI tutor provides personalized explanations to keep you on track.',
  },
  {
    icon: BookOpen,
    title: 'Personalized Study Plans',
    description: 'Our AI analyzes your goals and learning style to generate a custom study plan that adapts as you progress.',
  },
  {
    icon: FlaskConical,
    title: 'Virtual Labs & Code Feedback',
    description: 'Apply your knowledge in hands-on virtual labs and get instant AI-driven feedback on your code.',
  },
  {
    icon: GraduationCap,
    title: 'Verified Certificates',
    description: 'Earn blockchain-verified certificates upon course completion to validate your skills to employers.',
  },
  {
    icon: Briefcase,
    title: 'Career & Job Hub',
    description: 'Access exclusive job postings and internship opportunities from our network of partner employers.',
  },
  {
    icon: Users,
    title: 'Global Community',
    description: 'Connect with peers, collaborate on projects, and learn from a diverse community of students and experts.',
  },
];

const freemiumFeatures = [
  { text: 'Access to introductory modules', included: true },
  { text: 'Read-only access to community', included: true },
  { text: 'AI Tutor and Study Planner', included: false },
  { text: 'Verified Certificate', included: false },
  { text: 'Full access to Career Hub', included: false },
];

const premiumFeatures = [
  { text: 'Unlimited access to all course content', included: true },
  { text: 'Full access to AI Tutor and Study Planner', included: true },
  { text: 'Verified Certificate upon completion', included: true },
  { text: 'Full community access (posting, messaging)', included: true },
  { text: 'Full access to Career & Job Hub', included: true },
  { text: 'Eligible for AFTACOIN rewards', included: true },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-primary">
            <Logo className="size-8" />
            <span>UnivAI</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <Link href="#features" className="text-muted-foreground transition-colors hover:text-foreground">Features</Link>
            <Link href="#pricing" className="text-muted-foreground transition-colors hover:text-foreground">Pricing</Link>
          </nav>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
                <Link href="/register">Register Now</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center md:px-6 md:py-32">
          <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            The Future of Global Higher Education, <span className="text-primary">Powered by AI</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground md:text-xl">
            UnivAI offers accredited degrees with AI-driven learning tools, a global community, and a direct path to your career. Start learning for free today.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/register">Get Started for Free <ArrowRight className="ml-2"/></Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full bg-muted py-20 md:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">A Smarter Way to Learn</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Our platform is packed with AI-powered features designed to enhance your learning experience and accelerate your career.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="flex flex-col">
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="mt-2">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="w-full py-20 md:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Choose Your Plan</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Start for free and upgrade when you're ready to unlock your full potential.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 items-start gap-8 md:grid-cols-2">
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
                        <Button variant="outline" className="w-full" size="lg" asChild>
                            <Link href="/register">Get Started</Link>
                        </Button>
                    </CardFooter>
                </Card>

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
                        <Button className="w-full" size="lg" asChild>
                            <Link href="/register">Upgrade to Premium</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t bg-muted">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 px-4 py-8 md:px-6">
            <div className="flex flex-col gap-2 items-start">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Logo className="size-6" />
                    <span>UnivAI</span>
                </div>
                <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} UnivAI. All rights reserved.</p>
                <div className="flex items-center gap-4 text-sm">
                    <Link href="#" className="text-muted-foreground hover:text-foreground">Privacy</Link>
                    <Link href="#" className="text-muted-foreground hover:text-foreground">Terms</Link>
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <h4 className="font-semibold">Students</h4>
                <Link href="/login" className="text-muted-foreground text-sm hover:text-foreground">Student Login</Link>
                <Link href="/register" className="text-muted-foreground text-sm hover:text-foreground">Register</Link>
                <Link href="#features" className="text-muted-foreground text-sm hover:text-foreground">Features</Link>
                <Link href="#pricing" className="text-muted-foreground text-sm hover:text-foreground">Pricing</Link>
            </div>
            <div className="flex flex-col gap-2">
                <h4 className="font-semibold">Staff & Partners</h4>
                <Link href="/login/lecturer" className="text-muted-foreground text-sm hover:text-foreground">Lecturer Login</Link>
                <Link href="/login/admin" className="text-muted-foreground text-sm hover:text-foreground">Admin Login</Link>
                <Link href="/login/employer" className="text-muted-foreground text-sm hover:text-foreground">Employer Login</Link>
            </div>
             <div className="flex flex-col gap-2">
                <h4 className="font-semibold">Company</h4>
                <Link href="#" className="text-muted-foreground text-sm hover:text-foreground">About</Link>
                <Link href="#" className="text-muted-foreground text-sm hover:text-foreground">Blog</Link>
                <Link href="#" className="text-muted-foreground text-sm hover:text-foreground">Contact</Link>
            </div>
        </div>
      </footer>
    </div>
  );
}
