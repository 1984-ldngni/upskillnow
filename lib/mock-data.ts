export type Tool = {
  slug: string;
  name: string;
  category: string;
  subcategory: string;
  description: string;
  websiteUrl: string;
  targetIndustry: string;
  difficultyLevel: "Beginner" | "Intermediate" | "Advanced" | "All Levels";
  pricingTier: string;
  marketSegment: string;
};

export const tools: Tool[] = [
  {
    slug: "chatgpt",
    name: "ChatGPT (GPT-4o)",
    category: "Core AI Reasoning",
    subcategory: "General Reasoning",
    description: "Multi-modal reasoning, general writing, drafting, and coding assistant.",
    websiteUrl: "https://chatgpt.com",
    targetIndustry: "General / All",
    difficultyLevel: "All Levels",
    pricingTier: "Freemium",
    marketSegment: "Consumer / Enterprise",
  },
  {
    slug: "claude",
    name: "Claude (3.5 Sonnet)",
    category: "Core AI Reasoning",
    subcategory: "General Reasoning",
    description: "Complex reasoning, long-document analysis, and coding.",
    websiteUrl: "https://claude.ai",
    targetIndustry: "Legal / Tech / General",
    difficultyLevel: "All Levels",
    pricingTier: "Freemium",
    marketSegment: "Pro / Enterprise",
  },
  {
    slug: "motion",
    name: "Motion",
    category: "Executive Support",
    subcategory: "Calendar Automation",
    description: "AI calendar auto-scheduling and daily task prioritization.",
    websiteUrl: "https://usemotion.com",
    targetIndustry: "Executive Support",
    difficultyLevel: "Beginner",
    pricingTier: "Paid",
    marketSegment: "SMB / Individual",
  },
  {
    slug: "zapier",
    name: "Zapier",
    category: "Workflow Automation",
    subcategory: "No-Code Automation",
    description: "Natural language trigger-action workflow building across thousands of apps.",
    websiteUrl: "https://zapier.com",
    targetIndustry: "SMB / Cross-Industry",
    difficultyLevel: "Beginner",
    pricingTier: "Freemium",
    marketSegment: "SMB / Consumer",
  },
  {
    slug: "uipath",
    name: "UiPath",
    category: "Enterprise RPA",
    subcategory: "Robotic Process Automation",
    description: "Market-leading enterprise RPA and agentic orchestration.",
    websiteUrl: "https://uipath.com",
    targetIndustry: "Banking / Health / Manufacturing",
    difficultyLevel: "Advanced",
    pricingTier: "Enterprise",
    marketSegment: "Enterprise",
  },
  {
    slug: "elevenlabs",
    name: "ElevenLabs",
    category: "Voice AI",
    subcategory: "Text-to-Speech",
    description: "Ultra-realistic voice cloning, text-to-speech, and audio lessons.",
    websiteUrl: "https://elevenlabs.io",
    targetIndustry: "E-Learning / Media",
    difficultyLevel: "Intermediate",
    pricingTier: "Freemium",
    marketSegment: "Creator / Developer",
  },
];

export type Course = {
  slug: string;
  title: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  description: string;
  lessons: { title: string; duration: string }[];
};

export const courses: Course[] = [
  {
    slug: "ai-fundamentals-for-vas",
    title: "AI Fundamentals for Virtual Assistants",
    level: "Beginner",
    description: "Get comfortable with the core AI tools every VA should know.",
    lessons: [
      { title: "What AI tools actually do for your clients", duration: "3 min" },
      { title: "Choosing the right tool for the task", duration: "4 min" },
      { title: "Your first automated workflow", duration: "5 min" },
    ],
  },
  {
    slug: "workflow-automation-with-zapier",
    title: "Workflow Automation with Zapier & Make",
    level: "Intermediate",
    description: "Build multi-step automations that save clients hours every week.",
    lessons: [
      { title: "Triggers, actions, and Zaps", duration: "4 min" },
      { title: "Multi-branch logic in Make", duration: "6 min" },
      { title: "Debugging broken automations", duration: "5 min" },
    ],
  },
];

export const quizzes: Record<string, { question: string; options: string[]; answerIndex: number }[]> = {
  "ai-fundamentals-for-vas": [
    {
      question: "Which tool is best suited for connecting apps without code?",
      options: ["UiPath", "Zapier", "Claude", "ElevenLabs"],
      answerIndex: 1,
    },
    {
      question: "What is ElevenLabs primarily used for?",
      options: ["Spreadsheet automation", "Text-to-speech / voice AI", "CRM data enrichment", "Video editing"],
      answerIndex: 1,
    },
  ],
};

export const mockUsers = [
  { id: "u1", name: "Jamie Rivera", email: "jamie@example.com", plan: "Pro" },
  { id: "u2", name: "Sam Okafor", email: "sam@example.com", plan: "Free" },
  { id: "u3", name: "Priya Nair", email: "priya@example.com", plan: "Team" },
];
