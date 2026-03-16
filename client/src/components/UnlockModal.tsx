import { useState } from "react";
import { unlockApp } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Star, Zap, Shield, Smartphone } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onUnlocked: () => void;
};

export default function UnlockModal({ open, onClose, onUnlocked }: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleUnlock() {
    if (!code.trim()) {
      setError("Please enter your unlock code.");
      return;
    }
    setLoading(true);
    setError("");
    const ok = await unlockApp(code.trim());
    setLoading(false);
    if (ok) {
      onUnlocked();
    } else {
      setError("Invalid code. Please check your purchase confirmation email.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "var(--color-surface)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Star size={18} className="text-yellow-500" />
              <span className="font-bold text-base" style={{ color: "var(--color-text)" }}>Unlock Unlimited Plans</span>
            </div>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>One-time payment. Yours forever.</p>
          </div>
          <button onClick={onClose} className="p-1" style={{ color: "var(--color-text-muted)" }}><X size={18} /></button>
        </div>

        {/* Price */}
        <div className="mx-5 rounded-2xl p-4 mb-4" style={{ background: "#0D2B45" }}>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-4xl font-bold text-white">$10</span>
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>one-time</span>
          </div>
          <div className="space-y-2">
            {[
              { icon: Zap, text: "Unlimited meeting plans" },
              { icon: Shield, text: "All data stays in your session" },
              { icon: Smartphone, text: "Works on phone, tablet, and computer" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
                <Icon size={14} style={{ color: "#C9A84C" }} />
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Payment button */}
        <div className="px-5 mb-4">
          <a
            href="https://buy.stripe.com/smeac-meetings"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center rounded-xl py-3 font-semibold text-white text-sm transition-opacity hover:opacity-90"
            style={{ background: "#0D2B45" }}
            data-testid="button-buy-now"
          >
            Pay $10 — Apple Pay / Google Pay / Card
          </a>
          <p className="text-xs text-center mt-2" style={{ color: "var(--color-text-muted)" }}>
            You'll receive an unlock code by email after payment.
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 px-5 mb-4">
          <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Already purchased?</span>
          <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
        </div>

        {/* Unlock code input */}
        <div className="px-5 pb-5 space-y-2">
          <Input
            placeholder="Enter your unlock code"
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(""); }}
            data-testid="input-unlock-code"
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <Button variant="outline" onClick={handleUnlock} disabled={loading} className="w-full" data-testid="button-submit-code">
            {loading ? "Verifying..." : "Unlock with Code"}
          </Button>
        </div>
      </div>
    </div>
  );
}
