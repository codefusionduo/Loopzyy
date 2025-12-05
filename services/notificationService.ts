import { db } from "../firebase";
import { collection, query, where, getDocs, writeBatch } from "firebase/firestore";

export const markAllNotificationsAsRead = async (userId: string) => {
  try {
    const batch = writeBatch(db);
    const notificationsRef = collection(db, "users", userId, "notifications");
    
    // Query only unread notifications
    const q = query(notificationsRef, where("read", "==", false));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });

    await batch.commit();
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
};
