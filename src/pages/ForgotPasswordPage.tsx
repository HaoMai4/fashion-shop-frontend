import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { forgotPassword } from '@/services/api/userService';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      toast.error('Vui lòng nhập email');
      return;
    }

    try {
      setLoading(true);
      const res = await forgotPassword(normalizedEmail);

      toast.success(res?.message || 'Đã gửi mã OTP đến email của bạn');
      navigate(`/dat-lai-mat-khau?email=${encodeURIComponent(normalizedEmail)}`);
    } catch (error: any) {
      toast.error(error?.message || 'Không thể gửi OTP đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-md rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Mail className="h-6 w-6" />
          </div>

          <h1 className="mb-2 text-2xl font-bold">Quên mật khẩu</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Nhập email tài khoản để nhận mã OTP đặt lại mật khẩu.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Đang gửi OTP...' : 'Gửi mã OTP'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Nhớ mật khẩu?{' '}
            <Link to="/dang-nhap" className="font-medium text-primary hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </MainLayout>
  );
}