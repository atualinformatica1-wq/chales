import { supabase } from "@/integrations/supabase/client";
import { queryOptions } from "@tanstack/react-query";

export type Chalet = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  capacity: number;
  whatsapp: string;
  active: boolean;
  sort_order: number;
};

export type Company = {
  id: string;
  name: string;
  tagline: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  pix_key: string;
};

export const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export const formatDateBR = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export function whatsappLink(number: string, message: string) {
  const digits = (number || "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message.slice(0, 900))}`;
}

export const chaletsQuery = queryOptions({
  queryKey: ["chalets"],
  queryFn: async (): Promise<Chalet[]> => {
    const { data, error } = await supabase
      .from("chalets")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((c) => ({ ...c, price: Number(c.price) })) as Chalet[];
  },
});

export const allChaletsQuery = queryOptions({
  queryKey: ["chalets", "all"],
  queryFn: async (): Promise<Chalet[]> => {
    const { data, error } = await supabase
      .from("chalets")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((c) => ({ ...c, price: Number(c.price) })) as Chalet[];
  },
});

export const companyQuery = queryOptions({
  queryKey: ["company"],
  queryFn: async (): Promise<Company | null> => {
    const { data, error } = await supabase.from("company_settings").select("*").limit(1).maybeSingle();
    if (error) throw error;
    return (data as Company) ?? null;
  },
});

export const rentedQuery = queryOptions({
  queryKey: ["rented"],
  refetchInterval: 60000,
  queryFn: async (): Promise<string[]> => {
    const { data, error } = await supabase.rpc("rented_chalet_ids");
    if (error) throw error;
    return ((data ?? []) as unknown as string[]).map(String);
  },
});

export const TIME_SLOTS = [
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
];
