'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';

export default function SimpleLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSuccess(false);
    
    try {
      console.log('Attempting login with:', email);
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful:', result.user);
      
      setSuccess(true);
      
      // Try different redirect methods
      setTimeout(() => {
        console.log('Redirecting to /admin...');
        // Method 1: window.location
        window.location.href = '/admin';
        
        // Method 2: window.location.replace (uncomment if method 1 doesn't work)
        // window.location.replace('/admin');
        
        // Method 3: window.location.assign (uncomment if others don't work)
        // window.location.assign('/admin');
      }, 1000);
      
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-graphite-900 via-graphite-800 to-graphite-900 p-4">
      <Card className="w-full max-w-md glass border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Simple Login Test</CardTitle>
          <CardDescription className="text-graphite-300">
            Testing direct Firebase authentication
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-3">
                <p className="text-sm text-green-400">Login successful! Redirecting...</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-graphite-200">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-graphite-800/50 border-graphite-600 text-white"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-graphite-200">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-graphite-800/50 border-graphite-600 text-white"
                required
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-accent-500 hover:bg-accent-600 text-graphite-900"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
          
          <div className="mt-4 p-3 bg-graphite-800/50 rounded-lg">
            <p className="text-xs text-graphite-400">Test credentials:</p>
            <p className="text-xs text-graphite-300">admin@schoolworldvacation.com</p>
            <p className="text-xs text-graphite-300">121993Pw</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}