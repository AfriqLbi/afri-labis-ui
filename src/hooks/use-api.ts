/**
 * Thin wrappers over TanStack Query for each API resource.
 * Keeps page components clean — one import, one hook call.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  catalog,
  orders,
  customOrders,
  measurements,
  adminOrders,
  adminCustomOrders,
  adminAnalytics,
  adminCatalog,
  lookbook,
  adminLookbook,
} from "@/lib/api.ts";

// ── Catalog ───────────────────────────────────────────────────────────────────

export function useProducts(
  params?: Parameters<typeof catalog.listProducts>[0],
) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => catalog.listProducts(params),
    staleTime: 60_000,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: () => catalog.getProduct(slug),
    staleTime: 60_000,
    enabled: !!slug,
  });
}

export function useCategories(type?: "category" | "section") {
  return useQuery({
    queryKey: ["categories", type],
    queryFn: () => catalog.listCategories(type),
    staleTime: 300_000,
  });
}

// ── Orders ────────────────────────────────────────────────────────────────────

export function useMyOrders(page = 1) {
  return useQuery({
    queryKey: ["my-orders", page],
    queryFn: () => orders.mine(page),
    staleTime: 30_000,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: () => orders.get(id),
    staleTime: 30_000,
    enabled: !!id,
  });
}

export function useOrderProductionHistory(orderId: string) {
  return useQuery({
    queryKey: ["production-history", orderId],
    queryFn: () => orders.getProductionHistory(orderId),
    staleTime: 30_000,
    enabled: !!orderId,
  });
}

// ── Custom Orders ─────────────────────────────────────────────────────────────

export function useMyCustomOrders(page = 1) {
  return useQuery({
    queryKey: ["my-custom-orders", page],
    queryFn: () => customOrders.mine(page),
    staleTime: 30_000,
  });
}

export function useCustomOrder(id: string) {
  return useQuery({
    queryKey: ["custom-order", id],
    queryFn: () => customOrders.get(id),
    staleTime: 30_000,
    enabled: !!id,
  });
}

// ── Measurements ──────────────────────────────────────────────────────────────

export function useMeasurementProfiles() {
  return useQuery({
    queryKey: ["measurement-profiles"],
    queryFn: () => measurements.list(),
    staleTime: 60_000,
  });
}

// ── Admin: Orders ─────────────────────────────────────────────────────────────

export function useAdminOrders(
  params?: Parameters<typeof adminOrders.list>[0],
) {
  return useQuery({
    queryKey: ["admin-orders", params],
    queryFn: () => adminOrders.list(params),
    staleTime: 20_000,
  });
}

export function useAdminCustomOrders(
  params?: Parameters<typeof adminCustomOrders.list>[0],
) {
  return useQuery({
    queryKey: ["admin-custom-orders", params],
    queryFn: () => adminCustomOrders.list(params),
    staleTime: 20_000,
  });
}

// ── Admin: Analytics ──────────────────────────────────────────────────────────

export function useAdminMetrics() {
  return useQuery({
    queryKey: ["admin-metrics"],
    queryFn: () => adminAnalytics.metrics(),
    staleTime: 60_000,
  });
}

export function useAdminRevenueSeries(months = 6) {
  return useQuery({
    queryKey: ["admin-revenue-series", months],
    queryFn: () => adminAnalytics.revenueSeries(months),
    staleTime: 60_000,
  });
}

export function useAdminCategoryMix() {
  return useQuery({
    queryKey: ["admin-category-mix"],
    queryFn: () => adminAnalytics.categoryMix(),
    staleTime: 60_000,
  });
}

export function useAdminTopProducts() {
  return useQuery({
    queryKey: ["admin-top-products"],
    queryFn: () => adminAnalytics.topProducts(),
    staleTime: 60_000,
  });
}

// ── Admin: Products ───────────────────────────────────────────────────────────

export function useAdminProducts(
  params?: Parameters<typeof adminCatalog.listProducts>[0],
) {
  return useQuery({
    queryKey: ["admin-products", params],
    queryFn: () => adminCatalog.listProducts(params),
    staleTime: 30_000,
  });
}

export function useAdminLowStock() {
  return useQuery({
    queryKey: ["admin-low-stock"],
    queryFn: () => adminCatalog.lowStock(),
    staleTime: 60_000,
  });
}

// ── Mutation helpers ──────────────────────────────────────────────────────────

export function useAdminSetStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, stock }: { productId: string; stock: number }) =>
      adminCatalog.setStock({ productId, stock }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["admin-low-stock"] });
    },
  });
}

export function useAdminCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: unknown) => adminCatalog.createProduct(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
  });
}

export function useAdminUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: unknown }) =>
      adminCatalog.updateProduct(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
  });
}

export function useAdminDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminCatalog.deleteProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
  });
}

export function useAdminToggleTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, tag }: { id: string; tag: string }) =>
      adminCatalog.toggleTag(id, tag),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
  });
}

export function useAdminCatalogCategories() {
  return useQuery({
    queryKey: ["admin-catalog-categories"],
    queryFn: () => adminCatalog.listCategories(),
    staleTime: 300_000,
  });
}

export function useAdminCatalogBrands() {
  return useQuery({
    queryKey: ["admin-catalog-brands"],
    queryFn: () => adminCatalog.listBrands(),
    staleTime: 300_000,
  });
}

export function useAdminCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: unknown) => adminCatalog.createCategory(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-catalog-categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useAdminUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: unknown }) =>
      adminCatalog.updateCategory(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-catalog-categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useAdminDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminCatalog.deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-catalog-categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useAdminFulfilOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminOrders.fulfil(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-orders"] }),
  });
}

export function useAdminCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminOrders.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-orders"] }),
  });
}

export function useAdminUpdateProductionStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      stage,
      note,
    }: {
      id: string;
      stage: string;
      note?: string;
    }) => adminOrders.updateProductionStage(id, stage, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["production-history"] });
    },
  });
}

export function useAdminSetCustomOrderQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Parameters<typeof adminCustomOrders.setQuote>[1];
    }) => adminCustomOrders.setQuote(id, dto),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin-custom-orders"] }),
  });
}

export function useAdminMoveCustomOrderToProduction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminCustomOrders.moveToProduction(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin-custom-orders"] }),
  });
}

// ── Lookbook ──────────────────────────────────────────────────────────────────

export function useLookbook() {
  return useQuery({
    queryKey: ["lookbook"],
    queryFn: () => lookbook.list(),
    staleTime: 120_000,
  });
}

export function useAdminLookbook() {
  return useQuery({
    queryKey: ["admin-lookbook"],
    queryFn: () => adminLookbook.list(),
    staleTime: 30_000,
  });
}

export function useAdminCreateLookbookItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Parameters<typeof adminLookbook.create>[0]) =>
      adminLookbook.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-lookbook"] });
      qc.invalidateQueries({ queryKey: ["lookbook"] });
    },
  });
}

export function useAdminUpdateLookbookItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Parameters<typeof adminLookbook.update>[1];
    }) => adminLookbook.update(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-lookbook"] });
      qc.invalidateQueries({ queryKey: ["lookbook"] });
    },
  });
}

export function useAdminDeleteLookbookItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminLookbook.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-lookbook"] });
      qc.invalidateQueries({ queryKey: ["lookbook"] });
    },
  });
}

export function useAdminReorderLookbook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: { id: string; sortOrder: number }[]) =>
      adminLookbook.reorder(items),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-lookbook"] }),
  });
}

// ── Shipping estimate ─────────────────────────────────────────────────────────

import { adminShipping, shipping } from "@/lib/api.ts";

export function useShippingEstimate(
  address: { country: string; state?: string } | null,
  cartId?: string,
  pickup?: boolean,
) {
  return useQuery({
    queryKey: ["shipping-estimate", address, cartId, pickup],
    queryFn: () =>
      shipping.estimate({
        address: address!,
        cartId,
        pickup,
      }),
    enabled: !!address?.country,
    staleTime: 60_000,
    retry: 1,
  });
}

// ── Admin: Shipping ───────────────────────────────────────────────────────────

export function useAdminShippingZones() {
  return useQuery({
    queryKey: ["admin-shipping-zones"],
    queryFn: () => adminShipping.listZones(),
    staleTime: 30_000,
  });
}

export function useAdminShippingQuotes() {
  return useQuery({
    queryKey: ["admin-shipping-quotes"],
    queryFn: () => adminShipping.listQuotes(),
    staleTime: 15_000,
    refetchInterval: 60_000,
  });
}

export function useAdminShippingSettings() {
  return useQuery({
    queryKey: ["admin-shipping-settings"],
    queryFn: () => adminShipping.getSettings(),
    staleTime: 60_000,
  });
}

export function useAdminCreateShippingZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Parameters<typeof adminShipping.createZone>[0]) =>
      adminShipping.createZone(dto),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin-shipping-zones"] }),
  });
}

export function useAdminUpdateShippingZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Parameters<typeof adminShipping.updateZone>[1];
    }) => adminShipping.updateZone(id, dto),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin-shipping-zones"] }),
  });
}

export function useAdminDeleteShippingZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminShipping.deleteZone(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin-shipping-zones"] }),
  });
}

export function useAdminSubmitShippingQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      dto,
    }: {
      orderId: string;
      dto: Parameters<typeof adminShipping.submitQuote>[1];
    }) => adminShipping.submitQuote(orderId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-shipping-quotes"] });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });
}

export function useAdminOverrideShippingFee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      dto,
    }: {
      orderId: string;
      dto: Parameters<typeof adminShipping.overrideFee>[1];
    }) => adminShipping.overrideFee(orderId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-orders"] }),
  });
}

export function useAdminCreateShippingAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      dto,
    }: {
      orderId: string;
      dto: Parameters<typeof adminShipping.createAdjustment>[1];
    }) => adminShipping.createAdjustment(orderId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-orders"] }),
  });
}

export function useAdminUpdateShippingSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Parameters<typeof adminShipping.updateSettings>[0]) =>
      adminShipping.updateSettings(dto),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin-shipping-settings"] }),
  });
}
