import { useState, useEffect } from 'react';
import { Package, ShoppingBag, Users, DollarSign, Bot, TrendingUp, MessageCircle, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import MainLayout from '@/components/layout/MainLayout';
import { sanPhamData } from '@/data/products';
import { donHangData } from '@/data/orders';
import { formatPrice } from '@/utils/format';

const stats = [
  { icon: Package, label: 'Tổng sản phẩm', value: '22', color: 'text-accent' },
  { icon: ShoppingBag, label: 'Tổng đơn hàng', value: '1,245', color: 'text-success' },
  { icon: Users, label: 'Tổng khách hàng', value: '3,680', color: 'text-warning' },
  { icon: DollarSign, label: 'Doanh thu', value: '458.5M₫', color: 'text-accent' },
];

const chatbotStats = [
  { label: 'Câu hỏi phổ biến', value: 'Tư vấn size' },
  { label: 'Lượt tư vấn hôm nay', value: '127' },
  { label: 'Nhu cầu nhiều nhất', value: 'Đồ thể thao nam' },
  { label: 'Tỉ lệ hài lòng', value: '94%' },
];

export default function AdminPage() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Quản trị hệ thống</h1>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <Card key={s.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                  <TrendingUp className="h-4 w-4 text-success" />
                </div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Products table */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Quản lý sản phẩm</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Giá</TableHead>
                    <TableHead>Tồn kho</TableHead>
                    <TableHead>Đã bán</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sanPhamData.slice(0, 8).map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs font-medium max-w-[150px] truncate">{p.ten}</TableCell>
                      <TableCell className="text-xs">{formatPrice(p.gia)}</TableCell>
                      <TableCell className="text-xs">{p.soLuongTon}</TableCell>
                      <TableCell className="text-xs">{p.daBan.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Orders table */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Đơn hàng gần đây</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã đơn</TableHead>
                    <TableHead>Tổng tiền</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donHangData.map(o => (
                    <TableRow key={o.id}>
                      <TableCell className="text-xs font-medium">{o.maDonHang}</TableCell>
                      <TableCell className="text-xs">{formatPrice(o.tongTien)}</TableCell>
                      <TableCell>
                        <Badge variant={o.trangThai === 'hoan_thanh' ? 'outline' : o.trangThai === 'da_huy' ? 'destructive' : 'default'} className="text-[10px]">
                          {o.trangThai === 'cho_xac_nhan' ? 'Chờ xác nhận' : o.trangThai === 'dang_giao' ? 'Đang giao' : o.trangThai === 'hoan_thanh' ? 'Hoàn thành' : 'Đã hủy'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Chatbot Analytics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Bot className="h-5 w-5 text-accent" /> Chatbot AI Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {chatbotStats.map(s => (
                <div key={s.label} className="rounded-lg bg-secondary/50 p-4 text-center">
                  <p className="text-lg font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
