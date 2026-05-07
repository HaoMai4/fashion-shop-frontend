import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import ScrollToTop from "./components/ScrollToTop";

import Index from "./pages/Index";
import ProductListing from "./pages/ProductListing";
import ProductDetail from "./pages/ProductDetail";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import AccountPage from "./pages/AccountPage";
import WishlistPage from "./pages/WishlistPage";
import OrderHistory from "./pages/OrderHistory";
import OrderDetailPage from "./pages/OrderDetailPage";
import TraCuuDonHangSearchPage from "./pages/TraCuuDonHangSearchPage";
import TraCuuDonHangPage from "./pages/TraCuuDonHangPage";
import AIConsultant from "./pages/AIConsultant";
import AdminPage from "./pages/AdminPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminOrderReportsPage from "./pages/admin/AdminOrderReportsPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminCategoriesPage from "./pages/admin/AdminCategoriesPage";
import AdminStatsPage from "./pages/admin/AdminStatsPage";
import AdminVouchersPage from "./pages/admin/AdminVouchersPage";
import AdminSalesPage from "./pages/admin/AdminSalesPage";
import NotFound from "./pages/NotFound";
import AddressPage from "./pages/AddressPage";
import VoucherWalletPage from "./pages/VoucherWalletPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentCancelPage from "./pages/PaymentCancelPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <BrowserRouter>
        <ScrollToTop />

        <Routes>
          <Route path="/" element={<Index />} />

          <Route path="/san-pham" element={<ProductListing />} />
          <Route path="/san-pham/:slug" element={<ProductDetail />} />

          <Route path="/gio-hang" element={<CartPage />} />
          <Route path="/thanh-toan" element={<CheckoutPage />} />

          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/cancel" element={<PaymentCancelPage />} />

          <Route path="/dang-nhap" element={<LoginPage />} />
          <Route path="/dang-ky" element={<RegisterPage />} />
          <Route path="/quen-mat-khau" element={<ForgotPasswordPage />} />
          <Route path="/dat-lai-mat-khau" element={<ResetPasswordPage />} />
          <Route path="/doi-mat-khau" element={<ChangePasswordPage />} />

          <Route path="/tai-khoan" element={<AccountPage />} />
          <Route path="/dia-chi" element={<AddressPage />} />
          <Route path="/vi-voucher" element={<VoucherWalletPage />} />
          <Route path="/yeu-thich" element={<WishlistPage />} />

          <Route path="/don-hang" element={<OrderHistory />} />
          <Route path="/don-hang/:orderCode" element={<OrderDetailPage />} />

          <Route path="/tra-cuu-don-hang" element={<TraCuuDonHangSearchPage />} />
          <Route path="/tra-cuu-don-hang/:orderCode" element={<TraCuuDonHangPage />} />

          <Route path="/ai-tu-van" element={<AIConsultant />} />

          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/order-reports" element={<AdminOrderReportsPage />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="/admin/sales" element={<AdminSalesPage />} />
          <Route path="/admin/categories" element={<AdminCategoriesPage />} />
          <Route path="/admin/stats" element={<AdminStatsPage />} />
          <Route path="/admin/vouchers" element={<AdminVouchersPage />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;