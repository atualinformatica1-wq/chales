import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MessageCircle, Users, CalendarDays, ShieldCheck, Clock } from "lucide-react";

import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { BookingDialog } from "@/components/site/BookingDialog";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { chaletsQuery, companyQuery, formatBRL, rentedQuery, whatsappLink, type Chalet } from "@/lib/site";
import { RentedBadge } from "@/components/site/RentedBadge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chalés Vale das Araucárias | Aluguel de chalés na serra" },
      {
        name: "description",
        content:
          "Alugue chalés na serra com reserva online, pagamento por Pix e atendimento direto pelo WhatsApp.",
      },
      { property: "og:title", content: "Chalés Vale das Araucárias" },
      {
        property: "og:description",
        content: "Chalés de montanha para alugar com reserva online e confirmação rápida.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: chalets = [], isLoading } = useQuery(chaletsQuery);
  const { data: company } = useQuery(companyQuery);
  const { data: rented = [] } = useQuery(rentedQuery);
  const [selected, setSelected] = useState<Chalet | null>(null);
  const [open, setOpen] = useState(false);

  function reserve(chalet: Chalet) {
    setSelected(chalet);
    setOpen(true);
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative">
        <Carousel opts={{ loop: true }} className="w-full">
          <CarouselContent>
            {(chalets.length ? chalets : [null]).map((chalet, i) => (
              <CarouselItem key={chalet?.id ?? i}>
                <div className="relative h-[70vh] min-h-[420px] w-full overflow-hidden">
                  {chalet ? (
                    <img
                      src={chalet.image_url}
                      alt={chalet.name}
                      width={1280}
                      height={864}
                      className="size-full object-cover"
                      {...(i === 0 ? {} : { loading: "lazy" as const })}
                    />
                  ) : (
                    <div className="size-full bg-secondary" />
                  )}
                  <div className="hero-overlay absolute inset-0" />
                  {chalet && rented.includes(chalet.id) ? <RentedBadge large /> : null}
                  <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-12">
                    <p className="text-sm tracking-widest text-primary-foreground/80 uppercase">
                      {company?.tagline ?? "Refúgios na montanha"}
                    </p>
                    <h1 className="mt-2 font-display text-4xl font-semibold text-primary-foreground sm:text-6xl">
                      {chalet?.name ?? company?.name ?? "Chalés para alugar"}
                    </h1>
                    {chalet ? (
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-background/90 px-4 py-2 font-display text-lg font-semibold">
                          {formatBRL(chalet.price)}
                          <span className="text-sm font-normal text-muted-foreground"> / diária</span>
                        </span>
                        <Button size="lg" onClick={() => reserve(chalet)}>
                          {rented.includes(chalet.id) ? "Ver datas livres" : "Reservar agora"}
                        </Button>
                        <Button asChild size="lg" variant="secondary">
                          <Link to="/chale/$id" params={{ id: chalet.id }}>
                            Ver detalhes
                          </Link>
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4" />
          <CarouselNext className="right-4" />
        </Carousel>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: CalendarDays, title: "Reserva online", text: "Escolha data e horário em poucos cliques." },
            { icon: Clock, title: "1 hora para pagar", text: "Sem pagamento, a reserva é liberada automaticamente." },
            { icon: ShieldCheck, title: "Confirmação segura", text: "Você recebe o aviso assim que o pagamento é confirmado." },
          ].map((item) => (
            <div key={item.title} className="surface-card flex gap-3 p-5">
              <item.icon className="size-5 shrink-0 text-accent" />
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="chales" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-8">
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">Chalés para alugar</h2>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Todos com roupa de cama, café da manhã e estacionamento incluídos.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="surface-card h-96 animate-pulse bg-muted" />
              ))
            : chalets.map((chalet) => (
                <article key={chalet.id} className="surface-card flex flex-col overflow-hidden">
                  <Link to="/chale/$id" params={{ id: chalet.id }} className="relative block overflow-hidden">
                    <img
                      src={chalet.image_url}
                      alt={chalet.name}
                      width={1280}
                      height={864}
                      loading="lazy"
                      className="h-52 w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    {rented.includes(chalet.id) ? <RentedBadge /> : null}
                  </Link>
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-xl font-semibold">{chalet.name}</h3>
                      <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
                        <Users className="size-3.5" /> {chalet.capacity}
                      </span>
                    </div>
                    <p className="line-clamp-3 text-sm text-muted-foreground">{chalet.description}</p>
                    <p className="font-display text-2xl font-semibold">
                      {formatBRL(chalet.price)}
                      <span className="text-sm font-normal text-muted-foreground"> / diária</span>
                    </p>
                    <div className="mt-auto flex flex-col gap-2 pt-2">
                      <Button
                        variant={rented.includes(chalet.id) ? "outline" : "default"}
                        onClick={() => reserve(chalet)}
                      >
                        {rented.includes(chalet.id) ? "Ver datas livres" : "Agendar reserva"}
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="border-whatsapp text-whatsapp hover:bg-whatsapp/10"
                      >
                        <a
                          target="_blank"
                          rel="noreferrer"
                          href={whatsappLink(
                            chalet.whatsapp || company?.whatsapp || "",
                            `Olá! Tenho interesse no ${chalet.name} (${formatBRL(chalet.price)} a diária).`,
                          )}
                        >
                          <MessageCircle className="size-4" /> Falar no WhatsApp
                        </a>
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
        </div>
      </section>

      <BookingDialog chalet={selected} company={company ?? null} open={open} onOpenChange={setOpen} />
      <SiteFooter />
    </div>
  );
}
