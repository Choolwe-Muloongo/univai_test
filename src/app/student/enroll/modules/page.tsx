'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getProgramModules, getEnrollment, saveEnrollmentModules } from '@/lib/api';
import type { EnrollmentData } from '@/lib/api/types';
import type { ProgramModule } from '@/lib/api/types';

export default function EnrollmentModulesPage() {
  const { toast } = useToast();
  const [modules, setModules] = useState<ProgramModule[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [moduleList, enrollment] = await Promise.all([
          getProgramModules(),
          getEnrollment(),
        ]);
        setModules(moduleList);
        const existingSelection = (enrollment as EnrollmentData | null)?.selectedModules ?? [];
        setSelectedModules(existingSelection.length ? existingSelection : moduleList.map((item) => item.id));
      } catch (error) {
        console.error('Failed to load modules', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleModule = (id: string) => {
    setSelectedModules((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (selectedModules.length === 0) {
      toast({
        title: 'Select at least one module',
        description: 'You need at least one module to proceed.',
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    try {
      await saveEnrollmentModules(selectedModules);
      toast({ title: 'Modules saved', description: 'Your semester selection has been updated.' });
    } catch (error: any) {
      toast({
        title: 'Save failed',
        description: error?.message ?? 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading modules...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Select Semester Modules</h1>
        <p className="text-muted-foreground">Choose the modules you want to register for this semester.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Semester Modules</CardTitle>
          <CardDescription>Default modules are pre-selected for your program.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {modules.map((module) => {
            const selected = selectedModules.includes(module.id);
            return (
              <div key={module.id} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">{module.title}</p>
                  <p className="text-sm text-muted-foreground">Semester {module.semester}</p>
                </div>
                <Button
                  size="sm"
                  variant={selected ? 'default' : 'outline'}
                  onClick={() => toggleModule(module.id)}
                >
                  {selected ? 'Selected' : 'Select'}
                </Button>
              </div>
            );
          })}
          {modules.length === 0 && (
            <p className="text-sm text-muted-foreground">No modules available yet.</p>
          )}
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="outline" asChild>
            <Link href="/student/enroll">Back</Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Selection'}
            </Button>
            <Button asChild>
              <Link href="/student/enroll/payment">Continue to Payment</Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

