import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDocs, query, where, deleteDoc, writeBatch, getCountFromServer } from "firebase/firestore";
import { Report } from "../types";

export const sendReport = async (
  reporterId: string, 
  targetId: string, 
  targetType: 'post' | 'user' | 'comment', 
  reason: string, 
  additionalInfo: string = ""
) => {
  try {
    // 1. Save Report
    await addDoc(collection(db, "reports"), {
      reporterId,
      targetId,
      targetType,
      reason,
      additionalInfo,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    // 2. Simulate Admin Email Notification
    console.log(`[EMAIL SENT] Admin Alert: New report filed against ${targetType} ${targetId}. Reason: ${reason}`);

    // 3. Auto-Ban Check (Simulation)
    // In a real app, this would be a Cloud Function
    if (targetType === 'user') {
       const reportsRef = collection(db, "reports");
       const q = query(reportsRef, where("targetId", "==", targetId));
       const snapshot = await getCountFromServer(q);
       const reportCount = snapshot.data().count;

       if (reportCount >= 10) {
          await banUser(targetId);
          console.log(`[AUTO-BAN] User ${targetId} has been automatically banned due to excessive reports.`);
       }
    }

  } catch (error) {
    console.error("Error sending report:", error);
    throw error;
  }
};

export const getReports = async (): Promise<Report[]> => {
    try {
        const q = query(collection(db, "reports")); // Fetch all to show history
        const snapshot = await getDocs(q);
        
        const reports = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now()
            } as Report;
        });
        
        // Sort client-side to avoid index issues
        return reports.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
        console.error("Error fetching reports:", error);
        return [];
    }
};

export const resolveReport = async (reportId: string, resolution: 'resolved' | 'dismissed') => {
  try {
    await updateDoc(doc(db, "reports", reportId), {
      status: resolution,
    });
  } catch (error) {
    console.error("Error resolving report:", error);
    throw error;
  }
};

export const markReviewing = async (reportId: string) => {
  try {
    await updateDoc(doc(db, "reports", reportId), {
      status: "reviewing",
    });
  } catch (error) {
    console.error("Error marking report as reviewing:", error);
    throw error;
  }
};

export const banUser = async (userId: string) => {
    try {
        await updateDoc(doc(db, "users", userId), {
            isBanned: true
        });
    } catch (error) {
        console.error("Error banning user:", error);
        throw error;
    }
};

export const deleteReportedContent = async (type: 'post' | 'comment' | 'user', id: string) => {
    try {
        if (type === 'post') {
            await deleteDoc(doc(db, "posts", id));
        } else if (type === 'comment') {
            // Note: Deleting comments usually requires finding the parent post first if stored in array.
            // For this implementation, we assume comments might be subcollections or handled via array updates in postService.
            // Since our current postService uses arrays for comments, deleting a specific comment by ID is tricky without the PostID.
            // We will skip comment deletion implementation here or assume it handles cleaning up the reported object reference.
            console.warn("Direct comment deletion requires post context.");
        } else if (type === 'user') {
            // Soft delete or ban is preferred over actual deletion
            await banUser(id); 
        }
    } catch (error) {
        console.error("Error deleting content:", error);
        throw error;
    }
};