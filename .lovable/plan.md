

# MATEWEAR - Vietnamese Fashion E-Commerce with AI Chatbot

## Brand
**MATEWEAR** — "Mặc đẹp mỗi ngày, mua sắm thông minh cùng AI"
Premium Vietnamese fashion e-commerce for young adults (18-35), with integrated AI shopping assistant.

## Visual Style
- Clean white background, black & deep blue primary colors
- Premium, modern, youthful fashion feel with polished spacing, rounded corners, subtle shadows
- Desktop-first, fully responsive

## Architecture
Clean separation: `pages/`, `components/`, `layouts/`, `services/`, `hooks/`, `data/`, `types/`, `utils/`
- Mock service layer (`services/api/`) mirroring future REST API endpoints
- TypeScript interfaces matching MySQL entities (san_pham, don_hang, khach_hang, etc.)
- All business logic in services, easily replaceable with real API calls

## Pages (12 routes)

1. **Trang chủ** (`/`) — Hero carousel, quick categories, dual promo banners, sports campaign, featured products, product tabs (Bán chạy/Mới về/Sale), AI recommendations, membership benefits, brand story, social proof, footer
2. **Danh sách sản phẩm** (`/san-pham`) — Breadcrumbs, filter sidebar (danh mục, giá, màu, size, chất liệu), sorting, responsive grid
3. **Chi tiết sản phẩm** (`/san-pham/:id`) — Image gallery, color/size selectors, reviews, related products, AI buttons (tư vấn size, gợi ý phối đồ)
4. **Giỏ hàng** (`/gio-hang`) — Item list, quantity controls, coupon input, order summary
5. **Thanh toán** (`/thanh-toan`) — Address form, shipping method, payment (COD/chuyển khoản/ví điện tử), order success state
6. **Đăng nhập** (`/dang-nhap`) — Login form with validation
7. **Đăng ký** (`/dang-ky`) — Registration form with validation
8. **Tài khoản** (`/tai-khoan`) — Profile, addresses, orders, wishlist, loyalty points, AI history
9. **Yêu thích** (`/yeu-thich`) — Wishlist grid with move-to-cart/remove actions
10. **Lịch sử đơn hàng** (`/don-hang`) — Order list with statuses (Chờ xác nhận, Đang giao, Hoàn thành, Đã hủy)
11. **AI Tư vấn** (`/ai-tu-van`) — Dedicated large chat interface, intro section, sample questions, category shortcuts
12. **Quản trị** (`/admin`) — Dashboard cards, product/order/customer tables, chatbot analytics mock

## Header & Navigation
Sticky header: MATEWEAR logo | Nav (Nam, Nữ, Thể thao, Phụ kiện, Sale, Bộ sưu tập, AI tư vấn) | Search, Account, Wishlist, Cart icons | Mobile drawer menu

## AI Chatbot Module
- **Floating widget** (bottom-right, all pages) + dedicated `/ai-tu-van` page
- Chat UI: message bubbles, bot avatar, typing indicator, timestamps, quick suggestion chips
- Mixed response rendering: text, product cards, FAQ blocks, CTA buttons
- **API-ready architecture**: `chatbotService.sendMessage()` → `POST /api/chatbot/message`
- Mock service simulates realistic conversations (product recommendations, size consultation, FAQ, order support)
- Supports intents: product recommendation, size advice, FAQ, order tracking, cross-sell, guided shopping

## Mock Data
- 20+ products (nam, nữ, thể thao, phụ kiện, sale items) with Vietnamese names/descriptions
- Categories, users, cart items, wishlist, orders, reviews, promotions, FAQ, sample chatbot conversations
- All in VND currency

## Key Reusable Components
Header, Footer, HeroCarousel, ProductCard, ProductGrid, FilterSidebar, SearchBar, PromoBanner, ChatWidget, ChatWindow, CategoryCard, ReviewCard, LoyaltyCard, Breadcrumbs, MobileMenu, OrderSummary, RecommendationCard

## Responsive
- Desktop: 4-col grids, full sidebars
- Tablet: 2-3 cols
- Mobile: 1-2 cols, filter drawer, mobile menu, accessible chatbot

