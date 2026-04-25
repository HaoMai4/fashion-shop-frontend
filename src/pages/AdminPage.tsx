import { Link } from 'react-router-dom';
import { Package, ShoppingBag, BarChart3, FileText } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const adminModules = [
  {
    title: 'Quản lý đơn hàng',
    description: 'Xem danh sách đơn, lọc trạng thái, xem chi tiết và cập nhật trạng thái đơn hàng.',
    href: '/admin/orders',
    icon: ShoppingBag,
    enabled: true,
  },
  {
    title: 'Yêu cầu hủy đơn',
    description: 'Xem danh sách yêu cầu hủy đơn và duyệt yêu cầu hủy từ khách hàng.',
    href: '/admin/order-reports',
    icon: FileText,
    enabled: true,
  },
  {
    title: 'Quản lý sản phẩm',
    description: 'Quản lý sản phẩm gốc, biến thể, size, giá, tồn kho và xóa variant.',
    href: '/admin/products',
    icon: Package,
    enabled: true,
  },
  {
    title: 'Thống kê',
    description: 'Xem tổng quan đơn hàng, doanh thu, top sản phẩm, sản phẩm bán chậm và top khách hàng.',
    href: '/admin/stats',
    icon: BarChart3,
    enabled: true,
  },
];

export default function AdminPage() {
  return (
    <MainLayout>
      <div className="container mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Quản trị hệ thống</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Các module admin hiện có cho demo.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {adminModules.map((module) => {
            const Icon = module.icon;

            return (
              <Card key={module.title} className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-base">
                    <Icon className="h-5 w-5" />
                    {module.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{module.description}</p>

                  {module.enabled ? (
                    <Button asChild className="w-full">
                      <Link to={module.href}>Mở module</Link>
                    </Button>
                  ) : (
                    <Button className="w-full" variant="outline" disabled>
                      Chưa làm bước này
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}