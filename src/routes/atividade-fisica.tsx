import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { activitiesQuery, activityScheduleLabel } from "@/lib/activities";

export const Route = createFileRoute("/atividade-fisica")({
  head: () => ({
    meta: [
      { title: "Atividade física | Chalés Vale das Araucárias" },
      { name: "description", content: "Atividades físicas nos Chalés Vale das Araucárias: dias, horários, fotos e vídeos." },
      { property: "og:title", content: "Atividade física | Chalés Vale das Araucárias" },
      { property: "og:description", content: "Confira os dias e horários das atividades físicas na serra." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ActivitiesPage,
});

function ActivitiesPage() {
  const { data: items = [], isLoading } = useQuery(activitiesQuery);
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">Atividade física</h1>
        <p className="mt-2 text-muted-foreground">Movimente-se durante sua estadia.</p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {isLoading ? <p className="text-muted-foreground">Carregando...</p> : null}
          {!isLoading && items.length === 0 ? <p className="text-muted-foreground">Nenhuma atividade programada no momento.</p> : null}
          {items.map((a) => (
            <article key={a.id} className="surface-card overflow-hidden">
              <div className="space-y-3 p-5">
                <p className="flex items-center gap-2 text-sm text-accent">
                  <CalendarDays className="size-4 shrink-0" />
                  <span>{activityScheduleLabel(a)}</span>
                </p>
                <h2 className="font-display text-2xl font-semibold">{a.title}</h2>
                {a.description ? <p className="whitespace-pre-wrap text-sm text-muted-foreground">{a.description}</p> : null}
              </div>
              <div className="space-y-2">
                {a.bannerUrl ? <img src={a.bannerUrl} alt={a.title} loading="lazy" className="h-56 w-full object-cover" /> : null}
                {a.videoUrl ? <video src={a.videoUrl} controls preload="metadata" className="w-full bg-muted" /> : null}
              </div>
            </article>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
