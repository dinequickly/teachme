//this hook made to fetch data from supabase -> use only in client components

import { createClient } from "@/supabase/client";
import { useQuery } from "@tanstack/react-query";

const supabase = createClient();

type QueryModifier = (query: any) => any;

interface ClientFetchOptions {
  filters?: QueryModifier;
  cache?: number;
  enabled?: boolean;
  extraKey?: unknown;
}

export function useClientFetch<T>(
  key: string,
  table: string,
  options: ClientFetchOptions = {}
) {
  const { filters, cache, enabled, extraKey } = options;

  return useQuery<T[]>({
    queryKey: extraKey === undefined ? [key] : [key, extraKey],
    queryFn: async () => {
      let query = supabase.from(table).select("*");
      if (filters) query = filters(query);

      const { data, error } = await query;
      if (error) throw error;

      return data as T[];
    },
    staleTime: cache ?? 0,
    gcTime: cache ?? 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    enabled: enabled ?? true,
  });
}
