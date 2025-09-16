'use client';

import React, { useState, useMemo } from 'react';
import { MobileContactCard } from './mobile-contact-card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Users,
  ChevronDown,
  ChevronUp,
  UserCheck,
  UserX,
  UserPlus,
  Eye,
  EyeOff,
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  category: string;
  status: string;
  type?: string;
  portalStatus?: string;
  _count?: {
    assignedTasks?: number;
  };
}

interface ContactSection {
  id: string;
  title: string;
  icon?: React.ReactNode;
  contacts: Contact[];
  isExpanded: boolean;
  color?: string;
}

interface MobileContactListProps {
  contacts: Contact[];
  onInvite?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
  onTap?: (contact: Contact) => void;
  showPortalProgress?: boolean;
  className?: string;
}

export function MobileContactList({
  contacts,
  onInvite,
  onDelete,
  onTap,
  showPortalProgress = true,
  className,
}: MobileContactListProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    // Load saved preferences from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('contactSectionsExpanded');
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    }
    // Default: expand active section
    return new Set(['active']);
  });

  const [showInactive, setShowInactive] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('showInactiveContacts');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  // Calculate sections
  const sections = useMemo(() => {
    const sectionMap: Record<string, ContactSection> = {
      active: {
        id: 'active',
        title: 'Active Contacts',
        icon: <UserCheck className="h-4 w-4" />,
        contacts: [],
        isExpanded: expandedSections.has('active'),
        color: 'text-green-500',
      },
      potential: {
        id: 'potential',
        title: 'Potential',
        icon: <UserPlus className="h-4 w-4" />,
        contacts: [],
        isExpanded: expandedSections.has('potential'),
        color: 'text-blue-500',
      },
      follow_up: {
        id: 'follow_up',
        title: 'Follow Up',
        icon: <Users className="h-4 w-4" />,
        contacts: [],
        isExpanded: expandedSections.has('follow_up'),
        color: 'text-yellow-500',
      },
      inactive: {
        id: 'inactive',
        title: 'Inactive',
        icon: <UserX className="h-4 w-4" />,
        contacts: [],
        isExpanded: expandedSections.has('inactive'),
        color: 'text-gray-500',
      },
      blacklisted: {
        id: 'blacklisted',
        title: 'Blacklisted',
        icon: <UserX className="h-4 w-4" />,
        contacts: [],
        isExpanded: expandedSections.has('blacklisted'),
        color: 'text-red-500',
      },
    };

    // Organize contacts by status
    contacts.forEach((contact) => {
      const status = contact.status.toLowerCase();
      if (sectionMap[status]) {
        sectionMap[status].contacts.push(contact);
      } else if (status === 'active') {
        sectionMap.active.contacts.push(contact);
      } else {
        // Default to active if status is unknown
        sectionMap.active.contacts.push(contact);
      }
    });

    // Filter out empty sections and handle inactive visibility
    return Object.values(sectionMap).filter((section) => {
      if (section.id === 'inactive' || section.id === 'blacklisted') {
        return showInactive && section.contacts.length > 0;
      }
      return section.contacts.length > 0;
    });
  }, [contacts, expandedSections, showInactive]);

  // Portal statistics
  const portalStats = useMemo(() => {
    const stats = {
      active: 0,
      pending: 0,
      none: 0,
      total: contacts.length,
    };

    contacts.forEach((contact) => {
      if (contact.portalStatus === 'ACTIVE') {
        stats.active++;
      } else if (contact.portalStatus === 'INVITED') {
        stats.pending++;
      } else {
        stats.none++;
      }
    });

    return stats;
  }, [contacts]);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
    
    // Save preferences
    if (typeof window !== 'undefined') {
      localStorage.setItem('contactSectionsExpanded', JSON.stringify(Array.from(newExpanded)));
    }
  };

  const toggleShowInactive = () => {
    const newValue = !showInactive;
    setShowInactive(newValue);
    
    // Save preference
    if (typeof window !== 'undefined') {
      localStorage.setItem('showInactiveContacts', JSON.stringify(newValue));
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Portal Progress */}
      {showPortalProgress && portalStats.total > 0 && (
        <div className="bg-graphite-800/30 backdrop-blur-sm rounded-lg p-3 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/80">Portal Access</span>
            <span className="text-sm text-white/60">
              {portalStats.active} of {portalStats.total}
            </span>
          </div>
          <div className="w-full bg-graphite-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${(portalStats.active / portalStats.total) * 100}%` 
              }}
            />
          </div>
          {portalStats.pending > 0 && (
            <p className="text-xs text-yellow-500 mt-1">
              {portalStats.pending} pending {portalStats.pending === 1 ? 'invitation' : 'invitations'}
            </p>
          )}
        </div>
      )}

      {/* Sections - Clean layout like Tasks page */}
      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.id} className="space-y-2">
            {/* Section Header - Minimal, no frame */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between px-1 py-1 hover:bg-white/5 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className={section.color}>{section.icon}</span>
                <span className="text-sm font-medium text-white">{section.title}</span>
                <span className="text-xs text-white/40">({section.contacts.length})</span>
              </div>
              {section.isExpanded ? (
                <ChevronUp className="h-4 w-4 text-white/40" />
              ) : (
                <ChevronDown className="h-4 w-4 text-white/40" />
              )}
            </button>

            {/* Section Content - Cards displayed directly */}
            {section.isExpanded && (
              <div className="space-y-2">
                {section.contacts.map((contact) => (
                  <MobileContactCard
                    key={contact.id}
                    contact={contact}
                    onInvite={onInvite}
                    onDelete={onDelete}
                    onTap={onTap}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Show/Hide Inactive Toggle */}
      {(contacts.some(c => c.status === 'INACTIVE' || c.status === 'BLACKLISTED')) && (
        <Button
          variant="outline"
          size="sm"
          onClick={toggleShowInactive}
          className="w-full border-white/20 text-white/60 hover:text-white hover:bg-white/10"
        >
          {showInactive ? (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              Hide Inactive Contacts
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Show Inactive Contacts
            </>
          )}
        </Button>
      )}

      {/* Empty State */}
      {contacts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-white/20 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            No contacts yet
          </h3>
          <p className="text-white/60 max-w-sm">
            Add your first contact to start managing your project team.
          </p>
        </div>
      )}
    </div>
  );
}