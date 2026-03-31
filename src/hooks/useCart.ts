import { useState, useCallback } from 'react';
import { ChiTietGioHang, SanPham } from '@/types';
import { toast } from 'sonner';

const CART_KEY = 'matewear_cart';

function loadCart(): ChiTietGioHang[] {
  try {
    const data = localStorage.getItem(CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveCart(items: ChiTietGioHang[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function useCart() {
  const [items, setItems] = useState<ChiTietGioHang[]>(loadCart);

  const addItem = useCallback((product: SanPham, mauSac: string, kichCo: string, soLuong = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.sanPham.id === product.id && i.mauSac === mauSac && i.kichCo === kichCo);
      let next: ChiTietGioHang[];
      if (existing) {
        next = prev.map(i => i === existing ? { ...i, soLuong: i.soLuong + soLuong } : i);
      } else {
        next = [...prev, { id: Date.now(), sanPham: product, mauSac, kichCo, soLuong, gia: product.gia }];
      }
      saveCart(next);
      toast.success(`Đã thêm ${product.ten} vào giỏ hàng!`);
      return next;
    });
  }, []);

  const removeItem = useCallback((id: number) => {
    setItems(prev => {
      const next = prev.filter(i => i.id !== id);
      saveCart(next);
      return next;
    });
  }, []);

  const updateQuantity = useCallback((id: number, soLuong: number) => {
    if (soLuong < 1) return;
    setItems(prev => {
      const next = prev.map(i => i.id === id ? { ...i, soLuong } : i);
      saveCart(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(CART_KEY);
  }, []);

  const tongTien = items.reduce((sum, i) => sum + i.gia * i.soLuong, 0);
  const tongSoLuong = items.reduce((sum, i) => sum + i.soLuong, 0);

  return { items, addItem, removeItem, updateQuantity, clearCart, tongTien, tongSoLuong };
}
