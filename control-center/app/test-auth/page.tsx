'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function TestAuthPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('Auth state changed:', currentUser);
      if (currentUser) {
        const token = await currentUser.getIdToken();
        const tokenResult = await currentUser.getIdTokenResult();
        console.log('Token:', token);
        console.log('Token claims:', tokenResult.claims);
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          claims: tokenResult.claims
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const testRedirects = () => {
    console.log('Testing redirects...');
    
    // Test 1: router.push
    console.log('Test 1: router.push(\'/admin\')');
    router.push('/admin');
    
    // If that doesn't work, uncomment the next test:
    // setTimeout(() => {
    //   console.log('Test 2: window.location.href');
    //   window.location.href = '/admin';
    // }, 2000);
  };

  return (
    <div className="min-h-screen bg-graphite-900 p-8">
      <div className="max-w-4xl mx-auto space-y-4">
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Firebase Auth Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-white font-semibold mb-2">Status:</h3>
              {loading ? (
                <p className="text-graphite-300">Loading...</p>
              ) : user ? (
                <p className="text-green-400">Authenticated</p>
              ) : (
                <p className="text-red-400">Not authenticated</p>
              )}
            </div>

            {user && (
              <div>
                <h3 className="text-white font-semibold mb-2">User Info:</h3>
                <pre className="bg-graphite-800 p-3 rounded text-xs text-graphite-300 overflow-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            )}

            <div className="space-x-2">
              <Button onClick={() => window.location.href = '/login'}>
                Go to Login
              </Button>
              <Button onClick={() => window.location.href = '/admin'}>
                Go to Admin (Direct)
              </Button>
              <Button onClick={testRedirects}>
                Test Redirects
              </Button>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">Firebase Config:</h3>
              <pre className="bg-graphite-800 p-3 rounded text-xs text-graphite-300 overflow-auto">
{`API Key: ${process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set ✓' : 'Missing ✗'}
Auth Domain: ${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'Set ✓' : 'Missing ✗'}
Project ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'Set ✓' : 'Missing ✗'}
Storage: ${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? 'Set ✓' : 'Missing ✗'}
App ID: ${process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? 'Set ✓' : 'Missing ✗'}`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}