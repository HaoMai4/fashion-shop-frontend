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

    return apiRequest(`/api/orders?${qs.toString()}`, {
      auth: true,
    });
  },

  async getOrderByCode(orderCode: string) {
    return apiRequest(`/api/orders/code/${orderCode}`);
  },
};