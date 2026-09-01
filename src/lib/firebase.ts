import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  signInWithCredential
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  limit,
  Firestore
} from 'firebase/firestore';
import {
  UserProfile,
  LostFoundItem,
  ClaimRecord,
  AiMatchResult,
  AppNotification,
  CampusLocation
} from '../types';
import { RTC_LOCATIONS, RTC_DEMO_ITEMS } from '../data';
import firebaseConfigData from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfigData) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Initialize Firestore
export const db: Firestore = firebaseConfigData.firestoreDatabaseId
  ? getFirestore(app, firebaseConfigData.firestoreDatabaseId)
  : getFirestore(app);

// Authentication Helpers
export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Google Sign-In failed:', error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// User Profile Management
export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (err) {
    console.warn('Error fetching user profile from Firestore:', err);
  }
  return null;
}

export async function upsertUserProfile(profile: UserProfile): Promise<void> {
  const userDocRef = doc(db, 'users', profile.uid);
  await setDoc(userDocRef, profile, { merge: true });
}

// Lost Items Real-Time Subscription
export function subscribeLostItems(callback: (items: LostFoundItem[]) => void) {
  const colRef = collection(db, 'lostItems');
  const q = query(colRef, orderBy('createdAt', 'desc'), limit(100));

  return onSnapshot(
    q,
    (snapshot) => {
      const liveItems: LostFoundItem[] = snapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as LostFoundItem),
        id: docSnap.id,
      }));
      callback(liveItems);
    },
    (err) => {
      console.warn('Firestore lostItems subscription warning:', err);
    }
  );
}

export async function createLostItemDoc(item: Omit<LostFoundItem, 'id'>): Promise<string> {
  const colRef = collection(db, 'lostItems');
  const docRef = await addDoc(colRef, item);
  return docRef.id;
}

export async function updateLostItemDoc(id: string, updates: Partial<LostFoundItem>): Promise<void> {
  const docRef = doc(db, 'lostItems', id);
  await updateDoc(docRef, updates);
}

export async function deleteLostItemDoc(id: string): Promise<void> {
  const docRef = doc(db, 'lostItems', id);
  await deleteDoc(docRef);
}

// Found Items Real-Time Subscription
export function subscribeFoundItems(callback: (items: LostFoundItem[]) => void) {
  const colRef = collection(db, 'foundItems');
  const q = query(colRef, orderBy('createdAt', 'desc'), limit(100));

  return onSnapshot(
    q,
    (snapshot) => {
      const liveItems: LostFoundItem[] = snapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as LostFoundItem),
        id: docSnap.id,
      }));
      callback(liveItems);
    },
    (err) => {
      console.warn('Firestore foundItems subscription warning:', err);
    }
  );
}

export async function createFoundItemDoc(item: Omit<LostFoundItem, 'id'>): Promise<string> {
  const colRef = collection(db, 'foundItems');
  const docRef = await addDoc(colRef, item);
  return docRef.id;
}

export async function updateFoundItemDoc(id: string, updates: Partial<LostFoundItem>): Promise<void> {
  const docRef = doc(db, 'foundItems', id);
  await updateDoc(docRef, updates);
}

export async function deleteFoundItemDoc(id: string): Promise<void> {
  const docRef = doc(db, 'foundItems', id);
  await deleteDoc(docRef);
}

// Claims Real-Time Subscription
export function subscribeClaims(callback: (claims: ClaimRecord[]) => void) {
  const colRef = collection(db, 'claims');
  const q = query(colRef, orderBy('createdAt', 'desc'), limit(100));

  return onSnapshot(
    q,
    (snapshot) => {
      const liveClaims: ClaimRecord[] = snapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as ClaimRecord),
        id: docSnap.id,
      }));
      callback(liveClaims);
    },
    (err) => {
      console.warn('Firestore claims subscription warning:', err);
    }
  );
}

export async function submitClaimDoc(claim: Omit<ClaimRecord, 'id'>): Promise<string> {
  const colRef = collection(db, 'claims');
  const docRef = await addDoc(colRef, claim);

  // Update item status to 'claim_pending'
  try {
    const itemCol = claim.itemType === 'lost' ? 'lostItems' : 'foundItems';
    await updateDoc(doc(db, itemCol, claim.itemId), {
      status: 'claim_pending',
    });
  } catch (e) {
    console.warn('Could not update item status on claim submit:', e);
  }

  // Create notification for admin or item owner
  try {
    await addDoc(collection(db, 'notifications'), {
      userId: 'broadcast',
      title: `New Claim Submitted: ${claim.itemTitle}`,
      message: `${claim.claimantName} (${claim.claimantDept}) filed a private ownership claim for "${claim.itemTitle}".`,
      type: 'claim',
      linkId: docRef.id,
      linkType: 'claim',
      read: false,
      createdAt: Date.now(),
    });
  } catch (e) {
    console.warn('Notification create error:', e);
  }

  return docRef.id;
}

export async function updateClaimStatusDoc(
  claimId: string,
  itemId: string,
  itemType: 'lost' | 'found',
  status: ClaimRecord['status'],
  adminNotes?: string
): Promise<void> {
  const claimRef = doc(db, 'claims', claimId);
  await updateDoc(claimRef, {
    status,
    adminNotes: adminNotes || '',
    updatedAt: Date.now(),
  });

  // If approved or returned, reflect on the item
  try {
    const itemCol = itemType === 'lost' ? 'lostItems' : 'foundItems';
    let newItemStatus: LostFoundItem['status'] = 'open';
    if (status === 'approved') newItemStatus = 'approved';
    else if (status === 'returned') newItemStatus = 'returned';
    else if (status === 'rejected') newItemStatus = 'open';
    else if (status === 'under_review') newItemStatus = 'under_review';

    await updateDoc(doc(db, itemCol, itemId), {
      status: newItemStatus,
    });
  } catch (e) {
    console.warn('Item status update on claim decision error:', e);
  }
}

// AI Matches Subscription & Storage
export function subscribeMatches(callback: (matches: AiMatchResult[]) => void) {
  const colRef = collection(db, 'matches');
  const q = query(colRef, orderBy('createdAt', 'desc'), limit(50));

  return onSnapshot(
    q,
    (snapshot) => {
      const liveMatches: AiMatchResult[] = snapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as AiMatchResult),
        id: docSnap.id,
      }));
      callback(liveMatches);
    },
    (err) => {
      console.warn('Firestore matches subscription warning:', err);
    }
  );
}

export async function saveAiMatchDoc(match: Omit<AiMatchResult, 'id'>): Promise<string> {
  const colRef = collection(db, 'matches');
  const docRef = await addDoc(colRef, match);
  return docRef.id;
}

// Notifications Subscription
export function subscribeUserNotifications(
  uid: string | null,
  callback: (notifs: AppNotification[]) => void
) {
  const colRef = collection(db, 'notifications');
  const q = query(colRef, orderBy('createdAt', 'desc'), limit(30));

  return onSnapshot(
    q,
    (snapshot) => {
      const all: AppNotification[] = snapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as AppNotification),
        id: docSnap.id,
      }));
      // Filter for this user or broadcast
      const filtered = all.filter((n) => !uid || n.userId === uid || n.userId === 'broadcast');
      callback(filtered);
    },
    (err) => {
      console.warn('Firestore notifications subscription warning:', err);
    }
  );
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const docRef = doc(db, 'notifications', id);
  await updateDoc(docRef, { read: true });
}

export const markNotificationReadDoc = markNotificationAsRead;

// Combined Real-Time Subscription for all Lost & Found items
export function subscribeAllItems(callback: (items: LostFoundItem[]) => void) {
  let lostCache: LostFoundItem[] = [];
  let foundCache: LostFoundItem[] = [];

  const updateCombined = () => {
    const combined = [...lostCache, ...foundCache].sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    );
    if (combined.length === 0) {
      callback(RTC_DEMO_ITEMS);
    } else {
      callback(combined);
    }
  };

  const unsubLost = subscribeLostItems((items) => {
    lostCache = items;
    updateCombined();
  });

  const unsubFound = subscribeFoundItems((items) => {
    foundCache = items;
    updateCombined();
  });

  return () => {
    unsubLost();
    unsubFound();
  };
}

// Seed Demo items into Firestore
export async function seedRtcDemoData(): Promise<void> {
  for (const item of RTC_DEMO_ITEMS) {
    if (item.type === 'lost') {
      await addDoc(collection(db, 'lostItems'), {
        ...item,
        createdAt: Date.now() - Math.floor(Math.random() * 86400000 * 3),
      });
    } else {
      await addDoc(collection(db, 'foundItems'), {
        ...item,
        createdAt: Date.now() - Math.floor(Math.random() * 86400000 * 3),
      });
    }
  }
}

// Campus Locations Subscription & Management
export function subscribeCampusLocations(callback: (locs: string[]) => void) {
  const colRef = collection(db, 'campusLocations');

  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        callback(RTC_LOCATIONS);
      } else {
        const locs = snapshot.docs.map((d) => (d.data().name as string) || d.id);
        callback(locs.length ? locs : RTC_LOCATIONS);
      }
    },
    (err) => {
      console.warn('Firestore campusLocations subscription warning:', err);
      callback(RTC_LOCATIONS);
    }
  );
}

export async function addCampusLocationDoc(name: string): Promise<void> {
  const colRef = collection(db, 'campusLocations');
  await addDoc(colRef, { name: name.trim(), active: true, createdAt: Date.now() });
}

export async function deleteCampusLocationDoc(name: string): Promise<void> {
  const colRef = collection(db, 'campusLocations');
  const q = query(colRef, where('name', '==', name));
  const snaps = await getDocs(q);
  for (const s of snaps.docs) {
    await deleteDoc(s.ref);
  }
}
