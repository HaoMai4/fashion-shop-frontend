import { apiRequest } from './apiClient';

const TOKEN_KEY = 'stylehub_token';
const LEGACY_TOKEN_KEY = 'token';

const CATEGORY_API_PREFIX = '/api/categories';

export type CategoryGroup = 'nam' | 'nu' | 'the-thao' | 'phu-kien' | 'unisex';
export type CategoryType = 'ao' | 'quan' | 'vay' | 'phu-kien' | 'do-the-thao' | 'khac';
export type CategoryStatus = 'active' | 'inactive';

export interface CategoryRecord {
  _id: string;
  name: string;
  slug: string;
  path: string;
  parentId?:
  | string
  | {
    _id?: string;
    name?: string;
    slug?: string;
    path?: string;
    level?: number;
    group?: CategoryGroup;
    type?: CategoryType;
  }
  | null;
  level?: number;
  group?: CategoryGroup;
  type?: CategoryType;
  sortOrder?: number;
  status?: CategoryStatus;
  children?: CategoryRecord[];
  productCount?: number;
  childrenCount?: number;
  canDelete?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryPayload {
  name: string;
  slug: string;
  path?: string;
  parentId?: string | null;
  group?: CategoryGroup;
  type?: CategoryType;
  sortOrder?: number;
  status?: CategoryStatus;
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
}

function getAuthHeaders() {
  const token = getToken();

  return {
    Authorization: `Bearer ${token || ''}`,
  };
}

function buildPath(path = '') {
  return `${CATEGORY_API_PREFIX}${path}`;
}

function extractCategory(raw: any): CategoryRecord {
  return raw?.category || raw?.data || raw;
}

function extractCategories(raw: any): CategoryRecord[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.categories)) return raw.categories;
  return [];
}

export async function getCategories(params?: {
  tree?: boolean;
  group?: CategoryGroup;
  type?: CategoryType;
  status?: CategoryStatus;
  parentId?: string | null;
}): Promise<CategoryRecord[]> {
  const qs = new URLSearchParams();

  if (params?.tree) qs.set('tree', 'true');
  if (params?.group) qs.set('group', params.group);
  if (params?.type) qs.set('type', params.type);
  if (params?.status) qs.set('status', params.status);

  if (params && 'parentId' in params) {
    qs.set('parentId', params.parentId || 'null');
  }

  const query = qs.toString();
  const raw = await apiRequest<any>(buildPath(query ? `?${query}` : ''), {
    method: 'GET',
  });

  return extractCategories(raw);
}

export async function getCategoryTree(): Promise<CategoryRecord[]> {
  const raw = await apiRequest<any>(buildPath('/tree'), {
    method: 'GET',
  });

  return extractCategories(raw);
}

export async function createCategory(payload: CategoryPayload): Promise<CategoryRecord> {
  const raw = await apiRequest<any>(buildPath('/add-categories'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return extractCategory(raw);
}

export async function updateCategory(
  currentSlug: string,
  payload: CategoryPayload
): Promise<CategoryRecord> {
  const raw = await apiRequest<any>(buildPath(`/${encodeURIComponent(currentSlug)}`), {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return extractCategory(raw);
}

export async function deleteCategory(slug: string): Promise<{ message?: string }> {
  return apiRequest<any>(buildPath(`/${encodeURIComponent(slug)}`), {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
}

export const categoryService = {
  getCategories,
  getCategoryTree,
  createCategory,
  updateCategory,
  deleteCategory,
};