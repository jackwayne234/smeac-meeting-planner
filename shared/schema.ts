import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// We're using localStorage only — no DB needed for this app.
// Schema types are defined here for type safety across the app.

export type SmeacPlan = {
  id: string;
  createdAt: number;
  // Step 1 — Situation
  meetingTitle: string;
  dateTime: string;
  location: string;
  currentState: string;
  keyChallenge: string;
  // Step 2 — Mission
  missionStatement: string;
  // Step 3 — Execution
  steps: { action: string; owner: string; dueDate: string }[];
  // Step 4 — Administration
  adminItems: string[];
  adminNotes: string;
  // Step 5 — Command & Control
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  actionItems: { item: string; owner: string; due: string }[];
};
