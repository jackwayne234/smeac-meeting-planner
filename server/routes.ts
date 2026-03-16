import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import type { SmeacPlan } from "@shared/schema";
import { v4 as uuidv4 } from "uuid";

// Session ID comes from the x-session-id header (set by the client).
// This avoids cookie issues in sandboxed/iframe environments.
function getSessionId(req: any, res: any): string {
  const sid = req.headers["x-session-id"];
  if (sid && typeof sid === "string" && sid.length > 0) return sid;
  // Fallback: generate one (shouldn't normally happen)
  return uuidv4();
}

export async function registerRoutes(httpServer: Server, app: Express) {
  // GET /api/plans
  app.get("/api/plans", (req: any, res: any) => {
    const sid = getSessionId(req, res);
    res.json(storage.getPlans(sid));
  });

  // POST /api/plans
  app.post("/api/plans", (req: any, res: any) => {
    const sid = getSessionId(req, res);
    const plan = req.body as SmeacPlan;
    if (!plan.id) return res.status(400).json({ error: "Missing plan id" });
    storage.savePlan(sid, plan);
    res.json(plan);
  });

  // DELETE /api/plans/:id
  app.delete("/api/plans/:id", (req: any, res: any) => {
    const sid = getSessionId(req, res);
    storage.deletePlan(sid, req.params.id);
    res.json({ ok: true });
  });

  // GET /api/trial
  app.get("/api/trial", (req: any, res: any) => {
    const sid = getSessionId(req, res);
    res.json({
      trial: storage.getTrialData(sid),
      unlocked: storage.isUnlocked(sid),
    });
  });

  // POST /api/unlock
  app.post("/api/unlock", (req: any, res: any) => {
    const sid = getSessionId(req, res);
    const { code } = req.body;
    if (code && code.trim().length > 0) {
      storage.setUnlocked(sid);
      res.json({ ok: true });
    } else {
      res.status(400).json({ error: "Invalid code" });
    }
  });

  return httpServer;
}
