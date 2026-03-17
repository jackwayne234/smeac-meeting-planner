import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { savePlan, fetchPlans, newBlankPlan } from "@/lib/storage";
import type { SmeacPlan } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, Check, Plus, Trash2, BookOpen } from "lucide-react";
import ExampleModal from "@/components/ExampleModal";
import { EXAMPLES } from "@/lib/examples";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const STEPS = [
  { letter: "S", label: "Situation", color: "#1a1e25", sub: "What's actually happening right now?" },
  { letter: "M", label: "Mission",   color: "#14171c", sub: "What is the goal of this meeting?" },
  { letter: "E", label: "Execution", color: "#8a6a28", sub: "How will you get it done?" },
  { letter: "A", label: "Administration", color: "#14171c", sub: "What do you need to prepare?" },
  { letter: "C", label: "Command & Control", color: "#1a1e25", sub: "Who is accountable?" },
];

const ADMIN_CHECKLIST = [
  "PowerPoint / slides",
  "Handouts",
  "Conference room",
  "Video call link",
  "Projector / screen",
  "Whiteboard / markers",
  "Catering / refreshments",
  "Agenda email",
  "Pre-read material",
  "Recording setup",
];

// Example fields per step
function getExampleFields(step: number) {
  switch (step) {
    case 0:
      return [
        { label: "Meeting Title", value: EXAMPLES.situation.meetingTitle },
        { label: "Date & Time", value: EXAMPLES.situation.dateTime },
        { label: "Location", value: EXAMPLES.situation.location },
        { label: "Current State", value: EXAMPLES.situation.currentState },
        { label: "Key Challenge", value: EXAMPLES.situation.keyChallenge },
      ];
    case 1:
      return [{ label: "Mission Statement", value: EXAMPLES.mission }];
    case 2:
      return EXAMPLES.execution.map((s, i) => ({
        label: `Step ${i + 1}`,
        value: `${s.action}\nOwner: ${s.owner}  ·  Due: ${s.dueDate}`,
      }));
    case 3:
      return [
        { label: "Logistics Checked", value: EXAMPLES.adminItems.join(", ") },
        { label: "Additional Notes", value: EXAMPLES.adminNotes },
      ];
    case 4:
      return [
        {
          label: "Meeting Lead",
          value: `${EXAMPLES.command.leadName}  ·  ${EXAMPLES.command.leadEmail}  ·  ${EXAMPLES.command.leadPhone}`,
        },
        ...EXAMPLES.command.actionItems.map((a, i) => ({
          label: `Action Item ${i + 1}`,
          value: `${a.item}\nOwner: ${a.owner}  ·  Due: ${a.due}`,
        })),
      ];
    default:
      return [];
  }
}

function applyExample(step: number, plan: SmeacPlan): SmeacPlan {
  switch (step) {
    case 0:
      return { ...plan, ...EXAMPLES.situation };
    case 1:
      return { ...plan, missionStatement: EXAMPLES.mission };
    case 2:
      return { ...plan, steps: EXAMPLES.execution };
    case 3:
      return { ...plan, adminItems: EXAMPLES.adminItems, adminNotes: EXAMPLES.adminNotes };
    case 4:
      return { ...plan, ...EXAMPLES.command };
    default:
      return plan;
  }
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      {STEPS.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
            style={{
              background: i === current ? s.color : i < current ? "#e4af50" : "var(--color-surface)",
              color: i <= current ? "white" : "var(--color-text-muted)",
              border: i > current ? "1.5px solid var(--color-border)" : "none",
              transform: i === current ? "scale(1.15)" : "scale(1)",
            }}
          >
            {i < current ? <Check size={14} /> : s.letter}
          </div>
          {i < STEPS.length - 1 && (
            <div className="w-6 h-0.5 rounded" style={{ background: i < current ? "#e4af50" : "var(--color-border)" }} />
          )}
        </div>
      ))}
    </div>
  );
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5">
      <label className="font-semibold text-sm block" style={{ color: "var(--color-text)" }}>{children}</label>
      {hint && <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{hint}</p>}
    </div>
  );
}

function GuidanceBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-4 mb-6 text-sm leading-relaxed"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
    >
      {children}
    </div>
  );
}

export default function WizardPage() {
  const [, navigate] = useLocation();
  const params = useParams<{ id?: string }>();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [plan, setPlan] = useState<SmeacPlan>(newBlankPlan());
  const [showExample, setShowExample] = useState(false);
  const [saving, setSaving] = useState(false);

  // When editing an existing plan, load it from the API plans list
  const { data: existingPlans } = useQuery({
    queryKey: ["/api/plans"],
    queryFn: fetchPlans,
    enabled: !!params.id,
  });

  useEffect(() => {
    if (params.id && existingPlans) {
      const found = existingPlans.find((p) => p.id === params.id);
      if (found) setPlan(found);
    }
  }, [params.id, existingPlans]);

  function update(partial: Partial<SmeacPlan>) {
    setPlan((p) => ({ ...p, ...partial }));
  }

  function updateStep(idx: number, field: "action" | "owner" | "dueDate", value: string) {
    const steps = [...plan.steps];
    steps[idx] = { ...steps[idx], [field]: value };
    update({ steps });
  }

  function addStep() {
    update({ steps: [...plan.steps, { action: "", owner: "", dueDate: "" }] });
  }

  function removeStep(idx: number) {
    update({ steps: plan.steps.filter((_, i) => i !== idx) });
  }

  function toggleAdmin(item: string) {
    const current = plan.adminItems;
    if (current.includes(item)) {
      update({ adminItems: current.filter((i) => i !== item) });
    } else {
      update({ adminItems: [...current, item] });
    }
  }

  async function handleNext() {
    if (step < 4) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setSaving(true);
      try {
        await savePlan(plan);
        await qc.invalidateQueries({ queryKey: ["/api/plans"] });
        navigate(`/summary/${plan.id}`);
      } finally {
        setSaving(false);
      }
    }
  }

  function handleBack() {
    if (step > 0) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
  }

  const currentStep = STEPS[step];

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      {/* Top nav */}
      <header className="sticky top-0 z-20 border-b" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={handleBack} className="flex items-center gap-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
            <ChevronLeft size={16} /> Back
          </button>
          <span className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
            Step {step + 1} of 5
          </span>
          {/* Example button */}
          <button
            onClick={() => setShowExample(true)}
            data-testid="button-see-example"
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
            style={{
              background: "#1a1e25",
              color: "#e4af50",
            }}
          >
            <BookOpen size={12} /> See Example
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <StepIndicator current={step} />

        {/* Step header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg"
              style={{ background: currentStep.color, color: "#e4af50" }}
            >
              {currentStep.letter}
            </div>
            <div>
              <h1 className="font-bold leading-tight" style={{ fontSize: "var(--text-xl)", color: "var(--color-text)" }}>
                {currentStep.label}
              </h1>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{currentStep.sub}</p>
            </div>
          </div>
        </div>

        {/* ── STEP 1: SITUATION ── */}
        {step === 0 && (
          <div className="space-y-5">
            <GuidanceBox>
              <strong style={{ color: "var(--color-text)" }}>Rule 1 — Situation must be brutally honest. Never sanitize.</strong>{" "}
              Don't soften the truth. Say what is actually happening — risks, gaps, what's broken, what people are worried about.
              A clear-eyed view of reality is the only foundation for an effective plan.
            </GuidanceBox>
            <div>
              <FieldLabel hint="What is this meeting about?">Meeting Title</FieldLabel>
              <Input data-testid="input-meeting-title" value={plan.meetingTitle}
                onChange={(e) => update({ meetingTitle: e.target.value })} placeholder="e.g. Q2 Project Kickoff" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Date & Time</FieldLabel>
                <Input data-testid="input-date-time" value={plan.dateTime}
                  onChange={(e) => update({ dateTime: e.target.value })} placeholder="e.g. March 20, 10:00 AM" />
              </div>
              <div>
                <FieldLabel>Location / Link</FieldLabel>
                <Input data-testid="input-location" value={plan.location}
                  onChange={(e) => update({ location: e.target.value })} placeholder="Room 204 or Zoom link" />
              </div>
            </div>
            <div>
              <FieldLabel hint="Describe the real conditions on the ground — risks, gaps, what's broken, what's working.">
                Current State
              </FieldLabel>
              <Textarea data-testid="input-current-state" value={plan.currentState}
                onChange={(e) => update({ currentState: e.target.value })}
                placeholder="What is actually going on right now? Be direct." rows={4} />
            </div>
          </div>
        )}

        {/* ── STEP 2: MISSION ── */}
        {step === 1 && (
          <div className="space-y-5">
            <GuidanceBox>
              <strong style={{ color: "var(--color-text)" }}>Rule 2 — Mission should address each problem in the Situation. Always include the human outcome.</strong>
              <br /><br />
              Your mission must connect directly to what you described in the Situation — every problem should have a corresponding action.
              And always state what it means for the people involved. Taking care of people is the point.
              <br /><br />
              <em>Format:</em> "The purpose of this meeting is to <strong>[action]</strong> in order to <strong>[human outcome]</strong>."
            </GuidanceBox>
            <div>
              <FieldLabel hint="Complete the sentence below.">Mission Statement</FieldLabel>
              <Textarea data-testid="input-mission" value={plan.missionStatement}
                onChange={(e) => update({ missionStatement: e.target.value })}
                placeholder="The purpose of this meeting is to ____ in order to ____." rows={5} />
            </div>
          </div>
        )}

        {/* ── STEP 3: EXECUTION ── */}
        {step === 2 && (
          <div className="space-y-5">
            <GuidanceBox>
              <strong style={{ color: "var(--color-text)" }}>Rule 3 — Execution includes steps to address each issue. Vague plans fail.</strong>
              <br /><br />
              Each step must be a specific, concrete action — not a category or a general idea.
              Assign exactly one person to each action and give it a due date.
              "Someone will handle it" is not a plan.
            </GuidanceBox>
            {plan.steps.map((s, i) => (
              <div key={i} className="rounded-xl p-4 space-y-3"
                style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>Step {i + 1}</span>
                  {plan.steps.length > 1 && (
                    <button onClick={() => removeStep(i)} className="text-xs flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
                      <Trash2 size={12} /> Remove
                    </button>
                  )}
                </div>
                <Input data-testid={`input-step-action-${i}`} value={s.action}
                  onChange={(e) => updateStep(i, "action", e.target.value)} placeholder="What action needs to happen?" />
                <div className="grid grid-cols-2 gap-3">
                  <Input data-testid={`input-step-owner-${i}`} value={s.owner}
                    onChange={(e) => updateStep(i, "owner", e.target.value)} placeholder="Who is responsible?" />
                  <Input data-testid={`input-step-due-${i}`} value={s.dueDate}
                    onChange={(e) => updateStep(i, "dueDate", e.target.value)} placeholder="By when?" />
                </div>
              </div>
            ))}
            <button onClick={addStep} data-testid="button-add-step"
              className="w-full py-3 rounded-xl border-dashed border-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
              <Plus size={15} /> Add Another Step
            </button>
          </div>
        )}

        {/* ── STEP 4: ADMINISTRATION ── */}
        {step === 3 && (
          <div className="space-y-5">
            <GuidanceBox>
              <strong style={{ color: "var(--color-text)" }}>Rule 4 — Administration is real logistics. This gets missed a lot.</strong>
              <br /><br />
              Emails, slides, data sheets, room reservations, print-outs — the meeting only runs smoothly if someone planned for it.
              Check everything that applies and add any notes specific to your situation.
            </GuidanceBox>
            <div>
              <FieldLabel hint="Check everything you need to prepare">Logistics Checklist</FieldLabel>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {ADMIN_CHECKLIST.map((item) => (
                  <button key={item}
                    data-testid={`button-admin-${item.replace(/\s+/g, "-").toLowerCase()}`}
                    onClick={() => toggleAdmin(item)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-left transition-all"
                    style={{
                      background: plan.adminItems.includes(item) ? "#1a1e25" : "var(--color-surface)",
                      color: plan.adminItems.includes(item) ? "white" : "var(--color-text)",
                      border: `1.5px solid ${plan.adminItems.includes(item) ? "#1a1e25" : "var(--color-border)"}`,
                    }}>
                    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: plan.adminItems.includes(item) ? "#e4af50" : "transparent",
                        border: plan.adminItems.includes(item) ? "none" : "1.5px solid var(--color-border)",
                      }}>
                      {plan.adminItems.includes(item) && <Check size={10} strokeWidth={3} />}
                    </div>
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel hint="Anything specific to your meeting not on the checklist above?">Additional Notes</FieldLabel>
              <Textarea data-testid="input-admin-notes" value={plan.adminNotes}
                onChange={(e) => update({ adminNotes: e.target.value })}
                placeholder="Any other logistics, prep tasks, or reminders..." rows={3} />
            </div>
          </div>
        )}

        {/* ── STEP 5: COMMAND & CONTROL ── */}
        {step === 4 && (
          <div className="space-y-5">
            <GuidanceBox>
              <strong style={{ color: "var(--color-text)" }}>Rule 5 — Command &amp; Control closes the loop.</strong>
              <br /><br />
              Who is in charge, and who can people reach out to when they need help?
              Everyone needs help sometimes. Make sure they know exactly who to call.
            </GuidanceBox>
            <div className="rounded-xl p-4 space-y-3"
              style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <p className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>Meeting Lead / Person in Charge</p>
              <Input data-testid="input-lead-name" value={plan.leadName}
                onChange={(e) => update({ leadName: e.target.value })} placeholder="Full name" />
              <div className="grid grid-cols-2 gap-3">
                <Input data-testid="input-lead-email" value={plan.leadEmail}
                  onChange={(e) => update({ leadEmail: e.target.value })} placeholder="Email address" type="email" />
                <Input data-testid="input-lead-phone" value={plan.leadPhone}
                  onChange={(e) => update({ leadPhone: e.target.value })} placeholder="Phone number" type="tel" />
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-10">
          <Button variant="outline" onClick={handleBack} className="flex-1 gap-1.5">
            <ChevronLeft size={15} /> Back
          </Button>
          <Button onClick={handleNext} disabled={saving} data-testid="button-next" className="flex-1 gap-1.5">
            {step === 4
              ? saving ? "Saving..." : <><Check size={15} /> Finish Plan</>
              : <>Next <ChevronRight size={15} /></>}
          </Button>
        </div>
      </main>

      {/* Example modal */}
      <ExampleModal
        open={showExample}
        onClose={() => setShowExample(false)}
        stepLetter={currentStep.letter}
        stepLabel={currentStep.label}
        stepColor={currentStep.color}
        fields={getExampleFields(step)}
        onUseExample={() => setPlan((p) => applyExample(step, p))}
      />
    </div>
  );
}
