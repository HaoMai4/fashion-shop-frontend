// Mock API service - replace with real REST API calls later
// Example: const API_BASE = 'http://localhost:5000/api';

import { sanPhamData } from '@/data/products';
import { danhMucData } from '@/data/categories';
import { danhGiaData } from '@/data/reviews';
import { SanPham, DanhMuc, DanhGiaSanPham, ProductFilter } from '@/types';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const productService = {
  async getAll(filter?: ProductFilter): Promise<SanPham[]> {
    await delay(300);
    let results = [...sanPhamData];
    if (filter) {
      if (filter.gioiTinh) results = results.filter(p => p.gioiTinh === filter.gioiTinh || p.gioiTinh === 'unisex');
      if (filter.danhMuc) results = results.filter(p => p.danhMuc === filter.danhMuc);
      if (filter.giaMin) results = results.filter(p => p.gia >= filter.giaMin!);
      if (filter.giaMax) results = results.filter(p => p.gia <= filter.giaMax!);
      if (filter.mauSac?.length) results = results.filter(p => p.mauSac.some(m => filter.mauSac!.includes(m.ten)));
      if (filter.kichCo?.length) results = results.filter(p => p.kichCo.some(k => filter.kichCo!.includes(k)));
      if (filter.khuyenMai) results = results.filter(p => p.giaGoc && p.giaGoc > p.gia);
      if (filter.timKiem) {
        const q = filter.timKiem.toLowerCase();
        results = results.filter(p => p.ten.toLowerCase().includes(q) || p.moTa.toLowerCase().includes(q) || p.tags.some(t => t.includes(q)));
      }
      if (filter.sapXep) {
        switch (filter.sapXep) {
          case 'gia_tang': results.sort((a, b) => a.gia - b.gia); break;
          case 'gia_giam': results.sort((a, b) => b.gia - a.gia); break;
          case 'ban_chay': results.sort((a, b) => b.daBan - a.daBan); break;
          case 'moi_nhat': results.sort((a, b) => new Date(b.ngayTao).getTime() - new Date(a.ngayTao).getTime()); break;
        }
      }
    }
    return results;
  },

  async getById(id: number): Promise<SanPham | undefined> {
    await delay(200);
    return sanPhamData.find(p => p.id === id);
  },

  async getBySlug(slug: string): Promise<SanPham | undefined> {
    await delay(200);
    return sanPhamData.find(p => p.slug === slug);
  },

  async getFeatured(): Promise<SanPham[]> {
    await delay(300);
    return sanPhamData.filter(p => p.badge === 'bestseller' || p.daBan > 1500).slice(0, 8);
  },

  async getNewArrivals(): Promise<SanPham[]> {
    await delay(300);
    return sanPhamData.filter(p => p.badge === 'moi').slice(0, 8);
  },

  async getSaleItems(): Promise<SanPham[]> {
    await delay(300);
    return sanPhamData.filter(p => p.giaGoc && p.giaGoc > p.gia).slice(0, 8);
  },

  async getBestSellers(): Promise<SanPham[]> {
    await delay(300);
    return [...sanPhamData].sort((a, b) => b.daBan - a.daBan).slice(0, 8);
  },

  async getRelated(productId: number): Promise<SanPham[]> {
    await delay(300);
    const product = sanPhamData.find(p => p.id === productId);
    if (!product) return [];
    return sanPhamData.filter(p => p.id !== productId && (p.danhMucId === product.danhMucId || p.gioiTinh === product.gioiTinh)).slice(0, 4);
  },

  async search(query: string): Promise<SanPham[]> {
    await delay(200);
    const q = query.toLowerCase();
    return sanPhamData.filter(p => p.ten.toLowerCase().includes(q) || p.moTa.toLowerCase().includes(q) || p.danhMuc.toLowerCase().includes(q) || p.tags.some(t => t.includes(q))).slice(0, 10);
  },

  async getCategories(): Promise<DanhMuc[]> {
    await delay(200);
    return danhMucData;
  },

  async getReviews(productId: number): Promise<DanhGiaSanPham[]> {
    await delay(200);
    return danhGiaData.filter(r => r.sanPhamId === productId);
  },
};
