export const BUILTIN_TEMPLATES = [
  {
    id: "mad-sad-glad",
    name: "Mad | Sad | Glad",
    description: "Great as a team health-check and teammates well-being.",
    emoji: "😤",
    columns: [
      { name: "Mad", description: "What made you frustrated or angry?", color: "#ef4444" },
      { name: "Sad", description: "What disappointed you?", color: "#3b82f6" },
      { name: "Glad", description: "What made you happy?", color: "#22c55e" },
    ],
  },
  {
    id: "liked-learned-lacked",
    name: "Liked | Learned | Lacked",
    description: "Helps you summarize projects the team just finished.",
    emoji: "📊",
    columns: [
      { name: "Liked", description: "What went well?", color: "#22c55e" },
      { name: "Learned", description: "What did you learn?", color: "#3b82f6" },
      { name: "Lacked", description: "What was missing?", color: "#f97316" },
    ],
  },
  {
    id: "start-stop-continue",
    name: "Start | Stop | Continue",
    description: "Directs the team toward specific actions.",
    emoji: "🚦",
    columns: [
      { name: "Start", description: "What should we begin doing?", color: "#22c55e" },
      { name: "Stop", description: "What should we stop doing?", color: "#ef4444" },
      { name: "Continue", description: "What is working well?", color: "#3b82f6" },
    ],
  },
  {
    id: "blank",
    name: "Blank slate",
    description: "Start from scratch and build your own columns.",
    emoji: "✨",
    columns: [
      { name: "Column 1", description: "", color: "#facc15" },
      { name: "Column 2", description: "", color: "#22c55e" },
      { name: "Column 3", description: "", color: "#3b82f6" },
    ],
  },
] as const;

export type TemplateDef = (typeof BUILTIN_TEMPLATES)[number];
