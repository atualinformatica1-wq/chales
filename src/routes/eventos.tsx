import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { eventsQuery, formatEventDateTime } from "@/lib/events";

export const Route = createFileRoute("/eventos")({
  head: () => ({
    meta: [
      { title: "Eventos | Chalés Vale das Araucárias" },
      { name: "description", content: "Confira os próximos eventos nos Chalés Vale das Araucárias." },
      { property: "og:title", content: "Eventos | Chalés Vale das Araucárias" },
      { property: "og:description", content: "Datas, fotos e vídeos dos nossos eventos na serra." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const { data: events = [], isLoading } = useQuery(eventsQuery);
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">Eventos</h1>
        <p className="mt-2 text-muted-foreground">Programe sua estadia junto com nossos eventos.</p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {isLoading ? <p className="text-muted-foreground">Carregando...</p> : null}
          {!isLoading && events.length === 0 ? <p className="text-muted-foreground">Nenhum evento programado no momento.</p> : null}
          {events.map((ev) => (
            <article key={ev.id} className="surface-card overflow-hidden">
              <div className="space-y-3 p-5">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-accent">
                  <CalendarDays className="size-4 shrink-0" />
                  <span>
                    Início: {formatEventDateTime(ev.start_date, ev.start_time)}
                    {ev.end_date ? ` · Fim: ${formatEventDateTime(ev.end_date, ev.end_time)}` : ""}
                  </span>
                </p>
                <h2 className="font-display text-2xl font-semibold">{ev.title}</h2>
                {ev.description ? <p className="whitespace-pre-wrap text-sm text-muted-foreground">{ev.description}</p> : null}
              </div>
              <div className="space-y-2">
                {ev.bannerUrl ? <img src={ev.bannerUrl} alt={ev.title} loading="lazy" className="h-56 w-full object-cover" /> : null}
                {ev.videoUrl ? <video src={ev.videoUrl} controls preload="metadata" className="w-full bg-muted" /> : null}
              </div>
            </article>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
