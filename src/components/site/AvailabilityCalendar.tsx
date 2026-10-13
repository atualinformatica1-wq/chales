import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { getBlockedDates } from "@/lib/public.functions";

export function toIso(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function useBlockedDates(chaletId: string | undefined, enabled = true) {
  const blockedFn = useServerFn(getBlockedDates);
  const { data } = useQuery({
    queryKey: ["blocked", chaletId],
    enabled: enabled && Boolean(chaletId),
    refetchInterval: 60000,
    queryFn: () => blockedFn({ data: { chaletId: chaletId! } }),
  });
  return useMemo(() => new Set(data?.blocked ?? []), [data]);
}

/** Returns true when any of the `nights` days starting at `date` is occupied. */
export function overlapsBlocked(date: Date, nights: number, blocked: Set<string>) {
  for (let i = 0; i < nights; i++) {
    const d = new Date(date);
    d.setDate(d.getDate() + i);
    if (blocked.has(toIso(d))) return true;
  }
  return false;
}

export const occupiedClass =
  "[&>button]:bg-destructive/15 [&>button]:text-destructive [&>button]:line-through [&>button]:opacity-100";

export function AvailabilityLegend() {
  return (
    <div className="flex flex-wrap gap-4 px-2 pb-1 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-sm bg-destructive/20" /> Ocupado
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-sm border border-border bg-background" /> Disponível
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-sm bg-primary" /> Sua escolha
      </span>
    </div>
  );
}

export function AvailabilityCalendar({ chaletId }: { chaletId: string }) {
  const blocked = useBlockedDates(chaletId);
  const occupied = useMemo(
    () => Array.from(blocked).map((d) => new Date(`${d}T12:00:00`)),
    [blocked],
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="surface-card inline-block p-3">
      <Calendar
        mode="single"
        locale={ptBR}
        numberOfMonths={2}
        disabled={[{ before: today }]}
        modifiers={{ occupied }}
        modifiersClassNames={{ occupied: occupiedClass }}
        className="pointer-events-auto"
      />
      <AvailabilityLegend />
    </div>
  );
}
