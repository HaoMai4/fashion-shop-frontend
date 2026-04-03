import { DanhMuc } from '@/types';

import catAoPolo from '@/assets/categories/ao-polo.jpg';
import catAoThun from '@/assets/categories/ao-thun.jpg';
import catSoMi from '@/assets/categories/so-mi.jpg';
import catQuanDai from '@/assets/categories/quan-dai.jpg';
import catQuanShort from '@/assets/categories/quan-short.jpg';
import catDoTheThao from '@/assets/categories/do-the-thao.jpg';
import catDoLot from '@/assets/categories/do-lot.jpg';
import catVay from '@/assets/categories/vay.jpg';
import catAoKhoac from '@/assets/categories/ao-khoac.jpg';
import catPhuKien from '@/assets/categories/phu-kien.jpg';

export const danhMucData: DanhMuc[] = [
  { id: 1, ten: 'Áo Polo', slug: 'ao-polo', hinhAnh: catAoPolo, moTa: 'Áo polo nam nữ chất lượng cao', soSanPham: 15 },
  { id: 2, ten: 'Áo Thun', slug: 'ao-thun', hinhAnh: catAoThun, moTa: 'Áo thun basic và trendy', soSanPham: 28 },
  { id: 3, ten: 'Sơ Mi', slug: 'so-mi', hinhAnh: catSoMi, moTa: 'Sơ mi công sở và casual', soSanPham: 12 },
  { id: 4, ten: 'Quần Dài', slug: 'quan-dai', hinhAnh: catQuanDai, moTa: 'Quần dài nam nữ đa phong cách', soSanPham: 20 },
  { id: 5, ten: 'Quần Short', slug: 'quan-short', hinhAnh: catQuanShort, moTa: 'Quần short thể thao và casual', soSanPham: 18 },
  { id: 6, ten: 'Đồ Thể Thao', slug: 'do-the-thao', hinhAnh: catDoTheThao, moTa: 'Trang phục thể thao chuyên dụng', soSanPham: 25 },
  { id: 7, ten: 'Đồ Lót', slug: 'do-lot', hinhAnh: catDoLot, moTa: 'Đồ lót nam nữ cao cấp', soSanPham: 16 },
  { id: 8, ten: 'Váy', slug: 'vay', hinhAnh: catVay, moTa: 'Váy nữ các kiểu dáng', soSanPham: 10 },
  { id: 9, ten: 'Áo Khoác', slug: 'ao-khoac', hinhAnh: catAoKhoac, moTa: 'Áo khoác gió, hoodie, jacket', soSanPham: 14 },
  { id: 10, ten: 'Phụ Kiện', slug: 'phu-kien', hinhAnh: catPhuKien, moTa: 'Nón, tất, balo, thắt lưng', soSanPham: 22 },
];
