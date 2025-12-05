import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, updateDoc, increment, arrayUnion, arrayRemove, deleteDoc, Timestamp } from "firebase/firestore";
import { Post, Comment } from "../types";

// Helper to deeply sanitize objects for Firestore
// Removes undefined values and ensures no circular references or DOM nodes
const sanitizePayload = (data: any, seen = new WeakSet(), depth = 0): any => {
  // Prevent stack overflow
  if (depth > 20) return null;

  // 1. Handle Primitives and Null
  if (data === null || typeof data !== 'object') {
    return data === undefined ? null : data; // Firestore doesn't like undefined
  }

  // 2. Detect and break circular references
  if (seen.has(data)) {
    return null; 
  }
  seen.add(data);

  // 3. Handle Special Types allowed in Firestore
  if (data instanceof Date) return data;
  if (data instanceof Timestamp) return data; 
  
  // 4. Exclude specific types that shouldn't be in Firestore
  if (data instanceof File || data instanceof Blob) return null;

  // 5. Handle Arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizePayload(item, seen, depth + 1));
  }

  // 6. Handle Objects - Filter out DOM nodes and React internals
  try {
      // Check for DOM nodes or Events which cause circular refs
      if ('nodeType' in data || 'nativeEvent' in data || 'window' in data || 'document' in data || data instanceof Event) {
          return null;
      }
      
      // Check for React internal fibers (keys usually start with __react)
      const keys = Object.keys(data);
      const isReactInternal = keys.some(k => k.startsWith('__react') || k.startsWith('_react'));
      if (isReactInternal) return null;

      const sanitized: any = {};
      for (const key of keys) {
        const value = data[key];
        // Skip functions and symbols
        if (typeof value === 'function' || typeof value === 'symbol') continue;
        
        sanitized[key] = sanitizePayload(value, seen, depth + 1);
      }
      return sanitized;
  } catch (e) {
      // If property access throws (e.g. cross-origin), skip object
      return null;
  }
};

export const createPost = async (postData: any) => {
  try {
    // Sanitize the entire payload
    const safePostData = sanitizePayload(postData);

    // Ensure we save the user data with the post for easy display
    await addDoc(collection(db, "posts"), {
      ...safePostData,
      likes: 0,
      comments: [],
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
};

export const subscribeToPosts = (callback: (posts: Post[]) => void) => {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.createdAt?.toMillis() || Date.now(),
        // Ensure arrays exist
        comments: data.comments || [],
        likes: data.likes || 0,
      } as Post;
    });
    callback(posts);
  });
};

export const toggleLikePost = async (postId: string, userId: string, isLiked: boolean) => {
  const postRef = doc(db, "posts", postId);
  try {
    if (isLiked) {
      // Unlike
      await updateDoc(postRef, {
        likes: increment(-1),
        likedBy: arrayRemove(userId)
      });
    } else {
      // Like
      await updateDoc(postRef, {
        likes: increment(1),
        likedBy: arrayUnion(userId)
      });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
  }
};

export const addCommentToPost = async (postId: string, comment: Comment) => {
  const postRef = doc(db, "posts", postId);
  try {
    const safeComment = sanitizePayload(comment);
    await updateDoc(postRef, {
      comments: arrayUnion(safeComment)
    });
  } catch (error) {
    console.error("Error adding comment:", error);
  }
};

export const deletePost = async (postId: string) => {
  try {
    await deleteDoc(doc(db, "posts", postId));
  } catch (error) {
    console.error("Error deleting post:", error);
    throw error;
  }
};