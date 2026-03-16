import type { SmeacPlan } from "@shared/schema";
import fs from "fs";
import path from "path";

// File-backed storage — persists to disk so plans survive server restarts.

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "plans.json");

export interface IStorage {
  getPlans(sessionId: string): SmeacPlan[];
  savePlan(sessionId: string, plan: SmeacPlan): void;
  deletePlan(sessionId: string, id: string): void;
  getPlan(sessionId: string, id: string): SmeacPlan | undefined;
  getTrialData(sessionId: string): TrialData | null;
  setTrialData(sessionId: string, data: TrialData): void;
  isUnlocked(sessionId: string): boolean;
  setUnlocked(sessionId: string): void;
}

export type TrialData = {
  startDate: number;
  lastPlanDate: number;
};

type SessionData = {
  plans: SmeacPlan[];
  trial: TrialData | null;
  unlocked: boolean;
};

type DataStore = {
  sessions: Record<string, SessionData>;
};

export class FileStorage implements IStorage {
  private data: DataStore = { sessions: {} };

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      if (fs.existsSync(DATA_FILE)) {
        this.data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      }
    } catch (e) {
      console.error("[storage] Failed to load, starting fresh:", e);
      this.data = { sessions: {} };
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (e) {
      console.error("[storage] Failed to save:", e);
    }
  }

  private getSession(sessionId: string): SessionData {
    if (!this.data.sessions[sessionId]) {
      this.data.sessions[sessionId] = { plans: [], trial: null, unlocked: false };
    }
    return this.data.sessions[sessionId];
  }

  getPlans(sessionId: string): SmeacPlan[] {
    return this.getSession(sessionId).plans;
  }

  savePlan(sessionId: string, plan: SmeacPlan): void {
    const session = this.getSession(sessionId);
    const idx = session.plans.findIndex((p) => p.id === plan.id);
    if (idx >= 0) {
      session.plans[idx] = plan;
    } else {
      session.plans.unshift(plan);
      const now = Date.now();
      session.trial = {
        startDate: session.trial?.startDate ?? now,
        lastPlanDate: now,
      };
    }
    this.save();
  }

  deletePlan(sessionId: string, id: string): void {
    const session = this.getSession(sessionId);
    session.plans = session.plans.filter((p) => p.id !== id);
    this.save();
  }

  getPlan(sessionId: string, id: string): SmeacPlan | undefined {
    return this.getSession(sessionId).plans.find((p) => p.id === id);
  }

  getTrialData(sessionId: string): TrialData | null {
    return this.getSession(sessionId).trial;
  }

  setTrialData(sessionId: string, data: TrialData): void {
    this.getSession(sessionId).trial = data;
    this.save();
  }

  isUnlocked(sessionId: string): boolean {
    return this.getSession(sessionId).unlocked;
  }

  setUnlocked(sessionId: string): void {
    this.getSession(sessionId).unlocked = true;
    this.save();
  }
}

export const storage = new FileStorage();
