import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Load config
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

async function migrate() {
  const markets = ['kalyan', 'rajdhani_night'];
  for (const market of markets) {
    const jsonPath = path.resolve(process.cwd(), `src/data/${market === 'kalyan' ? 'kalyanHistorical' : 'rajdhaniNightHistorical'}.json`);
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    console.log(`Migrating ${market}...`);
    
    for (const weekData of data) {
      const weekId = weekData.week.replace(/[^a-zA-Z0-9]/g, '-');
      const docRef = doc(db, 'charts', market, 'weeklyData', weekId);
      await setDoc(docRef, weekData);
      console.log(`Migrated week ${weekData.week}`);
    }
  }
  console.log('Migration complete!');
}

migrate().catch(console.error);
