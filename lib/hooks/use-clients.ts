import { useQuery } from "@tanstack/react-query";
import { clientsApi } from "@/lib/api";
import type { Client } from "@/lib/types";

export function useClients() {
  return useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: () => clientsApi.list().then((r) => r.data),
  });
}
