import { useState, useCallback, useEffect } from 'react';
import { ChiTietGioHang, SanPham } from '@/types';
import { toast } from 'sonner';

const CART_KEY = 'matewear_cart';
const CART_UPDATED_EVENT = 'stylehub_cart_updated';

type AddItemOptions = {
  variantId: string;
  price?: number;
  image?: string;
};

function notifyCartUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CART_UPDATED_EVENT));
  }
}

function loadCart(): ChiTietGioHang[] {
  try {
    const data = localStorage.getItem(CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveCart(items: ChiTietGioHang[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function useCart() {
  const [items, setItems] = useState<ChiTietGioHang[]>(loadCart);

  useEffect(() => {
    const handleCartUpdated = () => {
      setItems(loadCart());
    };

    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdated);
    window.addEventListener('storage', handleCartUpdated);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdated);
      window.removeEventListener('storage', handleCartUpdated);
    };
  }, []);

  const addItem = useCallback(
    (
      product: SanPham,
      mauSac: string,
      kichCo: string,
      soLuong = 1,
      options?: AddItemOptions
    ) => {
      if (!options?.variantId) {
        toast.error('Thiếu variantId, không thể thêm vào giỏ hàng');
        return;
      }

      setItems((prev) => {
        const existing = prev.find(
          (i) =>
            i.productId === product.id &&
            i.variantId === options.variantId &&
            i.kichCo === kichCo
        );

        const finalPrice = options.price ?? product.gia;
        const finalImage = options.image ?? product.hinhAnh;

        let next: ChiTietGioHang[];

        if (existing) {
          next = prev.map((i) =>
            i.id === existing.id
              ? {
                  ...i,
                  sanPham: product,
                  mauSac,
                  kichCo,
                  gia: finalPrice,
                  hinhAnh: finalImage,
                  soLuong: i.soLuong + soLuong,
                }
              : i
          );
        } else {
          next = [
            ...prev,
            {
              id: Date.now(),
              productId: product.id,
              variantId: options.variantId,
              sanPham: product,
              mauSac,
              kichCo,
              soLuong,
              gia: finalPrice,
              hinhAnh: finalImage,
            },
          ];
        }

        saveCart(next);
        notifyCartUpdated();
        toast.success(`Đã thêm ${product.ten} vào giỏ hàng!`);

        return next;
      });
    },
    []
  );

  const removeItem = useCallback((id: number) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      saveCart(next);
      notifyCartUpdated();
      return next;
    });
  }, []);

  const updateQuantity = useCallback((id: number, soLuong: number) => {
    if (soLuong < 1) return;

    setItems((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, soLuong } : i));
      saveCart(next);
      notifyCartUpdated();
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(CART_KEY);
    notifyCartUpdated();
  }, []);

  const tongTien = items.reduce((sum, i) => sum + i.gia * i.soLuong, 0);
  const tongSoLuong = items.reduce((sum, i) => sum + i.soLuong, 0);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    tongTien,
    tongSoLuong,
  };
}