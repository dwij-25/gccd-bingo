import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';

// Google Firebase Configuration (Read from Vite environment variables)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

// Check if Firebase configuration keys are provided
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket
);

let app: any = null;
let db: any = null;
let storage: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    console.info('🔥 Google Firebase connected successfully for GCCD Bingo!');
  } catch (err) {
    console.warn('⚠️ Google Firebase initialization error:', err);
  }
} else {
  console.info('ℹ️ Google Firebase config not detected; running on Google Cloud Neon/Vercel backend.');
}

export { app, db, storage };

/**
 * Upload a captured challenge image directly to Google Cloud Firebase Storage
 */
export async function uploadToFirebaseStorage(
  participantId: string,
  tileIndex: number,
  dataUrl: string
): Promise<string | null> {
  if (!isFirebaseConfigured || !storage) return null;

  try {
    const timestamp = Date.now();
    const filePath = `bingo_challenges/${participantId}/tile_${tileIndex}_${timestamp}.jpg`;
    const storageRef = ref(storage, filePath);

    // Upload base64 / dataUrl
    await uploadString(storageRef, dataUrl, 'data_url', {
      contentType: 'image/jpeg',
      customMetadata: {
        participantId,
        tileIndex: String(tileIndex),
        uploadedAt: new Date().toISOString()
      }
    });

    const publicUrl = await getDownloadURL(storageRef);
    return publicUrl;
  } catch (error) {
    console.error('Failed to upload image to Firebase Storage:', error);
    return null;
  }
}

/**
 * Sync participant and card progress to Google Cloud Firestore
 */
export async function syncCardToFirestore(
  participantId: string,
  cardData: any
): Promise<boolean> {
  if (!isFirebaseConfigured || !db) return false;

  try {
    const cardRef = doc(db, 'gccd_bingo_cards', participantId);
    await setDoc(cardRef, {
      ...cardData,
      last_synced_at: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Failed to sync card to Firebase Firestore:', error);
    return false;
  }
}
