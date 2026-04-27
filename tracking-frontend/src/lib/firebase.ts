import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// These should be set in .env
const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY || "mock-api-key",
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN || "mock-auth-domain",
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID || "mock-project-id",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
