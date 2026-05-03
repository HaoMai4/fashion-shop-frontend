import { apiRequest } from './apiClient';

export interface ReviewUser {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface ReviewProduct {
  _id?: string;
  name?: string;
  slug?: string;
}

export interface AdminReply {
  message?: string;
  repliedAt?: string;
  admin?: ReviewUser | null;
  adminId?: ReviewUser | string | null;
}

export interface ProductReview {
  _id: string;
  productId?: string | ReviewProduct;
  userId?: string | ReviewUser;
  variantId?: string | null;
  color?: string;
  colorCode?: string;
  size?: string;
  rating: number;
  comment?: string;
  adminReply?: AdminReply | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReviewListResponse {
  productId: string;
  total: number;
  page: number;
  perPage: number;
  reviews: ProductReview[];
}

export interface CreateReviewPayload {
  rating: number;
  comment: string;
}

export const reviewService = {
  getReviewsBySlug: async (
    slug: string,
    page = 1,
    limit = 10
  ): Promise<ReviewListResponse> => {
    return apiRequest<ReviewListResponse>(
      `/api/products/details/${slug}/reviews?page=${page}&limit=${limit}`
    );
  },

  createOrUpdateReview: async (
    productId: string,
    payload: CreateReviewPayload
  ): Promise<{ message: string; review: ProductReview }> => {
    return apiRequest<{ message: string; review: ProductReview }>(
      `/api/products/${productId}/reviews`,
      {
        method: 'POST',
        auth: true,
        body: JSON.stringify(payload),
      }
    );
  },

  updateReview: async (
    reviewId: string,
    payload: CreateReviewPayload
  ): Promise<{ message: string; review: ProductReview }> => {
    return apiRequest<{ message: string; review: ProductReview }>(
      `/api/products/reviews/${reviewId}`,
      {
        method: 'PUT',
        auth: true,
        body: JSON.stringify(payload),
      }
    );
  },

  deleteReview: async (reviewId: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(
      `/api/products/reviews/${reviewId}`,
      {
        method: 'DELETE',
        auth: true,
      }
    );
  },
};