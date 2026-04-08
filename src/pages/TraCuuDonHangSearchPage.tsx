import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function TraCuuDonHangSearchPage() {
  const navigate = useNavigate();
  const [orderCode, setOrderCode] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedCode = orderCode.trim();

    if (!trimmedCode) {
      toast.error('Vui lòng nhập mã đơn hàng');
      return;
    }

    navigate(`/tra-cuu-don-hang/${trimmedCode}`);
  };

  return (
    <MainLayout>
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Về trang chủ
        </Link>

        <div className="rounded-2xl border border-border p-6 md:p-8">
          <h1 className="mb-2 text-2xl font-bold">Tra cứu đơn hàng</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Nhập mã đơn hàng để xem chi tiết trạng thái, sản phẩm đã đặt và thông tin nhận hàng.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Mã đơn hàng
              </label>
              <Input
                value={orderCode}
                onChange={(e) => setOrderCode(e.target.value)}
                placeholder="Ví dụ: 668333906"
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="gap-2">
                <Search className="h-4 w-4" />
                Tra cứu
              </Button>

              <Button type="button" variant="outline" asChild>
                <Link to="/san-pham">Tiếp tục mua sắm</Link>
              </Button>
            </div>
          </form>

          <div className="mt-6 rounded-xl bg-secondary/50 p-4 text-sm text-muted-foreground">
            Bạn có thể lấy mã đơn hàng ở màn hình đặt hàng thành công hoặc trong tin nhắn/email xác nhận đơn hàng.
          </div>
        </div>
      </div>
    </MainLayout>
  );
}