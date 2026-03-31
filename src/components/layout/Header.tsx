import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, User, Heart, ShoppingBag, Menu, X, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';

const navItems = [
  { label: 'Nam', href: '/san-pham?gioiTinh=nam' },
  { label: 'Nữ', href: '/san-pham?gioiTinh=nu' },
  { label: 'Thể thao', href: '/san-pham?danhMuc=Đồ Thể Thao' },
  { label: 'Phụ kiện', href: '/san-pham?danhMuc=Phụ Kiện' },
  { label: 'Sale', href: '/san-pham?khuyenMai=true' },
  { label: 'Bộ sưu tập', href: '/san-pham' },
  { label: 'AI Tư vấn', href: '/ai-tu-van', icon: true },
];

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const { tongSoLuong } = useCart();
  const { items: wishlistItems } = useWishlist();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/san-pham?timKiem=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetTitle className="text-xl font-bold tracking-tight">MATEWEAR</SheetTitle>
            <nav className="mt-6 flex flex-col gap-1">
              {navItems.map(item => (
                <Link key={item.href} to={item.href} className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-foreground/80 hover:bg-secondary hover:text-foreground transition-colors">
                  {item.icon && <Bot className="h-4 w-4 text-accent" />}
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-foreground">
          MATEWEAR
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                item.icon ? 'text-accent hover:bg-accent/10' : 'text-foreground/70 hover:text-foreground hover:bg-secondary'
              }`}
            >
              {item.icon && <Bot className="h-4 w-4" />}
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="w-40 md:w-64 h-9"
                autoFocus
              />
              <Button variant="ghost" size="icon" onClick={() => setSearchOpen(false)} className="h-9 w-9">
                <X className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} className="h-9 w-9">
              <Search className="h-5 w-5" />
            </Button>
          )}

          <Link to="/tai-khoan">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <User className="h-5 w-5" />
            </Button>
          </Link>

          <Link to="/yeu-thich" className="relative">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Heart className="h-5 w-5" />
            </Button>
            {wishlistItems.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                {wishlistItems.length}
              </span>
            )}
          </Link>

          <Link to="/gio-hang" className="relative">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ShoppingBag className="h-5 w-5" />
            </Button>
            {tongSoLuong > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                {tongSoLuong}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
