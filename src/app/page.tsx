import { Header } from '@/components/Header';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { ShieldCheck, UserCheck } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="text-center max-w-lg mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-primary">Welcome to QRAttend</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            A dynamic, time and proxy-free attendance solution.
            Login to get started.
          </p>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/login?role=admin">
              <Card className="hover:shadow-lg hover:border-primary transition-all duration-300 cursor-pointer text-center">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <ShieldCheck className="h-12 w-12 text-primary" />
                  </div>
                  <CardTitle>Admin Login</CardTitle>
                  <CardDescription>Manage sessions and view reports</CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/login?role=student">
              <Card className="hover:shadow-lg hover:border-primary transition-all duration-300 cursor-pointer text-center">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <UserCheck className="h-12 w-12 text-primary" />
                  </div>
                  <CardTitle>Student Login</CardTitle>
                  <CardDescription>Scan QR to mark attendance</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
