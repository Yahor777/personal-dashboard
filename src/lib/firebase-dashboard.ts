import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  type FirestoreError,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "../config/firebase";
import { DASHBOARD_SNAPSHOT_VERSION, type DashboardSnapshot } from "../store/dashboardTypes";
import {
  createDefaultSnapshot,
  normalizeSnapshot,
} from "../store/dashboardDefaults";

const COLLECTION_NAME = "dashboards";

const dashboardDoc = (userId: string) => doc(db, COLLECTION_NAME, userId);

function sanitizeForFirestore<T>(input: T): T {
  if (input === undefined) {
    return null as T;
  }
  if (input === null) {
    return input;
  }
  if (typeof input !== "object") {
    return input;
  }
  if (input instanceof Date) {
    return input as T;
  }
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }

  const entries = Object.entries(input as Record<string, unknown>).reduce<Record<string, unknown>>(
    (acc, [key, value]) => {
      const sanitized = sanitizeForFirestore(value);
      if (sanitized !== undefined) {
        acc[key] = sanitized;
      }
      return acc;
    },
    {},
  );

  return entries as unknown as T;
}

export const fetchDashboardSnapshot = async (userId: string): Promise<DashboardSnapshot> => {
  const ref = dashboardDoc(userId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    const defaults = createDefaultSnapshot();
    await setDoc(ref, sanitizeForFirestore({ ...defaults, version: DASHBOARD_SNAPSHOT_VERSION }));
    return defaults;
  }
  return normalizeSnapshot(snapshot.data() as Partial<DashboardSnapshot>);
};

export const subscribeDashboardSnapshot = (
  userId: string,
  onData: (snapshot: DashboardSnapshot) => void,
  onError?: (error: FirestoreError) => void,
): Unsubscribe =>
  onSnapshot(
    dashboardDoc(userId),
    (document) => {
      if (!document.exists()) {
        const defaults = createDefaultSnapshot();
        onData(defaults);
        setDoc(
          dashboardDoc(userId),
          sanitizeForFirestore({ ...defaults, version: DASHBOARD_SNAPSHOT_VERSION }),
        ).catch(
          (error) => {
            console.error("Failed to seed dashboard snapshot", error);
          },
        );
        return;
      }
      onData(normalizeSnapshot(document.data() as Partial<DashboardSnapshot>));
    },
    (error) => {
      console.error("Dashboard subscription error", error);
      onError?.(error);
    },
  );

export const saveDashboardSnapshot = async (
  userId: string,
  snapshot: DashboardSnapshot,
): Promise<void> => {
  const payload: DashboardSnapshot = {
    ...snapshot,
    version: DASHBOARD_SNAPSHOT_VERSION,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(dashboardDoc(userId), sanitizeForFirestore(payload), { merge: true });
};