'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getStudentAttendance, getStudent } from '@/lib/actions';
import { Student, AttendanceRecord } from '@/lib/data';
import { User, Calendar, Clock, Building, Hash, Loader2, ArrowLeft } from 'lucide-react';
import { format, getMonth, getYear } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AttendancePage() {
  const params = useParams();
  const router = useRouter();
  const studentIdentifier = params.studentId as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [allRecords, setAllRecords] = useState<Omit<AttendanceRecord, 'studentId'>[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<Omit<AttendanceRecord, 'studentId'>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availableMonths, setAvailableMonths] = useState<{ label: string; value: string }[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      if (!studentIdentifier) return;

      setIsLoading(true);
      const studentData = await getStudent(studentIdentifier);

      if (!studentData) {
        setStudent(null);
        setIsLoading(false);
        return;
      }
      setStudent(studentData);

      const recordsData = await getStudentAttendance(studentIdentifier);
      const sortedRecords = recordsData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setAllRecords(sortedRecords);
      setFilteredRecords(sortedRecords);

      // Determine available months from records
      const months = new Set<string>();
      sortedRecords.forEach(record => {
        const monthYear = format(record.timestamp, 'yyyy-MM');
        months.add(monthYear);
      });

      const monthOptions = Array.from(months).map(my => ({
        value: my,
        label: format(new Date(my + '-02'), 'MMMM yyyy'),
      }));
      setAvailableMonths(monthOptions);
      
      // Set initial filter to the most recent month if records exist
      if(monthOptions.length > 0) {
        setSelectedMonth(monthOptions[0].value);
      } else {
        setSelectedMonth('all');
      }

      setIsLoading(false);
    };

    fetchData();
  }, [studentIdentifier]);

  useEffect(() => {
    if (selectedMonth === 'all') {
      setFilteredRecords(allRecords);
    } else {
      const [year, month] = selectedMonth.split('-').map(Number);
      const filtered = allRecords.filter(record => {
        const recordDate = record.timestamp;
        return getYear(recordDate) === year && getMonth(recordDate) === month - 1;
      });
      setFilteredRecords(filtered);
    }
  }, [selectedMonth, allRecords]);
  
  // Check if student is authorized to view this page
  useEffect(() => {
    const authorizedUsn = sessionStorage.getItem('studentUsn');
    if (!authorizedUsn || (student && authorizedUsn !== student.usn)) {
        // Redirect if not logged in or trying to access another student's page
        router.push('/login?role=student');
    }
  }, [student, router]);


  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="text-center">
            <CardHeader>
              <CardTitle>Student Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p>The student with ID or USN "{studentIdentifier}" could not be found.</p>
              <Button asChild variant="link" className="mt-4">
                <Link href="/scan">Try again</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-8 container mx-auto">
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className='flex items-start gap-4'>
                    <Button variant="ghost" size="icon" className="h-8 w-8 mt-1 hidden sm:flex" asChild>
                        <Link href="/student/dashboard">
                            <ArrowLeft />
                            <span className="sr-only">Back to Dashboard</span>
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-4 mb-2 sm:mb-0">
                             <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden" asChild>
                                <Link href="/student/dashboard">
                                    <ArrowLeft />
                                    <span className="sr-only">Back to Dashboard</span>
                                </Link>
                            </Button>
                            <CardTitle>Attendance Report</CardTitle>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-muted-foreground mt-1">
                            <div className="flex items-center gap-1.5">
                                <User className="h-4 w-4" />
                                <span>{student.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Hash className="h-4 w-4" />
                                <span>{student.usn}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Building className="h-4 w-4" />
                                <span>{student.department}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Filter by month" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Time</SelectItem>
                            {availableMonths.map(month => (
                                <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

          </CardHeader>
          <CardContent>
            {filteredRecords.length > 0 ? (
              <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time Marked</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium truncate max-w-[150px]">{record.sessionId}</TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(record.timestamp, 'PPP')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {format(record.timestamp, 'p')}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground bg-secondary rounded-lg">
                <p>No attendance records found for the selected period.</p>
                 <Button asChild variant="link" className="mt-2">
                  <Link href="/scan">Scan a QR Code</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
