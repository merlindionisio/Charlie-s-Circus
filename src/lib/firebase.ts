import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit, addDoc, getDocs } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string | null;
    email: string | null;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: any[];
  }
}

const handleFirestoreError = (error: any, operationType: FirestoreErrorInfo['operationType'], path: string | null = null) => {
  if (error.message?.includes('insufficient permissions')) {
    const authInfo = {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || false,
      isAnonymous: auth.currentUser?.isAnonymous || false,
      providerInfo: auth.currentUser?.providerData || []
    };
    const info: FirestoreErrorInfo = {
      error: error.message,
      operationType,
      path,
      authInfo
    };
    console.error("Firestore Permission Denied:", info);
    throw new Error(JSON.stringify(info));
  }
  throw error;
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    return null;
  }
};

export const logout = () => signOut(auth);

// Helper for saving progress
export const saveUserProgress = async (user: any, stats: any) => {
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, { 
      userId: user.uid,
      displayName: user.displayName || 'Circus Performer',
      photoURL: user.photoURL || '',
      email: user.email || '',
      stats 
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, 'write', `users/${user.uid}`);
  }
};

// Helper for global leaderboard
export const submitScore = async (userId: string, displayName: string, score: number, act: string, difficulty: string) => {
  if (score <= 0) return;

  try {
    // Generate a unique identifier for this score/user/act combo
    const scoreId = `${userId}_${act}_${score}`;
    const scoreDocRef = doc(db, 'leaderboards', scoreId);
    
    // Use getDoc to skip if it already exists
    const existingDoc = await getDoc(scoreDocRef);
    if (existingDoc.exists()) {
      console.log("Duplicate score skipped");
      return;
    }

    await setDoc(scoreDocRef, {
      userId,
      displayName: displayName || 'Anonymous Clowner',
      score,
      act,
      difficulty,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, 'create', 'leaderboards');
  }
};

export const getTopScores = async (act: string, limitNum: number = 10) => {
  try {
    const scoresRef = collection(db, 'leaderboards');
    const q = query(
      scoresRef, 
      orderBy('score', 'desc'), 
      limit(limitNum)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data()).filter(d => d.act === act);
  } catch (error) {
    handleFirestoreError(error, 'list', 'leaderboards');
    return [];
  }
};
