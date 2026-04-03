import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Bot, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Newsletter */}
      <div className="border-b border-primary-foreground/10">
        <div className="container mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold mb-1">Đăng ký nhận ưu đãi</h3>
            <p className="text-sm text-primary-foreground/60">Nhận voucher giảm 10% cho đơn hàng đầu tiên và cập nhật BST mới nhất</p>
          </div>
          <form className="flex gap-2 w-full md:w-auto" onSubmit={e => e.preventDefault()}>
            <Input placeholder="Email của bạn..." className="w-full md:w-72 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40 h-11 rounded-xl" />
            <Button type="submit" className="h-11 rounded-xl px-6 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
              Đăng ký
            </Button>
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-extrabold tracking-tight mb-3">MATEWEAR</h3>
            <p className="text-sm text-primary-foreground/60 leading-relaxed mb-5 max-w-xs">
              Mặc đẹp mỗi ngày, mua sắm thông minh cùng AI. Thương hiệu thời trang Việt Nam dành cho giới trẻ hiện đại.
            </p>
            <div className="flex flex-col gap-3 text-sm text-primary-foreground/70">
              <a href="tel:19008888" className="flex items-center gap-2.5 hover:text-primary-foreground transition-colors">
                <div className="h-8 w-8 rounded-lg bg-primary-foreground/10 flex items-center justify-center"><Phone className="h-4 w-4" /></div>
                <span className="font-semibold">1900 8888</span>
              </a>
              <a href="mailto:support@matewear.vn" className="flex items-center gap-2.5 hover:text-primary-foreground transition-colors">
                <div className="h-8 w-8 rounded-lg bg-primary-foreground/10 flex items-center justify-center"><Mail className="h-4 w-4" /></div>
                support@matewear.vn
              </a>
              <span className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-primary-foreground/10 flex items-center justify-center"><MapPin className="h-4 w-4" /></div>
                123 Nguyễn Huệ, Q.1, TP.HCM
              </span>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-bold mb-4 text-primary-foreground">Về chúng tôi</h4>
            <ul className="space-y-2.5 text-sm text-primary-foreground/60">
              <li><Link to="/" className="hover:text-primary-foreground transition-colors">Giới thiệu</Link></li>
              <li><Link to="/san-pham" className="hover:text-primary-foreground transition-colors">Cửa hàng</Link></li>
              <li><Link to="/" className="hover:text-primary-foreground transition-colors">Tuyển dụng</Link></li>
              <li><Link to="/" className="hover:text-primary-foreground transition-colors">Liên hệ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold mb-4 text-primary-foreground">Chính sách</h4>
            <ul className="space-y-2.5 text-sm text-primary-foreground/60">
              <li><Link to="/" className="hover:text-primary-foreground transition-colors">Chính sách đổi trả</Link></li>
              <li><Link to="/" className="hover:text-primary-foreground transition-colors">Chính sách bảo mật</Link></li>
              <li><Link to="/" className="hover:text-primary-foreground transition-colors">Chính sách vận chuyển</Link></li>
              <li><Link to="/" className="hover:text-primary-foreground transition-colors">Điều khoản dịch vụ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold mb-4 text-primary-foreground">Hỗ trợ</h4>
            <ul className="space-y-2.5 text-sm text-primary-foreground/60">
              <li>
                <Link to="/ai-tu-van" className="flex items-center gap-1.5 hover:text-accent transition-colors">
                  <Bot className="h-3.5 w-3.5" /> AI Tư vấn
                </Link>
              </li>
              <li><Link to="/" className="hover:text-primary-foreground transition-colors">Hướng dẫn mua hàng</Link></li>
              <li><Link to="/" className="hover:text-primary-foreground transition-colors">Hướng dẫn chọn size</Link></li>
              <li><Link to="/don-hang" className="hover:text-primary-foreground transition-colors">Tra cứu đơn hàng</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-primary-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-primary-foreground/40">
          <p>© 2024 MATEWEAR. Tất cả quyền được bảo lưu.</p>
          <p>Đồ án tốt nghiệp — Xây dựng website bán quần áo thời trang kết hợp AI</p>
        </div>
      </div>
    </footer>
  );
}
