import type { SmeacPlan } from "@shared/schema";

// Client-side PDF generation using jsPDF (loaded via CDN)
// We generate the PDF entirely in the browser — no server needed.

declare const window: Window & {
  jspdf: { jsPDF: any };
};

export async function exportPlanAsPDF(plan: SmeacPlan): Promise<void> {
  // Dynamically load jsPDF from CDN if not already loaded
  if (!(window as any).jspdf) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load jsPDF"));
      document.head.appendChild(script);
    });
  }

  const { jsPDF } = (window as any).jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });

  const NAVY = [13, 43, 69];
  const GOLD = [201, 168, 76];
  const LIGHT = [247, 246, 242];
  const DARK = [40, 37, 29];
  const MUTED = [122, 121, 116];
  const WHITE = [255, 255, 255];
  const pageW = 215.9;
  const pageH = 279.4;
  const margin = 14;
  const contentW = pageW - margin * 2;

  let y = 0;

  // --- Header banner ---
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageW, 22, "F");
  doc.setFillColor(...GOLD);
  doc.rect(0, 22, pageW, 1.5, "F");

  doc.setTextColor(...WHITE);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("SMEAC Meeting Plan", margin, 10);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GOLD);
  doc.text("Masterclass for Meetings  |  Christopher J. Riner", margin, 17);

  y = 28;

  // --- Meeting info row ---
  doc.setFillColor(235, 238, 242);
  doc.rect(margin, y, contentW, 14, "F");

  doc.setTextColor(...MUTED);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.text("MEETING / TOPIC", margin + 2, y + 4);
  doc.text("DATE & TIME", margin + contentW * 0.45, y + 4);
  doc.text("LOCATION / LINK", margin + contentW * 0.7, y + 4);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK);
  doc.setFontSize(9);
  doc.text(plan.meetingTitle || "—", margin + 2, y + 10, { maxWidth: contentW * 0.42 });
  doc.text(plan.dateTime || "—", margin + contentW * 0.45, y + 10, { maxWidth: contentW * 0.22 });
  doc.text(plan.location || "—", margin + contentW * 0.7, y + 10, { maxWidth: contentW * 0.27 });

  y += 18;

  const sectionColors: [number, number, number][] = [
    [13, 43, 69],
    [26, 74, 110],
    [180, 140, 50],
    [26, 74, 110],
    [13, 43, 69],
  ];

  const sections = [
    {
      letter: "S",
      title: "SITUATION",
      desc: "What is actually happening right now?",
      body: [
        { label: "Current State", value: plan.currentState },
        { label: "Key Challenge", value: plan.keyChallenge },
      ],
    },
    {
      letter: "M",
      title: "MISSION",
      desc: "Purpose & desired outcome",
      body: [{ label: "Mission Statement", value: plan.missionStatement }],
    },
    {
      letter: "E",
      title: "EXECUTION",
      desc: "Step-by-step plan with owners",
      body: plan.steps
        .filter((s) => s.action)
        .map((s, i) => ({
          label: `Step ${i + 1}`,
          value: [s.action, s.owner && `Owner: ${s.owner}`, s.dueDate && `Due: ${s.dueDate}`]
            .filter(Boolean)
            .join("  ·  "),
        })),
    },
    {
      letter: "A",
      title: "ADMINISTRATION",
      desc: "Logistics & resources needed",
      body: [
        {
          label: "Checklist",
          value: plan.adminItems.length ? plan.adminItems.join(", ") : "—",
        },
      ],
    },
    {
      letter: "C",
      title: "COMMAND & CONTROL",
      desc: "Who is in charge — accountability chain",
      body: [
        {
          label: "Meeting Lead",
          value: [plan.leadName, plan.leadEmail, plan.leadPhone].filter(Boolean).join("  ·  ") || "—",
        },
        ...plan.actionItems
          .filter((a) => a.item)
          .map((a, i) => ({
            label: `Action ${i + 1}`,
            value: [a.item, a.owner && `Owner: ${a.owner}`, a.due && `Due: ${a.due}`]
              .filter(Boolean)
              .join("  ·  "),
          })),
      ],
    },
  ];

  for (let si = 0; si < sections.length; si++) {
    const sec = sections[si];
    const color = sectionColors[si];
    const badgeW = 12;
    const bodyLines = sec.body.map((b) =>
      doc.splitTextToSize(`${b.label}: ${b.value || "—"}`, contentW - badgeW - 6)
    );
    const totalLines = bodyLines.reduce((a, b) => a + b.length, 0);
    // Add extra blank space in the Execution section for handwritten notes
    const extraSpace = sec.letter === "E" ? 40 : 0;
    const sectionH = 8 + totalLines * 4.5 + 4 + extraSpace;

    // Check page break
    if (y + sectionH > pageH - 20) {
      doc.addPage();
      y = 14;
    }

    // Background
    doc.setFillColor(...LIGHT);
    doc.roundedRect(margin, y, contentW, sectionH, 2, 2, "F");

    // Letter badge
    doc.setFillColor(...color);
    doc.rect(margin, y, badgeW, sectionH, "F");
    doc.roundedRect(margin, y, badgeW, sectionH, 2, 2, "F");
    // Square right edge of badge
    doc.rect(margin + badgeW - 2, y, 2, sectionH, "F");

    doc.setTextColor(...WHITE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(sec.letter, margin + badgeW / 2, y + sectionH / 2 + 2, { align: "center" });

    // Title
    const cx = margin + badgeW + 3;
    doc.setTextColor(...DARK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(sec.title, cx, y + 5);

    // Desc
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(sec.desc, cx, y + 9);

    // Body fields
    let fieldY = y + 13;
    for (let fi = 0; fi < sec.body.length; fi++) {
      const lines = bodyLines[fi];
      doc.setFillColor(255, 255, 255);
      const fh = lines.length * 4.5 + 3;
      doc.roundedRect(cx, fieldY, contentW - badgeW - 4, fh, 1, 1, "F");
      doc.setTextColor(...MUTED);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(lines, cx + 2, fieldY + 3.5);
      fieldY += fh + 1.5;
    }

    // Draw faint ruled lines in the Execution section's extra space for note-taking
    if (sec.letter === "E" && extraSpace > 0) {
      const cx = margin + badgeW + 3;
      const lineStartY = fieldY + 2;
      const lineSpacing = 6;
      const numLines = Math.floor((y + sectionH - lineStartY - 4) / lineSpacing);
      doc.setDrawColor(210, 210, 210);
      doc.setLineWidth(0.2);
      for (let li = 0; li < numLines; li++) {
        const lineY = lineStartY + li * lineSpacing;
        if (lineY < y + sectionH - 3) {
          doc.line(cx, lineY, margin + contentW - 2, lineY);
        }
      }
    }

    y += sectionH + 3;
  }

  // --- Footer ---
  doc.setFillColor(...NAVY);
  doc.rect(0, pageH - 12, pageW, 12, "F");
  doc.setTextColor(...GOLD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("Masterclass for Meetings  |  Christopher J. Riner", margin, pageH - 5);
  doc.setTextColor(180, 190, 200);
  doc.setFont("helvetica", "normal");
  doc.text('"Did I value your time?" — Ask this at the end of every meeting.', pageW / 2, pageH - 5, {
    align: "center",
  });

  doc.save(`SMEAC_${plan.meetingTitle || "Plan"}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
