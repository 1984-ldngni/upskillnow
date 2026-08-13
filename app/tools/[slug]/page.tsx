import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getToolBySlug } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ToolDetailPage({ params }: { params: { slug: string } }) {
  const tool = await getToolBySlug(params.slug);
  if (!tool) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{tool.category}</Badge>
          <Badge variant="outline">{tool.subcategory}</Badge>
        </div>
        <h1 className="mt-4 font-heading text-3xl font-black">{tool.name}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{tool.description}</p>

        <div className="mt-6 grid grid-cols-2 gap-4 rounded-md border-2 border-black bg-card p-4 text-sm shadow-brutal sm:grid-cols-4">
          <div>
            <p className="text-muted-foreground">Industry</p>
            <p className="font-medium">{tool.targetIndustry}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Level</p>
            <p className="font-medium">{tool.difficultyLevel}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Pricing</p>
            <p className="font-medium">{tool.pricingTier}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Segment</p>
            <p className="font-medium">{tool.marketSegment}</p>
          </div>
        </div>

        <a href={tool.websiteUrl} target="_blank" rel="noreferrer">
          <Button className="mt-8">Visit {tool.name}</Button>
        </a>
      </main>
      <SiteFooter />
    </div>
  );
}
