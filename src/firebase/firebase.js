import { getFirestore } from 'firebase/firestore';
import "firebase/firestore";
import { initializeApp } from 'firebase/app'

export const firebaseConfig = {
    apiKey: process.env.React_APP_FIREBASE_KEY,
    authDomain: process.env.React_APP_AUTH_DOMANIAN,
    projectId: process.env.React_APP_PROJECT_ID,
    storageBucket: process.env.React_APP_STORAGE_BUCKET,
    messagingSenderId: process.env.React_APP_MS_ID,
    appId: 'reactmap-d80ae',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
