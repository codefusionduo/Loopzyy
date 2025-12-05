

import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, setDoc, Timestamp, limit, updateDoc, where, getDoc, getDocs, writeBatch, deleteDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { ChatMessage, Chat } from "../types";

export const getChatId = (userId1: string, userId2: string) => {
  return [userId1, userId2].sort().join('_');
};

export const createGroupChat = async (creatorId: string, groupName: string, participantIds: string[], isPrivate: boolean = true) => {
  try {
    // Add creator to participants if not already there
    const allParticipants = Array.from(new Set([creatorId, ...participantIds]));
    
    // Add document to chats collection (auto-generated ID for groups)
    const chatRef = await addDoc(collection(db, "chats"), {
      isGroup: true,
      groupName: groupName,
      groupAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(groupName)}&background=random`,
      adminIds: [creatorId],
      participants: allParticipants,
      createdBy: creatorId,
      onlyAdminsCanPost: false,
      isPrivateGroup: isPrivate,
      lastMessage: {
        text: `${groupName} created`,
        timestamp: serverTimestamp(),
      },
      updatedAt: serverTimestamp()
    });

    // Add initial system message
    const messagesRef = collection(db, "chats", chatRef.id, "messages");
    await addDoc(messagesRef, {
      senderId: 'system',
      text: `Group "${groupName}" created`,
      read: true,
      createdAt: serverTimestamp()
    });

    return chatRef.id;
  } catch (error) {
    console.error("Error creating group chat:", error);
    throw error;
  }
};

export const joinGroup = async (chatId: string, userId: string) => {
  try {
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, {
      participants: arrayUnion(userId)
    });
  } catch (error) {
    console.error("Error joining group:", error);
    throw error;
  }
};

export const searchPublicGroups = async (searchTerm: string) => {
  try {
    const chatsRef = collection(db, "chats");
    // Simple query for public groups
    // Note: Complex string matching usually requires third-party search (Algolia) or client-side filtering for small datasets
    const q = query(
        chatsRef, 
        where("isGroup", "==", true),
        where("isPrivateGroup", "==", false),
        limit(20)
    );
    const snapshot = await getDocs(q);
    const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Client-side filter for name match if search term provided
    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        return groups.filter((g: any) => g.groupName?.toLowerCase().includes(lowerTerm));
    }
    
    return groups;
  } catch (error) {
    console.error("Error searching public groups:", error);
    return [];
  }
};

export const updateGroupName = async (chatId: string, newName: string) => {
  try {
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, { groupName: newName });
  } catch (error) {
    console.error("Error updating group name:", error);
    throw error;
  }
};

export const updateGroupAvatar = async (chatId: string, avatarUrl: string) => {
  try {
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, { groupAvatar: avatarUrl });
  } catch (error) {
    console.error("Error updating group avatar:", error);
    throw error;
  }
};

export const updateGroupPermissions = async (chatId: string, onlyAdminsCanPost: boolean) => {
  try {
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, { onlyAdminsCanPost });
  } catch (error) {
    console.error("Error updating group permissions:", error);
    throw error;
  }
};

export const leaveGroup = async (chatId: string, userId: string) => {
  try {
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, {
      participants: arrayRemove(userId),
      adminIds: arrayRemove(userId)
    });
  } catch (error) {
    console.error("Error leaving group:", error);
    throw error;
  }
};

export const addMembersToGroup = async (chatId: string, memberIds: string[]) => {
  try {
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, {
      participants: arrayUnion(...memberIds)
    });
  } catch (error) {
    console.error("Error adding members:", error);
    throw error;
  }
};

export const removeMemberFromGroup = async (chatId: string, memberId: string) => {
  try {
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, {
      participants: arrayRemove(memberId),
      adminIds: arrayRemove(memberId)
    });
  } catch (error) {
    console.error("Error removing member:", error);
    throw error;
  }
};

export const toggleGroupAdmin = async (chatId: string, memberId: string, makeAdmin: boolean) => {
  try {
    const chatRef = doc(db, "chats", chatId);
    if (makeAdmin) {
      await updateDoc(chatRef, { adminIds: arrayUnion(memberId) });
    } else {
      await updateDoc(chatRef, { adminIds: arrayRemove(memberId) });
    }
  } catch (error) {
    console.error("Error toggling admin:", error);
    throw error;
  }
};

export const sendMessage = async (
  chatId: string, 
  senderId: string, 
  text: string, 
  media?: { url: string, type: 'image' | 'video' | 'gif' | 'document', fileName?: string },
  replyTo?: { id: string, text: string, senderId: string }
) => {
  try {
    // Permission Check
    const chatRef = doc(db, "chats", chatId);
    const chatDoc = await getDoc(chatRef);
    if (chatDoc.exists()) {
        const data = chatDoc.data();
        if (data.isGroup && data.onlyAdminsCanPost) {
            if (!data.adminIds?.includes(senderId)) {
                throw new Error("Only admins can send messages in this group.");
            }
        }
    }

    const messageData: any = {
      senderId: senderId,
      text: text,
      read: false,
      createdAt: serverTimestamp(),
    };

    if (media) {
      messageData.mediaUrl = media.url;
      messageData.mediaType = media.type;
      if (media.fileName) {
        messageData.fileName = media.fileName;
      }
    }

    if (replyTo) {
      messageData.replyToId = replyTo.id;
      messageData.replyToText = replyTo.text;
      messageData.replyToSender = replyTo.senderId;
    }

    // Add message to subcollection
    const messagesRef = collection(db, "chats", chatId, "messages");
    await addDoc(messagesRef, messageData);

    // Update chat document with last message
    let lastMessageText = text;
    
    if (media) {
        if (media.type === 'image') lastMessageText = text ? `📷 ${text}` : 'Sent an image';
        else if (media.type === 'video') lastMessageText = text ? `🎥 ${text}` : 'Sent a video';
        else if (media.type === 'gif') lastMessageText = 'GIF';
        else if (media.type === 'document') lastMessageText = text ? `📄 ${text}` : `Sent a file: ${media.fileName || 'Document'}`;
    }

    await setDoc(chatRef, {
      lastMessage: {
        text: lastMessageText,
        timestamp: serverTimestamp(),
      },
      updatedAt: serverTimestamp()
    }, { merge: true });

  } catch (error) {
    console.error("Error sending message: ", error);
    throw error;
  }
};

export const markMessageAsRead = async (chatId: string, messageId: string) => {
  try {
    // 1. Get the target message to establish timestamp and sender
    const targetMessageRef = doc(db, "chats", chatId, "messages", messageId);
    const targetMessageSnap = await getDoc(targetMessageRef);
    
    if (!targetMessageSnap.exists()) return;
    
    const targetData = targetMessageSnap.data();
    const senderId = targetData.senderId;
    const targetTimestamp = targetData.createdAt;

    if (!senderId || !targetTimestamp) return;

    // 2. Query all unread messages from this sender
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(
      messagesRef,
      where("senderId", "==", senderId),
      where("read", "==", false)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    let updateCount = 0;

    // 3. Filter in memory for messages older than or equal to target
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const msgTime = data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : (data.createdAt || Date.now());
      const targetTime = targetTimestamp instanceof Timestamp ? targetTimestamp.toMillis() : (targetTimestamp || Date.now());

      if (msgTime <= targetTime) {
        batch.update(docSnap.ref, { read: true });
        updateCount++;
      }
    });

    if (updateCount > 0) {
      await batch.commit();
    }
  } catch (error) {
    console.error("Error marking messages as read:", error);
  }
};

export const markChatRead = async (chatId: string, userId: string) => {
  try {
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(
      messagesRef,
      where("senderId", "!=", userId),
      where("read", "==", false)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });

    await batch.commit();
  } catch (error) {
    console.error("Error marking chat as read:", error);
  }
};

export const deleteChat = async (chatId: string) => {
  try {
    await deleteDoc(doc(db, "chats", chatId));
  } catch (error) {
    console.error("Error deleting chat:", error);
    throw error;
  }
};

export const toggleChatPin = async (chatId: string, userId: string, isPinned: boolean) => {
  try {
    const chatRef = doc(db, "chats", chatId);
    if (isPinned) {
      await updateDoc(chatRef, { pinnedBy: arrayRemove(userId) });
    } else {
      await updateDoc(chatRef, { pinnedBy: arrayUnion(userId) });
    }
  } catch (error) {
    console.error("Error toggling pin:", error);
  }
};

export const toggleChatMute = async (chatId: string, userId: string, isMuted: boolean) => {
  try {
    const chatRef = doc(db, "chats", chatId);
    if (isMuted) {
      await updateDoc(chatRef, { mutedBy: arrayRemove(userId) });
    } else {
      await updateDoc(chatRef, { mutedBy: arrayUnion(userId) });
    }
  } catch (error) {
    console.error("Error toggling mute:", error);
  }
};

export const toggleChatCallMute = async (chatId: string, userId: string, isCallMuted: boolean) => {
  try {
    const chatRef = doc(db, "chats", chatId);
    if (isCallMuted) {
      await updateDoc(chatRef, { callMutedBy: arrayRemove(userId) });
    } else {
      await updateDoc(chatRef, { callMutedBy: arrayUnion(userId) });
    }
  } catch (error) {
    console.error("Error toggling call mute:", error);
  }
};

export const toggleChatCategory = async (chatId: string, userId: string, moveToGeneral: boolean) => {
  try {
    const chatRef = doc(db, "chats", chatId);
    if (moveToGeneral) {
      await updateDoc(chatRef, { generalBy: arrayUnion(userId) });
    } else {
      await updateDoc(chatRef, { generalBy: arrayRemove(userId) });
    }
  } catch (error) {
    console.error("Error toggling chat category:", error);
  }
};


export const addMessageReaction = async (chatId: string, messageId: string, reaction: string) => {
  try {
    const messageRef = doc(db, "chats", chatId, "messages", messageId);
    await updateDoc(messageRef, {
      reaction: reaction
    });
  } catch (error) {
    console.error("Error adding reaction:", error);
  }
};

export const subscribeToChat = (chatId: string, callback: (messages: ChatMessage[]) => void) => {
  const messagesRef = collection(db, "chats", chatId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"), limit(100));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        senderId: data.senderId,
        text: data.text,
        timestamp: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now(),
        read: data.read || false,
        reaction: data.reaction || undefined,
        mediaUrl: data.mediaUrl || undefined,
        mediaType: data.mediaType || undefined,
        fileName: data.fileName || undefined,
        replyToText: data.replyToText || undefined,
        replyToSender: data.replyToSender || undefined
      } as ChatMessage;
    });
    callback(messages);
  });
};

export const subscribeToUserChats = (userId: string, onChatUpdate: (changeType: 'added' | 'modified' | 'removed', chatData: any, chatId: string) => void) => {
  const chatsRef = collection(db, "chats");
  const q = query(chatsRef, where("participants", "array-contains", userId));

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const data = change.doc.data();
      onChatUpdate(change.type, data, change.doc.id);
    });
  });
};

export const initializeBotChat = async (userId: string) => {
  const botId = 'u2'; 
  if (userId === botId) return; 

  const chatId = getChatId(userId, botId);
  const chatRef = doc(db, "chats", chatId);

  try {
    const chatDoc = await getDoc(chatRef);
    
    if (!chatDoc.exists()) {
      await setDoc(chatRef, {
        participants: [userId, botId],
        lastMessage: {
          text: "Hi! I'm Loopzyy Bot. I'm here to help you draft posts, replies, and just vibe! ✨",
          timestamp: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });

      const messagesRef = collection(db, "chats", chatId, "messages");
      await addDoc(messagesRef, {
        senderId: botId,
        text: "Hi! I'm Loopzyy Bot. I'm here to help you draft posts, replies, and just vibe! ✨",
        read: false,
        createdAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error("Error initializing bot chat:", error);
  }
};