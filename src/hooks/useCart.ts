import { useState, useCallback, useEffect } from 'react';
import { ChiTietGioHang, SanPham } from '@/types';
import { toast } from 'sonner';

const CART_KEY = 'matewear_cart';
const CART_UPDATED_EVENT = 'stylehub_cart_updated';

type AddItemOptions = {
  variantId: string;
  price?: number;
  image?: string;
  stock?: number;
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

function getMaxStock(item?: ChiTietGioHang | null) {
  if (!item) return 0;

  return Number(item.sanPham?.soLuongTon || 0);
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
      kichCo: string,
      mauSac: string,
      soLuong = 1,
      options?: AddItemOptions
    ) => {
      if (!options?.variantId) {
        toast.error('Thiếu variantId, không thể thêm vào giỏ hàng');
        return;
      }

      if (!kichCo) {
        toast.error('Vui lòng chọn kích cỡ');
        return;
      }

      if (!mauSac) {
        toast.error('Vui lòng chọn màu sắc');
        return;
      }

      const quantityToAdd = Number(soLuong || 0);

      if (!quantityToAdd || quantityToAdd <= 0) {
        toast.error('Số lượng sản phẩm không hợp lệ');
        return;
      }

      const stockFromOption = Number(options.stock || 0);
      const stockFromProduct = Number(product.soLuongTon || 0);
      const maxStock = stockFromOption > 0 ? stockFromOption : stockFromProduct;

      if (maxStock > 0 && quantityToAdd > maxStock) {
        toast.error(`Sản phẩm này chỉ còn ${maxStock} sản phẩm`);
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

        const cartProduct: SanPham = {
          ...product,
          soLuongTon: maxStock > 0 ? maxStock : product.soLuongTon,
          hinhAnh: finalImage,
        };

        let next: ChiTietGioHang[];

        if (existing) {
          const currentQuantity = Number(existing.soLuong || 0);
          const nextQuantity = currentQuantity + quantityToAdd;
          const existingMaxStock = getMaxStock(existing) || maxStock;

          if (existingMaxStock > 0 && nextQuantity > existingMaxStock) {
            toast.error(`Sản phẩm này chỉ còn ${existingMaxStock} sản phẩm`);
            return prev;
          }

          next = prev.map((i) =>
            i.id === existing.id
              ? {
                  ...i,
                  sanPham: {
                    ...cartProduct,
                    soLuongTon: existingMaxStock || cartProduct.soLuongTon,
                  },
                  mauSac,
                  kichCo,
                  gia: finalPrice,
                  hinhAnh: finalImage,
                  soLuong: nextQuantity,
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
              sanPham: cartProduct,
              mauSac,
              kichCo,
              soLuong: quantityToAdd,
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
    const nextQuantity = Number(soLuong || 0);

    if (!nextQuantity || nextQuantity < 1) {
      return;
    }

    setItems((prev) => {
      const current = prev.find((i) => i.id === id);

      if (!current) {
        return prev;
      }

      const maxStock = getMaxStock(current);

      if (maxStock > 0 && nextQuantity > maxStock) {
        toast.error(`Sản phẩm này chỉ còn ${maxStock} sản phẩm`);
        return prev;
      }

      const next = prev.map((i) =>
        i.id === id ? { ...i, soLuong: nextQuantity } : i
      );

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