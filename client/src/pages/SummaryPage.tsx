import { useLocation, useParams } from "wouter";
import { fetchPlans, deletePlan } from "@/lib/storage";
import { exportPlanAsPDF } from "@/lib/pdfExport";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Download, Pencil, Trash2, Check } from "lucide-react";
import { useState } from "react";
import PerplexityAttribution from "@/components/PerplexityAttribution";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SmeacPlan } from "@shared/schema";

const SECTIONS = [
  { letter: "S", label: "Situation", color: "#1a1e25" },
  { letter: "M", label: "Mission", color: "#14171c" },
  { letter: "E", label: "Execution", color: "#8a6a28" },
  { letter: "A", label: "Administration", color: "#14171c" },
  { letter: "C", label: "Command & Control", color: "#1a1e25" },
];

function SectionCard({ letter, label, color, children }: { letter: string; label: string; color: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: color }}>
        <span className="font-bold text-lg w-7 text-center" style={{ color: "#e4af50" }}>{letter}</span>
        <span className="font-semibold text-sm text-white">{label}</span>
      </div>
      <div className="p-4 space-y-3" style={{ background: "var(--color-surface)" }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--color-text-muted)" }}>{label}</p>
      <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--color-text)" }}>{value}</p>
    </div>
  );
}

export default function SummaryPage() {
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [exporting, setExporting] = useState(false);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["/api/plans"],
    queryFn: fetchPlans,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePlan(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/plans"] });
      navigate("/");
    },
  });

  const plan: SmeacPlan | undefined = plans.find((p) => p.id === params.id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
        <div className="space-y-3 w-full max-w-lg px-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl h-24 animate-pulse" style={{ background: "var(--color-surface)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
        <div className="text-center">
          <p style={{ color: "var(--color-text-muted)" }}>Plan not found.</p>
          <Button className="mt-4" onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportPlanAsPDF(plan!);
    } finally {
      setExporting(false);
    }
  }

  function handleDelete() {
    if (confirm("Delete this plan? This cannot be undone.")) {
      deleteMutation.mutate(plan!.id);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      {/* Header */}
      <header className="sticky top-0 z-20 border-b" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
            <ChevronLeft size={16} /> Plans
          </button>
          <span className="font-semibold text-sm truncate max-w-[160px]" style={{ color: "var(--color-text)" }}>
            {plan.meetingTitle || "Untitled Plan"}
          </span>
          <button
            onClick={() => navigate(`/edit/${plan.id}`)}
            className="flex items-center gap-1.5 text-sm font-medium"
            style={{ color: "var(--color-primary)" }}
          >
            <Pencil size={14} /> Edit
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-4">
        {/* Hero card */}
        <div className="rounded-2xl p-5" style={{ background: "#1a1e25" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#e4af50" }}>SMEAC Meeting Plan</p>
          <h1 className="font-bold text-white mb-3" style={{ fontSize: "var(--text-xl)" }}>
            {plan.meetingTitle || "Untitled Plan"}
          </h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
            {plan.dateTime && <span>{plan.dateTime}</span>}
            {plan.location && <span>{plan.location}</span>}
          </div>
          {/* SMEAC letters */}
          <div className="flex gap-2 mt-4">
            {SECTIONS.map((s) => (
              <div key={s.letter}
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ background: "rgba(201,168,76,0.2)", color: "#e4af50" }}>
                {s.letter}
              </div>
            ))}
          </div>
        </div>

        {/* S — Situation */}
        <SectionCard letter="S" label="Situation" color="#1a1e25">
          <Field label="Current State" value={plan.currentState} />
        </SectionCard>

        {/* M — Mission */}
        <SectionCard letter="M" label="Mission" color="#14171c">
          <Field label="Mission Statement" value={plan.missionStatement} />
        </SectionCard>

        {/* E — Execution */}
        <SectionCard letter="E" label="Execution" color="#8a6a28">
          {plan.steps.filter(s => s.action).length === 0 && (
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No steps added.</p>
          )}
          {plan.steps.filter(s => s.action).map((s, i) => (
            <div key={i} className="rounded-xl p-3" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                  style={{ background: "#8a6a28", color: "white" }}>{i + 1}</div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{s.action}</p>
                  <div className="flex gap-3 mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {s.owner && <span>Owner: {s.owner}</span>}
                    {s.dueDate && <span>Due: {s.dueDate}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </SectionCard>

        {/* A — Administration */}
        <SectionCard letter="A" label="Administration" color="#14171c">
          {plan.adminItems.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--color-text-muted)" }}>Checklist</p>
              <div className="flex flex-wrap gap-2">
                {plan.adminItems.map((item) => (
                  <span key={item} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                    style={{ background: "#1a1e25", color: "#e4af50" }}>
                    <Check size={10} strokeWidth={3} /> {item}
                  </span>
                ))}
              </div>
            </div>
          )}
          <Field label="Additional Notes" value={plan.adminNotes} />
        </SectionCard>

        {/* C — Command & Control */}
        <SectionCard letter="C" label="Command & Control" color="#1a1e25">
          {(plan.leadName || plan.leadEmail || plan.leadPhone) && (
            <div className="rounded-xl p-3" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Meeting Lead</p>
              <p className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>{plan.leadName}</p>
              <div className="flex gap-3 mt-0.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                {plan.leadEmail && <span>{plan.leadEmail}</span>}
                {plan.leadPhone && <span>{plan.leadPhone}</span>}
              </div>
            </div>
          )}
        </SectionCard>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button onClick={handleExport} disabled={exporting} className="flex-1 gap-2" data-testid="button-export-pdf">
            <Download size={15} />
            {exporting ? "Generating..." : "Download PDF"}
          </Button>
          <Button variant="outline" onClick={() => navigate(`/edit/${plan.id}`)} className="gap-1.5" data-testid="button-edit-plan">
            <Pencil size={14} /> Edit
          </Button>
          <Button variant="outline" onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="gap-1.5 text-red-500 border-red-200" data-testid="button-delete-plan">
            <Trash2 size={14} />
          </Button>
        </div>

        {/* Did I value your time */}
        <div className="rounded-2xl p-5 text-center" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <p className="font-semibold text-sm mb-1" style={{ color: "var(--color-text)" }}>
            "Did I value your time?"
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Ask this at the end of every meeting. It's the question that changes the room.
          </p>
          <p className="text-xs mt-2">
            <a href="https://www.amazon.com/dp/B0GSM4CGDJ" target="_blank" rel="noopener noreferrer"
              style={{ color: "var(--color-primary)" }}>
              Masterclass for Meetings — Christopher J. Riner
            </a>
          </p>
        </div>
      </main>

      <footer className="max-w-lg mx-auto px-4 py-6 text-center">
        <PerplexityAttribution />
      </footer>
    </div>
  );
}
