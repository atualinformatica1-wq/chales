import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Acesso restrito ao administrador.");
}

export const claimAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("claim_admin");
    if (error) throw new Error("Não foi possível verificar o acesso.");
    return { isAdmin: Boolean(data) };
  });

export const listBookings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    await context.supabase.rpc("expire_pending_bookings");

    const { data, error } = await context.supabase
      .from("bookings")
      .select("*, chalets(name)")
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) throw new Error("Não foi possível carregar as reservas.");
    return data ?? [];
  });

export const setBookingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pendente", "confirmado", "cancelado", "finalizado"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const patch: any = { status: data.status };
    if (data.status === "confirmado") patch["confirmed_at"] = new Date().toISOString();
    if (data.status === "cancelado") patch["cancelled_at"] = new Date().toISOString();
    if (data.status === "pendente") {
      patch["expires_at"] = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      patch["cancelled_at"] = null;
    }

    const { error } = await context.supabase.from("bookings").update(patch).eq("id", data.id);
    if (error) throw new Error("Não foi possível atualizar a reserva.");
    return { ok: true };
  });

export const deleteBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("bookings").delete().eq("id", data.id);
    if (error) throw new Error("Não foi possível excluir a reserva.");
    return { ok: true };
  });

const chaletSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1500).default(""),
  price: z.number().min(0).max(1000000),
  image_url: z.string().trim().max(500).default(""),
  capacity: z.number().int().min(1).max(50),
  whatsapp: z
    .string()
    .trim()
    .max(20)
    .regex(/^[0-9]*$/, "Use apenas números, com DDI e DDD")
    .default(""),
  active: z.boolean().default(true),
  sort_order: z.number().int().min(0).max(999).default(0),
});

export const saveChalet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => chaletSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...fields } = data;
    const query = id
      ? context.supabase.from("chalets").update(fields).eq("id", id)
      : context.supabase.from("chalets").insert(fields);
    const { error } = await query;
    if (error) throw new Error("Não foi possível salvar o chalé.");
    return { ok: true };
  });

export const deleteChalet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("chalets").delete().eq("id", data.id);
    if (error) throw new Error("Não foi possível excluir o chalé.");
    return { ok: true };
  });

const companySchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().max(150).default(""),
  tagline: z.string().trim().max(200).default(""),
  address: z.string().trim().max(300).default(""),
  phone: z.string().trim().max(40).default(""),
  whatsapp: z
    .string()
    .trim()
    .max(20)
    .regex(/^[0-9]*$/, "Use apenas números, com DDI e DDD")
    .default(""),
  email: z.string().trim().max(255).default(""),
  pix_key: z.string().trim().max(255).default(""),
});

export const saveCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => companySchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...fields } = data;
    const { error } = await context.supabase
      .from("company_settings")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error("Não foi possível salvar os dados da empresa.");
    return { ok: true };
  });
