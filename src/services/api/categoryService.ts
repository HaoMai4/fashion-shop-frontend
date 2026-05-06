import { apiRequest } from './apiClient';

const TOKEN_KEY = 'stylehub_token';
const LEGACY_TOKEN_KEY = 'token';

const CATEGORY_API_PREFIX = '/api/categories';

export interface CategoryRecord {
  _id: string;
  name: string;
  slug: string;
  path: string;
}

export interface CategoryPayload {
  name: string;
  slug: string;
  path: string;
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

export async function getCategories(): Promise<CategoryRecord[]> {
  const raw = await apiRequest<any>(buildPath(), {
    method: 'GET',
  });

  return Array.isArray(raw) ? raw : raw?.data || raw?.categories || [];
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
  createCategory,
  updateCategory,
  deleteCategory,
};