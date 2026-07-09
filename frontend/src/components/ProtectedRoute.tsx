'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const publicRoutes = ['/login', '/signup'];

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && !publicRoutes.includes(pathname)) {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0B0F] relative overflow-hidden">
        {/* Background glow blobs */}
        <div className="absolute top-[25%] left-[25%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
        <div className="relative flex flex-col items-center z-10">
          <div className="relative mb-6">
            {/* Spinning gradient ring */}
            <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-primary shadow-[0_0_15px_rgba(139,92,246,0.5)]"></div>
          </div>
          <p className="text-textMuted text-xs font-bold uppercase tracking-widest animate-pulse">Initializing Snaplearn AI...</p>
        </div>
      </div>
    );
  }

  // If we are on a public route, or if we have a user, render children
  if (publicRoutes.includes(pathname) || user) {
    return <>{children}</>;
  }

  // Otherwise render nothing while redirecting
  return null;
}
