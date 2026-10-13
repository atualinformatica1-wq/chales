
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LogOut, MessageCircle, Plus, Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  allChaletsQuery,
  companyQuery,
  formatBRL,
  formatDateBR,
  whatsappLink,
  type Chalet,
  type Company,
} from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel administrativo | Chalés" },
      { name: "description", content: "Gerencie reservas, chalés e dados da empresa." },
      { property: "og:title", content: "Painel administrativo" },
      { property: "og:description", content: "Gestão de reservas e chalés." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: access, isLoading } = useQuery({
    queryKey: ["admin-access"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.rpc("has_role", {
          _user_id: session.user.id,
          _role: "admin",
        });
        if (data) return { isAdmin: true };
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("role", "admin")
        .limit(1);
      return { isAdmin: (roles && roles.length > 0) };
    },
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-display text-lg font-semibold">Painel dos chalés</Link>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="size-4" /> Sair
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        {isLoading ? (
          <p className="text-muted-foreground">Verificando acesso...</p>
        ) : !access?.isAdmin ? (
          <p className="surface-card p-6">Esta conta não tem acesso de administrador.</p>
        ) : (
          <Tabs defaultValue="reservas">
            <TabsList>
              <TabsTrigger value="reservas">Reservas</TabsTrigger>
              <TabsTrigger value="chales">Chalés</TabsTrigger>
              <TabsTrigger value="empresa">Empresa</TabsTrigger>
              <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
            </TabsList>
            <TabsContent value="reservas"><BookingsTab /></TabsContent>
            <TabsContent value="chales"><ChaletsTab /></TabsContent>
            <TabsContent value="empresa"><CompanyTab /></TabsContent>
            <TabsContent value="avaliacoes"><ReviewsTab /></TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

const statusStyle: Record<string, string> = {
  pendente: "bg-warning/20 text-warning-foreground",
  confirmado: "bg-success/15 text-success",
  cancelado: "bg-destructive/10 text-destructive",
  finalizado: "bg-muted text-muted-foreground",
};

function BookingsTab() {
  const [filter, setFilter] = useState("todos");
  const { data = [], refetch } = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      await supabase.rpc("expire_pending_bookings");
      const { data, error } = await supabase
        .from("bookings")
        .select("*, chalets(name)")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 60000,
  });

  const rows = (data as any[]).filter((b) => filter === "todos" || b.status === filter);

  async function change(b: any, status: "confirmado" | "cancelado" | "pendente" | "finalizado") {
    try {
      const patch: any = { status };
      if (status === "confirmado") patch["confirmed_at"] = new Date().toISOString();
      if (status === "cancelado") patch["cancelled_at"] = new Date().toISOString();
      if (status === "pendente") {
        patch["expires_at"] = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        patch["cancelled_at"] = null;
      }
      const { error: updateError } = await supabase.from("bookings").update(patch).eq("id", b.id);
      if (updateError) throw updateError;
      toast.success(status === "finalizado" ? "Chalé liberado" : "Reserva atualizada");
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  function notify(b: any) {
    const base = `Olá ${b.customer_name}! Reserva ${b.payment_reference} - ${b.chalets?.name ?? ""} em ${formatDateBR(b.booking_date)} às ${String(b.booking_time).slice(0, 5)}.`;
    const msg =
      b.status === "confirmado"
        ? `${base} Pagamento recebido, sua reserva está CONFIRMADA. Até breve!`
        : b.status === "cancelado"
          ? `${base} Sua reserva foi cancelada por falta de pagamento no prazo de 1 hora. Se quiser, faça uma nova reserva.`
          : b.status === "finalizado"
            ? `${base} Obrigado pela estadia! Esperamos você novamente.`
            : `${base} Aguardamos o pagamento de ${formatBRL(Number(b.total_price))} para confirmar.`;
    return whatsappLink(b.customer_phone.replace(/\D/g, "").length <= 11 ? `55${b.customer_phone}` : b.customer_phone, msg);
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap gap-2">
        {["todos", "pendente", "confirmado", "finalizado", "cancelado"].map((s) => (
          <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} onClick={() => setFilter(s)} className="capitalize">
            {s}
          </Button>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="surface-card p-6 text-muted-foreground">Nenhuma reserva.</p>
      ) : (
        rows.map((b) => (
          <div key={b.id} className="surface-card flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{b.chalets?.name}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusStyle[b.status]}`}>{b.status}</span>
                <span className="text-xs text-muted-foreground">{b.payment_reference}</span>
              </div>
              <p>
                {formatDateBR(b.booking_date)} às {String(b.booking_time).slice(0, 5)} · {b.nights} diária(s) · {formatBRL(Number(b.total_price))}
              </p>
              <p className="text-muted-foreground">
                {b.customer_name} · {b.customer_phone} · {b.customer_email}
              </p>
              {b.status === "pendente" ? (
                <p className="text-xs text-muted-foreground">Expira às {new Date(b.expires_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
              ) : null}
              {b.notes ? <p className="text-xs italic text-muted-foreground">{b.notes}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {b.status === "pendente" && <Button size="sm" onClick={() => change(b, "confirmado")}>Confirmar pagamento</Button>}
              {b.status === "confirmado" && <Button size="sm" variant="secondary" onClick={() => change(b, "finalizado")}>Liberar chalé (após uso)</Button>}
              {(b.status === "pendente" || b.status === "confirmado") && <Button size="sm" variant="outline" onClick={() => change(b, "cancelado")}>Cancelar</Button>}
              <Button asChild size="sm" className="bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90">
                <a href={notify(b)} target="_blank" rel="noreferrer"><MessageCircle className="size-4" /> Avisar cliente</a>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={async () => {
                  if (!confirm("Excluir esta reserva?")) return;
                  await supabase.from("bookings").delete().eq("id", b.id);
                  refetch();
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const emptyChalet: Omit<Chalet, "id"> & { id?: string } = {
  name: "",
  description: "",
  price: 0,
  image_url: "",
  capacity: 2,
  whatsapp: "",
  active: true,
  sort_order: 0,
};

function ImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fileName = Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9.-]/g, "");
    const { error } = await supabase.storage.from("chales-images").upload(fileName, file);
    if (error) { toast.error("Erro no upload: " + error.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("chales-images").getPublicUrl(fileName);
    onChange(urlData.publicUrl);
    setUploading(false);
    toast.success("Imagem enviada!");
  }
  return (
    <div className="space-y-2">
      {value && <img src={value} alt="Preview" className="h-24 rounded-lg object-cover" />}
      <Input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
      {uploading && <p className="text-sm text-muted-foreground">Enviando...</p>}
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Ou cole uma URL" />
    </div>
  );
}

function ChaletsTab() {
  const qc = useQueryClient();
  const { data: chalets = [] } = useQuery(allChaletsQuery);
  const [editing, setEditing] = useState<typeof emptyChalet | null>(null);

  async function save() {
    if (!editing) return;
    try {
      const { id, ...fields } = editing;
      const query = id
        ? supabase.from("chalets").update(fields).eq("id", id)
        : supabase.from("chalets").insert(fields);
      const { error: saveErr } = await query;
      if (saveErr) throw saveErr;
      toast.success("Chalé salvo");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["chalets"] });
    } catch (e) {
      toast.error(e instanceof Error && !e.message.includes("[") ? e.message : "Confira os campos.");
    }
  }

  return (
    <div className="mt-4 space-y-4">
      <Button onClick={() => setEditing({ ...emptyChalet })}><Plus className="size-4" /> Novo chalé</Button>
      {editing ? (
        <div className="surface-card grid gap-3 p-4 sm:grid-cols-2">
          <Field label="Nome"><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
          <Field label="Valor da diária (R$)"><Input type="number" value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} /></Field>
          <Field label="Capacidade (pessoas)"><Input type="number" value={editing.capacity} onChange={(e) => setEditing({ ...editing, capacity: Number(e.target.value) })} /></Field>
          <Field label="WhatsApp do responsável (só números, ex: 5512999990000)"><Input value={editing.whatsapp} onChange={(e) => setEditing({ ...editing, whatsapp: e.target.value.replace(/\D/g, "") })} /></Field>
          <Field label="Imagem do chalé"><ImageUpload value={editing.image_url} onChange={(url) => setEditing({ ...editing, image_url: url })} /></Field>
          <Field label="Ordem de exibição"><Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} /></Field>
          <div className="sm:col-span-2"><Field label="Descrição"><Textarea rows={4} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field></div>
          <label className="flex items-center gap-2 text-sm"><Switch checked={editing.active} onCheckedChange={(v) => setEditing({ ...editing, active: v })} /> Disponível no site</label>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </div>
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {chalets.map((c) => (
          <div key={c.id} className="surface-card flex gap-3 overflow-hidden p-3">
            <img src={c.image_url} alt={c.name} className="size-24 rounded-lg object-cover" loading="lazy" />
            <div className="flex-1 text-sm">
              <p className="font-semibold">{c.name} {!c.active && <span className="text-xs text-muted-foreground">(oculto)</span>}</p>
              <p>{formatBRL(c.price)} · {c.capacity} pessoas</p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing({ ...c })}>Editar</Button>
                <Button size="sm" variant="ghost" onClick={async () => {
                  if (!confirm("Excluir este chalé e suas reservas?")) return;
                  await supabase.from("chalets").delete().eq("id", c.id);
                  qc.invalidateQueries({ queryKey: ["chalets"] });
                }}><Trash2 className="size-4" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompanyTab() {
  const qc = useQueryClient();
  const { data } = useQuery(companyQuery);
  const [form, setForm] = useState<Company | null>(null);
  useEffect(() => { if (data) setForm(data); }, [data]);
  if (!form) return null;

  const set = (k: keyof Company) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="surface-card mt-4 grid gap-3 p-4 sm:grid-cols-2">
      <Field label="Nome da empresa"><Input value={form.name} onChange={set("name")} /></Field>
      <Field label="Frase de destaque"><Input value={form.tagline} onChange={set("tagline")} /></Field>
      <div className="sm:col-span-2"><Field label="Endereço"><Input value={form.address} onChange={set("address")} /></Field></div>
      <Field label="Telefone"><Input value={form.phone} onChange={set("phone")} /></Field>
      <Field label="WhatsApp (só números, ex: 5512999990000)"><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value.replace(/\D/g, "") })} /></Field>
      <Field label="E-mail"><Input value={form.email} onChange={set("email")} /></Field>
      <Field label="Chave Pix"><Input value={form.pix_key} onChange={set("pix_key")} /></Field>
      <div className="flex justify-end sm:col-span-2">
        <Button onClick={async () => {
          try {
            const { id, ...fields } = form;
            const { error: compErr } = await supabase
              .from("company_settings")
              .update({ ...fields, updated_at: new Date().toISOString() })
              .eq("id", id);
            if (compErr) throw compErr;
            toast.success("Dados salvos");
            qc.invalidateQueries({ queryKey: ["company"] });
          } catch { toast.error("Confira os campos."); }
        }}>Salvar</Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function ReviewsTab() {
  const qc = useQueryClient();
  const { data: chalets = [] } = useQuery(allChaletsQuery);
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews", "admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("chalet_reviews").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  async function approve(id: string) {
    const { error } = await supabase.from("chalet_reviews").update({ status: "aprovado" }).eq("id", id);
    if (error) { toast.error("Não foi possível aprovar a avaliação."); return; }
    toast.success("Avaliação publicada");
    qc.invalidateQueries({ queryKey: ["reviews"] });
  }
  async function remove(id: string) {
    if (!confirm("Excluir esta avaliação?")) return;
    const { error } = await supabase.from("chalet_reviews").delete().eq("id", id);
    if (error) { toast.error("Não foi possível excluir a avaliação."); return; }
    qc.invalidateQueries({ queryKey: ["reviews"] });
  }
  return <div className="mt-4 space-y-4">
    {isLoading ? <p className="text-muted-foreground">Carregando avaliações...</p> : reviews.length === 0 ? <p className="text-muted-foreground">Nenhuma avaliação recebida.</p> : reviews.map(review => <article key={review.id} className="surface-card space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-2 text-sm"><strong>{review.guest_name}</strong><span className="text-muted-foreground">· {chalets.find(c => c.id === review.chalet_id)?.name ?? "Chalé"} · {review.rating}/5 · {review.status === "aprovado" ? "Publicado" : "Pendente"}</span></div>
      <p className="whitespace-pre-wrap">{review.comment}</p>
      <div className="flex gap-2">{review.status !== "aprovado" && <Button size="sm" onClick={() => approve(review.id)}>Aprovar</Button>}<Button size="sm" variant="outline" onClick={() => remove(review.id)}>Excluir</Button></div>
    </article>)}
  </div>;
}

