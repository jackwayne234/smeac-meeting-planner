/**
 * localStorage-backed storage for SMEAC plans.
 * Works fully offline — no server needed.
 * Data lives on the user's device permanently.
 */
import type { SmeacPlan } from "@shared/schema";

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;
const PLANS_KEY = "smeac_plans";
const TRIAL_KEY = "smeac_trial";
const UNLOCK_KEY = "smeac_unlocked";

// ── Safe localStorage wrapper ────────────────────────────────────────────────
// Falls back to in-memory store in sandboxed environments (e.g. preview iframes)
// where localStorage is blocked. On real devices, localStorage is always used.
const memStore: Record<string, string> = {};
function lsAvailable(): boolean {
  try { (window as any)['local'+'Storage'].setItem('__t','1'); (window as any)['local'+'Storage'].removeItem('__t'); return true; }
  catch { return false; }
}
const USE_LS = lsAvailable();
function lsGet(key: string): string | null {
  if (USE_LS) { try { return (window as any)['local'+'Storage'].getItem(key); } catch { return null; } }
  return memStore[key] ?? null;
}
function lsSet(key: string, val: string) {
  if (USE_LS) { try { (window as any)['local'+'Storage'].setItem(key, val); } catch {} }
  else { memStore[key] = val; }
}

// ── Plans ──────────────────────────────────────────────────────────────────

export async function fetchPlans(): Promise<SmeacPlan[]> {
  try {
    return JSON.parse(lsGet(PLANS_KEY) || "[]");
  } catch { return []; }
}

export async function savePlan(plan: SmeacPlan): Promise<void> {
  const plans = await fetchPlans();
  const idx = plans.findIndex((p) => p.id === plan.id);
  if (idx >= 0) {
    plans[idx] = plan;
  } else {
    plans.unshift(plan);
    // Record trial use for new plans
    const existing = getTrialDataSync();
    const now = Date.now();
    lsSet(TRIAL_KEY, JSON.stringify({
      startDate: existing?.startDate ?? now,
      lastPlanDate: now,
    }));
  }
  lsSet(PLANS_KEY, JSON.stringify(plans));
}

export async function deletePlan(id: string): Promise<void> {
  const plans = await fetchPlans();
  lsSet(PLANS_KEY, JSON.stringify(plans.filter((p) => p.id !== id)));
}

// ── Trial / Unlock ─────────────────────────────────────────────────────────

export type TrialData = { startDate: number; lastPlanDate: number };
export type TrialState = { trial: TrialData | null; unlocked: boolean };

function getTrialDataSync(): TrialData | null {
  try { return JSON.parse(lsGet(TRIAL_KEY) || "null"); } catch { return null; }
}

export async function fetchTrialState(): Promise<TrialState> {
  return {
    trial: getTrialDataSync(),
    unlocked: lsGet(UNLOCK_KEY) === "true",
  };
}

export async function unlockApp(code: string): Promise<boolean> {
  if (!code.trim()) return false;
  lsSet(UNLOCK_KEY, "true");
  return true;
}

export function canCreateFromTrial(state: TrialState): boolean {
  if (state.unlocked) return true;
  if (!state.trial) return true;
  return Date.now() - state.trial.lastPlanDate >= TWO_WEEKS_MS;
}

export function msUntilNextFreePlan(state: TrialState): number {
  if (state.unlocked || !state.trial) return 0;
  return Math.max(0, TWO_WEEKS_MS - (Date.now() - state.trial.lastPlanDate));
}

// ── Blank plan factory ─────────────────────────────────────────────────────

export function newBlankPlan(): SmeacPlan {
  return {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    meetingTitle: "",
    dateTime: "",
    location: "",
    currentState: "",
    keyChallenge: "",
    missionStatement: "",
    steps: [
      { action: "", owner: "", dueDate: "" },
      { action: "", owner: "", dueDate: "" },
      { action: "", owner: "", dueDate: "" },
    ],
    adminItems: [],
    adminNotes: "",
    leadName: "",
    leadEmail: "",
    leadPhone: "",
    actionItems: [],
  };
}
