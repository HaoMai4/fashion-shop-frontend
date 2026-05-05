import { apiRequest } from "./apiClient";

export type CreateOrderPayload = {
  items: Array<{
    productId: string;
    variantId: string;
    size: string;
    quantity: number;
  }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    email?: string;
    addressLine?: string;
    addressLine1?: string;
    addressLine2?: string;
    ward?: string;
    district?: string;
    city?: string;
    postalCode?: string;
  };
  paymentMethod: {
    type: "COD" | "PayOS";
    note?: string;
  };
  guestInfo?: {
    fullName: string;
    email: string;
    phone: string;
  };
  customerNote?: string;
  voucherCode?: string;
  shippingFee?: number;
};

export const orderService = {
  async createOrder(payload: CreateOrderPayload) {
    return apiRequest("/api/orders/create-orders", {
      method: "POST",
      body: JSON.stringify(payload),
      auth: true,
    });
  },

  async getMyOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const qs = new URLSearchParams();

    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.status) qs.set("status", params.status);
    if (params?.sortBy) qs.set("sortBy", params.sortBy);
    if (params?.sortOrder) qs.set("sortOrder", params.sortOrder);

    const queryString = qs.toString();

    return apiRequest(`/api/orders${queryString ? `?${queryString}` : ""}`, {
      auth: true,
    });
  },

  async getMyOrderDetail(orderCode: string) {
    return apiRequest(`/api/orders/my-orders/${encodeURIComponent(orderCode)}`, {
      auth: true,
    });
  },

  async getOrderByCode(orderCode: string) {
    return apiRequest(`/api/orders/code/${encodeURIComponent(orderCode)}`);
  },

  async requestOrderCancellation(
    orderId: string,
    payload: {
      reason: string;
    }
  ) {
    return apiRequest(`/api/orders/${encodeURIComponent(orderId)}/report`, {
      method: "POST",
      body: JSON.stringify(payload),
      auth: true,
    });
  },

  async getAdminOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    export?: "csv";
    countsOnly?: boolean;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const qs = new URLSearchParams();

    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.status) qs.set("status", params.status);
    if (params?.sortBy) qs.set("sortBy", params.sortBy);
    if (params?.sortOrder) qs.set("sortOrder", params.sortOrder);
    if (params?.export) qs.set("export", params.export);
    if (params?.countsOnly) qs.set("countsOnly", "true");
    if (params?.dateFrom) qs.set("dateFrom", params.dateFrom);
    if (params?.dateTo) qs.set("dateTo", params.dateTo);

    const queryString = qs.toString();

    return apiRequest(`/api/orders/admin${queryString ? `?${queryString}` : ""}`, {
      auth: true,
    });
  },

  async updateOrderStatus(
    orderId: string,
    payload: {
      orderStatus?: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "completed";
      paymentStatus?: "pending" | "paid" | "failed" | "cancelled";
    }
  ) {
    return apiRequest(`/api/orders/admin/${encodeURIComponent(orderId)}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      auth: true,
    });
  },

  async getAdminOrderReports(params?: {
    page?: number;
    limit?: number;
    status?: string;
    orderId?: string;
  }) {
    const qs = new URLSearchParams();

    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.status) qs.set("status", params.status);
    if (params?.orderId) qs.set("orderId", params.orderId);

    const queryString = qs.toString();

    return apiRequest(`/api/orders/admin/reports${queryString ? `?${queryString}` : ""}`, {
      auth: true,
    });
  },

  async approveOrderReport(reportId: string) {
    return apiRequest(`/api/orders/admin/reports/${encodeURIComponent(reportId)}/approve`, {
      method: "PATCH",
      auth: true,
    });
  },

  async rejectOrderReport(
    reportId: string,
    payload?: {
      reason?: string;
    }
  ) {
    return apiRequest(`/api/orders/admin/reports/${encodeURIComponent(reportId)}/reject`, {
      method: "PATCH",
      body: JSON.stringify(payload || {}),
      auth: true,
    });
  },
};