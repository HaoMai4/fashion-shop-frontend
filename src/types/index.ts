// Types matching MySQL entities for future backend integration

export interface SanPham {
  id: string;
  ten: string;
  slug: string;
  moTa: string;
  moTaChiTiet?: string;
  gia: number;
  giaGoc?: number;
  hinhAnh: string;
  danhMuc: string;
  danhMucId: string;
  gioiTinh: "nam" | "nu" | "unisex";
  thuongHieu?: string;
  tags: string[];
  daBan: number;
  ngayTao: string;
  mauSac: { ten: string; ma: string }[];
  kichCo: string[];
  badge?: string;
  danhGia: number;
  soLuongDanhGia: number;
  chatLieu?: string;
  donHang?: number;
  soLuongTon?: number;
  bienThe?: BienTheSanPhamDetail[];
  colorSizeMap?: Record<string, string[]>;
  hinhAnhList?: string[];
  variants?: any[];
  defaultVariantId?: string;
  defaultColor?: string;
  defaultSize?: string;
  defaultPrice?: number;
}

export interface MauSac {
  ten: string;
  ma: string;
}

export interface KichThuocBienTheDetail {
  size: string;
  price: number;
  discountPrice?: number;
  finalPrice: number;
  stock: number;
}

export interface BienTheSanPhamDetail {
  id: string;
  mau: string;
  maMau: string;
  hinhAnh: string[];
  kichThuoc: KichThuocBienTheDetail[];
}

export interface BienTheSanPham {
  id: number;
  sanPhamId: number;
  mauSac: string;
  kichCo: string;
  soLuongTon: number;
  gia?: number;
}

export interface DanhMuc {
  id: number;
  ten: string;
  slug: string;
  hinhAnh: string;
  moTa: string;
  soSanPham: number;
  parentId?: number;
}

export interface KhachHang {
  id: number;
  hoTen: string;
  email: string;
  soDienThoai: string;
  avatar?: string;
  diemThanhVien: number;
  hangThanhVien: 'Đồng' | 'Bạc' | 'Vàng' | 'Kim cương';
  ngayTao: string;
}

export interface GioHang {
  id: number;
  khachHangId: number;
  chiTiet: ChiTietGioHang[];
  tongTien: number;
}

export interface ChiTietGioHang {
  id: number;
  productId: string;
  variantId: string;
  sanPham: SanPham;
  mauSac: string;
  kichCo: string;
  soLuong: number;
  gia: number;
  hinhAnh?: string;
}

export interface DonHang {
  id: number;
  maDonHang: string;
  khachHangId: number;
  ngayDat: string;
  tongTien: number;
  trangThai: 'cho_xac_nhan' | 'dang_giao' | 'hoan_thanh' | 'da_huy';
  phuongThucThanhToan: string;
  diaChiGiao: string;
  soDienThoai: string;
  chiTiet: ChiTietDonHang[];
  phiVanChuyen: number;
  giamGia: number;
}

export interface ChiTietDonHang {
  id: number;
  sanPham: SanPham;
  mauSac: string;
  kichCo: string;
  soLuong: number;
  gia: number;
}

export interface KhuyenMai {
  id: number;
  ma: string;
  moTa: string;
  loai: 'phan_tram' | 'tien';
  giaTri: number;
  ngayBatDau: string;
  ngayKetThuc: string;
  trangThai: boolean;
}

export interface DanhGiaSanPham {
  id: number;
  sanPhamId: number;
  khachHangTen: string;
  avatar?: string;
  soSao: number;
  noiDung: string;
  ngayDanhGia: string;
  hinhAnh?: string[];
}

export interface YeuThich {
  id: number;
  khachHangId: number;
  sanPham: SanPham;
  ngayThem: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: string;
  products?: SanPham[];
  suggestions?: string[];
  type?: 'text' | 'product_recommendation' | 'faq' | 'size_advice';
}

export interface ChatRequest {
  message: string;
  userId?: number;
  conversationId: string;
  context?: {
    currentPage?: string;
    selectedCategory?: string;
    cartItems?: number[];
  };
}

export interface ChatResponse {
  reply: string;
  recommendedProducts?: SanPham[];
  suggestions?: string[];
  type?: 'text' | 'product_recommendation' | 'faq' | 'size_advice';
}

export interface ProductFilter {
  danhMuc?: string;
  gioiTinh?: string;
  giaMin?: number;
  giaMax?: number;
  mauSac?: string[];
  kichCo?: string[];
  chatLieu?: string[];
  danhGia?: number;
  khuyenMai?: boolean;
  sapXep?: 'moi_nhat' | 'ban_chay' | 'gia_tang' | 'gia_giam';
  timKiem?: string;
}

export interface FAQItem {
  id: number;
  cauHoi: string;
  traLoi: string;
  danhMuc: string;
}