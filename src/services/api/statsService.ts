import { apiRequest } from "./apiClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8686";
const TOKEN_KEY = "stylehub_token";
const LEGACY_TOKEN_KEY = "token";

export type AdminOverviewStats = {
  totalOrders: number;
  totalRevenueAll: number;
  totalPaidRevenue: number;
  totalPaidOrders: number;
  uniqueCustomers: number;
  statusCounts: Record<string, number>;
  paymentCounts: Record<string, number>;
  recentOrders: Array<{
    _id: string;
    orderCode?: string;
    orderStatus?: string;
    paymentMethod?: {
      status?: string;
    };
    totalAmount?: number;
    createdAt?: string;
  }>;
};

export type AdminSalesStats = {
  period: "day" | "week" | "month";
  range: number;
  labels: string[];
  data: Array<{
    orders: number;
    revenue: number;
  }>;
};

export type AdminTopProduct = {
  _id: string;
  productName?: string;
  sku?: string;
  qtySold?: number;
  revenue?: number;
};

export type AdminSlowProduct = {
  _id: string;
  name?: string;
  slug?: string;
  totalStock?: number;
  qtySold?: number;
  score?: number;
  sampleImage?: string | null;
};

export type AdminTopCustomer = {
  rank?: number;
  name?: string;
  email?: string;
  phone?: string;
  orders?: number;
  totalSpent?: number;
  userId?: string;
};

async function downloadWithAuth(path: string, filename = "thongke.xlsx") {
  const token = localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);

  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    let message = "Không thể tải file Excel";
    try {
      const data = await response.json();
      message = data?.message || message;
    } catch {
      //
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export const statsService = {
  async getOverview() {
    return apiRequest<AdminOverviewStats>("/api/admin/stats/overview", {
      auth: true,
    });
  },

  async getSales(params?: { period?: "day" | "week" | "month"; range?: number }) {
    const search = new URLSearchParams();

    if (params?.period) search.set("period", params.period);
    if (params?.range) search.set("range", String(params.range));

    const query = search.toString();
    return apiRequest<AdminSalesStats>(
      `/api/admin/stats/sales${query ? `?${query}` : ""}`,
      { auth: true }
    );
  },

  async getTopProducts(params?: { limit?: number; periodDays?: number }) {
    const search = new URLSearchParams();

    if (params?.limit) search.set("limit", String(params.limit));
    if (params?.periodDays) search.set("periodDays", String(params.periodDays));

    const query = search.toString();
    return apiRequest<{ periodDays: number; limit: number; data: AdminTopProduct[] }>(
      `/api/admin/stats/top-products${query ? `?${query}` : ""}`,
      { auth: true }
    );
  },

  async getSlowProducts(params?: { limit?: number; periodDays?: number }) {
    const search = new URLSearchParams();

    if (params?.limit) search.set("limit", String(params.limit));
    if (params?.periodDays) search.set("periodDays", String(params.periodDays));

    const query = search.toString();
    return apiRequest<{ periodDays: number; limit: number; data: AdminSlowProduct[] }>(
      `/api/admin/stats/slow-products${query ? `?${query}` : ""}`,
      { auth: true }
    );
  },

  async getTopCustomers(params?: { limit?: number; periodDays?: number }) {
    const search = new URLSearchParams();

    if (params?.limit) search.set("limit", String(params.limit));
    if (params?.periodDays) search.set("periodDays", String(params.periodDays));

    const query = search.toString();
    return apiRequest<{ periodDays: number; limit: number; data: AdminTopCustomer[] }>(
      `/api/admin/stats/top-customers${query ? `?${query}` : ""}`,
      { auth: true }
    );
  },

  async exportExcel(params?: { period?: "day" | "week" | "month"; range?: number }) {
    const search = new URLSearchParams();

    if (params?.period) search.set("period", params.period);
    if (params?.range) search.set("range", String(params.range));

    const query = search.toString();
    const fileName = `thongke_${new Date().toISOString().slice(0, 10)}.xlsx`;

    return downloadWithAuth(
      `/api/admin/stats/export-excel${query ? `?${query}` : ""}`,
      fileName
    );
  },
};