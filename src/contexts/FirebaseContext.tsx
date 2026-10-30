import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  sanitizeFirestoreId,
} from '../firebase';
import { MarketType, PassbookEntry, WeekRecord } from '../types';

const ADMIN_EMAIL = 'secretaryilada1425@gmail.com';
const LOCAL_PASSBOOK_KEY = 'ankganit_passbook_v1';
const LOCAL_CHART_CACHE_PREFIX = 'ankganit_cloud_chart_v1_';

interface FirebaseContextValue {
  user: FirebaseUser | null;
  authReady: boolean;
  isAdmin: boolean;
  isSigningIn: boolean;
  authError: string | null;
  cloudChartSyncStatus: 'connecting' | 'synced' | 'offline';
  cloudKalyanWeeks: Record<string, WeekRecord>;
  cloudRajdhaniWeeks: Record<string, WeekRecord>;
  cloudManipurWeeks: Record<string, WeekRecord>;
  passbookEntries: PassbookEntry[];
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  savePassbookEntry: (
    entry: Omit<PassbookEntry, 'id' | 'userId' | 'createdAtMs' | 'syncedToCloud'>
  ) => Promise<void>;
  deletePassbookEntry: (entryId: string) => Promise<void>;
  syncWeekToCloud: (market: MarketType, weekRecord: WeekRecord, weekIndex: number) => Promise<boolean>;
  syncRecentChartToCloud: (market: MarketType, history: WeekRecord[], count?: number) => Promise<number>;
  syncAllMarketsToCloud: (
    kalyanHistory: WeekRecord[],
    rajdhaniHistory: WeekRecord[],
    count?: number
  ) => Promise<{ kalyan: number; rajdhani: number }>;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

function loadLocalPassbook(): PassbookEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_PASSBOOK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalPassbook(entries: PassbookEntry[]) {
  try {
    localStorage.setItem(LOCAL_PASSBOOK_KEY, JSON.stringify(entries));
  } catch {}
}

function loadCachedCloudWeeks(market: MarketType): Record<string, WeekRecord> {
  try {
    const raw = localStorage.getItem(`${LOCAL_CHART_CACHE_PREFIX}${market}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveCachedCloudWeeks(market: MarketType, map: Record<string, WeekRecord>) {
  try {
    localStorage.setItem(`${LOCAL_CHART_CACHE_PREFIX}${market}`, JSON.stringify(map));
  } catch {}
}

export function mergeBaseAndCloudHistory(
  baseHistory: WeekRecord[],
  cloudWeeks: Record<string, WeekRecord>
): WeekRecord[] {
  const cloudValues = Object.values(cloudWeeks);
  if (cloudValues.length === 0) return baseHistory;

  const merged = baseHistory.map((item) => {
    const cloudMatch = cloudWeeks[item.week];
    return cloudMatch ? { ...item, ...cloudMatch } : item;
  });

  const existingSet = new Set(merged.map((w) => w.week));
  const extraWeeks = cloudValues.filter((cw) => cw.week && !existingSet.has(cw.week));

  return [...merged, ...extraWeeks];
}

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [cloudChartSyncStatus, setCloudChartSyncStatus] = useState<'connecting' | 'synced' | 'offline'>('connecting');

  const [cloudKalyanWeeks, setCloudKalyanWeeks] = useState<Record<string, WeekRecord>>(() =>
    loadCachedCloudWeeks('kalyan')
  );
  const [cloudRajdhaniWeeks, setCloudRajdhaniWeeks] = useState<Record<string, WeekRecord>>(() =>
    loadCachedCloudWeeks('rajdhani_night')
  );
  const [cloudManipurWeeks, setCloudManipurWeeks] = useState<Record<string, WeekRecord>>(() =>
    loadCachedCloudWeeks('manipur')
  );

  const [localEntries, setLocalEntries] = useState<PassbookEntry[]>(() => loadLocalPassbook());
  const [cloudEntries, setCloudEntries] = useState<PassbookEntry[]>([]);

  const isAdmin = Boolean(
    user && user.emailVerified && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );

  // 1. Ensure /users/{uid} exists on Google Sign-In (satisfies Master Gate invariant)
  const ensureUserProfile = useCallback(async (fbUser: FirebaseUser) => {
    if (!fbUser.email || !fbUser.emailVerified) return;
    const userPath = `users/${fbUser.uid}`;
    const userRef = doc(db, 'users', fbUser.uid);

    try {
      const snap = await getDoc(userRef);
      const displayName = (fbUser.displayName || fbUser.email.split('@')[0] || 'User').slice(0, 100);
      const photoURL = (fbUser.photoURL || '').slice(0, 500);

      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: fbUser.uid,
          email: fbUser.email.slice(0, 254),
          displayName,
          photoURL,
          preferredLanguage: 'mr',
          preferredMarket: 'kalyan',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        const existingData = snap.data();
        await setDoc(userRef, {
          uid: existingData.uid || fbUser.uid,
          email: existingData.email || fbUser.email.slice(0, 254),
          displayName,
          photoURL,
          preferredLanguage: existingData.preferredLanguage === 'en' ? 'en' : 'mr',
          preferredMarket:
            existingData.preferredMarket === 'rajdhani_night'
              ? 'rajdhani_night'
              : existingData.preferredMarket === 'manipur'
              ? 'manipur'
              : 'kalyan',
          createdAt: existingData.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, userPath);
      } catch {
        // Logged structured JSON diagnostic in handleFirestoreError
      }
    }
  }, []);

  // 2. Auth state listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (current) => {
      setUser(current);
      setAuthReady(true);
      if (current) {
        await ensureUserProfile(current);
      } else {
        setCloudEntries([]);
      }
    });
    return () => unsub();
  }, [ensureUserProfile]);

  // 3. Public Real-Time Weekly Chart Listeners (Kalyan & Rajdhani Night)
  useEffect(() => {
    if (!authReady) return;

    const kalyanPath = 'charts/kalyan/weeklyData';
    const kalyanQuery = query(
      collection(db, 'charts', 'kalyan', 'weeklyData'),
      where('market', '==', 'kalyan')
    );

    const unsubKalyan = onSnapshot(
      kalyanQuery,
      (snap) => {
        const nextMap: Record<string, WeekRecord> = {};
        const sortedDocs = [...snap.docs].sort(
          (a, b) => (a.data().weekIndex ?? 0) - (b.data().weekIndex ?? 0)
        );
        for (const d of sortedDocs) {
          const data = d.data();
          if (data.week && data.mon && data.tue && data.wed && data.thu && data.fri && data.sat) {
            nextMap[data.week] = {
              week: data.week,
              mon: data.mon,
              tue: data.tue,
              wed: data.wed,
              thu: data.thu,
              fri: data.fri,
              sat: data.sat,
            };
          }
        }
        setCloudKalyanWeeks(nextMap);
        saveCachedCloudWeeks('kalyan', nextMap);
        setCloudChartSyncStatus('synced');
      },
      (err) => {
        setCloudChartSyncStatus('offline');
        try {
          handleFirestoreError(err, OperationType.LIST, kalyanPath);
        } catch {}
      }
    );

    const rajdhaniPath = 'charts/rajdhani_night/weeklyData';
    const rajdhaniQuery = query(
      collection(db, 'charts', 'rajdhani_night', 'weeklyData'),
      where('market', '==', 'rajdhani_night')
    );

    const unsubRajdhani = onSnapshot(
      rajdhaniQuery,
      (snap) => {
        const nextMap: Record<string, WeekRecord> = {};
        const sortedDocs = [...snap.docs].sort(
          (a, b) => (a.data().weekIndex ?? 0) - (b.data().weekIndex ?? 0)
        );
        for (const d of sortedDocs) {
          const data = d.data();
          if (data.week && data.mon && data.tue && data.wed && data.thu && data.fri && data.sat) {
            nextMap[data.week] = {
              week: data.week,
              mon: data.mon,
              tue: data.tue,
              wed: data.wed,
              thu: data.thu,
              fri: data.fri,
              sat: data.sat,
            };
          }
        }
        setCloudRajdhaniWeeks(nextMap);
        saveCachedCloudWeeks('rajdhani_night', nextMap);
        setCloudChartSyncStatus('synced');
      },
      (err) => {
        setCloudChartSyncStatus('offline');
        try {
          handleFirestoreError(err, OperationType.LIST, rajdhaniPath);
        } catch {}
      }
    );

    const manipurPath = 'charts/manipur/weeklyData';
    const manipurQuery = query(
      collection(db, 'charts', 'manipur', 'weeklyData'),
      where('market', '==', 'manipur')
    );

    const unsubManipur = onSnapshot(
      manipurQuery,
      (snap) => {
        const nextMap: Record<string, WeekRecord> = {};
        const sortedDocs = [...snap.docs].sort(
          (a, b) => (a.data().weekIndex ?? 0) - (b.data().weekIndex ?? 0)
        );
        for (const d of sortedDocs) {
          const data = d.data();
          if (data.week && data.mon && data.tue && data.wed && data.thu && data.fri && data.sat) {
            nextMap[data.week] = {
              week: data.week,
              mon: data.mon,
              tue: data.tue,
              wed: data.wed,
              thu: data.thu,
              fri: data.fri,
              sat: data.sat,
            };
          }
        }
        setCloudManipurWeeks(nextMap);
        saveCachedCloudWeeks('manipur', nextMap);
        setCloudChartSyncStatus('synced');
      },
      (err) => {
        setCloudChartSyncStatus('offline');
        try {
          handleFirestoreError(err, OperationType.LIST, manipurPath);
        } catch {}
      }
    );

    return () => {
      unsubKalyan();
      unsubRajdhani();
      unsubManipur();
    };
  }, [authReady]);

  // 4. Private Passbook Subcollection Listener + Local-to-Cloud Auto Migration
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) return;

    const passbookPath = `users/${user.uid}/passbook`;
    const passbookQuery = query(
      collection(db, 'users', user.uid, 'passbook'),
      where('userId', '==', user.uid)
    );

    const unsub = onSnapshot(
      passbookQuery,
      (snap) => {
        const loaded: PassbookEntry[] = snap.docs
          .map((d) => {
            const data = d.data();
            const createdMs = data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now();
            return {
              id: data.id || d.id,
              userId: data.userId,
              market: data.market as MarketType,
              week: data.week,
              day: data.day,
              otcDigits: Array.isArray(data.otcDigits) ? data.otcDigits : [],
              jodis: Array.isArray(data.jodis) ? data.jodis : [],
              panas: Array.isArray(data.panas) ? data.panas : [],
              note: typeof data.note === 'string' ? data.note : '',
              createdAtMs: createdMs,
              syncedToCloud: true,
            };
          })
          .sort((a, b) => b.createdAtMs - a.createdAtMs);
        setCloudEntries(loaded);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, passbookPath);
        } catch {}
      }
    );

    return () => unsub();
  }, [authReady, user]);

  // Migrate unsynced local entries into Firestore once signed in
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified || localEntries.length === 0) return;

    let cancelled = false;
    (async () => {
      await ensureUserProfile(user);
      const remainingLocal: PassbookEntry[] = [];
      for (const item of localEntries) {
        if (cancelled) break;
        const safeId = sanitizeFirestoreId(item.id);
        const docPath = `users/${user.uid}/passbook/${safeId}`;
        try {
          const otcDigits = item.otcDigits
            .filter((n) => Number.isInteger(n) && n >= 0 && n <= 9)
            .slice(0, 4);
          if (otcDigits.length === 0) continue;

          const existingSnap = await getDoc(doc(db, 'users', user.uid, 'passbook', safeId));
          if (!existingSnap.exists()) {
            await setDoc(doc(db, 'users', user.uid, 'passbook', safeId), {
              id: safeId,
              userId: user.uid,
              market: item.market === 'rajdhani_night' ? 'rajdhani_night' : 'kalyan',
              week: item.week.slice(0, 40),
              day: item.day,
              otcDigits,
              jodis: item.jodis.filter((j) => /^\d{2}$/.test(j)).slice(0, 8),
              panas: item.panas.filter((p) => /^\d{3}$/.test(p)).slice(0, 6),
              note: (item.note || '').slice(0, 200),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        } catch (err) {
          remainingLocal.push(item);
          try {
            handleFirestoreError(err, OperationType.CREATE, docPath);
          } catch {}
        }
      }
      if (!cancelled && remainingLocal.length !== localEntries.length) {
        setLocalEntries(remainingLocal);
        saveLocalPassbook(remainingLocal);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, user, localEntries, ensureUserProfile]);

  const signInWithGoogle = useCallback(async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setAuthError(err?.message || 'Google sign-in failed.');
      }
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    setAuthError(null);
    await signOut(auth);
  }, []);

  const savePassbookEntry = useCallback(
    async (
      raw: Omit<PassbookEntry, 'id' | 'userId' | 'createdAtMs' | 'syncedToCloud'>
    ) => {
      const cleanOtc = Array.from(
        new Set(raw.otcDigits.filter((d) => Number.isInteger(d) && d >= 0 && d <= 9))
      ).slice(0, 4);
      if (cleanOtc.length === 0) return;

      const cleanJodis = Array.from(
        new Set(raw.jodis.map((j) => j.trim()).filter((j) => /^\d{2}$/.test(j)))
      ).slice(0, 8);
      const cleanPanas = Array.from(
        new Set(raw.panas.map((p) => p.trim()).filter((p) => /^\d{3}$/.test(p)))
      ).slice(0, 6);
      const cleanNote = (raw.note || '').trim().slice(0, 200);
      const cleanWeek = raw.week.trim().slice(0, 40);
      const entryId = sanitizeFirestoreId(
        `${raw.market}_${cleanWeek}_${raw.day}_${Date.now().toString(36)}`
      );

      if (user && user.emailVerified) {
        const docPath = `users/${user.uid}/passbook/${entryId}`;
        try {
          await ensureUserProfile(user);
          await setDoc(doc(db, 'users', user.uid, 'passbook', entryId), {
            id: entryId,
            userId: user.uid,
            market: raw.market,
            week: cleanWeek,
            day: raw.day,
            otcDigits: cleanOtc,
            jodis: cleanJodis,
            panas: cleanPanas,
            note: cleanNote,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          return;
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, docPath);
        }
      }

      // Offline / signed-out fallback to localStorage
      const newLocal: PassbookEntry = {
        id: entryId,
        userId: 'local_user',
        market: raw.market,
        week: cleanWeek,
        day: raw.day,
        otcDigits: cleanOtc,
        jodis: cleanJodis,
        panas: cleanPanas,
        note: cleanNote,
        createdAtMs: Date.now(),
        syncedToCloud: false,
      };
      const updated = [newLocal, ...localEntries];
      setLocalEntries(updated);
      saveLocalPassbook(updated);
    },
    [user, localEntries, ensureUserProfile]
  );

  const deletePassbookEntry = useCallback(
    async (entryId: string) => {
      if (user && user.emailVerified) {
        const isCloud = cloudEntries.some((e) => e.id === entryId);
        if (isCloud) {
          const docPath = `users/${user.uid}/passbook/${entryId}`;
          try {
            await deleteDoc(doc(db, 'users', user.uid, 'passbook', entryId));
          } catch (err) {
            handleFirestoreError(err, OperationType.DELETE, docPath);
          }
          return;
        }
      }
      const next = localEntries.filter((e) => e.id !== entryId);
      setLocalEntries(next);
      saveLocalPassbook(next);
    },
    [user, cloudEntries, localEntries]
  );

  const syncWeekToCloud = useCallback(
    async (market: MarketType, weekRecord: WeekRecord, weekIndex: number): Promise<boolean> => {
      if (!user || !isAdmin) return false;
      const weekId = sanitizeFirestoreId(weekRecord.week);
      const docPath = `charts/${market}/weeklyData/${weekId}`;
      const sanitizeCell = (cell?: { openPana: string; jodi: string; closePana: string }) => ({
        openPana: (cell?.openPana || '***').slice(0, 5),
        jodi: (cell?.jodi || '**').slice(0, 5),
        closePana: (cell?.closePana || '***').slice(0, 5),
      });

      try {
        await setDoc(doc(db, 'charts', market, 'weeklyData', weekId), {
          market,
          week: weekRecord.week.slice(0, 40),
          weekIndex: Math.max(0, Math.min(50000, Math.floor(weekIndex))),
          mon: sanitizeCell(weekRecord.mon),
          tue: sanitizeCell(weekRecord.tue),
          wed: sanitizeCell(weekRecord.wed),
          thu: sanitizeCell(weekRecord.thu),
          fri: sanitizeCell(weekRecord.fri),
          sat: sanitizeCell(weekRecord.sat),
          updatedAt: serverTimestamp(),
        });
        return true;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, docPath);
      }
    },
    [user, isAdmin]
  );

  const syncRecentChartToCloud = useCallback(
    async (market: MarketType, history: WeekRecord[], count: number = 12): Promise<number> => {
      if (!user || !isAdmin || history.length === 0) return 0;
      const startIdx = Math.max(0, history.length - count);
      let synced = 0;
      for (let i = startIdx; i < history.length; i++) {
        const ok = await syncWeekToCloud(market, history[i], i);
        if (ok) synced++;
      }
      return synced;
    },
    [user, isAdmin, syncWeekToCloud]
  );

  const syncAllMarketsToCloud = useCallback(
    async (
      kalyanHistory: WeekRecord[],
      rajdhaniHistory: WeekRecord[],
      count: number = 12
    ): Promise<{ kalyan: number; rajdhani: number }> => {
      if (!user || !isAdmin) return { kalyan: 0, rajdhani: 0 };
      const kCount = await syncRecentChartToCloud('kalyan', kalyanHistory, count);
      const rCount = await syncRecentChartToCloud('rajdhani_night', rajdhaniHistory, count);
      return { kalyan: kCount, rajdhani: rCount };
    },
    [user, isAdmin, syncRecentChartToCloud]
  );

  const combinedEntries = useMemo(() => {
    if (user && user.emailVerified) {
      const cloudIds = new Set(cloudEntries.map((c) => c.id));
      const unsynced = localEntries.filter((l) => !cloudIds.has(l.id));
      return [...unsynced, ...cloudEntries].sort((a, b) => b.createdAtMs - a.createdAtMs);
    }
    return localEntries;
  }, [user, cloudEntries, localEntries]);

  const value = useMemo<FirebaseContextValue>(
    () => ({
      user,
      authReady,
      isAdmin,
      isSigningIn,
      authError,
      cloudChartSyncStatus,
      cloudKalyanWeeks,
      cloudRajdhaniWeeks,
      cloudManipurWeeks,
      passbookEntries: combinedEntries,
      signInWithGoogle,
      signOutUser,
      savePassbookEntry,
      deletePassbookEntry,
      syncWeekToCloud,
      syncRecentChartToCloud,
      syncAllMarketsToCloud,
    }),
    [
      user,
      authReady,
      isAdmin,
      isSigningIn,
      authError,
      cloudChartSyncStatus,
      cloudKalyanWeeks,
      cloudRajdhaniWeeks,
      cloudManipurWeeks,
      combinedEntries,
      signInWithGoogle,
      signOutUser,
      savePassbookEntry,
      deletePassbookEntry,
      syncWeekToCloud,
      syncRecentChartToCloud,
      syncAllMarketsToCloud,
    ]
  );

  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>;
};

export function useFirebaseApp() {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    throw new Error('useFirebaseApp must be used inside FirebaseProvider');
  }
  return ctx;
}
