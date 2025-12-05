
import { db } from "../firebase";
import { doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";

export const activateRadar = async (userId: string, mood: string, durationMinutes: number, visibility: 'all' | 'close' = 'all') => {
  try {
    const radarRef = doc(db, "radar_sessions", userId);
    await setDoc(radarRef, {
      userId,
      mood,
      visibility,
      isActive: true,
      startTime: serverTimestamp(),
      expiresAt: Date.now() + (durationMinutes * 60 * 1000),
      lastLocation: null // We don't store real location for the demo, just presence
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error("Error activating radar:", error);
    throw error;
  }
};

export const deactivateRadar = async (userId: string) => {
  try {
    const radarRef = doc(db, "radar_sessions", userId);
    await updateDoc(radarRef, {
      isActive: false
    });
  } catch (error) {
    console.error("Error deactivating radar:", error);
  }
};

// Simulation function to find "nearby" friends
// In a real app, this would query Geohashes from Redis/Firestore
export const scanForFriends = async (userId: string) => {
    // Simulate finding the Loopzyy Bot
    return new Promise<{found: boolean, friendId?: string}>((resolve) => {
        setTimeout(() => {
            // 50% chance to find someone for the demo
            resolve({ found: true, friendId: 'u2' }); // u2 is Loopzyy Bot
        }, 3000);
    });
};

export const broadcastCheckIn = async (userId: string, locationLabel: string) => {
    // Simulate checking in
    // In a real app, this would create a notification for nearby friends
    console.log(`User ${userId} checked in at ${locationLabel}`);
    return new Promise((resolve) => setTimeout(resolve, 1000));
};
