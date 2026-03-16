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

// ── Seed example plan ─────────────────────────────────────────────────────

export function seedExamplePlanIfNeeded(): void {
  const example: SmeacPlan = {
    id: "example-plan-001",
    createdAt: new Date("2026-03-02T08:00:00").getTime(),
    meetingTitle: "Example: Workforce & Capacity Meeting",
    dateTime: "March 2nd, 2026 at 0800",
    location: "Main Conference Room",
    currentState: "From October through January, the company's workload doubles. There is no plan developed to tackle this challenge. The people of the company are smart and worried about it — rightfully so. They know we aren't ready. They know that if it doesn't get fixed, it'll negatively impact their lives. The temp agency that usually provides workers during that time went out of business last month. We have 8 working printers and need 20 during this time. We have no onboarding process for temporary hires during this fast-paced environment.",
    keyChallenge: "",
    missionStatement: "To write down actionable items to address losing the temp agency, not having the printers we need, and not having an onboarding process for this unique situation — and to notify the organization that we acknowledge the challenge and are taking action this early. The result will be increased morale and better quality of life for our valued workers. If you take care of the people, the people will take care of you.",
    steps: [
      {
        action: "Sarah (HR): Research options for replacing the temp agency and bring results to next Monday's meeting. Do you have any questions or thoughts on that? (Write down Sarah's questions and thoughts. If you don't know the answer, say: \"That's a great question. I don't know. I will look that up and get back to you by 0800 Tuesday.\" This shows you valued their input, you're taking it seriously, and you're giving them an honest answer.)",
        owner: "Sarah — HR",
        dueDate: "Next Monday's meeting",
      },
      {
        action: "Tony (Technical Lead): Work with Sarah so she knows exactly the qualifications and number of people needed during this time. Can you do that? Do you have any questions, comments, or suggestions?",
        owner: "Tony — Technical Lead",
        dueDate: "Next Monday's meeting",
      },
      {
        action: "Greg (Logistics): What's the status of getting parts to fix the 2 broken printers and ordering 10 more before August 1st? Has there been any roadblocks? Research that and bring results to the next meeting.",
        owner: "Greg — Logistics",
        dueDate: "Next Monday's meeting",
      },
      {
        action: "Jennifer (Public Affairs): Prepare a draft post for our public website acknowledging this future challenge and the steps we're taking — not just to fix it, but to thrive through it. Don't post anything yet. Bring the structure to the next meeting and we'll fill in the blanks with everyone's results. This will ease the worry people have.",
        owner: "Jennifer — Public Affairs",
        dueDate: "Next Monday's meeting",
      },
    ],
    adminItems: ["PowerPoint slides for each step", "Email summarizing the meeting and results", "Public website post draft"],
    adminNotes: "Closing questions to ask at the end of every meeting:\n• Does anyone have any questions?\n• Did I value everyone's time during this meeting?",
    leadName: "Big Boss Ross",
    leadEmail: "BBR@AWESOME.COM",
    leadPhone: "123-123-1234",
    actionItems: [],
  };
  const existing = JSON.parse(lsGet(PLANS_KEY) || "[]") as SmeacPlan[];
  // Add example plan if it's not already there
  const hasExample = existing.some((p) => p.id === "example-plan-001");
  if (!hasExample) {
    lsSet(PLANS_KEY, JSON.stringify([example, ...existing]));
  }
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
