"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getStudent } from "@/lib/actions";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuthState } from "react-firebase-hooks/auth";

export default function LoginPageClient({ initialRole }: { initialRole: string }) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [user, loading] = useAuthState(auth);
  const [role, setRole] = useState(initialRole);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usn, setUsn] = useState("");
  const [dob, setDob] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const intendedRole = sessionStorage.getItem("userRole");
      if (intendedRole === "admin") {
        router.push("/admin");
      } else if (intendedRole === "student") {
        router.push("/student/dashboard");
      }
    }
  }, [user, loading, router]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      sessionStorage.setItem("userRole", "admin");
      toast({ title: "Success", description: "Logged in as admin." });
      router.push("/admin");
    } catch (error: any) {
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const student = await getStudent(usn);
      if (student && student.dob === dob) {
        sessionStorage.setItem("userRole", "student");
        sessionStorage.setItem("studentUsn", student.usn);
        toast({ title: "Success", description: `Welcome, ${student.name}!` });
        router.push("/student/dashboard");
      } else {
        toast({ title: "Login Failed", description: "Invalid USN or Date of Birth.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Login Failed", description: "An error occurred.", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  if (loading || user) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <Tabs value={role} onValueChange={setRole} className="w-full max-w-md">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="student">Student</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>

          <TabsContent value="student">
            <Card>
              <CardHeader>
                <CardTitle>Student Login</CardTitle>
                <CardDescription>Enter your USN and Date of Birth to proceed.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleStudentLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="usn">USN</Label>
                    <Input id="usn" value={usn} onChange={(e) => setUsn(e.target.value)} required disabled={isSubmitting} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} required disabled={isSubmitting} />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : "Login"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle>Admin Login</CardTitle>
                <CardDescription>Enter your credentials to access the admin panel.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isSubmitting} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isSubmitting} />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : "Login"}
                  </Button>
                </form>
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <Link href="/signup" className="underline hover:text-primary">
                    Sign up
                  </Link>
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
