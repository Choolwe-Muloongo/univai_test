'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, Clock3, Filter, ShieldAlert, UserCircle2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  formatSlaCountdown,
  getSortedLaneItems,
  opsLanes,
  type OpsLane,
  type OpsQueueItem,
  type Severity,
} from '@/lib/admin-operations';

const SESSION_KEY = 'admin-ops-filters-v1';

type LaneFilterState = {
  onlyMine: boolean;
};

const defaultFilterState: LaneFilterState = {
  onlyMine: false,
};

const severityClasses: Record<Severity, string> = {
  Critical: 'bg-red-100 text-red-800 border-red-300',
  High: 'bg-orange-100 text-orange-800 border-orange-300',
  Medium: 'bg-blue-100 text-blue-800 border-blue-300',
  Low: 'bg-gray-100 text-gray-800 border-gray-300',
};

export function OperationsClient({ items, currentAdmin }: { items: OpsQueueItem[]; currentAdmin: string }) {
  const [activeLane, setActiveLane] = useState<OpsLane>('Admissions Ops');
  const [laneFilters, setLaneFilters] = useState<Record<string, LaneFilterState>>({});

  useEffect(() => {
    const rawSaved = sessionStorage.getItem(SESSION_KEY);
    if (!rawSaved) return;

    try {
      const parsed = JSON.parse(rawSaved) as Record<string, LaneFilterState>;
      setLaneFilters(parsed);
    } catch {
      setLaneFilters({});
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(laneFilters));
  }, [laneFilters]);

  const updateOnlyMineFilter = (lane: OpsLane, value: boolean) => {
    setLaneFilters((prev) => ({
      ...prev,
      [lane]: {
        ...(prev[lane] ?? defaultFilterState),
        onlyMine: value,
      },
    }));
  };

  const laneItemsMap = useMemo(() => {
    const map = new Map<OpsLane, OpsQueueItem[]>();

    for (const lane of opsLanes) {
      const laneItems = items.filter((item) => item.lane === lane);
      const filterState = laneFilters[lane] ?? defaultFilterState;
      const filtered = filterState.onlyMine
        ? laneItems.filter((item) => item.assignedOwner.toLowerCase().includes(currentAdmin.toLowerCase()))
        : laneItems;

      map.set(lane, getSortedLaneItems(filtered));
    }

    return map;
  }, [currentAdmin, items, laneFilters]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Operations Command Center</h1>
        <p className="text-sm text-muted-foreground">
          Switch lanes to work pending queues with severity-first triage and SLA breach-risk ordering.
        </p>
      </div>

      <Tabs value={activeLane} onValueChange={(value) => setActiveLane(value as OpsLane)} className="space-y-4">
        <TabsList className="h-auto flex-wrap justify-start">
          {opsLanes.map((lane) => (
            <TabsTrigger key={lane} value={lane} className="mb-1">
              {lane}
            </TabsTrigger>
          ))}
        </TabsList>

        {opsLanes.map((lane) => {
          const filterState = laneFilters[lane] ?? defaultFilterState;
          const laneItems = laneItemsMap.get(lane) ?? [];

          return (
            <TabsContent key={lane} value={lane} className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{lane} queue</CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filters persist for this admin session. Sort order defaults to severity then SLA breach risk.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`only-mine-${lane}`}
                        checked={filterState.onlyMine}
                        onCheckedChange={(checked) => updateOnlyMineFilter(lane, checked)}
                      />
                      <label htmlFor={`only-mine-${lane}`} className="text-sm font-medium">
                        Only my items ({currentAdmin})
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground">{laneItems.length} items in current view</p>
                  </div>

                  <div className="space-y-3">
                    {laneItems.length === 0 ? (
                      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                        No queue items match the current filters.
                      </div>
                    ) : (
                      laneItems.map((item) => {
                        const slaLabel = formatSlaCountdown(item.slaDueAt);
                        const isBreached = slaLabel.startsWith('Breached');

                        return (
                          <Card key={item.id} className="border-l-4 border-l-primary">
                            <CardContent className="space-y-3 p-4">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm text-muted-foreground">Pending queue: {item.pendingQueue}</p>
                                  <h3 className="text-base font-semibold">{item.title}</h3>
                                </div>
                                <Badge className={severityClasses[item.severity]}>{item.severity}</Badge>
                              </div>

                              <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                                <p className="flex items-center gap-2">
                                  <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                                  Risk: {item.slaBreachRisk}%
                                </p>
                                <p className="flex items-center gap-2">
                                  <Clock3 className="h-4 w-4 text-muted-foreground" />
                                  <span className={isBreached ? 'text-red-600 font-medium' : ''}>SLA: {slaLabel}</span>
                                </p>
                                <p className="flex items-center gap-2">
                                  <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                                  Owner: {item.assignedOwner}
                                </p>
                                <p className="flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                                  Next best action: {item.nextBestAction}
                                </p>
                              </div>

                              <div className="flex justify-end">
                                <Button asChild>
                                  <Link href={`/admin/operations/${item.id}`}>
                                    Open detail & action panel <ArrowRight className="ml-2 h-4 w-4" />
                                  </Link>
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
