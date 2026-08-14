import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getToolBySlug, getCourseByToolSlug } from "@/lib/data";
import { difficultyVariant, pricingVariant } from "@/lib/badge-colors";
import { GraduationCap } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ToolDetailPage({ params }: { params: { slug: string } }) {
  const tool = await getToolBySlug(params.slug);
  if (!tool) notFound();
  const course = await getCourseByToolSlug(params.slug);

  return (
    <AppShell maxWidth="max-w-3xl">
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
            <Badge variant={difficultyVariant(tool.difficultyLevel)} className="mt-1">
              {tool.difficultyLevel}
            </Badge>
          </div>
          <div>
            <p className="text-muted-foreground">Pricing</p>
            <Badge variant={pricingVariant(tool.pricingTier)} className="mt-1">
              {tool.pricingTier}
            </Badge>
          </div>
          <div>
            <p className="text-muted-foreground">Segment</p>
            <p className="font-medium">{tool.marketSegment}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a href={tool.websiteUrl} target="_blank" rel="noreferrer">
            <Button>Visit {tool.name}</Button>
          </a>
          {course && (
            <Link href={`/courses/${course.slug}`}>
              <Button variant="outline">
                <GraduationCap className="mr-2 h-4 w-4" />
                Take the {tool.name} course
              </Button>
            </Link>
          )}
        </div>
    </AppShell>
  );
}
