import { SanPham } from '@/types';

export const sanPhamData: SanPham[] = [
  {
    id: 1, ten: 'Áo Polo Basic Nam', slug: 'ao-polo-basic-nam', moTa: 'Áo polo cotton co giãn, thoáng mát, phù hợp đi làm và dạo phố.',
    moTaChiTiet: 'Chất liệu cotton CVC cao cấp, co giãn 4 chiều, thấm hút mồ hôi tốt. Form regular fit thoải mái, phù hợp nhiều dáng người.',
    gia: 299000, giaGoc: 399000, hinhAnh: ['/sample.jpg'], danhMucId: 1, danhMuc: 'Áo Polo', gioiTinh: 'nam',
    chatLieu: 'Cotton CVC', mauSac: [{ ten: 'Đen', ma: '#1a1a1a' }, { ten: 'Trắng', ma: '#ffffff' }, { ten: 'Xanh navy', ma: '#1e3a5f' }],
    kichCo: ['S', 'M', 'L', 'XL', 'XXL'], badge: 'bestseller', daBan: 2450, conHang: true, soLuongTon: 156,
    danhGiaTB: 4.8, soDanhGia: 342, ngayTao: '2024-01-15', tags: ['polo', 'basic', 'nam', 'cotton']
  },
  {
    id: 2, ten: 'Áo Thun Cổ Tròn Nam', slug: 'ao-thun-co-tron-nam', moTa: 'Áo thun basic cổ tròn, chất cotton mềm mịn, thoáng khí.',
    moTaChiTiet: 'Áo thun 100% cotton organic, form slim fit trẻ trung. Đường may chắc chắn, giữ form sau nhiều lần giặt.',
    gia: 199000, hinhAnh: ['/sample.jpg'], danhMucId: 2, danhMuc: 'Áo Thun', gioiTinh: 'nam',
    chatLieu: 'Cotton Organic', mauSac: [{ ten: 'Đen', ma: '#1a1a1a' }, { ten: 'Trắng', ma: '#ffffff' }, { ten: 'Xám', ma: '#6b7280' }],
    kichCo: ['S', 'M', 'L', 'XL'], badge: 'moi', daBan: 1820, conHang: true, soLuongTon: 230,
    danhGiaTB: 4.6, soDanhGia: 215, ngayTao: '2024-03-01', tags: ['thun', 'basic', 'nam']
  },
  {
    id: 3, ten: 'Quần Short Thể Thao Nam', slug: 'quan-short-the-thao-nam', moTa: 'Quần short thể thao, chất liệu nhẹ, co giãn thoải mái.',
    moTaChiTiet: 'Chất liệu polyester pha spandex, nhanh khô, co giãn đa chiều. Thiết kế có túi khóa kéo, dây rút tiện lợi.',
    gia: 259000, giaGoc: 350000, hinhAnh: ['/sample.jpg'], danhMucId: 5, danhMuc: 'Quần Short', gioiTinh: 'nam',
    chatLieu: 'Polyester/Spandex', mauSac: [{ ten: 'Đen', ma: '#1a1a1a' }, { ten: 'Xanh dương', ma: '#2563eb' }],
    kichCo: ['S', 'M', 'L', 'XL'], badge: 'sale', daBan: 980, conHang: true, soLuongTon: 89,
    danhGiaTB: 4.7, soDanhGia: 156, ngayTao: '2024-02-10', tags: ['short', 'the-thao', 'nam']
  },
  {
    id: 4, ten: 'Sơ Mi Oxford Trắng Nam', slug: 'so-mi-oxford-trang-nam', moTa: 'Sơ mi Oxford classic, phù hợp đi làm và sự kiện.',
    moTaChiTiet: 'Chất liệu vải Oxford dày dặn nhưng thoáng, form slim fit thanh lịch. Cổ button-down hiện đại.',
    gia: 449000, hinhAnh: ['/sample.jpg'], danhMucId: 3, danhMuc: 'Sơ Mi', gioiTinh: 'nam',
    chatLieu: 'Oxford Cotton', mauSac: [{ ten: 'Trắng', ma: '#ffffff' }, { ten: 'Xanh nhạt', ma: '#bfdbfe' }],
    kichCo: ['S', 'M', 'L', 'XL', 'XXL'], daBan: 1560, conHang: true, soLuongTon: 67,
    danhGiaTB: 4.9, soDanhGia: 280, ngayTao: '2024-01-20', tags: ['so-mi', 'oxford', 'nam', 'cong-so']
  },
  {
    id: 5, ten: 'Quần Dài Kaki Nam', slug: 'quan-dai-kaki-nam', moTa: 'Quần kaki nam form slim, co giãn nhẹ, lịch sự hàng ngày.',
    moTaChiTiet: 'Chất liệu kaki cotton pha spandex, co giãn nhẹ thoải mái. Form slim fit vừa vặn, phù hợp đi làm và đi chơi.',
    gia: 399000, giaGoc: 499000, hinhAnh: ['/sample.jpg'], danhMucId: 4, danhMuc: 'Quần Dài', gioiTinh: 'nam',
    chatLieu: 'Kaki Cotton', mauSac: [{ ten: 'Be', ma: '#d2b48c' }, { ten: 'Đen', ma: '#1a1a1a' }, { ten: 'Xanh rêu', ma: '#4a5d23' }],
    kichCo: ['29', '30', '31', '32', '33', '34'], badge: 'sale', daBan: 2100, conHang: true, soLuongTon: 145,
    danhGiaTB: 4.5, soDanhGia: 198, ngayTao: '2024-02-01', tags: ['kaki', 'quan-dai', 'nam']
  },
  {
    id: 6, ten: 'Áo Tank Top Gym Nam', slug: 'ao-tank-top-gym-nam', moTa: 'Áo tank top tập gym, chất liệu thấm hút nhanh khô.',
    moTaChiTiet: 'Chất liệu Dri-FIT thấm hút mồ hôi, nhanh khô. Thiết kế thoáng mát, tối ưu cho tập luyện cường độ cao.',
    gia: 179000, hinhAnh: ['/sample.jpg'], danhMucId: 6, danhMuc: 'Đồ Thể Thao', gioiTinh: 'nam',
    chatLieu: 'Polyester Dri-FIT', mauSac: [{ ten: 'Đen', ma: '#1a1a1a' }, { ten: 'Xám', ma: '#6b7280' }, { ten: 'Xanh lá', ma: '#22c55e' }],
    kichCo: ['S', 'M', 'L', 'XL'], badge: 'moi', daBan: 650, conHang: true, soLuongTon: 200,
    danhGiaTB: 4.4, soDanhGia: 89, ngayTao: '2024-03-15', tags: ['tank-top', 'gym', 'the-thao', 'nam']
  },
  {
    id: 7, ten: 'Áo Croptop Nữ Basic', slug: 'ao-croptop-nu-basic', moTa: 'Áo croptop nữ chất cotton mềm, form ôm trẻ trung.',
    moTaChiTiet: 'Áo croptop 95% cotton 5% spandex, co giãn ôm dáng đẹp. Phù hợp mix match với quần jean hoặc chân váy.',
    gia: 169000, hinhAnh: ['/sample.jpg'], danhMucId: 2, danhMuc: 'Áo Thun', gioiTinh: 'nu',
    chatLieu: 'Cotton Spandex', mauSac: [{ ten: 'Trắng', ma: '#ffffff' }, { ten: 'Hồng', ma: '#ec4899' }, { ten: 'Đen', ma: '#1a1a1a' }],
    kichCo: ['S', 'M', 'L'], badge: 'hot', daBan: 1340, conHang: true, soLuongTon: 178,
    danhGiaTB: 4.7, soDanhGia: 267, ngayTao: '2024-02-20', tags: ['croptop', 'nu', 'basic']
  },
  {
    id: 8, ten: 'Váy Liền Công Sở Nữ', slug: 'vay-lien-cong-so-nu', moTa: 'Váy liền công sở thanh lịch, form A-line tôn dáng.',
    moTaChiTiet: 'Chất liệu polyester cao cấp, ít nhăn, giữ form tốt. Thiết kế A-line thanh lịch phù hợp môi trường công sở.',
    gia: 549000, giaGoc: 699000, hinhAnh: ['/sample.jpg'], danhMucId: 8, danhMuc: 'Váy', gioiTinh: 'nu',
    chatLieu: 'Polyester', mauSac: [{ ten: 'Đen', ma: '#1a1a1a' }, { ten: 'Xanh navy', ma: '#1e3a5f' }],
    kichCo: ['S', 'M', 'L', 'XL'], badge: 'sale', daBan: 890, conHang: true, soLuongTon: 56,
    danhGiaTB: 4.8, soDanhGia: 145, ngayTao: '2024-01-25', tags: ['vay', 'cong-so', 'nu']
  },
  {
    id: 9, ten: 'Quần Legging Thể Thao Nữ', slug: 'quan-legging-the-thao-nu', moTa: 'Quần legging tập gym cạp cao, co giãn tối đa.',
    moTaChiTiet: 'Chất liệu nylon spandex cao cấp, co giãn 4 chiều. Cạp cao nâng mông, có túi bên hông tiện lợi.',
    gia: 349000, hinhAnh: ['/sample.jpg'], danhMucId: 6, danhMuc: 'Đồ Thể Thao', gioiTinh: 'nu',
    chatLieu: 'Nylon Spandex', mauSac: [{ ten: 'Đen', ma: '#1a1a1a' }, { ten: 'Tím', ma: '#7c3aed' }, { ten: 'Xanh dương', ma: '#2563eb' }],
    kichCo: ['S', 'M', 'L', 'XL'], badge: 'bestseller', daBan: 2780, conHang: true, soLuongTon: 310,
    danhGiaTB: 4.9, soDanhGia: 412, ngayTao: '2024-01-10', tags: ['legging', 'the-thao', 'nu', 'gym']
  },
  {
    id: 10, ten: 'Áo Hoodie Oversize Unisex', slug: 'ao-hoodie-oversize-unisex', moTa: 'Áo hoodie oversize unisex, chất nỉ bông dày dặn ấm áp.',
    moTaChiTiet: 'Chất liệu nỉ bông 100% cotton, lót bông mềm mại. Form oversize trendy, phù hợp cả nam và nữ.',
    gia: 399000, hinhAnh: ['/sample.jpg'], danhMucId: 9, danhMuc: 'Áo Khoác', gioiTinh: 'unisex',
    chatLieu: 'Cotton Nỉ Bông', mauSac: [{ ten: 'Đen', ma: '#1a1a1a' }, { ten: 'Xám', ma: '#6b7280' }, { ten: 'Be', ma: '#d2b48c' }],
    kichCo: ['M', 'L', 'XL', 'XXL'], badge: 'moi', daBan: 1650, conHang: true, soLuongTon: 120,
    danhGiaTB: 4.6, soDanhGia: 198, ngayTao: '2024-03-05', tags: ['hoodie', 'oversize', 'unisex']
  },
  {
    id: 11, ten: 'Áo Polo Nữ Slim Fit', slug: 'ao-polo-nu-slim-fit', moTa: 'Áo polo nữ form slim fit, thanh lịch và năng động.',
    moTaChiTiet: 'Chất liệu pique cotton co giãn, form slim fit tôn dáng. Cổ bẻ thanh lịch, phù hợp đi làm và đi chơi.',
    gia: 279000, hinhAnh: ['/sample.jpg'], danhMucId: 1, danhMuc: 'Áo Polo', gioiTinh: 'nu',
    chatLieu: 'Pique Cotton', mauSac: [{ ten: 'Trắng', ma: '#ffffff' }, { ten: 'Hồng nhạt', ma: '#fce7f3' }, { ten: 'Xanh mint', ma: '#a7f3d0' }],
    kichCo: ['S', 'M', 'L', 'XL'], daBan: 920, conHang: true, soLuongTon: 145,
    danhGiaTB: 4.5, soDanhGia: 134, ngayTao: '2024-02-15', tags: ['polo', 'nu', 'slim-fit']
  },
  {
    id: 12, ten: 'Quần Jogger Thể Thao Nam', slug: 'quan-jogger-the-thao-nam', moTa: 'Quần jogger thể thao, chất liệu nhẹ thoáng mát.',
    moTaChiTiet: 'Chất liệu polyester pha cotton, co giãn thoải mái. Bo gấu tiện lợi, túi khóa kéo an toàn.',
    gia: 329000, giaGoc: 420000, hinhAnh: ['/sample.jpg'], danhMucId: 6, danhMuc: 'Đồ Thể Thao', gioiTinh: 'nam',
    chatLieu: 'Polyester Cotton', mauSac: [{ ten: 'Đen', ma: '#1a1a1a' }, { ten: 'Xám đậm', ma: '#374151' }],
    kichCo: ['S', 'M', 'L', 'XL'], badge: 'hot', daBan: 1430, conHang: true, soLuongTon: 95,
    danhGiaTB: 4.7, soDanhGia: 223, ngayTao: '2024-02-05', tags: ['jogger', 'the-thao', 'nam']
  },
  {
    id: 13, ten: 'Áo Bra Thể Thao Nữ', slug: 'ao-bra-the-thao-nu', moTa: 'Áo bra tập gym nâng đỡ tốt, thoáng mát.',
    moTaChiTiet: 'Chất liệu nylon spandex cao cấp, đệm mút mỏng nâng đỡ vừa phải. Dây chéo lưng thời trang.',
    gia: 249000, hinhAnh: ['/sample.jpg'], danhMucId: 7, danhMuc: 'Đồ Lót', gioiTinh: 'nu',
    chatLieu: 'Nylon Spandex', mauSac: [{ ten: 'Đen', ma: '#1a1a1a' }, { ten: 'Hồng', ma: '#ec4899' }, { ten: 'Trắng', ma: '#ffffff' }],
    kichCo: ['S', 'M', 'L'], daBan: 1890, conHang: true, soLuongTon: 267,
    danhGiaTB: 4.8, soDanhGia: 345, ngayTao: '2024-01-30', tags: ['bra', 'the-thao', 'nu', 'gym']
  },
  {
    id: 14, ten: 'Nón Lưỡi Trai Unisex', slug: 'non-luoi-trai-unisex', moTa: 'Nón lưỡi trai thêu logo, chất cotton thoáng.',
    moTaChiTiet: 'Nón lưỡi trai cotton 100%, thêu logo MATEWEAR tinh tế. Khóa điều chỉnh phía sau phù hợp mọi kích cỡ đầu.',
    gia: 149000, hinhAnh: ['/sample.jpg'], danhMucId: 10, danhMuc: 'Phụ Kiện', gioiTinh: 'unisex',
    chatLieu: 'Cotton', mauSac: [{ ten: 'Đen', ma: '#1a1a1a' }, { ten: 'Trắng', ma: '#ffffff' }, { ten: 'Xanh navy', ma: '#1e3a5f' }],
    kichCo: ['Free Size'], daBan: 3200, conHang: true, soLuongTon: 450,
    danhGiaTB: 4.3, soDanhGia: 89, ngayTao: '2024-01-05', tags: ['non', 'phu-kien', 'unisex']
  },
  {
    id: 15, ten: 'Tất Thể Thao Cao Cổ', slug: 'tat-the-thao-cao-co', moTa: 'Tất thể thao cao cổ, đệm êm chân, chống trượt.',
    moTaChiTiet: 'Chất liệu cotton pha polyamide, thấm hút tốt, đệm gót và mũi chân. Bộ 3 đôi tiện lợi.',
    gia: 99000, hinhAnh: ['/sample.jpg'], danhMucId: 10, danhMuc: 'Phụ Kiện', gioiTinh: 'unisex',
    chatLieu: 'Cotton Polyamide', mauSac: [{ ten: 'Trắng', ma: '#ffffff' }, { ten: 'Đen', ma: '#1a1a1a' }],
    kichCo: ['Free Size'], badge: 'bestseller', daBan: 5600, conHang: true, soLuongTon: 890,
    danhGiaTB: 4.5, soDanhGia: 567, ngayTao: '2024-01-01', tags: ['tat', 'the-thao', 'phu-kien']
  },
  {
    id: 16, ten: 'Áo Thun Nữ Oversize', slug: 'ao-thun-nu-oversize', moTa: 'Áo thun nữ form oversize, in hình trendy.',
    moTaChiTiet: 'Chất liệu cotton 100% dày dặn, in hình DTG sắc nét không bong tróc. Form oversize phong cách streetwear.',
    gia: 229000, hinhAnh: ['/sample.jpg'], danhMucId: 2, danhMuc: 'Áo Thun', gioiTinh: 'nu',
    chatLieu: 'Cotton 100%', mauSac: [{ ten: 'Trắng', ma: '#ffffff' }, { ten: 'Đen', ma: '#1a1a1a' }, { ten: 'Kem', ma: '#fef3c7' }],
    kichCo: ['S', 'M', 'L', 'XL'], badge: 'moi', daBan: 780, conHang: true, soLuongTon: 200,
    danhGiaTB: 4.6, soDanhGia: 123, ngayTao: '2024-03-10', tags: ['thun', 'oversize', 'nu', 'streetwear']
  },
  {
    id: 17, ten: 'Quần Jean Slim Fit Nam', slug: 'quan-jean-slim-fit-nam', moTa: 'Quần jean nam form slim fit, co giãn thoải mái.',
    moTaChiTiet: 'Chất liệu denim co giãn, form slim fit vừa vặn không bó. Wash màu đẹp, bền màu sau nhiều lần giặt.',
    gia: 459000, giaGoc: 599000, hinhAnh: ['/sample.jpg'], danhMucId: 4, danhMuc: 'Quần Dài', gioiTinh: 'nam',
    chatLieu: 'Denim Stretch', mauSac: [{ ten: 'Xanh đậm', ma: '#1e3a5f' }, { ten: 'Xanh nhạt', ma: '#93c5fd' }, { ten: 'Đen', ma: '#1a1a1a' }],
    kichCo: ['29', '30', '31', '32', '33', '34'], badge: 'sale', daBan: 3400, conHang: true, soLuongTon: 78,
    danhGiaTB: 4.7, soDanhGia: 445, ngayTao: '2024-01-12', tags: ['jean', 'slim-fit', 'nam', 'denim']
  },
  {
    id: 18, ten: 'Balo Thời Trang MATEWEAR', slug: 'balo-thoi-trang-matewear', moTa: 'Balo thời trang tiện dụng, ngăn laptop 15.6 inch.',
    moTaChiTiet: 'Chất liệu polyester chống nước, ngăn laptop 15.6 inch có đệm chống sốc. Nhiều ngăn phụ tiện lợi.',
    gia: 499000, hinhAnh: ['/sample.jpg'], danhMucId: 10, danhMuc: 'Phụ Kiện', gioiTinh: 'unisex',
    chatLieu: 'Polyester chống nước', mauSac: [{ ten: 'Đen', ma: '#1a1a1a' }, { ten: 'Xanh navy', ma: '#1e3a5f' }],
    kichCo: ['Free Size'], daBan: 670, conHang: true, soLuongTon: 45,
    danhGiaTB: 4.4, soDanhGia: 78, ngayTao: '2024-02-25', tags: ['balo', 'phu-kien', 'unisex']
  },
  {
    id: 19, ten: 'Set Đồ Thể Thao Nữ', slug: 'set-do-the-thao-nu', moTa: 'Set đồ thể thao nữ gồm áo bra và quần legging matching.',
    moTaChiTiet: 'Bộ đồ tập gym matching gồm áo bra support trung bình và quần legging cạp cao. Chất liệu co giãn cao cấp.',
    gia: 549000, giaGoc: 699000, hinhAnh: ['/sample.jpg'], danhMucId: 6, danhMuc: 'Đồ Thể Thao', gioiTinh: 'nu',
    chatLieu: 'Nylon Spandex', mauSac: [{ ten: 'Đen', ma: '#1a1a1a' }, { ten: 'Xanh teal', ma: '#14b8a6' }],
    kichCo: ['S', 'M', 'L'], badge: 'hot', daBan: 1120, conHang: true, soLuongTon: 67,
    danhGiaTB: 4.9, soDanhGia: 234, ngayTao: '2024-03-01', tags: ['set', 'the-thao', 'nu', 'gym']
  },
  {
    id: 20, ten: 'Boxer Brief Nam (3 chiếc)', slug: 'boxer-brief-nam-3-chiec', moTa: 'Set 3 boxer brief nam chất modal mềm mịn, thoáng khí.',
    moTaChiTiet: 'Chất liệu modal cao cấp siêu mềm, thoáng khí và kháng khuẩn tự nhiên. Cạp dệt êm, không hằn da.',
    gia: 299000, hinhAnh: ['/sample.jpg'], danhMucId: 7, danhMuc: 'Đồ Lót', gioiTinh: 'nam',
    chatLieu: 'Modal', mauSac: [{ ten: 'Đen/Xám/Navy', ma: '#1a1a1a' }],
    kichCo: ['S', 'M', 'L', 'XL'], badge: 'bestseller', daBan: 4500, conHang: true, soLuongTon: 560,
    danhGiaTB: 4.8, soDanhGia: 678, ngayTao: '2024-01-08', tags: ['boxer', 'do-lot', 'nam', 'modal']
  },
  {
    id: 21, ten: 'Áo Khoác Gió Unisex', slug: 'ao-khoac-gio-unisex', moTa: 'Áo khoác gió nhẹ, chống nước cơ bản, gấp gọn tiện lợi.',
    moTaChiTiet: 'Chất liệu polyester chống nước nhẹ, có mũ trùm và dây rút. Gấp gọn vào túi riêng cực tiện cho du lịch.',
    gia: 359000, hinhAnh: ['/sample.jpg'], danhMucId: 9, danhMuc: 'Áo Khoác', gioiTinh: 'unisex',
    chatLieu: 'Polyester chống nước', mauSac: [{ ten: 'Đen', ma: '#1a1a1a' }, { ten: 'Xanh dương', ma: '#2563eb' }, { ten: 'Cam', ma: '#f97316' }],
    kichCo: ['M', 'L', 'XL', 'XXL'], daBan: 890, conHang: true, soLuongTon: 134,
    danhGiaTB: 4.5, soDanhGia: 156, ngayTao: '2024-02-18', tags: ['khoac-gio', 'unisex', 'chong-nuoc']
  },
  {
    id: 22, ten: 'Quần Short Kaki Nữ', slug: 'quan-short-kaki-nu', moTa: 'Quần short kaki nữ lưng cao, năng động trẻ trung.',
    moTaChiTiet: 'Chất kaki cotton mềm, co giãn nhẹ. Lưng cao tôn dáng, phù hợp đi chơi, dạo phố mùa hè.',
    gia: 269000, hinhAnh: ['/sample.jpg'], danhMucId: 5, danhMuc: 'Quần Short', gioiTinh: 'nu',
    chatLieu: 'Kaki Cotton', mauSac: [{ ten: 'Be', ma: '#d2b48c' }, { ten: 'Trắng', ma: '#ffffff' }, { ten: 'Xanh rêu', ma: '#4a5d23' }],
    kichCo: ['S', 'M', 'L', 'XL'], daBan: 560, conHang: true, soLuongTon: 189,
    danhGiaTB: 4.4, soDanhGia: 87, ngayTao: '2024-03-08', tags: ['short', 'kaki', 'nu']
  },
];
