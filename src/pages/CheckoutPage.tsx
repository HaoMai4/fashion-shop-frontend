import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import MainLayout from '@/components/layout/MainLayout';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/utils/format';

export default function CheckoutPage() {
  const { items, tongTien, clearCart } = useCart();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [form, setForm] = useState({ hoTen: '', sdt: '', email: '', diaChi: '', ghiChu: '' });
  const [shipping, setShipping] = useState('standard');
  const [payment, setPayment] = useState('cod');

  const shippingFee = shipping === 'express' ? 50000 : tongTien >= 500000 ? 0 : 30000;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearCart();
    setStep('success');
  };

  if (step === 'success') {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center max-w-lg animate-fade-in">
          <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Đặt hàng thành công!</h1>
          <p className="text-muted-foreground mb-2">Cảm ơn bạn đã mua sắm tại MATEWEAR.</p>
          <p className="text-sm text-muted-foreground mb-6">Mã đơn hàng: <span className="font-semibold text-foreground">MW{Date.now().toString().slice(-8)}</span></p>
          <div className="flex gap-3 justify-center">
            <Button asChild><Link to="/">Về trang chủ</Link></Button>
            <Button variant="outline" asChild><Link to="/don-hang">Xem đơn hàng</Link></Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (items.length === 0) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-lg font-medium mb-4">Giỏ hàng trống</p>
          <Button asChild><Link to="/san-pham">Mua sắm ngay</Link></Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Link to="/gio-hang" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Quay lại giỏ hàng
        </Link>
        <h1 className="text-2xl font-bold mb-8">Thanh toán</h1>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            {/* Customer info */}
            <div className="rounded-xl border border-border p-5 space-y-4">
              <h2 className="font-semibold">Thông tin giao hàng</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label className="text-xs">Họ tên *</Label><Input required value={form.hoTen} onChange={e => setForm({ ...form, hoTen: e.target.value })} placeholder="Nguyễn Văn A" /></div>
                <div><Label className="text-xs">Số điện thoại *</Label><Input required value={form.sdt} onChange={e => setForm({ ...form, sdt: e.target.value })} placeholder="0901234567" /></div>
              </div>
              <div><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" /></div>
              <div><Label className="text-xs">Địa chỉ giao hàng *</Label><Input required value={form.diaChi} onChange={e => setForm({ ...form, diaChi: e.target.value })} placeholder="123 Nguyễn Huệ, Quận 1, TP.HCM" /></div>
              <div><Label className="text-xs">Ghi chú</Label><Input value={form.ghiChu} onChange={e => setForm({ ...form, ghiChu: e.target.value })} placeholder="Ghi chú cho đơn hàng..." /></div>
            </div>

            {/* Shipping */}
            <div className="rounded-xl border border-border p-5 space-y-3">
              <h2 className="font-semibold">Phương thức vận chuyển</h2>
              <RadioGroup value={shipping} onValueChange={setShipping} className="space-y-2">
                <label className="flex items-center justify-between rounded-lg border border-border p-3 cursor-pointer hover:bg-secondary/50">
                  <div className="flex items-center gap-3"><RadioGroupItem value="standard" /><div><p className="text-sm font-medium">Giao hàng tiêu chuẩn</p><p className="text-xs text-muted-foreground">3-5 ngày làm việc</p></div></div>
                  <span className="text-sm font-medium">{tongTien >= 500000 ? 'Miễn phí' : '30.000₫'}</span>
                </label>
                <label className="flex items-center justify-between rounded-lg border border-border p-3 cursor-pointer hover:bg-secondary/50">
                  <div className="flex items-center gap-3"><RadioGroupItem value="express" /><div><p className="text-sm font-medium">Giao hàng nhanh</p><p className="text-xs text-muted-foreground">1-2 ngày làm việc</p></div></div>
                  <span className="text-sm font-medium">50.000₫</span>
                </label>
              </RadioGroup>
            </div>

            {/* Payment */}
            <div className="rounded-xl border border-border p-5 space-y-3">
              <h2 className="font-semibold">Phương thức thanh toán</h2>
              <RadioGroup value={payment} onValueChange={setPayment} className="space-y-2">
                <label className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-secondary/50">
                  <RadioGroupItem value="cod" /><div><p className="text-sm font-medium">Thanh toán khi nhận hàng (COD)</p></div>
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-secondary/50">
                  <RadioGroupItem value="bank" /><div><p className="text-sm font-medium">Chuyển khoản ngân hàng</p></div>
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-secondary/50">
                  <RadioGroupItem value="ewallet" /><div><p className="text-sm font-medium">Ví điện tử (MoMo, ZaloPay)</p></div>
                </label>
              </RadioGroup>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border p-5 sticky top-20 space-y-4">
              <h2 className="font-semibold">Đơn hàng ({items.length} sản phẩm)</h2>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <img src={item.sanPham.hinhAnh[0]} alt="" className="h-14 w-14 rounded-lg object-cover bg-secondary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium line-clamp-1">{item.sanPham.ten}</p>
                      <p className="text-[11px] text-muted-foreground">{item.mauSac} / {item.kichCo} x{item.soLuong}</p>
                      <p className="text-xs font-bold">{formatPrice(item.gia * item.soLuong)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-3 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Tạm tính</span><span>{formatPrice(tongTien)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Phí vận chuyển</span><span>{shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}</span></div>
                <div className="flex justify-between font-bold text-base border-t border-border pt-2"><span>Tổng cộng</span><span>{formatPrice(tongTien + shippingFee)}</span></div>
              </div>
              <Button type="submit" size="lg" className="w-full">Đặt hàng</Button>
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
