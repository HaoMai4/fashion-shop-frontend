import { useState, useCallback } from 'react';
import { SanPham } from '@/types';
import { toast } from 'sonner';

const WISHLIST_KEY = 'matewear_wishlist';

function loadWishlist(): SanPham[] {
  try {
    const data = localStorage.getItem(WISHLIST_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveWishlist(items: SanPham[]) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
}

export function useWishlist() {
  const [items, setItems] = useState<SanPham[]>(loadWishlist);

  const addItem = useCallback((product: SanPham) => {
    setItems(prev => {
      if (prev.find(p => p.id === product.id)) {
        toast.info('Sản phẩm đã có trong danh sách yêu thích!');
        return prev;
      }
      const next = [...prev, product];
      saveWishlist(next);
      toast.success(`Đã thêm ${product.ten} vào yêu thích!`);
      return next;
    });
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems(prev => {
      const next = prev.filter(p => p.id !== productId);
      saveWishlist(next);
      toast.success('Đã xóa khỏi danh sách yêu thích');
      return next;
    });
  }, []);

  const isInWishlist = useCallback((productId: number) => {
    return items.some(p => p.id === productId);
  }, [items]);

  return { items, addItem, removeItem, isInWishlist };
}
