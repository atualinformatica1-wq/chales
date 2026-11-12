import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { adminEventsQuery, eventRangeLabel, uploadEventFile, type EventItem } from "@/lib/events";

type Draft = {
  id?: string;
  title: string;
  description: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  banner_path: string;
  video_path: string;
  banner_in_carousel: boolean;
  video_in_carousel: boolean;
  active: boolean;
};

const empty: Draft = {
  title: "", description: "", start_date: "", start_time: "", end_date: "", end_time: "", banner_path: "", video_path: "",
  banner_in_carousel: true, video_in_carousel: false, active: true,
};

export function EventsTab() {
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery(adminEventsQuery);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  function open(d: Draft) { setEditing(d); setBannerFile(null); setVideoFile(null); }

  async function save() {
    if (!editing) return;
    if (editing.title.trim().length < 2 || !editing.start_date) { toast.error("Preencha o nome e a data do evento."); return; }
    if (editing.end_date && editing.end_date < editing.start_date) { toast.error("A data final deve ser depois da inicial."); return; }
    if (editing.end_date === editing.start_date && editing.end_time && editing.start_time && editing.end_time <= editing.start_time) { toast.error("O horário final deve ser depois do inicial."); return; }
    setSaving(true);
    try {
      const banner_path = bannerFile ? await uploadEventFile(bannerFile, "banner") : editing.banner_path;
      const video_path = videoFile ? await uploadEventFile(videoFile, "video") : editing.video_path;
      const payload = {
        title: editing.title.trim(), description: editing.description.trim(),
        start_date: editing.start_date, start_time: editing.start_time || null,
        end_date: editing.end_date || null, end_time: editing.end_time || null,
        banner_path, video_path,
        banner_in_carousel: editing.banner_in_carousel, video_in_carousel: editing.video_in_carousel,
        active: editing.active,
      };
      const { error } = editing.id
        ? await supabase.from("events").update(payload).eq("id", editing.id)
        : await supabase.from("events").insert(payload);
      if (error) throw error;
      toast.success("Evento salvo");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["events"] });
    } catch {
      toast.error("Não foi possível salvar. Verifique o tamanho dos arquivos (máx. 50 MB).");
    } finally { setSaving(false); }
  }

  async function remove(ev: EventItem) {
    if (!confirm("Excluir este evento?")) return;
    const { error } = await supabase.from("events").delete().eq("id", ev.id);
    if (error) { toast.error("Não foi possível excluir."); return; }
    const files = [ev.banner_path, ev.video_path].filter(Boolean);
    if (files.length) await supabase.storage.from("event-media").remove(files);
    qc.invalidateQueries({ queryKey: ["events"] });
  }

  return <div className="mt-4 space-y-4">
    <p className="text-sm text-muted-foreground">Cadastre eventos com datas, banner e vídeo enviados do seu computador. Marque se o banner e/ou o vídeo devem aparecer no carrossel da página inicial.</p>
    <Button onClick={() => open(empty)}><Plus className="size-4" /> Novo evento</Button>
    {editing && <div className="surface-card space-y-3 p-4">
      <div className="space-y-1.5"><Label>Nome do evento</Label><Input value={editing.title} maxLength={150} onChange={e => setEditing({ ...editing, title: e.target.value })} /></div>
      <div className="space-y-1.5"><Label>Descrição</Label><Textarea rows={4} maxLength={2000} value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} /></div>
      <div className="flex flex-wrap gap-4">
        <div className="space-y-1.5"><Label>Data de início</Label><Input type="date" value={editing.start_date} onChange={e => setEditing({ ...editing, start_date: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Hora de início</Label><Input type="time" value={editing.start_time} onChange={e => setEditing({ ...editing, start_time: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Data final (opcional)</Label><Input type="date" value={editing.end_date} onChange={e => setEditing({ ...editing, end_date: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Hora final (opcional)</Label><Input type="time" value={editing.end_time} onChange={e => setEditing({ ...editing, end_time: e.target.value })} /></div>
      </div>
      <div className="space-y-1.5">
        <Label>Banner (imagem do computador)</Label>
        <Input type="file" accept="image/*" onChange={e => setBannerFile(e.target.files?.[0] ?? null)} />
        {editing.banner_path && !bannerFile ? <p className="text-xs text-muted-foreground">Já existe um banner. Escolha outro arquivo para trocar.</p> : null}
        <label className="flex items-center gap-2 text-sm"><Switch checked={editing.banner_in_carousel} onCheckedChange={v => setEditing({ ...editing, banner_in_carousel: v })} /> Mostrar banner no carrossel do início</label>
      </div>
      <div className="space-y-1.5">
        <Label>Vídeo (do computador, até 50 MB)</Label>
        <Input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files?.[0] ?? null)} />
        {editing.video_path && !videoFile ? <p className="text-xs text-muted-foreground">Já existe um vídeo. Escolha outro arquivo para trocar.</p> : null}
        <label className="flex items-center gap-2 text-sm"><Switch checked={editing.video_in_carousel} onCheckedChange={v => setEditing({ ...editing, video_in_carousel: v })} /> Mostrar vídeo no carrossel do início</label>
      </div>
      <label className="flex items-center gap-2 text-sm"><Switch checked={editing.active} onCheckedChange={v => setEditing({ ...editing, active: v })} /> Evento visível no site</label>
      <div className="flex gap-2"><Button onClick={save} disabled={saving}>{saving ? "Enviando..." : "Salvar"}</Button><Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button></div>
    </div>}
    {isLoading ? <p className="text-muted-foreground">Carregando...</p> : rows.map(ev => <article key={ev.id} className="surface-card flex gap-4 p-4">
      {ev.bannerUrl ? <img src={ev.bannerUrl} alt="" className="h-20 w-32 shrink-0 rounded object-cover" /> : null}
      <div className="flex-1 space-y-1">
        <strong>{ev.title}</strong>{!ev.active && <span className="ml-2 text-xs text-muted-foreground">(oculto)</span>}
        <p className="text-sm text-muted-foreground">{eventRangeLabel(ev)}{ev.video_path ? " · com vídeo" : ""}</p>
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={() => open({ ...ev, end_date: ev.end_date ?? "", start_time: ev.start_time ?? "", end_time: ev.end_time ?? "" })}>Editar</Button>
          <Button size="sm" variant="outline" onClick={() => remove(ev)}><Trash2 className="size-4" /></Button>
        </div>
      </div>
    </article>)}
  </div>;
}
