import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CalendarClock, CheckCircle2, Copy, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createBooking } from "@/lib/public.functions";
import { AvailabilityLegend, occupiedClass, overlapsBlocked, useBlockedDates } from "./AvailabilityCalendar";
import {
  formatBRL,
  formatDateBR,
  TIME_SLOTS,
  whatsappLink,
  type Chalet,
  type Company,
} from "@/lib/site";

type Props = {
  chalet: Chalet | null;
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Result = {
  id: string;
  reference: string;
  total: number;
  expiresAt: string;
  chaletName: string;
};

function toIso(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function Countdown({ target }: { target: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, new Date(target).getTime() - now);
  const m = Math.floor(diff / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return (
    <span className="font-mono font-semibold">
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

export function BookingDialog({ chalet, company, open, onOpenChange }: Props) {
  const createBookingFn = useServerFn(createBooking);

  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("14:00");
  const [nights, setNights] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (open) {
      setResult(null);
      setSaving(false);
    }
  }, [open, chalet?.id]);

  const blocked = useBlockedDates(chalet?.id, open);

  const occupied = useMemo(
    () => Array.from(blocked).map((d) => new Date(`${d}T12:00:00`)),
    [blocked],
  );

  const disabledDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return [{ before: today }, (d: Date) => overlapsBlocked(d, nights, blocked)];
  }, [blocked, nights]);

  useEffect(() => {
    if (date && overlapsBlocked(date, nights, blocked)) {
      setDate(undefined);
      toast.error("Esse período inclui datas ocupadas. Escolha outra data.");
    }
  }, [date, nights, blocked]);

  const total = (chalet?.price ?? 0) * nights;

  async function submit() {
    if (!chalet || !date) {
      toast.error("Escolha a data da reserva.");
      return;
    }
    setSaving(true);
    try {
      const res = (await createBookingFn({
        data: {
          chaletId: chalet.id,
          name,
          email,
          phone,
          date: toIso(date),
          time,
          nights,
          notes,
        },
      })) as Result;
      setResult(res);
      toast.success("Reserva criada! Agora finalize o pagamento.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível criar a reserva.";
      toast.error(message.includes("parse") ? "Confira os dados preenchidos." : message);
    } finally {
      setSaving(false);
    }
  }

  const pixKey = company?.pix_key ?? "";
  const contactNumber = chalet?.whatsapp || company?.whatsapp || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        {!result ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">
                Reservar {chalet?.name ?? ""}
              </DialogTitle>
              <DialogDescription>
                Escolha data e horário de entrada. A reserva fica guardada por 1 hora até o
                pagamento.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-xl border border-border p-2">
                <Calendar
                  mode="single"
                  locale={ptBR}
                  selected={date}
                  onSelect={setDate}
                  disabled={disabledDays}
                  modifiers={{ occupied }}
                  modifiersClassNames={{ occupied: occupiedClass }}
                  className="pointer-events-auto mx-auto"
                />
                <AvailabilityLegend />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Horário de entrada</Label>
                  <Select value={time} onValueChange={setTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Diárias</Label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={nights}
                    onChange={(e) => setNights(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Nome completo</Label>
                  <Input value={name} maxLength={100} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Telefone / WhatsApp</Label>
                  <Input
                    value={phone}
                    maxLength={30}
                    placeholder="(12) 99999-0000"
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={email}
                  maxLength={255}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Observações (opcional)</Label>
                <Textarea
                  value={notes}
                  maxLength={500}
                  rows={2}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between rounded-xl bg-secondary px-4 py-3">
                <span className="text-sm text-secondary-foreground">
                  {nights} {nights > 1 ? "diárias" : "diária"}
                </span>
                <span className="font-display text-xl font-semibold">{formatBRL(total)}</span>
              </div>

              <Button onClick={submit} disabled={saving} className="w-full" size="lg">
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                Confirmar dados e ir para o pagamento
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-display text-2xl">
                <CheckCircle2 className="size-6 text-success" />
                Reserva registrada
              </DialogTitle>
              <DialogDescription>
                Código <strong>{result.reference}</strong> · {result.chaletName}
                {date ? ` · ${formatDateBR(toIso(date))} às ${time}` : ""}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-warning/40 bg-warning/15 px-4 py-3 text-sm">
                <CalendarClock className="size-5 shrink-0" />
                <p>
                  Pague em até <Countdown target={result.expiresAt} /> ou a reserva é cancelada
                  automaticamente e o chalé volta a ficar disponível.
                </p>
              </div>

              <div className="surface-card space-y-2 p-4">
                <p className="text-sm text-muted-foreground">Valor total</p>
                <p className="font-display text-3xl font-semibold">{formatBRL(result.total)}</p>
                {pixKey ? (
                  <div className="pt-2">
                    <p className="text-sm text-muted-foreground">Chave Pix</p>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="flex-1 truncate rounded-md bg-muted px-3 py-2 text-sm">
                        {pixKey}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(pixKey);
                          toast.success("Chave Pix copiada");
                        }}
                      >
                        <Copy className="size-4" />
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>

              {contactNumber ? (
                <Button
                  asChild
                  size="lg"
                  className="w-full bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90"
                >
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href={whatsappLink(
                      contactNumber,
                      `Olá! Fiz a reserva ${result.reference} do ${result.chaletName}${
                        date ? ` para ${formatDateBR(toIso(date))} às ${time}` : ""
                      }. Valor ${formatBRL(result.total)}. Segue o comprovante do pagamento.`,
                    )}
                  >
                    Enviar comprovante pelo WhatsApp
                  </a>
                </Button>
              ) : null}

              <p className="text-center text-xs text-muted-foreground">
                Assim que o pagamento for confirmado, você recebe o aviso de confirmação.
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
