import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, MessageCircle, Users } from "lucide-react";

import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { BookingDialog } from "@/components/site/BookingDialog";
import { Button } from "@/components/ui/button";
import { chaletsQuery, companyQuery, formatBRL, rentedQuery, whatsappLink } from "@/lib/site";
import { AvailabilityCalendar } from "@/components/site/AvailabilityCalendar";
import { RentedBadge } from "@/components/site/RentedBadge";

export const Route = createFileRoute("/chale/$id")({
  head: () => ({
    meta: [
      { title: "Detalhes do chalé | Chalés Vale das Araucárias" },
      {
        name: "description",
        content: "Veja fotos, valores e faça a reserva online deste chalé na serra.",
      },
      { property: "og:title", content: "Detalhes do chalé" },
      {
        property: "og:description",
        content: "Fotos, valores e reserva online do chalé na serra.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChaletPage,
  errorComponent: () => (
    <div className="p-10 text-center text-muted-foreground">Não foi possível carregar o chalé.</div>
  ),
  notFoundComponent: () => <div className="p-10 text-center">Chalé não encontrado.</div>,
});

function ChaletPage() {
  const { id } = Route.useParams();
  const { data: chalets = [] } = useQuery(chaletsQuery);
  const { data: company } = useQuery(companyQuery);
  const { data: rented = [] } = useQuery(rentedQuery);
  const [open, setOpen] = useState(false);

  const chalet = chalets.find((c) => c.id === id) ?? null;
  const isRented = chalet ? rented.includes(chalet.id) : false;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/">
            <ArrowLeft className="size-4" /> Voltar
          </Link>
        </Button>

        {!chalet ? (
          <p className="py-20 text-center text-muted-foreground">Carregando chalé...</p>
        ) : (
          <article className="space-y-6">
            <div className="relative overflow-hidden rounded-2xl">
              <img
                src={chalet.image_url}
                alt={chalet.name}
                width={1280}
                height={864}
                className="h-[45vh] min-h-72 w-full rounded-2xl object-cover shadow-[var(--shadow-lift)]"
              />
              {isRented ? <RentedBadge large /> : null}
            </div>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-4xl font-semibold">{chalet.name}</h1>
                <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="size-4" /> Até {chalet.capacity} pessoas
                </p>
              </div>
              <p className="font-display text-3xl font-semibold">
                {formatBRL(chalet.price)}
                <span className="text-base font-normal text-muted-foreground"> / diária</span>
              </p>
            </div>

            <p className="max-w-3xl leading-relaxed whitespace-pre-line text-foreground/90">
              {chalet.description}
            </p>

            <div className="flex flex-wrap gap-3">
              <Button size="lg" variant={isRented ? "outline" : "default"} onClick={() => setOpen(true)}>
                {isRented ? "Ver datas livres" : "Agendar reserva"}
              </Button>
              <Button
                asChild
                size="lg"
                className="bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90"
              >
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={whatsappLink(
                    chalet.whatsapp || company?.whatsapp || "",
                    `Olá! Tenho interesse no ${chalet.name}.`,
                  )}
                >
                  <MessageCircle className="size-4" /> Falar no WhatsApp
                </a>
              </Button>
            </div>
            <section className="space-y-3 pt-4">
              <h2 className="font-display text-2xl font-semibold">Disponibilidade</h2>
              <p className="text-sm text-muted-foreground">
                Datas riscadas em vermelho já estão ocupadas.
              </p>
              <AvailabilityCalendar chaletId={chalet.id} />
            </section>
          </article>
        )}
      </main>

      <BookingDialog chalet={chalet} company={company ?? null} open={open} onOpenChange={setOpen} />
      <SiteFooter />
    </div>
  );
}
