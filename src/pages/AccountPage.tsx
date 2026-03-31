import { Link } from 'react-router-dom';
import { User, MapPin, Package, Heart, Award, Bot, ChevronRight, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';

const menuItems = [
  { icon: User, label: 'Thông tin cá nhân', href: '#info' },
  { icon: MapPin, label: 'Địa chỉ giao hàng', href: '#address' },
  { icon: Package, label: 'Đơn hàng của tôi', href: '/don-hang' },
  { icon: Heart, label: 'Sản phẩm yêu thích', href: '/yeu-thich' },
  { icon: Award, label: 'Điểm thành viên', href: '#loyalty' },
  { icon: Bot, label: 'Lịch sử AI tư vấn', href: '/ai-tu-van' },
];

export default function AccountPage() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Profile header */}
        <div className="flex items-center gap-4 mb-8 p-6 rounded-xl border border-border bg-card">
          <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center text-2xl font-bold text-accent">N</div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Nguyễn Minh Tuấn</h1>
            <p className="text-sm text-muted-foreground">tuan.nguyen@email.com</p>
            <div className="flex items-center gap-2 mt-1">
              <Award className="h-4 w-4 text-warning" />
              <span className="text-xs font-medium text-warning">Thành viên Vàng</span>
              <span className="text-xs text-muted-foreground">• 1,250 điểm</span>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="space-y-2 mb-8">
          {menuItems.map(item => (
            <Link key={item.label} to={item.href} className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>

        {/* Info section */}
        <div className="rounded-xl border border-border p-6 space-y-4 mb-6">
          <h2 className="font-semibold">Thông tin cá nhân</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Họ tên:</span> <span className="font-medium">Nguyễn Minh Tuấn</span></div>
            <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">tuan.nguyen@email.com</span></div>
            <div><span className="text-muted-foreground">Số điện thoại:</span> <span className="font-medium">0901234567</span></div>
            <div><span className="text-muted-foreground">Ngày tham gia:</span> <span className="font-medium">15/01/2024</span></div>
          </div>
        </div>

        <div className="rounded-xl border border-border p-6 space-y-4 mb-6">
          <h2 className="font-semibold">Địa chỉ giao hàng</h2>
          <div className="rounded-lg bg-secondary/50 p-4 text-sm">
            <p className="font-medium">Nguyễn Minh Tuấn</p>
            <p className="text-muted-foreground">0901234567</p>
            <p className="text-muted-foreground">123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh</p>
          </div>
        </div>

        <Button variant="outline" className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/5">
          <LogOut className="h-4 w-4" /> Đăng xuất
        </Button>
      </div>
    </MainLayout>
  );
}
