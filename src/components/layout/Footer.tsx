import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="border-b border-primary-foreground/10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 py-10 md:flex-row">
          <div>
            <h3 className="mb-1 text-lg font-bold">Đăng ký nhận ưu đãi</h3>
            <p className="text-sm text-primary-foreground/60">
              Nhận voucher giảm 10% cho đơn hàng đầu tiên và cập nhật BST mới nhất
            </p>
          </div>

          <form
            className="flex w-full gap-2 md:w-auto"
            onSubmit={(e) => e.preventDefault()}
          >
            <Input
              placeholder="Email của bạn..."
              className="h-11 w-full rounded-xl border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/40 md:w-72"
            />
            <Button
              type="submit"
              className="h-11 rounded-xl bg-accent px-6 font-semibold text-accent-foreground hover:bg-accent/90"
            >
              Đăng ký
            </Button>
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <h3 className="mb-3 text-2xl font-extrabold tracking-tight">MATEWEAR</h3>
            <p className="mb-5 max-w-xs text-sm leading-relaxed text-primary-foreground/60">
              Mặc đẹp mỗi ngày, mua sắm thông minh cùng AI. Thương hiệu thời trang Việt Nam dành cho giới trẻ hiện đại.
            </p>

            <div className="flex flex-col gap-3 text-sm text-primary-foreground/70">
              <a
                href="tel:19008888"
                className="flex items-center gap-2.5 transition-colors hover:text-primary-foreground"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/10">
                  <Phone className="h-4 w-4" />
                </div>
                <span className="font-semibold">1900 8888</span>
              </a>

              <a
                href="mailto:support@matewear.vn"
                className="flex items-center gap-2.5 transition-colors hover:text-primary-foreground"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/10">
                  <Mail className="h-4 w-4" />
                </div>
                support@matewear.vn
              </a>

              <span className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/10">
                  <MapPin className="h-4 w-4" />
                </div>
                123 Nguyễn Huệ, Q.1, TP.HCM
              </span>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold text-primary-foreground">Về chúng tôi</h4>
            <ul className="space-y-2.5 text-sm text-primary-foreground/60">
              <li>
                <Link to="/" className="transition-colors hover:text-primary-foreground">
                  Giới thiệu
                </Link>
              </li>
              <li>
                <Link to="/san-pham" className="transition-colors hover:text-primary-foreground">
                  Cửa hàng
                </Link>
              </li>
              <li>
                <Link to="/" className="transition-colors hover:text-primary-foreground">
                  Tuyển dụng
                </Link>
              </li>
              <li>
                <Link to="/" className="transition-colors hover:text-primary-foreground">
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold text-primary-foreground">Chính sách</h4>
            <ul className="space-y-2.5 text-sm text-primary-foreground/60">
              <li>
                <Link to="/" className="transition-colors hover:text-primary-foreground">
                  Chính sách đổi trả
                </Link>
              </li>
              <li>
                <Link to="/" className="transition-colors hover:text-primary-foreground">
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link to="/" className="transition-colors hover:text-primary-foreground">
                  Chính sách vận chuyển
                </Link>
              </li>
              <li>
                <Link to="/" className="transition-colors hover:text-primary-foreground">
                  Điều khoản dịch vụ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold text-primary-foreground">Hỗ trợ</h4>
            <ul className="space-y-2.5 text-sm text-primary-foreground/60">
              <li>
                <Link
                  to="/ai-tu-van"
                  className="flex items-center gap-1.5 transition-colors hover:text-accent"
                >
                  <Bot className="h-3.5 w-3.5" /> AI Tư vấn
                </Link>
              </li>
              <li>
                <Link to="/" className="transition-colors hover:text-primary-foreground">
                  Hướng dẫn mua hàng
                </Link>
              </li>
              <li>
                <Link to="/" className="transition-colors hover:text-primary-foreground">
                  Hướng dẫn chọn size
                </Link>
              </li>
              <li>
                <Link
                  to="/tra-cuu-don-hang"
                  className="transition-colors hover:text-primary-foreground"
                >
                  Tra cứu đơn hàng
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-primary-foreground/10 pt-6 text-xs text-primary-foreground/40 md:flex-row">
          <p>© 2024 MATEWEAR. Tất cả quyền được bảo lưu.</p>
          <p>Đồ án tốt nghiệp - Xây dựng website bán quần áo thời trang kết hợp AI</p>
        </div>
      </div>
    </footer>
  );
}