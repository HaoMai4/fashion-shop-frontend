import { DonHang } from '@/types';
import { sanPhamData } from './products';

export const donHangData: DonHang[] = [
  {
    id: 1, maDonHang: 'MW240301001', khachHangId: 1, ngayDat: '2024-03-01', tongTien: 757000,
    trangThai: 'hoan_thanh', phuongThucThanhToan: 'COD', diaChiGiao: '123 Nguyễn Huệ, Quận 1, TP.HCM',
    soDienThoai: '0901234567', phiVanChuyen: 30000, giamGia: 50000,
    chiTiet: [
      { id: 1, sanPham: sanPhamData[0], mauSac: 'Đen', kichCo: 'L', soLuong: 1, gia: 299000 },
      { id: 2, sanPham: sanPhamData[1], mauSac: 'Trắng', kichCo: 'M', soLuong: 2, gia: 199000 },
    ]
  },
  {
    id: 2, maDonHang: 'MW240310002', khachHangId: 1, ngayDat: '2024-03-10', tongTien: 549000,
    trangThai: 'dang_giao', phuongThucThanhToan: 'Chuyển khoản', diaChiGiao: '456 Lê Lợi, Quận 3, TP.HCM',
    soDienThoai: '0901234567', phiVanChuyen: 0, giamGia: 0,
    chiTiet: [
      { id: 3, sanPham: sanPhamData[7], mauSac: 'Đen', kichCo: 'M', soLuong: 1, gia: 549000 },
    ]
  },
  {
    id: 3, maDonHang: 'MW240315003', khachHangId: 1, ngayDat: '2024-03-15', tongTien: 928000,
    trangThai: 'cho_xac_nhan', phuongThucThanhToan: 'Ví điện tử', diaChiGiao: '789 Trần Hưng Đạo, Quận 5, TP.HCM',
    soDienThoai: '0901234567', phiVanChuyen: 30000, giamGia: 100000,
    chiTiet: [
      { id: 4, sanPham: sanPhamData[16], mauSac: 'Xanh đậm', kichCo: '31', soLuong: 1, gia: 459000 },
      { id: 5, sanPham: sanPhamData[9], mauSac: 'Đen', kichCo: 'L', soLuong: 1, gia: 399000 },
    ]
  },
  {
    id: 4, maDonHang: 'MW240305004', khachHangId: 1, ngayDat: '2024-03-05', tongTien: 299000,
    trangThai: 'da_huy', phuongThucThanhToan: 'COD', diaChiGiao: '321 Hai Bà Trưng, Quận 1, TP.HCM',
    soDienThoai: '0901234567', phiVanChuyen: 30000, giamGia: 0,
    chiTiet: [
      { id: 6, sanPham: sanPhamData[0], mauSac: 'Trắng', kichCo: 'XL', soLuong: 1, gia: 299000 },
    ]
  },
];
