import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const bookingSchema = z.object({
  chaletId: z.string().uuid(),
  name: z.string().trim().min(2, "Informe seu nome").max(100),
  email: z.string().trim().email("E-mail inválido").max(255),
  phone: z.string().trim().min(8, "Telefone inválido").max(30),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido"),
  nights: z.number().int().min(1).max(30),
  notes: z.string().trim().max(500).default(""),
});

export const getBlockedDates = createServerFn({ method: "POST" })
  .inputValidator((input: { chaletId: string }) =>
    z.object({ chaletId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.rpc("expire_pending_bookings");

    const today = new Date().toISOString().slice(0, 10);
    const { data: rows, error } = await supabaseAdmin
      .from("bookings")
      .select("booking_date, nights, status")
      .eq("chalet_id", data.chaletId)
      .in("status", ["pendente", "confirmado"])
      .gte("booking_date", today);

    if (error) throw new Error("Não foi possível verificar a disponibilidade.");

    const blocked = new Set<string>();
    for (const row of rows ?? []) {
      const start = new Date(`${row.booking_date}T00:00:00Z`);
      for (let i = 0; i < Math.max(1, row.nights); i++) {
        const d = new Date(start);
        d.setUTCDate(d.getUTCDate() + i);
        blocked.add(d.toISOString().slice(0, 10));
      }
    }
    return { blocked: Array.from(blocked) };
  });

export const createBooking = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => bookingSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.rpc("expire_pending_bookings");

    const { data: chalet, error: chaletError } = await supabaseAdmin
      .from("chalets")
      .select("id, name, price, active")
      .eq("id", data.chaletId)
      .maybeSingle();

    if (chaletError || !chalet || !chalet.active) {
      throw new Error("Chalé indisponível.");
    }

    // Chalés locados podem receber reservas para datas livres futuras;
    // o bloqueio real acontece na verificação de sobreposição de datas abaixo.

    const requested: string[] = [];
    const start = new Date(`${data.date}T00:00:00Z`);
    for (let i = 0; i < data.nights; i++) {
      const d = new Date(start);
      d.setUTCDate(d.getUTCDate() + i);
      requested.push(d.toISOString().slice(0, 10));
    }

    const { data: existing } = await supabaseAdmin
      .from("bookings")
      .select("booking_date, nights")
      .eq("chalet_id", data.chaletId)
      .in("status", ["pendente", "confirmado"])
      .gte("booking_date", new Date().toISOString().slice(0, 10));

    const taken = new Set<string>();
    for (const row of existing ?? []) {
      const s = new Date(`${row.booking_date}T00:00:00Z`);
      for (let i = 0; i < Math.max(1, row.nights); i++) {
        const d = new Date(s);
        d.setUTCDate(d.getUTCDate() + i);
        taken.add(d.toISOString().slice(0, 10));
      }
    }
    if (requested.some((d) => taken.has(d))) {
      throw new Error("Essas datas acabaram de ser reservadas. Escolha outro período.");
    }

    const total = Number(chalet.price) * data.nights;
    const reference = `RES-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const { data: inserted, error } = await supabaseAdmin
      .from("bookings")
      .insert({
        chalet_id: data.chaletId,
        customer_name: data.name,
        customer_email: data.email,
        customer_phone: data.phone,
        booking_date: data.date,
        booking_time: data.time,
        nights: data.nights,
        total_price: total,
        notes: data.notes,
        payment_reference: reference,
      })
      .select("id, expires_at, payment_reference, total_price")
      .single();

    if (error || !inserted) throw new Error("Não foi possível criar a reserva.");

    return {
      id: inserted.id,
      reference: inserted.payment_reference,
      total: Number(inserted.total_price),
      expiresAt: inserted.expires_at,
      chaletName: chalet.name,
    };
  });
