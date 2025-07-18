// src/app/scan/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrScanner } from '@/components/QrScanner';
import { logAttendance } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';

export default function ScanPage() {
  const router = useRouter();
  
  const [studentIdentifier, setStudentIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const userRole = sessionStorage.getItem('userRole');
    const usn = sessionStorage.getItem('studentUsn');
    
    if (userRole !== 'student' || !usn) {
      router.push('/login?role=student');
    } else {
      setStudentIdentifier(usn);
      setIsLoading(false);
    }
  }, [router]);
  
  const handleScanSuccess = async (decodedText: string) => {
    if (!studentIdentifier || isSubmitting) return;

    setIsSubmitting(true);
    setScanResult(null); // Reset previous result
    try {
      const result = await logAttendance(studentIdentifier, decodedText);
      setScanResult(result);
      if (result.success) {
        toast({
            title: 'Success',
            description: result.message,
        });
      } else {
        toast({
            title: 'Error',
            description: result.message,
            variant: 'destructive',
        });
      }
    } catch (error) {
      const message = 'An unexpected error occurred.';
      setScanResult({ success: false, message });
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (isLoading || !studentIdentifier) {
        return (
            <div className="flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    if (scanResult) {
       return (
          <Card className="w-full max-w-md text-center">
            <CardHeader className="pt-8">
              {scanResult.success ? <CheckCircle className="mx-auto h-16 w-16 text-primary" /> : <XCircle className="mx-auto h-16 w-16 text-destructive" />}
            </CardHeader>
            <CardContent className="space-y-4 pb-8">
              <CardTitle>{scanResult.success ? "Success!" : "Failed!"}</CardTitle>
              <p className="text-muted-foreground">{scanResult.message}</p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => setScanResult(null)} variant="outline">
                  Scan Another
                </Button>
                {scanResult.success && (
                  <Link href={`/attendance/${studentIdentifier}`}>
                    <Button>View My Attendance</Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
       )
    }

    return (
      <Card className="w-full max-w-lg shadow-md">
        <CardHeader>
          <div className='flex items-center gap-4'>
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href="/student/dashboard">
                    <ArrowLeft />
                    <span className="sr-only">Back to Dashboard</span>
                </Link>
            </Button>
            <div>
              <CardTitle>Scan QR Code</CardTitle>
              <CardDescription>Point your camera at the QR code from the admin.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-center mb-4 text-muted-foreground">Logged in as: <strong>{studentIdentifier}</strong></p>
          {isSubmitting ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] aspect-square">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Marking attendance...</p>
            </div>
          ) : (
            <div className='relative w-full max-w-md mx-auto'>
                <QrScanner onScanSuccess={handleScanSuccess} onScanFailure={(err) => console.log(err)} />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        {renderContent()}
      </main>
    </div>
  );
}
