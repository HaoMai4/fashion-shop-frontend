import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MainLayout from '@/components/layout/MainLayout';
import { orderService } from '@/services/api/orderService';
import { DonHang } from '@/types';
import { formatPrice, formatDate } from '@/utils/format';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  cho_xac_nhan: { label: 'Chờ xác nhận', variant: 'secondary' },
  dang_giao: { label: 'Đang giao', variant: 'default' },
  hoan_thanh: { label: 'Hoàn thành', variant: 'outline' },
  da_huy: { label: 'Đã hủy', variant: 'destructive' },
};

export default function OrderHistory() {
  const [orders, setOrders] = useState<DonHang[]>([]);

  useEffect(() => {
    orderService.getByCustomerId(1).then(setOrders);
  }, []);

  if (orders.length === 0) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Chưa có đơn hàng</h1>
          <p className="text-muted-foreground mb-6">Hãy bắt đầu mua sắm ngay!</p>
          <Button asChild><Link to="/san-pham">Mua sắm ngay</Link></Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">Lịch sử đơn hàng</h1>
        <div className="space-y-4">
          {orders.map(order => {
            const status = statusConfig[order.trangThai];
            return (
              <div key={order.id} className="rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold">{order.maDonHang}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.ngayDat)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  {order.chiTiet.map(item => (
                    <div key={item.id} className="flex items-center gap-3">
                      <img src={item.sanPham.hinhAnh[0]} alt="" className="h-12 w-12 rounded-lg object-cover bg-secondary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{item.sanPham.ten}</p>
                        <p className="text-xs text-muted-foreground">{item.mauSac} / {item.kichCo} x{item.soLuong}</p>
                      </div>
                      <span className="text-sm font-medium">{formatPrice(item.gia * item.soLuong)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm text-muted-foreground">{order.phuongThucThanhToan}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">{formatPrice(order.tongTien)}</span>
                    <Button variant="outline" size="sm" className="gap-1"><Eye className="h-3.5 w-3.5" /> Chi tiết</Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
