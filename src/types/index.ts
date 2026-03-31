// Types matching MySQL entities for future backend integration

export interface SanPham {
  id: number;
  ten: string;
  slug: string;
  moTa: string;
  moTaChiTiet: string;
  gia: number;
  giaGoc?: number;
  hinhAnh: string[];
  danhMucId: number;
  danhMuc: string;
  gioiTinh: 'nam' | 'nu' | 'unisex';
  chatLieu: string;
  mauSac: MauSac[];
  kichCo: string[];
  badge?: 'sale' | 'bestseller' | 'moi' | 'hot';
  daBan: number;
  conHang: boolean;
  soLuongTon: number;
  danhGiaTB: number;
  soDanhGia: number;
  ngayTao: string;
  tags: string[];
}

export interface MauSac {
  ten: string;
  ma: string; // hex code
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
  sanPham: SanPham;
  mauSac: string;
  kichCo: string;
  soLuong: number;
  gia: number;
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

// Chatbot types
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

// Filter types
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
