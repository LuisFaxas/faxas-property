'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useProjects, useContacts } from '@/hooks/use-api';
import { Widget } from '@/components/dashboard/Widget';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Users, AlertCircle, RefreshCw, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TeamVendorsWidget() {
  const { data: projects } = useProjects();
  const projectList = Array.isArray(projects) ? projects : (projects as any)?.data || [];
  const activeProject = projectList.find((p: any) => p.status === 'ACTIVE') || projectList[0];
  const projectId = activeProject?.id;

  const {
    data: contacts,
    isLoading,
    error,
    refetch,
  } = useContacts({ projectId }, !!projectId);

  // Normalize contacts data
  const contactList = useMemo(() => {
    if (!contacts) return [];
    return Array.isArray(contacts)
      ? contacts
      : (contacts as any)?.data || (contacts as any)?.items || [];
  }, [contacts]);

  // Filter active contacts and count by type
  const { activeContacts, typeCounts } = useMemo(() => {
    const active = contactList.filter((c: any) =>
      !c.status || c.status === 'ACTIVE' || c.status === 'active'
    );

    const counts: Record<string, number> = {};
    active.forEach((c: any) => {
      const type = (c.type || 'OTHER').toUpperCase();
      counts[type] = (counts[type] || 0) + 1;
    });

    return {
      activeContacts: active,
      typeCounts: counts,
    };
  }, [contactList]);

  // Get most recent contacts (by createdAt or just last 3)
  const recentContacts = useMemo(() => {
    const sorted = [...activeContacts].sort((a: any, b: any) => {
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });
    return sorted.slice(0, 3);
  }, [activeContacts]);

  // Format type counts for display
  const typesSummary = useMemo(() => {
    const types = [
      { key: 'STAFF', label: 'Staff' },
      { key: 'VENDOR', label: 'Vendors' },
      { key: 'CONTRACTOR', label: 'Contractors' },
      { key: 'SUBCONTRACTOR', label: 'Subs' },
    ];

    const parts = types
      .filter(t => typeCounts[t.key] > 0)
      .map(t => `${typeCounts[t.key]} ${t.label}`);

    return parts.length > 0 ? parts.join(' • ') : null;
  }, [typeCounts]);

  // Get contact type badge color
  const getTypeColor = (type?: string) => {
    const t = String(type || 'OTHER').toUpperCase();
    const map: Record<string, string> = {
      STAFF: 'bg-blue-500/20 text-blue-400',
      VENDOR: 'bg-purple-500/20 text-purple-400',
      CONTRACTOR: 'bg-green-500/20 text-green-400',
      SUBCONTRACTOR: 'bg-yellow-500/20 text-yellow-400',
      CLIENT: 'bg-pink-500/20 text-pink-400',
      OTHER: 'bg-white/10 text-white/60',
    };
    return map[t] || map.OTHER;
  };

  // Loading
  if (isLoading) {
    return (
      <Widget>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Team & Vendors</h3>
          <Users className="h-4 w-4 text-white/40" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </Widget>
    );
  }

  // Error
  if (error) {
    return (
      <Widget>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Team & Vendors</h3>
          <AlertCircle className="h-4 w-4 text-red-400" />
        </div>
        <div className="flex items-center justify-between py-4">
          <p className="text-sm text-white/60">Failed to load contacts</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="h-8 gap-1.5 text-xs focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      </Widget>
    );
  }

  // Empty
  if (activeContacts.length === 0) {
    return (
      <Widget>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Team & Vendors</h3>
          <Users className="h-4 w-4 text-white/40" />
        </div>
        <div className="flex items-center justify-between py-4">
          <p className="text-sm text-white/60">No active contacts</p>
          <Button
            variant="secondary"
            size="sm"
            asChild
            className="h-8 text-xs focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
          >
            <Link href="/admin/contacts/new">
              <UserPlus className="h-3 w-3 mr-1" />
              Add Contact
            </Link>
          </Button>
        </div>
      </Widget>
    );
  }

  // Content
  return (
    <Widget>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Team & Vendors</h3>
        <span className="text-xs text-white/60">{activeContacts.length} active</span>
      </div>

      {/* Type counts summary */}
      {typesSummary && (
        <div className="text-xs text-white/60 mb-2 pb-2 border-b border-white/10">
          {typesSummary}
        </div>
      )}

      {/* Recent contacts */}
      <div className="space-y-1">
        {recentContacts.map((contact: any) => (
          <Link
            key={contact.id}
            href={`/admin/contacts/${contact.id}`}
            className={cn(
              'block -mx-2 rounded p-2',
              'min-h-[44px]',
              'hover:bg-white/5',
              'focus:outline-none focus:ring-2 focus:ring-white/20',
              'motion-reduce:transition-none transition-colors'
            )}
            aria-label={`${contact.name} - ${contact.type?.toLowerCase()}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-white truncate flex-1">
                {contact.name}
              </span>
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  getTypeColor(contact.type)
                )}
              >
                {(contact.type || 'other').toLowerCase()}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-3 text-right">
        <Link
          href="/admin/contacts"
          className="text-xs text-white/60 hover:text-white motion-reduce:transition-none transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 rounded px-1"
          aria-label="View all contacts"
        >
          View all →
        </Link>
      </div>
    </Widget>
  );
}