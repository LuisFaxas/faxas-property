'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, Building, User, Mail, Phone, Lock } from 'lucide-react';

interface InviteData {
  valid: boolean;
  contact: {
    id: string;
    name: string;
    email: string;
    company?: string;
    project: {
      id: string;
      name: string;
    };
  };
}

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);

  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    fetch(`/api/v1/contacts/accept-invite?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.valid) {
          setInviteData(data.data);
          setFormData(prev => ({
            ...prev,
            displayName: data.data.contact.name,
          }));
        } else {
          setError(data.message || 'Invalid or expired invitation');
        }
      })
      .catch(() => {
        setError('Failed to validate invitation');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/contacts/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: formData.password,
          displayName: formData.displayName,
          phone: formData.phone,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // Redirect to contractor portal after 2 seconds
        setTimeout(() => {
          router.push('/contractor');
        }, 2000);
      } else {
        setError(data.message || 'Failed to activate portal access');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-accent-500" />
      </div>
    );
  }

  if (error && !inviteData) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <AlertCircle className="h-5 w-5" />
              Invalid Invitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/60">{error}</p>
            <p className="text-sm text-white/40 mt-4">
              Please contact your project administrator for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-500">
              <CheckCircle className="h-5 w-5" />
              Portal Access Activated!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/60">
              Your account has been created successfully. Redirecting to the portal...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-4">
          <div className="text-center">
            <CardTitle className="text-2xl font-bold text-white">
              Welcome to {inviteData?.contact.project.name}
            </CardTitle>
            <CardDescription className="text-white/60 mt-2">
              Complete your profile to access the project portal
            </CardDescription>
          </div>

          {/* Contact Info Card */}
          <div className="bg-white/5 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-white">
              <User className="h-4 w-4 text-white/60" />
              <span className="font-medium">{inviteData?.contact.name}</span>
            </div>
            {inviteData?.contact.company && (
              <div className="flex items-center gap-2 text-white/80">
                <Building className="h-4 w-4 text-white/60" />
                <span>{inviteData.contact.company}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-white/80">
              <Mail className="h-4 w-4 text-white/60" />
              <span>{inviteData?.contact.email}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="How should we display your name?"
                required
                className="h-12" // Touch-friendly height
              />
            </div>

            {/* Phone (optional) */}
            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number
                <span className="text-white/40 text-sm ml-2">(optional)</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                  className="h-12 pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Create Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  className="h-12 pl-10"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Re-enter your password"
                  required
                  minLength={8}
                  className="h-12 pl-10"
                />
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 text-base font-medium"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Activate Portal Access'
              )}
            </Button>

            {/* Privacy Note */}
            <p className="text-xs text-center text-white/40">
              By creating an account, you agree to our terms of service and privacy policy.
              Your data is encrypted and secure.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-accent-500" />
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}