import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = initializeApp({
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
});
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function updateWeek() {
  const weekId = '19-10-26-to-25-10-26';
  
  // Kalyan Update
  const kalyanRef = doc(db, 'charts', 'kalyan', 'weeklyData', weekId);
  const kalyanSnap = await getDoc(kalyanRef);
  if (kalyanSnap.exists()) {
    await updateDoc(kalyanRef, {
      thu: { openPana: '629', jodi: '12', closePana: '450' },
      fri: { openPana: '739', jodi: '73', closePana: '256' },
      sat: { openPana: '910', jodi: '91', closePana: '236' }
    });
    console.log('Kalyan updated');
  }

  // Rajdhani Update
  const rajRef = doc(db, 'charts', 'rajdhani_night', 'weeklyData', weekId);
  const rajSnap = await getDoc(rajRef);
  if (rajSnap.exists()) {
     // Based on screenshot 2: 
     // Mon: 55, Tue: 31, Wed: 50, Thu: 16, Fri: 81
     await updateDoc(rajRef, {
      mon: { openPana: '690', jodi: '55', closePana: '230' },
      tue: { openPana: '236', jodi: '31', closePana: '346' },
      wed: { openPana: '118', jodi: '50', closePana: '677' },
      thu: { openPana: '657', jodi: '16', closePana: '169' },
      fri: { openPana: '139', jodi: '81', closePana: '245' }
    });
    console.log('Rajdhani updated');
  }
}
updateWeek().catch(console.error);
