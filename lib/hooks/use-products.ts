import { useQuery } from "@tanstack/react-query";
import { productsApi } from "@/lib/api";
import type { Product } from "@/lib/types";

export function useProducts(params?: { is_global?: boolean }) {
  return useQuery<Product[]>({
    queryKey: ["products", params],
    queryFn: () => productsApi.list(params).then((r) => r.data),
  });
}
