// Course slugs used to end in "-for-vas" from when the platform was VA-only.
// Now that it's positioned for professionals at any career stage, every
// course slug had that suffix stripped (e.g. "chatgpt-for-vas" -> "chatgpt").
// These redirects keep any old bookmarks/links working instead of 404ing.
const OLD_COURSE_SLUGS = [
  "claude-code-for-vas",
  "motion-for-vas",
  "drift-for-vas",
  "ai-fundamentals-for-vas",
  "dalle-for-vas",
  "midjourney-for-vas",
  "tidio-for-vas",
  "synthesia-for-vas",
  "elevenlabs-for-vas",
  "cursor-for-vas",
  "windsurf-for-vas",
  "slack-for-vas",
  "chatgpt-for-vas",
  "claude-for-vas",
  "github-copilot-for-vas",
  "everlaw-for-vas",
  "relativity-for-vas",
  "pega-platform-for-vas",
  "automation-anywhere-for-vas",
  "blue-prism-for-vas",
  "uipath-for-vas",
  "gemini-for-vas",
  "workfusion-for-vas",
  "kissflow-for-vas",
  "microsoft-copilot-365-for-vas",
  "klara-for-vas",
  "luma-health-for-vas",
  "notebooklm-for-vas",
  "make-for-vas",
  "n8n-for-vas",
  "power-automate-for-vas",
  "zapier-for-vas",
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  images: { unoptimized: true },
  async redirects() {
    return OLD_COURSE_SLUGS.map((oldSlug) => ({
      source: `/courses/${oldSlug}/:path*`,
      destination: `/courses/${oldSlug.replace(/-for-vas$/, "")}/:path*`,
      permanent: true,
    }));
  },
};

export default nextConfig;
