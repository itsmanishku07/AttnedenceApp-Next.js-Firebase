// src/app/student/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { QrCode, ClipboardList, Loader2 } from 'lucide-react';
import { getStudent } from '@/lib/actions';
import { Student } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

export default function StudentDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userRole = sessionStorage.getItem('userRole');
    const usn = sessionStorage.getItem('studentUsn');
    
    if (userRole !== 'student' || !usn) {
      router.push('/login?role=student');
      return;
    }

    const fetchStudentData = async () => {
      try {
        const studentData = await getStudent(usn);
        if (!studentData) {
          toast({ title: 'Error', description: 'Could not find student data.', variant: 'destructive' });
          sessionStorage.clear();
          router.push('/login?role=student');
        } else {
          setStudent(studentData);
        }
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to fetch student details.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStudentData();

  }, [router, toast]);

  if (isLoading || !student) {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <main className="flex-1 flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </main>
        </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold">Welcome, {student.name}!</h1>
                <p className="text-muted-foreground">What would you like to do today?</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/scan">
              <Card className="hover:shadow-lg hover:border-primary transition-all duration-300 cursor-pointer text-center">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <QrCode className="h-12 w-12 text-primary" />
                  </div>
                  <CardTitle>Scan Attendance</CardTitle>
                  <CardDescription>Mark your attendance by scanning a new QR code.</CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link href={`/attendance/${student.usn}`}>
              <Card className="hover:shadow-lg hover:border-primary transition-all duration-300 cursor-pointer text-center">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <ClipboardList className="h-12 w-12 text-primary" />
                  </div>
                  <CardTitle>View Attendance</CardTitle>
                  <CardDescription>Check your past attendance records.</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
