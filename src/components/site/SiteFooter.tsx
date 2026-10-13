import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { MapPin, Phone, Mail } from "lucide-react";
import { companyQuery } from "@/lib/site";

export function SiteFooter() {
  const { data: company } = useQuery(companyQuery);

  return (
    <footer id="contato" className="mt-20 border-t border-border bg-secondary/50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl font-semibold">{company?.name ?? "Nossos chalés"}</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">{company?.tagline}</p>
        </div>
        <div className="space-y-3 text-sm">
          {company?.address ? (
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{company.address}</span>
            </p>
          ) : null}
          {company?.phone ? (
            <p className="flex items-center gap-2">
              <Phone className="size-4 shrink-0 text-primary" />
              <a href={`tel:${company.phone.replace(/\D/g, "")}`}>{company.phone}</a>
            </p>
          ) : null}
          {company?.email ? (
            <p className="flex items-center gap-2">
              <Mail className="size-4 shrink-0 text-primary" />
              <a href={`mailto:${company.email}`}>{company.email}</a>
            </p>
          ) : null}
        </div>
      </div>
      <div className="border-t border-border/70 py-4 text-center text-xs text-muted-foreground">
        <div className="mb-3 flex justify-center gap-5 text-sm">
          <Link to="/fale-conosco" className="hover:text-foreground">Fale conosco</Link>
          <Link to="/avaliacoes" className="hover:text-foreground">Avaliações</Link>
        </div>
        <Link to="/admin" className="hover:text-foreground">
          Área administrativa
        </Link>
      </div>
    </footer>
  );
}
