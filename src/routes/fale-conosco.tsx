import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import { companyQuery, whatsappLink } from "@/lib/site";

export const Route = createFileRoute("/fale-conosco")({
  head: () => ({ meta: [
    { title: "Fale conosco | Chalés Vale das Araucárias" },
    { name: "description", content: "Entre em contato com os Chalés Vale das Araucárias por WhatsApp, telefone ou e-mail." },
    { property: "og:title", content: "Fale conosco | Chalés Vale das Araucárias" },
    { property: "og:description", content: "Tire suas dúvidas e converse com nossa equipe sobre os chalés." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ContactPage,
});

function ContactPage() {
  const { data: company, isLoading } = useQuery(companyQuery);
  return <div className="min-h-screen bg-background">
    <SiteHeader />
    <main className="mx-auto max-w-5xl px-4 py-12 sm:py-20">
      <p className="text-sm font-semibold uppercase text-accent">Contato</p>
      <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Fale conosco</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Estamos à disposição para conversar sobre sua estadia.</p>
      {isLoading ? <p className="mt-12 text-muted-foreground">Carregando contatos...</p> : <div className="mt-12 grid gap-8 border-t border-border pt-8 sm:grid-cols-2">
        {company?.whatsapp && <div className="space-y-3">
          <MessageCircle className="size-6 text-primary" />
          <h2 className="font-display text-2xl font-semibold">WhatsApp</h2>
          <p className="text-muted-foreground">Converse diretamente com nossa equipe.</p>
          <Button asChild className="bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90"><a href={whatsappLink(company.whatsapp, "Olá! Gostaria de informações sobre os chalés.")} target="_blank" rel="noreferrer">Enviar mensagem</a></Button>
        </div>}
        {company?.phone && <div className="space-y-3">
          <Phone className="size-6 text-primary" />
          <h2 className="font-display text-2xl font-semibold">Telefone</h2>
          <Button asChild variant="link" className="h-auto justify-start p-0 text-base"><a href={`tel:${company.phone.replace(/\D/g, "")}`}>{company.phone}</a></Button>
        </div>}
        {company?.email && <div className="space-y-3">
          <Mail className="size-6 text-primary" />
          <h2 className="font-display text-2xl font-semibold">E-mail</h2>
          <Button asChild variant="link" className="h-auto max-w-full justify-start break-all whitespace-normal p-0 text-base"><a href={`mailto:${company.email}`}>{company.email}</a></Button>
        </div>}
        {company?.address && <div className="space-y-3">
          <MapPin className="size-6 text-primary" />
          <h2 className="font-display text-2xl font-semibold">Endereço</h2>
          <address className="text-muted-foreground not-italic">{company.address}</address>
        </div>}
      </div>}
    </main>
    <SiteFooter />
  </div>;
}