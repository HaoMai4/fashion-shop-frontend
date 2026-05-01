import { apiRequest } from './apiClient';

const TOKEN_KEY = 'stylehub_token';
const LEGACY_TOKEN_KEY = 'token';
const USER_KEY = 'stylehub_user';

const USER_API_PREFIX = '/api/users';

export interface UserProfile {
  _id?: string;
  id?: string;
  hoTen?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  sdt?: string;
  phone?: string;
  role?: string;
  avatar?: string;
  diaChi?: string;
  address?: string;
  gender?: string;
  dateOfBirth?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  hoTen: string;
  email: string;
  password: string;
  sdt: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface WishlistResponse {
  message?: string;
  wishlist?: any[];
  data?: any[];
}

function buildPath(path: string) {
  return `${USER_API_PREFIX}${path}`;
}

function getAuthHeaders() {
  const token = getToken();

  return {
    Authorization: `Bearer ${token || ''}`,
  };
}

function normalizeUser(raw: any): UserProfile {
  if (!raw) {
    return {
      email: '',
    };
  }

  return {
    _id: raw._id || raw.id,
    id: raw.id || raw._id,
    hoTen:
      raw.hoTen ||
      raw.fullName ||
      [raw.firstName, raw.lastName].filter(Boolean).join(' ').trim(),
    firstName: raw.firstName,
    lastName: raw.lastName,
    email: raw.email || '',
    sdt: raw.sdt || raw.phone,
    phone: raw.phone || raw.sdt,
    role: raw.role,
    avatar: raw.avatar,
    diaChi: raw.diaChi || raw.address,
    address: raw.address || raw.diaChi,
    gender: raw.gender,
    dateOfBirth: raw.dateOfBirth,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function normalizeAuthResponse(raw: any): AuthResponse {
  const token =
    raw?.token ||
    raw?.accessToken ||
    raw?.data?.token ||
    raw?.data?.accessToken ||
    '';

  const userRaw =
    raw?.user ||
    raw?.data?.user ||
    raw?.data ||
    raw;

  return {
    token,
    user: normalizeUser(userRaw),
  };
}

function splitFullName(fullName: string) {
  const trimmed = fullName.trim();

  if (!trimmed) {
    return { firstName: '', lastName: '' };
  }

  const parts = trimmed.split(/\s+/);

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }

  const lastName = parts.pop() || '';
  const firstName = parts.join(' ');

  return { firstName, lastName };
}

function extractWishlist(raw: any): any[] {
  const list =
    raw?.wishlist ||
    raw?.data ||
    raw?.items ||
    raw;

  return Array.isArray(list) ? list : [];
}

export function saveAuth(auth: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, auth.token);
  localStorage.setItem(LEGACY_TOKEN_KEY, auth.token);
  localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
}

export function getStoredUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return !!getToken();
}

export async function login(data: LoginPayload): Promise<AuthResponse> {
  const raw = await apiRequest<any>(buildPath('/login'), {
    method: 'POST',
    body: JSON.stringify({
      email: data.email,
      matKhau: data.password,
      password: data.password,
    }),
  });

  const normalized = normalizeAuthResponse(raw);
  saveAuth(normalized);
  return normalized;
}

export async function register(data: RegisterPayload): Promise<AuthResponse> {
  const { firstName, lastName } = splitFullName(data.hoTen);

  const raw = await apiRequest<any>(buildPath('/register'), {
    method: 'POST',
    body: JSON.stringify({
      hoTen: data.hoTen,
      email: data.email,
      sdt: data.sdt,
      phone: data.sdt,
      matKhau: data.password,
      password: data.password,
      firstName,
      lastName,
    }),
  });

  const normalized = normalizeAuthResponse(raw);
  saveAuth(normalized);
  return normalized;
}

export async function getMe(): Promise<UserProfile> {
  const raw = await apiRequest<any>(buildPath('/me'), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const user = normalizeUser(raw?.user || raw?.data || raw);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export async function updateMe(payload: Partial<UserProfile>): Promise<UserProfile> {
  const raw = await apiRequest<any>(buildPath('/me'), {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const user = normalizeUser(raw?.user || raw?.data || raw);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

// =========================
// Wishlist
// =========================
export async function getWishlist(): Promise<any[]> {
  const raw = await apiRequest<WishlistResponse>(buildPath('/wishlist'), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return extractWishlist(raw);
}

export async function addToWishlist(productId: string): Promise<any[]> {
  const raw = await apiRequest<WishlistResponse>(buildPath(`/wishlist/${productId}`), {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  return extractWishlist(raw);
}

export async function removeFromWishlist(productId: string): Promise<any[]> {
  const raw = await apiRequest<WishlistResponse>(buildPath(`/wishlist/${productId}`), {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  return extractWishlist(raw);
}