// src/components/Header.tsx
'use client';

import { QrCode, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';

export function Header() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('studentUsn');
    router.push('/');
  };

  return (
    <header className="bg-card border-b p-4 shadow-sm">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
          <QrCode className="h-8 w-8" />
          <span className="text-xl font-bold">QRAttend</span>
        </Link>
        {user && !loading && (
          <Button onClick={handleLogout} variant="ghost" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        )}
      </div>
    </header>
  );
}
