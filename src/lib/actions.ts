'use server';

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  limit,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Student, AttendanceRecord, DailyReport, AttendeeDetails } from './data';

// Helper to get the current active session for a specific admin
async function getActiveSessionId(adminId: string): Promise<string | null> {
    const q = query(
        collection(db, "sessions"), 
        where("active", "==", true), 
        where("adminId", "==", adminId), 
        limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    return querySnapshot.docs[0].id;
}

export async function addStudent(adminId: string, studentData: {usn: string, name: string, department: string, dob: string}): Promise<{ success: boolean; message: string; studentId?: string }> {
  const { usn, name, department, dob } = studentData;
  if (!usn || !name || !department || !dob) {
    return { success: false, message: 'All fields (USN, Name, Department, DOB) are required.' };
  }

  try {
    const studentsCollection = collection(db, 'students');
    // Check for duplicate USN for the same admin
    const q = query(studentsCollection, where("usn", "==", usn.trim()), where("adminId", "==", adminId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return { success: false, message: `A student with the USN "${usn.trim()}" already exists for this admin.` };
    }
    
    const docRef = await addDoc(studentsCollection, {
      usn: usn.trim(),
      name: name.trim(),
      department: department.trim(),
      dob: dob,
      adminId: adminId,
    });
    return { success: true, message: 'Student added.', studentId: docRef.id };
  } catch (error) {
    console.error("Error adding student: ", error);
    return { success: false, message: 'An error occurred while adding the student.' };
  }
}

export async function getStudentList(adminId: string): Promise<Student[]> {
  const studentsCollection = collection(db, 'students');
  const q = query(studentsCollection, where("adminId", "==", adminId));
  const studentSnapshot = await getDocs(q);
  const students: Student[] = [];
  studentSnapshot.forEach(doc => {
    const data = doc.data();
    students.push({ 
      id: doc.id, 
      usn: data.usn,
      name: data.name,
      department: data.department,
      dob: data.dob,
      adminId: data.adminId,
    });
  });
  return students;
}

export async function startSession(adminId: string): Promise<{ sessionId: string }> {
  // End any other active sessions for this admin before starting a new one
  const activeSessionId = await getActiveSessionId(adminId);
  if (activeSessionId) {
    const oldSessionDocRef = doc(db, 'sessions', activeSessionId);
    await updateDoc(oldSessionDocRef, { active: false, endTime: Timestamp.now() });
  }

  const sessionRef = await addDoc(collection(db, 'sessions'), {
    startTime: Timestamp.now(),
    endTime: null,
    active: true,
    adminId: adminId,
  });

  return { sessionId: sessionRef.id };
}

export async function endSession(adminId: string): Promise<{ endedSessionId: string | null }> {
  const endedSessionId = await getActiveSessionId(adminId);

  if (endedSessionId) {
    const sessionDocRef = doc(db, 'sessions', endedSessionId);
    await updateDoc(sessionDocRef, {
      endTime: Timestamp.now(),
      active: false,
    });
  }
  return { endedSessionId };
}

export async function logAttendance(
  studentIdentifier: string,
  sessionIdFromQr: string
): Promise<{ success: boolean; message: string }> {
  
  const sessionDocRef = doc(db, 'sessions', sessionIdFromQr);
  const sessionDoc = await getDoc(sessionDocRef);

  if (!sessionDoc.exists() || !sessionDoc.data().active) {
    return { success: false, message: 'Invalid or expired session QR code.' };
  }
  const sessionAdminId = sessionDoc.data().adminId;

  // Student identifier is USN, so we find the student with that USN under the session's admin
  const studentQuery = query(
    collection(db, 'students'), 
    where('usn', '==', studentIdentifier),
    where('adminId', '==', sessionAdminId),
    limit(1)
  );
  const studentQuerySnapshot = await getDocs(studentQuery);

  if (studentQuerySnapshot.empty) {
      return { success: false, message: `Student with USN ${studentIdentifier} not found for this administrator.` };
  }
  const studentDocSnapshot = studentQuerySnapshot.docs[0];
  const studentId = studentDocSnapshot.id; // The Firestore document ID

  const attendanceCollectionRef = collection(
    db,
    'sessions',
    sessionIdFromQr,
    'attendees'
  );

  // Check if student has already attended using their Firestore document ID
  const q = query(attendanceCollectionRef, where('studentId', '==', studentId));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    return {
      success: true,
      message: 'Attendance already marked for this session.',
    };
  }

  await addDoc(attendanceCollectionRef, {
    studentId,
    timestamp: Timestamp.now(),
  });

  return { success: true, message: 'Attendance marked successfully!' };
}

export async function getStudentAttendance(
  studentIdentifier: string
): Promise<Omit<AttendanceRecord, 'studentId'>[]> {
  const records: Omit<AttendanceRecord, 'studentId'>[] = [];
  
  let studentDocId: string | null = null;
  const student = await getStudent(studentIdentifier);
  if (student) {
      studentDocId = student.id;
  } else {
      return []; // Student not found
  }

  // Get all sessions - this part is tricky for multi-tenancy without fetching all sessions.
  // We'll fetch all sessions and then check the attendee list. This might be slow on a large scale
  // but is acceptable for this app's architecture.
  const sessionsSnapshot = await getDocs(collection(db, 'sessions'));

  for (const sessionDoc of sessionsSnapshot.docs) {
    const attendeesCollectionRef = collection(
      db,
      'sessions',
      sessionDoc.id,
      'attendees'
    );
    const q = query(attendeesCollectionRef, where('studentId', '==', studentDocId));
    const attendanceSnapshot = await getDocs(q);

    if (!attendanceSnapshot.empty) {
      attendanceSnapshot.forEach(doc => {
        const data = doc.data();
        records.push({
          sessionId: sessionDoc.id,
          timestamp: (data.timestamp as Timestamp).toDate(),
        });
      });
    }
  }

  return records;
}

// Helper function to get student data by Firestore ID or USN
export async function getStudent(idOrUsn: string): Promise<Student | null> {
    // Try fetching by doc ID first
    if (idOrUsn && /^[a-zA-Z0-9]{20}$/.test(idOrUsn)) {
      const studentDocRef = doc(db, 'students', idOrUsn);
      const studentDoc = await getDoc(studentDocRef);

      if (studentDoc.exists()) {
          const data = studentDoc.data();
          return { id: studentDoc.id, name: data.name, usn: data.usn, department: data.department, dob: data.dob, adminId: data.adminId };
      }
    }

    // If not found by ID or if ID is not in correct format, try searching by USN
    const q = query(collection(db, 'students'), where('usn', '==', idOrUsn), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return { id: doc.id, name: data.name, usn: data.usn, department: data.department, dob: data.dob, adminId: data.adminId };
    }

    return null;
}

// New action to get attendance by date for a specific admin
export async function getAttendanceByDate(adminId: string, date: Date): Promise<DailyReport[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const sessionsQuery = query(
    collection(db, "sessions"),
    where("adminId", "==", adminId),
    where("startTime", ">=", Timestamp.fromDate(startOfDay)),
    where("startTime", "<=", Timestamp.fromDate(endOfDay)),
    orderBy("startTime", "asc")
  );

  const sessionsSnapshot = await getDocs(sessionsQuery);
  if (sessionsSnapshot.empty) {
    return [];
  }
  
  const dailyReport: DailyReport[] = [];

  for (const sessionDoc of sessionsSnapshot.docs) {
    const sessionData = sessionDoc.data();
    const attendeesCollectionRef = collection(db, 'sessions', sessionDoc.id, 'attendees');
    const attendeesSnapshot = await getDocs(attendeesCollectionRef);

    const attendeesDetails: AttendeeDetails[] = [];
    if (!attendeesSnapshot.empty) {
      for (const attendeeDoc of attendeesSnapshot.docs) {
        const attendeeData = attendeeDoc.data();
        const student = await getStudent(attendeeData.studentId);
        if (student) {
          attendeesDetails.push({
            studentId: student.id,
            studentName: student.name,
            studentUsn: student.usn,
            timestamp: (attendeeData.timestamp as Timestamp).toDate().toISOString(),
          });
        }
      }
    }

    dailyReport.push({
      sessionId: sessionDoc.id,
      startTime: (sessionData.startTime as Timestamp).toDate().toISOString(),
      attendees: attendeesDetails,
    });
  }

  return JSON.parse(JSON.stringify(dailyReport));
}
