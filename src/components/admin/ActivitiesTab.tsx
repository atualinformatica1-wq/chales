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
import { Checkbox } from "@/components/ui/checkbox";
import { uploadEventFile } from "@/lib/events";
import { adminActivitiesQuery, activityScheduleLabel, toggleWeekday, WEEKDAYS, type ActivityItem } from "@/lib/activities";

type Draft = {
  id?: string;
  title: string;
  description: string;
  schedule_mode: "datas" | "semana";
  weekdays: number[];
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
  title: "", description: "", schedule_mode: "semana", weekdays: [], start_date: "", start_time: "", end_date: "", end_time: "",
  banner_path: "", video_path: "", banner_in_carousel: false, video_in_carousel: false, active: true,
};

export function ActivitiesTab() {
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery(adminActivitiesQuery);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  function open(d: Draft) { setEditing(d); setBannerFile(null); setVideoFile(null); }

  function toggleDay(d: number) {
    if (!editing) return;
    setEditing({ ...editing, weekdays: toggleWeekday(editing.weekdays, d) });
  }

  async function save() {
    if (!editing) return;
    const semana = editing.schedule_mode === "semana";
    if (editing.title.trim().length < 2) { toast.error("Preencha o nome da atividade."); return; }
    if (semana && editing.weekdays.length === 0) { toast.error("Marque pelo menos um dia da semana."); return; }
    if (!semana && !editing.start_date) { toast.error("Escolha a data de início."); return; }
    if (!semana && editing.end_date && editing.end_date < editing.start_date) { toast.error("A data final deve ser depois da inicial."); return; }
    if ((semana || editing.end_date === editing.start_date) && editing.end_time && editing.start_time && editing.end_time <= editing.start_time) { toast.error("O horário final deve ser depois do inicial."); return; }
    setSaving(true);
    try {
      const banner_path = bannerFile ? await uploadEventFile(bannerFile, "banner") : editing.banner_path;
      const video_path = videoFile ? await uploadEventFile(videoFile, "video") : editing.video_path;
      const payload = {
        title: editing.title.trim(), description: editing.description.trim(),
        schedule_mode: editing.schedule_mode,
        weekdays: semana ? [...editing.weekdays].sort() : [],
        start_date: semana ? null : editing.start_date,
        end_date: semana ? null : editing.end_date || null,
        start_time: editing.start_time || null, end_time: editing.end_time || null,
        banner_path, video_path,
        banner_in_carousel: editing.banner_in_carousel, video_in_carousel: editing.video_in_carousel,
        active: editing.active,
      };
      const { error } = editing.id
        ? await supabase.from("activities").update(payload).eq("id", editing.id)
        : await supabase.from("activities").insert(payload);
      if (error) throw error;
      toast.success("Atividade salva");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["activities"] });
    } catch {
      toast.error("Não foi possível salvar. Verifique o tamanho dos arquivos (máx. 50 MB).");
    } finally { setSaving(false); }
  }

  async function remove(a: ActivityItem) {
    if (!confirm("Excluir esta atividade?")) return;
    const { error } = await supabase.from("activities").delete().eq("id", a.id);
    if (error) { toast.error("Não foi possível excluir."); return; }
    const files = [a.banner_path, a.video_path].filter(Boolean);
    if (files.length) await supabase.storage.from("event-media").remove(files);
    qc.invalidateQueries({ queryKey: ["activities"] });
  }

  return <div className="mt-4 space-y-4">
    <p className="text-sm text-muted-foreground">Cadastre atividades físicas em datas específicas ou em dias da semana fixos, com banner e vídeo do seu computador.</p>
    <Button onClick={() => open(empty)}><Plus className="size-4" /> Nova atividade</Button>
    {editing && <div className="surface-card space-y-3 p-4">
      <div className="space-y-1.5"><Label>Nome da atividade</Label><Input value={editing.title} maxLength={150} onChange={e => setEditing({ ...editing, title: e.target.value })} /></div>
      <div className="space-y-1.5"><Label>Descrição</Label><Textarea rows={4} maxLength={2000} value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} /></div>
      <div className="space-y-1.5">
        <Label>Quando acontece?</Label>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant={editing.schedule_mode === "semana" ? "default" : "outline"} onClick={() => setEditing({ ...editing, schedule_mode: "semana" })}>Dias da semana</Button>
          <Button type="button" size="sm" variant={editing.schedule_mode === "datas" ? "default" : "outline"} onClick={() => setEditing({ ...editing, schedule_mode: "datas" })}>Escolher data</Button>
        </div>
      </div>
      {editing.schedule_mode === "semana" ? (
        <div className="flex flex-wrap gap-3">
          {WEEKDAYS.map((name, d) => (
            <label key={d} className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm">
              <Checkbox checked={editing.weekdays.includes(d)} onCheckedChange={() => toggleDay(d)} /> {name}
            </label>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-4">
          <div className="space-y-1.5"><Label>Data de início</Label><Input type="date" value={editing.start_date} onChange={e => setEditing({ ...editing, start_date: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Data final (opcional)</Label><Input type="date" value={editing.end_date} onChange={e => setEditing({ ...editing, end_date: e.target.value })} /></div>
        </div>
      )}
      <div className="flex flex-wrap gap-4">
        <div className="space-y-1.5"><Label>Hora de início</Label><Input type="time" value={editing.start_time} onChange={e => setEditing({ ...editing, start_time: e.target.value })} /></div>
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
      <label className="flex items-center gap-2 text-sm"><Switch checked={editing.active} onCheckedChange={v => setEditing({ ...editing, active: v })} /> Atividade visível no site</label>
      <div className="flex gap-2"><Button onClick={save} disabled={saving}>{saving ? "Enviando..." : "Salvar"}</Button><Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button></div>
    </div>}
    {isLoading ? <p className="text-muted-foreground">Carregando...</p> : rows.map(a => <article key={a.id} className="surface-card flex gap-4 p-4">
      {a.bannerUrl ? <img src={a.bannerUrl} alt="" className="h-20 w-32 shrink-0 rounded object-cover" /> : null}
      <div className="flex-1 space-y-1">
        <strong>{a.title}</strong>{!a.active && <span className="ml-2 text-xs text-muted-foreground">(oculto)</span>}
        <p className="text-sm text-muted-foreground">{activityScheduleLabel(a)}{a.video_path ? " · com vídeo" : ""}</p>
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={() => open({ ...a, start_date: a.start_date ?? "", end_date: a.end_date ?? "", start_time: a.start_time?.slice(0, 5) ?? "", end_time: a.end_time?.slice(0, 5) ?? "" })}>Editar</Button>
          <Button size="sm" variant="outline" onClick={() => remove(a)}><Trash2 className="size-4" /></Button>
        </div>
      </div>
    </article>)}
  </div>;
}
