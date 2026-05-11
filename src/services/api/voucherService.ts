import { apiRequest } from './apiClient';

export interface UserVoucher {
  _id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  maxDiscount?: number | null;
  startAt?: string;
  endAt?: string;
  minOrderValue?: number;
  applicableProducts?: string[];
  applicableCategories?: string[];
  usageLimit?: number | null;
  usedCount?: number;
  perUserLimit?: number | null;
  perUserUsed?: number;
  userRemainingUses?: number | null;
  exhausted?: boolean;
  perUserExceeded?: boolean;
  usable?: boolean;
  title?: string;
  description?: string;
  detail?: string;
  terms?: string;
  visibleToUsers?: boolean;
}

export interface AdminVoucher extends UserVoucher {
  active: boolean;
  combinable?: boolean;
  createdBy?: string;
  usersUsed?: Array<{
    user?: string;
    count?: number;
    _id?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export type VoucherPayload = {
  code: string;
  title?: string;
  description?: string;
  detail?: string;
  terms?: string;
  type: 'percent' | 'fixed';
  value: number;
  maxDiscount?: number | null;
  startAt?: string;
  endAt: string;
  usageLimit?: number | null;
  perUserLimit?: number | null;
  minOrderValue?: number;
  active?: boolean;
  visibleToUsers?: boolean;
  combinable?: boolean;
};

export async function getMyVouchers() {
  return apiRequest<UserVoucher[]>('/api/vouchers/my', {
    method: 'GET',
    auth: true,
  });
}

export async function getAdminVouchers(params?: {
  q?: string;
  active?: boolean;
  visibleToUsers?: boolean;
}) {
  const qs = new URLSearchParams();

  if (params?.q) qs.set('q', params.q);
  if (typeof params?.active === 'boolean') qs.set('active', String(params.active));
  if (typeof params?.visibleToUsers === 'boolean') {
    qs.set('visibleToUsers', String(params.visibleToUsers));
  }

  const queryString = qs.toString();

  return apiRequest<AdminVoucher[]>(
    `/api/vouchers${queryString ? `?${queryString}` : ''}`,
    {
      method: 'GET',
      auth: true,
    }
  );
}

export async function createAdminVoucher(payload: VoucherPayload) {
  return apiRequest<AdminVoucher>('/api/vouchers', {
    method: 'POST',
    body: JSON.stringify(payload),
    auth: true,
  });
}

export async function updateAdminVoucher(id: string, payload: Partial<VoucherPayload>) {
  return apiRequest<AdminVoucher>(`/api/vouchers/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    auth: true,
  });
}

export async function deleteAdminVoucher(id: string) {
  return apiRequest<{ message: string; id: string }>(
    `/api/vouchers/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      auth: true,
    }
  );
}