import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-foreground text-background/80">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <h3 className="text-xl font-bold text-background mb-3">MATEWEAR</h3>
            <p className="text-sm leading-relaxed mb-4 max-w-xs">Mặc đẹp mỗi ngày, mua sắm thông minh cùng AI. Thương hiệu thời trang Việt Nam dành cho giới trẻ.</p>
            <div className="flex flex-col gap-2 text-sm">
              <span className="flex items-center gap-2"><Phone className="h-4 w-4" /> 1900 8888</span>
              <span className="flex items-center gap-2"><Mail className="h-4 w-4" /> support@matewear.vn</span>
              <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> 123 Nguyễn Huệ, Q.1, TP.HCM</span>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-background mb-3">Về chúng tôi</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-background transition-colors">Giới thiệu</Link></li>
              <li><Link to="/san-pham" className="hover:text-background transition-colors">Cửa hàng</Link></li>
              <li><Link to="/" className="hover:text-background transition-colors">Tuyển dụng</Link></li>
              <li><Link to="/" className="hover:text-background transition-colors">Liên hệ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-background mb-3">Chính sách</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-background transition-colors">Chính sách đổi trả</Link></li>
              <li><Link to="/" className="hover:text-background transition-colors">Chính sách bảo mật</Link></li>
              <li><Link to="/" className="hover:text-background transition-colors">Chính sách vận chuyển</Link></li>
              <li><Link to="/" className="hover:text-background transition-colors">Điều khoản dịch vụ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-background mb-3">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/ai-tu-van" className="hover:text-background transition-colors">AI Tư vấn</Link></li>
              <li><Link to="/" className="hover:text-background transition-colors">Hướng dẫn mua hàng</Link></li>
              <li><Link to="/" className="hover:text-background transition-colors">Hướng dẫn chọn size</Link></li>
              <li><Link to="/don-hang" className="hover:text-background transition-colors">Tra cứu đơn hàng</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-background/20 pt-6 text-center text-xs">
          © 2024 MATEWEAR. Tất cả quyền được bảo lưu. | Đồ án tốt nghiệp — Xây dựng website bán quần áo thời trang kết hợp AI
        </div>
      </div>
    </footer>
  );
}
