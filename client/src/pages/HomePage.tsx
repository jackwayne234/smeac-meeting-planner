import { useLocation } from "wouter";
import { fetchPlans, fetchTrialState, deletePlan, canCreateFromTrial, msUntilNextFreePlan } from "@/lib/storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SmeacPlan } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, FileText, Plus, Lock, ChevronRight, Star } from "lucide-react";
import UnlockModal from "@/components/UnlockModal";
import { useState } from "react";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatCountdown(ms: number): string {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m`;
}

export default function HomePage() {
  const [, navigate] = useLocation();
  const [showUnlock, setShowUnlock] = useState(false);
  const qc = useQueryClient();

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["/api/plans"],
    queryFn: fetchPlans,
  });

  const { data: trialState } = useQuery({
    queryKey: ["/api/trial"],
    queryFn: fetchTrialState,
  });

  const deleteMutation = useMutation({
    mutationFn: deletePlan,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/plans"] }),
  });

  const canCreate = trialState ? canCreateFromTrial(trialState) : true;
  const waitMs = trialState ? msUntilNextFreePlan(trialState) : 0;
  const unlocked = trialState?.unlocked ?? false;

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (confirm("Delete this plan?")) deleteMutation.mutate(id);
  }

  function handleNew() {
    if (!canCreate && !unlocked) { setShowUnlock(true); return; }
    navigate("/new");
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <header className="sticky top-0 z-20 border-b" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg aria-label="SMEAC Planner" viewBox="0 0 32 32" width="28" height="28" fill="none">
              <rect width="32" height="32" rx="6" fill="#0D2B45"/>
              <text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle" fill="#C9A84C" fontFamily="Georgia,serif" fontWeight="bold" fontSize="14">S</text>
            </svg>
            <div>
              <div className="font-bold text-sm leading-tight" style={{ color: "var(--color-text)" }}>SMEAC Planner</div>
              <div className="text-xs leading-tight" style={{ color: "var(--color-text-muted)" }}>Meeting Planning Tool</div>
            </div>
          </div>
          {unlocked ? (
            <Badge variant="secondary" className="gap-1 text-xs"><Star size={11} className="text-yellow-500" /> Pro — Unlimited</Badge>
          ) : (
            <button onClick={() => setShowUnlock(true)}
              className="text-xs px-3 py-1.5 rounded-full border font-medium"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
              Unlock for $10
            </button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-bold mb-1" style={{ fontSize: "var(--text-xl)", color: "var(--color-text)" }}>Your Meeting Plans</h1>
              <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
                {unlocked ? "Unlimited plans. Your session data is secure." : "1 free plan every 2 weeks. Unlock unlimited for $10."}
              </p>
            </div>
            <Button onClick={handleNew} data-testid="button-new-plan" className="shrink-0 gap-1.5">
              {canCreate || unlocked ? <Plus size={16} /> : <Lock size={14} />} New Plan
            </Button>
          </div>

          {!unlocked && !canCreate && waitMs > 0 && (
            <div className="mt-4 rounded-xl p-4 flex items-center justify-between gap-4"
              style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <div>
                <p className="font-medium text-sm" style={{ color: "var(--color-text)" }}>Next free plan available in</p>
                <p className="font-bold" style={{ fontSize: "var(--text-lg)", color: "var(--color-primary)" }}>{formatCountdown(waitMs)}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowUnlock(true)} className="shrink-0">Unlock Now — $10</Button>
            </div>
          )}
        </div>

        {plansLoading ? (
          <div className="space-y-3">
            {[1,2].map(i => <div key={i} className="rounded-xl h-16 animate-pulse" style={{ background: "var(--color-surface)" }} />)}
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <FileText size={28} style={{ color: "var(--color-text-muted)" }} />
            </div>
            <h2 className="font-semibold mb-2" style={{ color: "var(--color-text)" }}>No plans yet</h2>
            <p className="mb-6 text-sm" style={{ color: "var(--color-text-muted)" }}>Create your first SMEAC meeting plan in under 2 minutes.</p>
            <Button onClick={handleNew} className="gap-1.5"><Plus size={15} /> Create Your First Plan</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {plans.map((plan: SmeacPlan) => (
              <div key={plan.id} data-testid={`card-plan-${plan.id}`}
                onClick={() => navigate(`/summary/${plan.id}`)}
                className="rounded-xl p-4 cursor-pointer hover-elevate"
                style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center font-bold text-sm"
                      style={{ background: "#0D2B45", color: "#C9A84C" }}>S</div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate text-sm" style={{ color: "var(--color-text)" }}>
                        {plan.meetingTitle || "Untitled Plan"}
                      </div>
                      <div className="text-xs mt-0.5 flex items-center gap-2" style={{ color: "var(--color-text-muted)" }}>
                        <span>{formatDate(plan.createdAt)}</span>
                        {plan.dateTime && <span>· {plan.dateTime}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button data-testid={`button-delete-${plan.id}`} onClick={(e) => handleDelete(plan.id, e)}
                      className="p-1.5 rounded-md" style={{ color: "var(--color-text-muted)" }}>
                      <Trash2 size={14} />
                    </button>
                    <ChevronRight size={16} style={{ color: "var(--color-text-muted)" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="max-w-2xl mx-auto px-4 py-8 mt-8 border-t text-center" style={{ borderColor: "var(--color-border)" }}>
        <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
          Based on the SMEAC framework from{" "}
          <a href="https://www.amazon.com/dp/B0GSM4CGDJ" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>
            Masterclass for Meetings
          </a>{" "}by Christopher J. Riner
        </p>
        <PerplexityAttribution />
      </footer>

      <UnlockModal open={showUnlock} onClose={() => setShowUnlock(false)}
        onUnlocked={() => { qc.invalidateQueries({ queryKey: ["/api/trial"] }); setShowUnlock(false); }} />
    </div>
  );
}
