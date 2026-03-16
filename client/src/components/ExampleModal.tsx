import { X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

type ExampleField = {
  label: string;
  value: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  stepLetter: string;
  stepLabel: string;
  stepColor: string;
  fields: ExampleField[];
  onUseExample?: () => void;
};

export default function ExampleModal({ open, onClose, stepLetter, stepLabel, stepColor, fields, onUseExample }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "var(--color-surface)", maxHeight: "85vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
              style={{ background: stepColor, color: "#C9A84C" }}
            >
              {stepLetter}
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: "var(--color-text)" }}>{stepLabel} — Example</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>From Masterclass for Meetings</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "var(--color-text-muted)" }}>
            <X size={18} />
          </button>
        </div>

        {/* Book callout */}
        <div className="mx-5 mt-4 rounded-xl px-4 py-3 flex items-start gap-3" style={{ background: "#0D2B45" }}>
          <BookOpen size={16} className="mt-0.5 shrink-0" style={{ color: "#C9A84C" }} />
          <p className="text-xs leading-relaxed" style={{ color: "#C9A84C" }}>
            This example is based on a real-world scenario used in{" "}
            <em>Masterclass for Meetings</em> to demonstrate how SMEAC works in a corporate setting.
          </p>
        </div>

        {/* Fields */}
        <div className="px-5 py-4 space-y-4">
          {fields.map((f, i) => (
            <div key={i}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>
                {f.label}
              </p>
              <div
                className="rounded-xl px-4 py-3 text-sm leading-relaxed"
                style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
              >
                {f.value}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-3">
          {onUseExample && (
            <Button onClick={() => { onUseExample(); onClose(); }} className="flex-1" data-testid="button-use-example">
              Use This Example
            </Button>
          )}
          <Button variant="outline" onClick={onClose} className={onUseExample ? "" : "flex-1"} data-testid="button-close-example">
            Got It
          </Button>
        </div>
      </div>
    </div>
  );
}
