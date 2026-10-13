import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { chaletsQuery } from "@/lib/site";

export const Route = createFileRoute("/avaliacoes")({
  head: () => ({ meta: [
    { title: "Avaliações dos hóspedes | Chalés Vale das Araucárias" },
    { name: "description", content: "Leia as avaliações dos hóspedes e conte como foi sua estadia nos chalés." },
    { property: "og:title", content: "Avaliações dos hóspedes | Chalés Vale das Araucárias" },
    { property: "og:description", content: "Conheça as opiniões dos hóspedes e compartilhe sua experiência." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ReviewsPage,
});

function ReviewsPage() {
  const qc = useQueryClient();
  const { data: chalets = [] } = useQuery(chaletsQuery);
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews", "approved"],
    queryFn: async () => {
      const { data, error } = await supabase.from("chalet_reviews").select("id, chalet_id, guest_name, rating, comment, created_at").eq("status", "aprovado").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const [name, setName] = useState("");
  const [chaletId, setChaletId] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!rating || !chaletId) { toast.error("Escolha um chalé e uma nota."); return; }
    setSending(true);
    const { error } = await supabase.from("chalet_reviews").insert({ chalet_id: chaletId, guest_name: name.trim(), rating, comment: comment.trim(), status: "pendente" });
    setSending(false);
    if (error) { toast.error("Não foi possível enviar sua avaliação. Tente novamente."); return; }
    toast.success("Avaliação enviada! Ela aparecerá após aprovação.");
    setName(""); setChaletId(""); setRating(0); setComment("");
    qc.invalidateQueries({ queryKey: ["reviews"] });
  }

  return <div className="min-h-screen bg-background">
    <SiteHeader />
    <main className="mx-auto max-w-5xl px-4 py-12 sm:py-20">
      <p className="text-sm font-semibold uppercase text-accent">Experiências</p>
      <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Avaliações</h1>
      <div className="mt-10 grid gap-12 border-t border-border pt-8 lg:grid-cols-[1fr_1fr]">
        <section>
          <h2 className="font-display text-2xl font-semibold">O que dizem nossos hóspedes</h2>
          {isLoading ? <p className="mt-6 text-muted-foreground">Carregando avaliações...</p> : reviews.length === 0 ? <p className="mt-6 text-muted-foreground">Ainda não há avaliações publicadas.</p> : <div className="mt-6 space-y-6">
            {reviews.map((review) => <article key={review.id} className="border-b border-border pb-6">
              <div className="flex items-center gap-1 text-accent" aria-label={`${review.rating} de 5 estrelas`}>
                {Array.from({ length: 5 }, (_, i) => <Star key={i} className={`size-4 ${i < review.rating ? "fill-current" : "text-muted-foreground"}`} />)}
              </div>
              <p className="mt-3 whitespace-pre-wrap leading-relaxed">{review.comment}</p>
              <p className="mt-3 text-sm font-semibold">{review.guest_name} <span className="font-normal text-muted-foreground">· {chalets.find(c => c.id === review.chalet_id)?.name ?? "Chalé"}</span></p>
            </article>)}
          </div>}
        </section>
        <section>
          <h2 className="font-display text-2xl font-semibold">Conte sua experiência</h2>
          <form onSubmit={submit} className="mt-6 space-y-5">
            <div className="space-y-2"><Label htmlFor="review-name">Seu nome</Label><Input id="review-name" required minLength={2} maxLength={80} value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="review-chalet">Chalé</Label><select id="review-chalet" required value={chaletId} onChange={e => setChaletId(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"><option value="">Selecione um chalé</option>{chalets.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <fieldset className="space-y-2"><legend className="text-sm font-medium">Sua nota</legend><div className="flex gap-1">{Array.from({ length: 5 }, (_, i) => <Button key={i} type="button" variant="ghost" size="icon" aria-label={`${i + 1} estrela${i ? "s" : ""}`} aria-pressed={rating === i + 1} onClick={() => setRating(i + 1)}><Star className={`size-5 ${i < rating ? "fill-current text-accent" : "text-muted-foreground"}`} /></Button>)}</div></fieldset>
            <div className="space-y-2"><Label htmlFor="review-comment">Sua avaliação</Label><Textarea id="review-comment" required minLength={10} maxLength={1000} rows={5} value={comment} onChange={e => setComment(e.target.value)} /></div>
            <p className="text-sm text-muted-foreground">Sua avaliação será publicada após aprovação.</p>
            <Button type="submit" disabled={sending || !rating || !chaletId}>{sending ? "Enviando..." : "Enviar avaliação"}</Button>
          </form>
        </section>
      </div>
    </main>
    <SiteFooter />
  </div>;
}