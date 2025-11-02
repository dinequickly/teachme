//this hook made to fetch data from supabase -> use only in client components

import { createClient } from "@/supabase/client";
import { useQuery } from "@tanstack/react-query";

const supabase = createClient();

export function useClientFetch<T>(
  key: string,
  table: string,
  cache?: number,
  filters?: (query: any) => any
) {
  return useQuery<T[]>({
    queryKey: [key],
    queryFn: async () => {
      let query = supabase.from(table).select("*");
      if (filters) query = filters(query);

      const { data, error } = await query;
      if (error) throw error;

      return data as T[];
    },
    staleTime: cache ? cache : 0, // Cache time if provided | 0 = always stale
    gcTime: cache ? cache : 0, // Garbage collection time | 0 = don't cache
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });
}
