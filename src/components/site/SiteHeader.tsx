import { Link } from "@tanstack/react-router";
import { Menu, Mountain } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { companyQuery, whatsappLink } from "@/lib/site";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { data: company } = useQuery(companyQuery);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Mountain className="size-5" />
          </span>
          <span className="font-display text-lg leading-tight font-semibold">
            {company?.name ?? "Chalés"}
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <a href="/#chales">Chalés</a>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/fale-conosco">Fale conosco</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/avaliacoes">Avaliações</Link>
          </Button>
          {company?.whatsapp ? (
            <Button
              asChild
              size="sm"
              className="bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90"
            >
              <a
                href={whatsappLink(company.whatsapp, "Olá! Gostaria de informações sobre os chalés.")}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
            </Button>
          ) : null}
          <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Abrir menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            <Menu className="size-5" />
          </Button>
        </nav>
      </div>
      {menuOpen && <nav className="flex flex-col border-t border-border bg-background px-4 py-2 sm:hidden" aria-label="Menu principal">
        <Button asChild variant="ghost" className="justify-start" onClick={() => setMenuOpen(false)}><Link to="/">Início</Link></Button>
        <Button asChild variant="ghost" className="justify-start" onClick={() => setMenuOpen(false)}><a href="/#chales">Chalés</a></Button>
        <Button asChild variant="ghost" className="justify-start" onClick={() => setMenuOpen(false)}><Link to="/fale-conosco">Fale conosco</Link></Button>
        <Button asChild variant="ghost" className="justify-start" onClick={() => setMenuOpen(false)}><Link to="/avaliacoes">Avaliações</Link></Button>
      </nav>}
    </header>
  );
}
