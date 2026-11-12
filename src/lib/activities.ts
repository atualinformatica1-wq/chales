import { supabase } from "@/integrations/supabase/client";
import { queryOptions } from "@tanstack/react-query";
import { EVENT_BUCKET, formatEventDateTime, formatTimeBR } from "@/lib/events";

export const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

export function toggleWeekday(days: number[], day: number) {
  return days.includes(day) ? days.filter((value) => value !== day) : [...days, day].sort((a, b) => a - b);
}

export type ActivityRow = {
  id: string;
  title: string;
  description: string;
  schedule_mode: "datas" | "semana";
  weekdays: number[];
  start_date: string | null;
  start_time: string | null;
  end_date: string | null;
  end_time: string | null;
  banner_path: string;
  video_path: string;
  banner_in_carousel: boolean;
  video_in_carousel: boolean;
  active: boolean;
};

export type ActivityItem = ActivityRow & { bannerUrl: string; videoUrl: string };

/** "Seg, Qua e Sex · 07:00 às 08:00" or "05/12/2026 às 19:00 até ..." */
export function activityScheduleLabel(a: Pick<ActivityRow, "schedule_mode" | "weekdays" | "start_date" | "start_time" | "end_date" | "end_time">) {
  if (a.schedule_mode === "semana") {
    const days = [...a.weekdays].sort((x, y) => x - y).map((d) => WEEKDAYS[d]);
    const list = days.length === 7 ? "Todos os dias" : days.length > 1 ? `${days.slice(0, -1).join(", ")} e ${days[days.length - 1]}` : days[0] ?? "";
    const s = formatTimeBR(a.start_time), e = formatTimeBR(a.end_time);
    const hours = s && e ? ` · ${s} às ${e}` : s ? ` · a partir das ${s}` : "";
    return list + hours;
  }
  if (!a.start_date) return "";
  const start = formatEventDateTime(a.start_date, a.start_time);
  return a.end_date ? `${start} até ${formatEventDateTime(a.end_date, a.end_time)}` : start;
}

async function withUrls(rows: ActivityRow[]): Promise<ActivityItem[]> {
  const paths = rows.flatMap((r) => [r.banner_path, r.video_path]).filter(Boolean);
  const map = new Map<string, string>();
  if (paths.length) {
    const { data } = await supabase.storage.from(EVENT_BUCKET).createSignedUrls(paths, 60 * 60 * 24 * 7);
    (data ?? []).forEach((d) => d.path && d.signedUrl && map.set(d.path, d.signedUrl));
  }
  return rows.map((r) => ({ ...r, bannerUrl: map.get(r.banner_path) ?? "", videoUrl: map.get(r.video_path) ?? "" }));
}

export const activitiesQuery = queryOptions({
  queryKey: ["activities"],
  queryFn: async () => {
    const { data, error } = await supabase.from("activities").select("*").eq("active", true).order("created_at");
    if (error) throw error;
    return withUrls((data ?? []) as ActivityRow[]);
  },
});

export const adminActivitiesQuery = queryOptions({
  queryKey: ["activities", "admin"],
  queryFn: async () => {
    const { data, error } = await supabase.from("activities").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return withUrls((data ?? []) as ActivityRow[]);
  },
});
