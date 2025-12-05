
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc, query, where, getDocs, getDoc } from "firebase/firestore";
import { VerificationRequest } from "../types";

export const sendVerificationRequest = async (userId: string, reason: string, uploadedIdUrl: string, uploadedSelfieUrl: string) => {
  try {
    // Fetch user details to store denormalized data for easier admin viewing
    const userDoc = await getDoc(doc(db, "users", userId));
    const userData = userDoc.data();

    await addDoc(collection(db, "verificationRequests"), {
      userId,
      userName: userData?.name || 'Unknown',
      userHandle: userData?.handle || 'unknown',
      userAvatar: userData?.avatarUrl || '',
      reason,
      uploadedIdUrl,
      uploadedSelfieUrl,
      status: "pending",
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error sending verification request:", error);
    throw error;
  }
};

export const uploadIdImage = async (file: File) => {
  const cloudName = "dpjklathd";
  const uploadPreset = "loopzyy_unsigned"; 
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  
  if (!res.ok) {
      throw new Error(data.error?.message || "Upload failed");
  }
  
  return data.secure_url;
};

export const getPendingVerificationRequests = async (): Promise<VerificationRequest[]> => {
  try {
    // FIX: Removed orderBy to avoid needing a manual composite index in Firestore.
    // We sort the results client-side instead.
    const q = query(
      collection(db, "verificationRequests"), 
      where("status", "==", "pending")
    );
    
    const snapshot = await getDocs(q);
    const requests = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toMillis() || Date.now()
      } as VerificationRequest;
    });

    // Sort by newest first
    return requests.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error fetching verification requests:", error);
    return [];
  }
};

const sendVerificationEmail = async (userId: string, status: 'approved' | 'rejected') => {
    // In a real application, this would trigger a Cloud Function to send an email via SendGrid/Mailgun
    console.log(`[EMAIL SIMULATION] Sending ${status} email to user ${userId}`);
    // Simulated delay
    await new Promise(resolve => setTimeout(resolve, 500));
};

export const approveVerification = async (requestId: string, userId: string) => {
  try {
    // Update verification request status
    await updateDoc(doc(db, "verificationRequests", requestId), {
      status: "approved",
    });

    // Mark user as verified
    await updateDoc(doc(db, "users", userId), {
      verified: true,
    });

    // Send Email
    await sendVerificationEmail(userId, 'approved');

  } catch (error) {
    console.error("Error approving verification:", error);
    throw error;
  }
};

export const rejectVerification = async (requestId: string, userId: string) => {
  try {
    await updateDoc(doc(db, "verificationRequests", requestId), {
      status: "rejected",
    });

    // Send Email
    await sendVerificationEmail(userId, 'rejected');

  } catch (error) {
    console.error("Error rejecting verification:", error);
    throw error;
  }
};
