
import { doc, setDoc, getDoc, getDocs, collection, serverTimestamp, onSnapshot, query, where, addDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { UserProfile, Ingredient, IncomingList } from "../types";

/**
 * Syncs the user profile to a role-specific collection (customers or owners).
 */
export const syncSession = async (profile: UserProfile) => {
  const collectionName = profile.role === 'owner' ? "owners" : "customers";
  const profileRef = doc(db, collectionName, profile.phone);
  
  const data: any = {
    phone: profile.phone,
    name: profile.name,
    role: profile.role,
    location: profile.location || "",
    lat: profile.lat || null,
    lng: profile.lng || null,
    updatedAt: serverTimestamp(),
  };

  if (profile.role === 'owner') {
    data.shopName = profile.shopName || "";
    data.storeType = profile.storeType || "";
  }

  await setDoc(profileRef, data, { merge: true });
};

/**
 * Sends a categorized list to a specific shop owner.
 */
export const sendListToOwner = async (ownerPhone: string, customer: UserProfile, items: Ingredient[]) => {
  const ordersRef = collection(db, "orders");
  await addDoc(ordersRef, {
    customerName: customer.name,
    customerPhone: customer.phone,
    shopPhone: ownerPhone, // Important for reverse lookup
    items: items,
    timestamp: serverTimestamp(),
    status: 'pending'
  });
};

/**
 * Listens for incoming lists for a specific shop owner.
 * Filters out terminal orders (rejected/completed) to keep dashboard clean.
 */
export const listenToIncomingLists = (ownerPhone: string, callback: (lists: IncomingList[]) => void) => {
  const ordersRef = collection(db, "orders");
  const q = query(ordersRef, where("shopPhone", "==", ownerPhone));
  
  return onSnapshot(q, (snapshot) => {
    const lists = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as IncomingList[];
    
    // Filter out rejected and completed items so they don't appear in the dashboard
    const activeLists = lists.filter(list => list.status !== 'rejected' && list.status !== 'completed');
    
    // Client-side sort descending by timestamp
    activeLists.sort((a, b) => {
      const timeA = a.timestamp?.seconds || 0;
      const timeB = b.timestamp?.seconds || 0;
      return timeB - timeA;
    });
    
    callback(activeLists);
  });
};

/**
 * Listens for orders sent BY a specific customer across all shops.
 */
export const listenToCustomerOrders = (customerPhone: string, callback: (lists: IncomingList[]) => void) => {
  const ordersRef = collection(db, "orders");
  const q = query(ordersRef, where("customerPhone", "==", customerPhone));

  return onSnapshot(q, (snapshot) => {
    const lists = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as IncomingList[];
    
    // Client-side sort descending
    lists.sort((a, b) => {
      const timeA = a.timestamp?.seconds || 0;
      const timeB = b.timestamp?.seconds || 0;
      return timeB - timeA;
    });

    callback(lists);
  });
};

/**
 * Updates order status.
 */
export const updateOrderStatus = async (orderId: string, status: 'pending' | 'accepted' | 'rejected' | 'ready' | 'completed') => {
  if (!orderId) return;
  const orderRef = doc(db, "orders", orderId);
  await updateDoc(orderRef, { status });
};

/**
 * Updates the entire items array (used for toggling availability).
 */
export const updateOrderItems = async (orderId: string, items: Ingredient[]) => {
  if (!orderId) return;
  const orderRef = doc(db, "orders", orderId);
  await updateDoc(orderRef, { items });
};

/**
 * Fetches a profile from the role-specific collection by phone number.
 */
export const getProfileByPhone = async (phone: string, role: 'customer' | 'owner'): Promise<UserProfile | null> => {
  const collectionName = role === 'owner' ? "owners" : "customers";
  const profileRef = doc(db, collectionName, phone);
  const docSnap = await getDoc(profileRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      name: data.name,
      phone: data.phone,
      role: data.role as 'customer' | 'owner',
      location: data.location,
      lat: data.lat,
      lng: data.lng,
      shopName: data.shopName,
      storeType: data.storeType
    };
  }
  return null;
};

/**
 * Fetches all registered owners to calculate proximity.
 */
export const getAllOwners = async (): Promise<UserProfile[]> => {
  const ownersCol = collection(db, "owners");
  const snapshot = await getDocs(ownersCol);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      name: data.name,
      phone: data.phone,
      role: 'owner',
      location: data.location,
      lat: data.lat,
      lng: data.lng,
      shopName: data.shopName,
      storeType: data.storeType
    };
  });
};
