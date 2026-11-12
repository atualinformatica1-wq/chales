import { supabase } from "@/integrations/supabase/client";
import { queryOptions } from "@tanstack/react-query";
import { formatDateBR } from "@/lib/site";

export const EVENT_BUCKET = "event-media";

export type EventRow = {
  id: string;
  title: string;
  description: string;
  start_date: string;
  start_time: string | null;
  end_date: string | null;
  end_time: string | null;
  banner_path: string;
  video_path: string;
  banner_in_carousel: boolean;
  video_in_carousel: boolean;
  active: boolean;
};

export type EventItem = EventRow & { bannerUrl: string; videoUrl: string };

export const formatTimeBR = (t: string | null | undefined) => (t ? t.slice(0, 5) : "");

export const formatEventDateTime = (date: string, time: string | null | undefined) => {
  const t = formatTimeBR(time);
  return `${formatDateBR(date)}${t ? ` às ${t}` : ""}`;
};

export function eventRangeLabel(
  ev: Pick<EventRow, "start_date" | "start_time" | "end_date" | "end_time">,
) {
  const start = formatEventDateTime(ev.start_date, ev.start_time);
  if (!ev.end_date) return start;
  return `${start} até ${formatEventDateTime(ev.end_date, ev.end_time)}`;
}

async function withUrls(rows: EventRow[]): Promise<EventItem[]> {
  const paths = rows.flatMap((r) => [r.banner_path, r.video_path]).filter(Boolean);
  const map = new Map<string, string>();
  if (paths.length) {
    const { data } = await supabase.storage.from(EVENT_BUCKET).createSignedUrls(paths, 60 * 60 * 24 * 7);
    (data ?? []).forEach((d) => d.path && d.signedUrl && map.set(d.path, d.signedUrl));
  }
  return rows.map((r) => ({
    ...r,
    bannerUrl: map.get(r.banner_path) ?? "",
    videoUrl: map.get(r.video_path) ?? "",
  }));
}

export const eventsQuery = queryOptions({
  queryKey: ["events"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("active", true)
      .order("start_date", { ascending: true });
    if (error) throw error;
    return withUrls((data ?? []) as EventRow[]);
  },
});

export const adminEventsQuery = queryOptions({
  queryKey: ["events", "admin"],
  queryFn: async () => {
    const { data, error } = await supabase.from("events").select("*").order("start_date", { ascending: false });
    if (error) throw error;
    return withUrls((data ?? []) as EventRow[]);
  },
});

export async function uploadEventFile(file: File, kind: "banner" | "video") {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${kind}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(EVENT_BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw error;
  return path;
}
