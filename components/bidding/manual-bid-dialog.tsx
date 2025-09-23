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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { useProjects } from '@/hooks/use-api';
import { Loader2, DollarSign, FileText, Upload } from 'lucide-react';

interface ManualBidDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rfpId: string;
  vendors?: Array<{
    id: string;
    name: string;
    email?: string;
  }>;
  onSuccess?: () => void;
}

export function ManualBidDialog({
  open,
  onOpenChange,
  rfpId,
  vendors = [],
  onSuccess
}: ManualBidDialogProps) {
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: projects } = useProjects();
  const projectId = projects?.[0]?.id;
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!selectedVendorId || !totalAmount) {
      toast({
        title: 'Error',
        description: 'Please select a vendor and enter the bid amount',
        variant: 'destructive'
      });
      return;
    }

    const amount = parseFloat(totalAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid bid amount',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // First, check if bid exists for this vendor
      const bidsResponse = await apiClient.get(
        `/api/v1/bids`,
        {
          params: { rfpId, vendorId: selectedVendorId },
          headers: { 'x-project-id': projectId }
        }
      );

      let bidId;
      if (bidsResponse.data.data.bids && bidsResponse.data.data.bids.length > 0) {
        // Update existing bid
        bidId = bidsResponse.data.data.bids[0].id;
        await apiClient.patch(
          `/api/v1/bids/${bidId}`,
          {
            totalAmount: amount,
            notes,
            status: 'SUBMITTED'
          },
          {
            headers: { 'x-project-id': projectId }
          }
        );
      } else {
        // Create new bid
        const createResponse = await apiClient.post(
          `/api/v1/bids`,
          {
            rfpId,
            vendorId: selectedVendorId,
            totalAmount: amount,
            notes,
            status: 'SUBMITTED'
          },
          {
            headers: { 'x-project-id': projectId }
          }
        );
        bidId = createResponse.data.data.id;
      }

      // Upload attachment if provided
      if (attachmentFile && bidId) {
        // Get signed URL for upload
        const signedUrlResponse = await apiClient.post(
          `/api/v1/storage/signed-url`,
          {
            fileName: attachmentFile.name,
            contentType: attachmentFile.type,
            purpose: 'bid-attachment'
          },
          {
            headers: { 'x-project-id': projectId }
          }
        );

        const { uploadUrl, storagePath } = signedUrlResponse.data.data;

        // Upload file to storage
        await fetch(uploadUrl, {
          method: 'PUT',
          body: attachmentFile,
          headers: {
            'Content-Type': attachmentFile.type
          }
        });

        // Save attachment metadata
        await apiClient.post(
          `/api/v1/bids/${bidId}/attachments`,
          {
            fileName: attachmentFile.name,
            storagePath,
            contentType: attachmentFile.type,
            size: attachmentFile.size
          },
          {
            headers: { 'x-project-id': projectId }
          }
        );
      }

      toast({
        title: 'Success',
        description: 'Bid recorded successfully'
      });

      // Invalidate queries per SOT - docs/05-state-management.md
      queryClient.invalidateQueries({ queryKey: ['bids', { rfpId }] });
      queryClient.invalidateQueries({ queryKey: ['rfp', rfpId] });

      // Reset form
      setSelectedVendorId('');
      setTotalAmount('');
      setNotes('');
      setAttachmentFile(null);

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to submit bid:', error);
      toast({
        title: 'Error',
        description: 'Failed to record bid',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] bg-black/95 border-white/10">
        <DialogHeader>
          <DialogTitle>Record Manual Bid</DialogTitle>
          <DialogDescription>
            Manually enter bid details received from vendors
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="vendor">Vendor *</Label>
            <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
              <SelectTrigger id="vendor">
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.length === 0 && (
                  <SelectItem value="none" disabled>No vendors available</SelectItem>
                )}
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                    {vendor.email && ` (${vendor.email})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="amount">Bid Amount *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0.00"
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this bid..."
              className="min-h-[100px]"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="attachment">Attachment (PDF)</Label>
            <div className="flex gap-2">
              <Input
                id="attachment"
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                className="flex-1"
              />
              {attachmentFile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAttachmentFile(null)}
                >
                  Clear
                </Button>
              )}
            </div>
            {attachmentFile && (
              <p className="text-sm text-white/60">
                <FileText className="h-3 w-3 inline mr-1" />
                {attachmentFile.name} ({(attachmentFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
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
            onClick={handleSubmit}
            disabled={!selectedVendorId || !totalAmount || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recording...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Record Bid
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}