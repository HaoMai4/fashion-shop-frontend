import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import MainLayout from '@/components/layout/MainLayout';
import { toast } from 'sonner';

export default function RegisterPage() {
  const [form, setForm] = useState({ hoTen: '', email: '', sdt: '', password: '', confirmPw: '' });
  const [showPw, setShowPw] = useState(false);
  const [agree, setAgree] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPw) { toast.error('Mật khẩu không khớp!'); return; }
    if (!agree) { toast.error('Vui lòng đồng ý điều khoản'); return; }
    toast.success('Đăng ký thành công!');
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16 max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Đăng ký</h1>
          <p className="text-muted-foreground text-sm">Tạo tài khoản MATEWEAR để mua sắm</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>Họ tên</Label><Input required value={form.hoTen} onChange={e => setForm({ ...form, hoTen: e.target.value })} placeholder="Nguyễn Văn A" /></div>
          <div><Label>Email</Label><Input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" /></div>
          <div><Label>Số điện thoại</Label><Input required value={form.sdt} onChange={e => setForm({ ...form, sdt: e.target.value })} placeholder="0901234567" /></div>
          <div>
            <Label>Mật khẩu</Label>
            <div className="relative">
              <Input type={showPw ? 'text' : 'password'} required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Tối thiểu 6 ký tự" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </div>
          <div><Label>Xác nhận mật khẩu</Label><Input type="password" required value={form.confirmPw} onChange={e => setForm({ ...form, confirmPw: e.target.value })} placeholder="Nhập lại mật khẩu" /></div>
          <label className="flex items-start gap-2 cursor-pointer">
            <Checkbox checked={agree} onCheckedChange={v => setAgree(!!v)} className="mt-0.5" />
            <span className="text-xs text-muted-foreground">Tôi đồng ý với <span className="text-accent">Điều khoản dịch vụ</span> và <span className="text-accent">Chính sách bảo mật</span> của MATEWEAR</span>
          </label>
          <Button type="submit" className="w-full" size="lg">Đăng ký</Button>
        </form>
        <p className="text-center text-sm mt-6 text-muted-foreground">Đã có tài khoản? <Link to="/dang-nhap" className="text-accent font-medium hover:underline">Đăng nhập</Link></p>
      </div>
    </MainLayout>
  );
}
