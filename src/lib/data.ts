// This file now primarily serves to define data types.
// The data itself is managed in Firestore and seeded via a helper script.

export interface Student {
  id: string; // Firestore document ID
  usn: string;
  name: string;
  department: string;
  dob: string; // Stored as 'YYYY-MM-DD'
  adminId: string; // ID of the admin who created the student
}

export interface AttendanceRecord {
  studentId: string;
  sessionId: string;
  timestamp: Date;
}

export interface AttendeeDetails {
    studentId: string;
    studentName: string;
    studentUsn: string;
    timestamp: string; // ISO String
}

export interface DailyReport {
    sessionId: string;
    startTime: string; // ISO String
    attendees: AttendeeDetails[];
}
