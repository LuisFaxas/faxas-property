'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';
import { useAllRfps, useProjects } from '@/hooks/use-api';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Send } from 'lucide-react';

interface InviteToRfpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactIds: string[];
  onSuccess?: () => void;
}

export function InviteToRfpDialog({
  open,
  onOpenChange,
  contactIds,
  onSuccess
}: InviteToRfpDialogProps) {
  const [selectedRfpId, setSelectedRfpId] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: projects } = useProjects();
  const projectId = Array.isArray(projects) ? projects[0]?.id : projects?.id;
  const { data: rfps, isLoading: rfpsLoading } = useAllRfps();

  const queryClient = useQueryClient();

  const handleInvite = async () => {
    if (!selectedRfpId) {
      toast({
        title: 'Error',
        description: 'Please select an RFP',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post(
        `/api/v1/rfps/${selectedRfpId}/invite`,
        { contactIds, message },
        {
          headers: {
            'x-project-id': projectId
          }
        }
      );

      if (response.data.success) {
        toast({
          title: 'Success',
          description: `Invited ${response.data.data.invited.length} contacts to bid`
        });

        // Invalidate queries per SOT - docs/05-state-management.md
        queryClient.invalidateQueries({ queryKey: ['rfps', { projectId }] });
        queryClient.invalidateQueries({ queryKey: ['bids', { rfpId: selectedRfpId }] });

        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error) {
      console.error('Failed to invite contacts:', error);
      toast({
        title: 'Error',
        description: 'Failed to send invitations',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeRfps = rfps?.filter((r: any) => r.status === 'PUBLISHED') || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-black/95 border-white/10">
        <DialogHeader>
          <DialogTitle>Invite to RFP</DialogTitle>
          <DialogDescription>
            Send bid invitations to {contactIds.length} selected contact{contactIds.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="rfp">Select RFP</Label>
            <Select value={selectedRfpId} onValueChange={setSelectedRfpId}>
              <SelectTrigger id="rfp">
                <SelectValue placeholder="Choose an RFP" />
              </SelectTrigger>
              <SelectContent>
                {rfpsLoading && (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                )}
                {activeRfps.length === 0 && !rfpsLoading && (
                  <SelectItem value="none" disabled>No active RFPs</SelectItem>
                )}
                {activeRfps.map((rfp: any) => (
                  <SelectItem key={rfp.id} value={rfp.id}>
                    {rfp.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message to include with the invitation..."
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleInvite}
            disabled={!selectedRfpId || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Invitations
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}