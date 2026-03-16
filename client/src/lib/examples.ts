// Real examples drawn from the Masterclass for Meetings book
// These appear when the user clicks "See Example" on each wizard step

export const EXAMPLES = {
  situation: {
    meetingTitle: "Q2 Product Launch Kickoff",
    dateTime: "April 7, 2026 · 10:00 AM",
    location: "Conference Room B / Zoom link in invite",
    currentState:
      "The product is 80% built but the launch date is 6 weeks away and the team has no shared understanding of who owns what. Three people think they are in charge of the marketing rollout. There is no written timeline. Two stakeholders have conflicting priorities and both have authority to block the launch.",
    keyChallenge:
      "We need everyone aligned on ownership, timeline, and priorities before the end of this meeting — or the launch will slip.",
  },
  mission:
    "The purpose of this meeting is to assign clear ownership of all launch deliverables and agree on a go/no-go decision date in order to prevent a delayed launch caused by unclear accountability.",
  execution: [
    { action: "Finalize the go-live date and communicate it to all stakeholders", owner: "Sarah Chen (PM)", dueDate: "April 8" },
    { action: "Create a shared launch checklist in Asana with owners for each item", owner: "Marcus Webb (Ops)", dueDate: "April 9" },
    { action: "Resolve the conflict between Marketing and Engineering on feature scope", owner: "Director of Product", dueDate: "April 7 — end of day" },
  ],
  adminItems: ["PowerPoint / slides", "Agenda email", "Conference room", "Pre-read material"],
  adminNotes:
    "Send the agenda 24 hours in advance. Include a one-page situation brief so attendees arrive prepared. Reserve the projector. Have a printed copy of the current timeline for reference.",
  command: {
    leadName: "Sarah Chen",
    leadEmail: "s.chen@company.com",
    leadPhone: "571-555-0182",
    actionItems: [
      { item: "Send launch timeline to all stakeholders", owner: "Sarah Chen", due: "April 8" },
      { item: "Update Asana board with assigned owners", owner: "Marcus Webb", due: "April 9" },
      { item: "Schedule follow-up check-in for April 14", owner: "Sarah Chen", due: "April 8" },
    ],
  },
};
