'use client';

import { useMemo } from 'react';
import { useBudgetSummary, useProjects } from '@/hooks/use-api';
import { useAuth } from '@/app/contexts/AuthContext';
import { Widget } from '@/components/dashboard/Widget';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, Minus, Info } from 'lucide-react';
import Link from 'next/link';
import { fmtCurrencySafe, fmtPercentSafe, widthPercent, toNum } from '@/lib/ui/format';

type StatusKey = 'on-track' | 'warning' | 'over';

function StatusBadge({ status }: { status: StatusKey }) {
  const map = {
    'on-track': { text: 'On Track', cls: 'bg-[#8EE3C8]/20 text-[#8EE3C8]' },
    warning: { text: 'Warning', cls: 'bg-yellow-400/20 text-yellow-400' },
    over: { text: 'Over Budget', cls: 'bg-red-400/20 text-red-400' },
  } as const;

  const Icon = status === 'on-track' ? Minus : TrendingUp;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${map[status].cls}`}
      aria-live="polite"
    >
      <Icon className="h-3 w-3" />
      {map[status].text}
    </span>
  );
}

function Stat({
  label,
  value,
  sublabel,
  emphasize = false,
  valueClass = 'text-white',
}: {
  label: string;
  value: string;
  sublabel?: string;
  emphasize?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-white/60">{label}</p>
      <p className={`font-semibold ${emphasize ? 'text-lg' : 'text-base'} ${valueClass}`}>{value}</p>
      {sublabel && <p className="text-xs text-white/60">{sublabel}</p>}
    </div>
  );
}

export function BudgetHealthWidget() {
  const { userRole } = useAuth();
  const { data: projects } = useProjects();

  // Choose active project (or first)
  const projectList = Array.isArray(projects) ? projects : projects?.data || [];
  const activeProject = projectList.find((p: any) => p.status === 'ACTIVE') || projectList[0];
  const projectId = activeProject?.id;

  const { data: summary, isLoading, error } = useBudgetSummary(projectId, !!projectId);

  // Calculate runway (must be before any conditional returns for hooks consistency)
  const runway = useMemo(() => {
    if (!activeProject?.startDate || !summary) return null;
    
    const summaryData = (summary as any)?.data || summary;
    const totalSpent = toNum(summaryData?.totalSpent);
    const totalBudget = toNum(summaryData?.totalBudget);
    if (totalSpent === null || totalBudget === null) return null;
    
    const variance = totalBudget - totalSpent;
    const start = new Date(activeProject.startDate);
    const now = new Date();
    const daysElapsed = Math.max(1, Math.floor((now.getTime() - start.getTime()) / 86400000) + 1);
    const dailyBurn = totalSpent / daysElapsed;
    if (!isFinite(dailyBurn) || dailyBurn <= 0) return null;
    const daysLeft = Math.floor(Math.max(0, variance) / dailyBurn);
    return Number.isFinite(daysLeft) ? daysLeft : null;
  }, [activeProject?.startDate, summary]);

  // Loading state
  if (isLoading) {
    return (
      <Widget>
        <div className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-full" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </Widget>
    );
  }

  // Error / no data
  if (error || !summary) {
    return (
      <Widget>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Budget Health</h2>
          <p className="text-sm text-white/60">No budget data available</p>
          <Button
            asChild
            variant="outline"
            type="button"
            className="w-full focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
          >
            <Link href="/admin/budget">
              Set up budget
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Widget>
    );
  }

  // Normalize numbers & guards
  const summaryData = (summary as any)?.data || summary;
  const totalBudget = toNum(summaryData?.totalBudget);
  const totalSpent = toNum(summaryData?.totalSpent);
  const hasBudget = totalBudget !== null && totalBudget > 0;

  // Show a precise empty-budget state (configured above)
  if (!hasBudget) {
    return (
      <Widget>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Budget Health</h2>
              <p className="text-2xl font-bold text-white mt-1">—</p>
            </div>
            <StatusBadge status="on-track" />
          </div>
          <div className="flex items-center gap-2 text-xs text-white/60">
            <Info className="h-3.5 w-3.5" />
            Budget not configured. Add a total budget to track usage and alerts.
          </div>
          <Button
            asChild
            variant="default"
            type="button"
            className="w-full focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
          >
            <Link href="/admin/budget">
              Set up budget
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Widget>
    );
  }

  // Core metrics
  const percentUsed = totalSpent !== null ? (totalSpent / totalBudget) * 100 : 0;
  const variance = totalSpent !== null ? totalBudget - totalSpent : totalBudget;

  const status: StatusKey =
    variance < 0 ? 'over' : percentUsed > 90 ? 'warning' : 'on-track';

  // VIEWER — compact status-only
  if (userRole === 'VIEWER') {
    return (
      <Widget>
        <Link
          href="/admin/budget"
          className="block space-y-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg motion-reduce:transition-none"
          aria-label="Open Budget"
        >
          <div className="flex items-start justify-between">
            <h2 className="text-lg font-semibold text-white">Budget Health</h2>
            <StatusBadge status={status} />
          </div>
          <div className="text-xs text-white/60">
            Total budget {fmtCurrencySafe(totalBudget)}
            {runway !== null && (
              <>
                {' • '}Runway&nbsp;<span className="text-white">{runway}d</span>
              </>
            )}
          </div>
        </Link>
      </Widget>
    );
  }

  // CONTRACTOR — percent & runway + overages CTA when present
  if (userRole === 'CONTRACTOR') {
    return (
      <Widget>
        <div className="space-y-4">
          <Link
            href="/admin/budget"
            className="block space-y-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg motion-reduce:transition-none"
            aria-label="Open Budget"
          >
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold text-white">Budget Health</h2>
              <StatusBadge status={status} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Stat label="Budget" value={fmtCurrencySafe(totalBudget)} emphasize />
              <Stat
                label="Remaining"
                value={fmtCurrencySafe(Math.max(0, variance))}
                valueClass={variance < 0 ? 'text-red-400' : 'text-[#8EE3C8]'}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span id="budget-usage-label-contractor" className="text-white/60">
                  Budget Used
                </span>
                <span className="text-white font-medium">
                  {fmtPercentSafe(totalSpent, totalBudget)}
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={Math.round(Math.min(100, percentUsed))}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-labelledby="budget-usage-label-contractor"
                className="h-2 bg-white/10 rounded-full overflow-hidden"
              >
                <div
                  className={`h-full motion-reduce:transition-none transition-all duration-500 ${
                    percentUsed > 90 ? 'bg-red-400' : percentUsed > 75 ? 'bg-yellow-400' : 'bg-[#8EE3C8]'
                  }`}
                  style={{ width: widthPercent(totalSpent, totalBudget) }}
                />
              </div>
              <p className="text-[10px] text-white/40">
                Thresholds: 75% caution • 90% critical
              </p>
            </div>

            {runway !== null && (
              <div className="text-xs text-white/60">
                Runway&nbsp;<span className="text-white">{runway} days</span> at current burn rate.
              </div>
            )}
          </Link>

          {summaryData?.overBudgetCount > 0 && (
            <Button
              asChild
              variant="outline"
              size="sm"
              type="button"
              className="w-full focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
            >
              <Link href="/admin/budget?filter=overages">
                Review overages ({summaryData?.overBudgetCount})
                <ArrowRight className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          )}
        </div>
      </Widget>
    );
  }

  // ADMIN/STAFF — full detail: totals, percent, runway, and overages CTA
  return (
    <Widget>
      <div className="space-y-4">
        <Link
          href="/admin/budget"
          className="block space-y-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg motion-reduce:transition-none"
          aria-label="Open Budget"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Budget Health</h2>
              <p className="text-2xl font-bold text-white mt-1">{fmtCurrencySafe(totalBudget)}</p>
            </div>
            <StatusBadge status={status} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Stat label="Spent" value={fmtCurrencySafe(totalSpent)} sublabel={`${fmtPercentSafe(totalSpent, totalBudget)} used`} />
            <Stat
              label="Remaining"
              value={fmtCurrencySafe(Math.abs(variance))}
              sublabel={variance < 0 ? 'Over budget' : 'Available'}
              valueClass={variance < 0 ? 'text-red-400' : 'text-[#8EE3C8]'}
              emphasize
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span id="budget-usage-label" className="text-white/60">
                Budget Usage
              </span>
              <span className="text-white">{fmtPercentSafe(totalSpent, totalBudget)}</span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={Math.round(Math.min(100, percentUsed))}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-labelledby="budget-usage-label"
              className="h-2 bg-white/10 rounded-full overflow-hidden"
              title="Usage thresholds: 75% caution, 90% critical"
            >
              <div
                className={`h-full motion-reduce:transition-none transition-all duration-500 ${
                  percentUsed > 90 ? 'bg-red-400' : percentUsed > 75 ? 'bg-yellow-400' : 'bg-[#8EE3C8]'
                }`}
                style={{ width: `${Math.min(100, percentUsed)}%` }}
              />
            </div>
            <p className="text-[10px] text-white/40">Thresholds: 75% caution • 90% critical</p>
          </div>

          {runway !== null && (
            <div className="text-xs text-white/60">
              Runway&nbsp;<span className="text-white">{runway} days</span> at current burn rate.
            </div>
          )}
        </Link>

        {summaryData?.overBudgetCount > 0 && (
          <Button
            asChild
            variant="outline"
            size="sm"
            type="button"
            className="w-full focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
          >
            <Link href="/admin/budget?filter=overages">
              Review overages ({summaryData?.overBudgetCount})
              <ArrowRight className="ml-2 h-3 w-3" />
            </Link>
          </Button>
        )}
      </div>
    </Widget>
  );
}