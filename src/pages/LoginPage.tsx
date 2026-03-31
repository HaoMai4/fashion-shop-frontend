import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MainLayout from '@/components/layout/MainLayout';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // PRODUCTION: Call POST /api/auth/login
    toast.success('Đăng nhập thành công!');
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16 max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Đăng nhập</h1>
          <p className="text-muted-foreground text-sm">Chào mừng bạn quay lại MATEWEAR</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>Email</Label><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" /></div>
          <div>
            <Label>Mật khẩu</Label>
            <div className="relative">
              <Input type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </div>
          <div className="flex justify-end"><button type="button" className="text-xs text-accent hover:underline">Quên mật khẩu?</button></div>
          <Button type="submit" className="w-full" size="lg">Đăng nhập</Button>
        </form>
        <p className="text-center text-sm mt-6 text-muted-foreground">Chưa có tài khoản? <Link to="/dang-ky" className="text-accent font-medium hover:underline">Đăng ký ngay</Link></p>
      </div>
    </MainLayout>
  );
}
