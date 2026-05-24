export const projects = [
  { title: "Sales Roleplay", open: true },
  { title: "Inference QA", open: false },
  { title: "Provider Benchmarks", open: false }
];

export const conversations = [
  { title: "Enterprise discovery practice", group: "Today", active: true },
  { title: "Pricing objection handling", group: "Today", active: true },
  { title: "Follow-up email coaching", group: "Yesterday", active: true },
  { title: "Gemini latency comparison", group: "Previous 7 days", active: true },
  { title: "Token usage review", group: "Previous 7 days", active: true }
];

export const groupedChats = ["Today", "Yesterday", "Previous 7 days"].map((group) => ({
  group,
  items: conversations.filter((chat) => chat.group === group && chat.active)
}));

export const suggestions = [
  "Practice an SDR discovery call",
  "Compare provider latency",
  "Review inference errors",
  "Draft coaching scorecard"
];
