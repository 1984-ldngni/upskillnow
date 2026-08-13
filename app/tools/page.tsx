import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTools } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ToolsPage() {
  const tools = await getTools();
  const categories = Array.from(new Set(tools.map((t) => t.category)));

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
        <h1 className="font-heading text-3xl font-black">AI & Automation Tool Directory</h1>
        <p className="mt-2 text-muted-foreground">
          Browse tools by category, industry, and difficulty level.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {categories.map((c) => (
            <Badge key={c} variant="outline">{c}</Badge>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t) => (
            <Link key={t.slug} href={`/tools/${t.slug}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{t.name}</CardTitle>
                    <Badge variant="outline">{t.difficultyLevel}</Badge>
                  </div>
                  <CardDescription>{t.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">{t.targetIndustry}</Badge>
                  <Badge variant="secondary">{t.pricingTier}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
