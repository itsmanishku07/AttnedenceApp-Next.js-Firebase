'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { startSession, endSession, getStudentList, addStudent, getAttendanceByDate } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Loader2, ListChecks, Users, UserSquare, UserPlus, Building, Hash, CalendarIcon, Clock, BadgeCheck, Cake } from 'lucide-react';
import type { Student, DailyReport } from '@/lib/data';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function AdminPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  const [session, setSession] = useState<{ id: string; active: boolean }>({ id: '', active: false });
  const [isLoading, setIsLoading] = useState(false);
  const [isStudentListLoading, setIsStudentListLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [newStudent, setNewStudent] = useState({ usn: '', name: '', department: '', dob: '' });
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [dailyReport, setDailyReport] = useState<DailyReport[]>([]);
  const [isFetchingDailyReport, setIsFetchingDailyReport] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login?role=admin');
      } else {
        fetchStudents();
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (selectedDate && user) {
      handleFetchDailyReport(selectedDate);
    }
  }, [selectedDate, user]);


  const fetchStudents = async () => {
    if (!user) return;
    setIsStudentListLoading(true);
    try {
      const studentList = await getStudentList(user.uid);
      setStudents(studentList);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch student list.', variant: 'destructive' });
    }
    setIsStudentListLoading(false);
  };


  const handleStartSession = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { sessionId } = await startSession(user.uid);
      setSession({ id: sessionId, active: true });
      toast({ title: 'Session Started', description: `Session ID: ${sessionId}` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to start session.', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const handleEndSession = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      await endSession(user.uid);
      setSession(prev => ({ ...prev, active: false }));
      toast({ title: 'Session Ended' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to end session.', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newStudent.usn.trim() || !newStudent.name.trim() || !newStudent.department.trim() || !newStudent.dob) {
      toast({ title: 'Error', description: 'All student fields are required.', variant: 'destructive' });
      return;
    }
    setIsAddingStudent(true);
    try {
      const result = await addStudent(user.uid, newStudent);
      if (result.success) {
        toast({ title: 'Success', description: 'Student added successfully!' });
        setNewStudent({ usn: '', name: '', department: '', dob: '' });
        await fetchStudents(); 
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add student.', variant: 'destructive' });
    }
    setIsAddingStudent(false);
  };

  const handleNewStudentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewStudent(prev => ({...prev, [id]: value}));
  }

  const handleFetchDailyReport = async (date: Date) => {
    if (!user) return;
    setIsFetchingDailyReport(true);
    setDailyReport([]);
    try {
      const reportData = await getAttendanceByDate(user.uid, date);
      setDailyReport(reportData);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch daily attendance report.', variant: 'destructive' });
    }
    setIsFetchingDailyReport(false);
  };
  
  if (loading || !user) {
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
      <main className="flex-1 p-4 md:p-8 container mx-auto">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Card className="shadow-md lg:col-span-1">
            <CardHeader>
              <div className="flex items-center gap-4">
                <ListChecks className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Session Control</CardTitle>
                  <CardDescription>Start or end an attendance session.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 pt-6">
              {session.active ? (
                <>
                  <div className="bg-white p-4 rounded-lg border shadow-inner">
                    <QRCode value={session.id} size={256} />
                  </div>
                  <p className="text-sm text-muted-foreground">Session ID: {session.id}</p>
                  <Button onClick={handleEndSession} disabled={isLoading} className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    {isLoading ? <Loader2 className="animate-spin" /> : 'End Session'}
                  </Button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center gap-4">
                  <p className="text-muted-foreground">No active session. Click below to start.</p>
                  <Button onClick={handleStartSession} disabled={isLoading} size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Start New Session'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-md lg:col-span-1">
            <CardHeader>
              <div className="flex items-center gap-4">
                  <UserPlus className="h-8 w-8 text-primary" />
                  <div>
                  <CardTitle>Add Student</CardTitle>
                  <CardDescription>Add a new student to your roster.</CardDescription>
                  </div>
              </div>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleAddStudent} className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="usn">USN</Label>
                <Input id="usn" value={newStudent.usn} onChange={handleNewStudentChange}  required disabled={isAddingStudent} />
                </div>
                <div className="space-y-2">
                <Label htmlFor="name">Student Name</Label>
                <Input id="name" value={newStudent.name} onChange={handleNewStudentChange}  required disabled={isAddingStudent} />
                </div>
                <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" value={newStudent.department} onChange={handleNewStudentChange}  required disabled={isAddingStudent} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input id="dob" type="date" value={newStudent.dob} onChange={handleNewStudentChange} required disabled={isAddingStudent} />
                </div>
                <Button type="submit" disabled={isAddingStudent} className="w-full">
                {isAddingStudent ? <Loader2 className="animate-spin" /> : 'Add Student'}
                </Button>
            </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 shadow-md">
              <CardHeader>
              <div className="flex items-center gap-4">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                  <CardTitle>Registered Students</CardTitle>
                  <CardDescription>All students in your roster.</CardDescription>
                  </div>
              </div>
              </CardHeader>
              <CardContent className="max-h-[354px] overflow-y-auto">
              {isStudentListLoading ? (
                  <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
              ) : students.length > 0 ? (
                  <ul className="space-y-3">
                  {students.sort((a,b) => a.name.localeCompare(b.name)).map((student) => (
                      <li key={student.id} className="flex items-start gap-3 p-3 rounded-md bg-secondary border">
                      <UserSquare className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                      <div className="flex-grow">
                          <p className="font-medium text-secondary-foreground">{student.name}</p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                              <Hash className="h-3 w-3" />
                              <span>{student.usn}</span>
                          </div>
                           <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                              <Building className="h-3 w-3" />
                              <span>{student.department}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                              <Cake className="h-3 w-3" />
                              <span>{student.dob}</span>
                          </div>
                      </div>
                      </li>
                  ))}
                  </ul>
              ) : (
                  <p className="text-center text-muted-foreground h-full flex items-center justify-center">No students found.</p>
              )}
              </CardContent>
          </Card>
        </div>
        
        <Card className="shadow-md mt-8">
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <BadgeCheck className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle>Daily Attendance Report</CardTitle>
                            <CardDescription>View present students for a specific date.</CardDescription>
                        </div>
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full sm:w-[280px] justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                </div>
            </CardHeader>
            <CardContent>
                {isFetchingDailyReport ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : dailyReport.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                        {dailyReport.map((sessionReport) => (
                            <AccordionItem value={sessionReport.sessionId} key={sessionReport.sessionId}>
                                <AccordionTrigger>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-left">
                                        <p>Session at {format(new Date(sessionReport.startTime), 'p')}</p>
                                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">ID: {sessionReport.sessionId}</p>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    {sessionReport.attendees.length > 0 ? (
                                        <ul className="space-y-3 pl-4 border-l-2 ml-2">
                                            {sessionReport.attendees.sort((a,b) => a.studentName.localeCompare(b.studentName)).map(attendee => (
                                                <li key={attendee.studentId} className="flex items-center gap-3">
                                                    <UserSquare className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                                    <div className="flex-grow">
                                                        <p className="font-medium">{attendee.studentName}</p>
                                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                            <span>USN: {attendee.studentUsn}</span>
                                                            <div className="flex items-center gap-1.5">
                                                                <Clock className="h-3.5 w-3.5" />
                                                                <span>Marked at {format(new Date(attendee.timestamp), 'p')}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="pl-4 text-muted-foreground">No attendees for this session.</p>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <div className="text-center py-16 text-muted-foreground bg-secondary rounded-lg">
                        <p>No attendance records found for {selectedDate ? format(selectedDate, 'PPP') : 'the selected date'}.</p>
                    </div>
                )}
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
