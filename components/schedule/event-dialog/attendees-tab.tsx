'use client';

import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  UserPlus, 
  X, 
  Mail, 
  Phone, 
  Building,
  Search,
  Check
} from 'lucide-react';
import { useContacts } from '@/hooks/use-api';
import type { EventFormData } from './index';

interface AttendeesTabProps {
  projectId: string;
}

export function AttendeesTab({ projectId }: AttendeesTabProps) {
  const { watch, setValue } = useFormContext<EventFormData>();
  const attendees = watch('attendees') || [];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'selected' | 'all'>('selected');
  
  // Fetch contacts from the project
  const { data: contactsData, isLoading } = useContacts({ projectId });
  const contacts = contactsData?.data || [];

  // Filter contacts based on search
  const filteredContacts = contacts.filter((contact: any) => {
    const query = searchQuery.toLowerCase();
    return (
      contact.name?.toLowerCase().includes(query) ||
      contact.company?.toLowerCase().includes(query) ||
      contact.emails?.some((email: string) => email.toLowerCase().includes(query))
    );
  });

  const toggleAttendee = (contactId: string) => {
    const currentAttendees = attendees || [];
    if (currentAttendees.includes(contactId)) {
      setValue('attendees', currentAttendees.filter(id => id !== contactId));
    } else {
      setValue('attendees', [...currentAttendees, contactId]);
    }
  };

  const removeAttendee = (contactId: string) => {
    setValue('attendees', attendees.filter(id => id !== contactId));
  };

  const getContactById = (contactId: string) => {
    return contacts.find((c: any) => c.id === contactId);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="space-y-2">
        <Label htmlFor="search" className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          Search Contacts
        </Label>
        <Input
          id="search"
          type="text"
          placeholder="Search by name, company, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-white/5 border-white/10"
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={selectedTab === 'selected' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedTab('selected')}
        >
          Selected ({attendees.length})
        </Button>
        <Button
          type="button"
          variant={selectedTab === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedTab('all')}
        >
          All Contacts ({contacts.length})
        </Button>
      </div>

      {/* Content based on selected tab */}
      {selectedTab === 'selected' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Selected Attendees
            </Label>
            <span className="text-sm text-white/60">
              {attendees.length} attendee{attendees.length !== 1 ? 's' : ''}
            </span>
          </div>

          {attendees.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No attendees selected</p>
              <p className="text-sm mt-2">
                Switch to "All Contacts" tab to add attendees
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {attendees.map((contactId) => {
                  const contact = getContactById(contactId);
                  if (!contact) return null;
                  
                  return (
                    <div
                      key={contactId}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-blue-600 text-white">
                            {getInitials(contact.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-white">{contact.name}</p>
                          {contact.company && (
                            <p className="text-sm text-white/60 flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {contact.company}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttendee(contactId)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Available Contacts
            </Label>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-white/60">Loading contacts...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No contacts found</p>
              {searchQuery && (
                <p className="text-sm mt-2">
                  Try adjusting your search criteria
                </p>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {filteredContacts.map((contact: any) => {
                  const isSelected = attendees.includes(contact.id);
                  
                  return (
                    <div
                      key={contact.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-600/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                      onClick={() => toggleAttendee(contact.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={isSelected ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white'}>
                            {getInitials(contact.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-white">{contact.name}</p>
                          <div className="flex items-center gap-3 text-sm text-white/60">
                            {contact.company && (
                              <span className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {contact.company}
                              </span>
                            )}
                            {contact.emails?.[0] && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {contact.emails[0]}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
}