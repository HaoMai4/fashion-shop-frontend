import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Search,
  User,
  Heart,
  ShoppingBag,
  Menu,
  X,
  Bot,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { getStoredUser, isLoggedIn } from '@/services/api/userService';
import {
  productService,
  type SearchHistoryItem,
} from '@/services/api/productService';
import type { SanPham } from '@/types';

const navItems = [
  { label: 'Tất cả', href: '/san-pham' },
  { label: 'Nam', href: '/san-pham?gioiTinh=nam' },
  { label: 'Nữ', href: '/san-pham?gioiTinh=nu' },
  { label: 'Thể thao', href: '/san-pham?danhMuc=Đồ Thể Thao' },
  { label: 'Phụ kiện', href: '/san-pham?danhMuc=Phụ Kiện' },
  { label: 'Đang sale', href: '/san-pham?khuyenMai=true' },
  { label: 'Bộ sưu tập', href: '/san-pham' },
  { label: 'AI Tư vấn', href: '/ai-tu-van', icon: true },
];

const LOCAL_SEARCH_HISTORY_KEY = 'stylehub_search_history';

type SearchHistoryViewItem = {
  id?: string;
  keyword: string;
  source: 'server' | 'local';
};

function normalizeRole(role?: string) {
  return String(role || '').trim().toLowerCase();
}

function getLocalSearchHistory() {
  try {
    const raw = localStorage.getItem(LOCAL_SEARCH_HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed)
      ? parsed.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 8)
      : [];
  } catch {
    return [];
  }
}

function saveLocalSearchHistory(keyword: string) {
  const trimmed = keyword.trim();

  if (!trimmed || trimmed.length < 2) return;

  const current = getLocalSearchHistory();

  const next = [
    trimmed,
    ...current.filter(
      (item) => item.toLowerCase() !== trimmed.toLowerCase()
    ),
  ].slice(0, 8);

  localStorage.setItem(LOCAL_SEARCH_HISTORY_KEY, JSON.stringify(next));
}

function clearLocalSearchHistory() {
  localStorage.removeItem(LOCAL_SEARCH_HISTORY_KEY);
}

function removeLocalSearchHistoryItem(keyword: string) {
  const trimmed = keyword.trim();

  if (!trimmed) return;

  const current = getLocalSearchHistory();

  const next = current.filter(
    (item) => item.toLowerCase() !== trimmed.toLowerCase()
  );

  localStorage.setItem(LOCAL_SEARCH_HISTORY_KEY, JSON.stringify(next));
}

function formatPrice(value?: number) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
}

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryViewItem[]>([]);
  const [suggestedProducts, setSuggestedProducts] = useState<SanPham[]>([]);
  const [keywordSuggestions, setKeywordSuggestions] = useState<string[]>([]);
  const [storedUserRole, setStoredUserRole] = useState(() =>
    normalizeRole(getStoredUser()?.role)
  );
  const searchWrapperRef = useRef<HTMLDivElement | null>(null);

  const location = useLocation();
  const { tongSoLuong } = useCart();
  const { items: wishlistItems } = useWishlist();

  useEffect(() => {
    setStoredUserRole(normalizeRole(getStoredUser()?.role));
  }, [location.pathname]);

  useEffect(() => {
    setSearchFocused(false);
    setSuggestedProducts([]);
    setKeywordSuggestions([]);
  }, [location.pathname, location.search]);

  const isAdmin = useMemo(() => {
    return isLoggedIn() && storedUserRole === 'admin';
  }, [storedUserRole]);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchFocused(false);
    setSearchQuery('');
    setSuggestedProducts([]);
    setKeywordSuggestions([]);
  };

  useEffect(() => {
    if (!searchOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(target)
      ) {
        closeSearch();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchOpen]);

  const goToSearch = async (keyword: string) => {
    const trimmed = keyword.trim();

    if (!trimmed) return;

    saveLocalSearchHistory(trimmed);

    if (isLoggedIn()) {
      await productService.saveSearchHistory(trimmed);
    }

    closeSearch();
    window.location.href = `/san-pham?timKiem=${encodeURIComponent(trimmed)}`;
  };

  const handleClearSearchHistory = async () => {
    clearLocalSearchHistory();
    setSearchHistory([]);

    if (isLoggedIn()) {
      await productService.clearSearchHistory();
    }
  };

  const handleDeleteSearchHistoryItem = async (
    item: SearchHistoryViewItem,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    removeLocalSearchHistoryItem(item.keyword);

    setSearchHistory((prev) =>
      prev.filter((historyItem) => {
        if (item.id && historyItem.id) {
          return historyItem.id !== item.id;
        }

        return (
          historyItem.keyword.toLowerCase() !== item.keyword.toLowerCase() ||
          historyItem.source !== item.source
        );
      })
    );

    if (item.source === 'server' && item.id && isLoggedIn()) {
      await productService.deleteSearchHistoryItem(item.id);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await goToSearch(searchQuery);
  };

  useEffect(() => {
    if (!searchOpen || !searchFocused) return;

    const loadHistory = async () => {
      const localHistory: SearchHistoryViewItem[] = getLocalSearchHistory().map(
        (keyword) => ({
          keyword,
          source: 'local' as const,
        })
      );

      if (!isLoggedIn()) {
        setSearchHistory(localHistory);
        return;
      }

      const serverHistory = await productService.getSearchHistory(8);

      const serverItems: SearchHistoryViewItem[] = serverHistory
        .map((item: SearchHistoryItem) => ({
          id: item._id,
          keyword: item.keyword,
          source: 'server' as const,
        }))
        .filter((item) => Boolean(item.keyword));

      const merged = [
        ...serverItems,
        ...localHistory.filter(
          (localItem) =>
            !serverItems.some(
              (serverItem) =>
                serverItem.keyword.toLowerCase() ===
                localItem.keyword.toLowerCase()
            )
        ),
      ].slice(0, 8);

      setSearchHistory(merged);
    };

    loadHistory();
  }, [searchOpen, searchFocused]);

  useEffect(() => {
    if (!searchOpen || !searchFocused) return;

    const keyword = searchQuery.trim();

    if (!keyword) {
      setSuggestedProducts([]);
      setKeywordSuggestions([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setSearchLoading(true);

        const res = await productService.getSearchSuggestions(keyword, 6);

        setSuggestedProducts(res.products || []);
        setKeywordSuggestions(res.keywordSuggestions || []);
      } catch (error) {
        console.error('Load search suggestions error:', error);
        setSuggestedProducts([]);
        setKeywordSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchQuery, searchOpen, searchFocused]);

  const handleSuggestionProductClick = (keyword: string) => {
    const trimmed = keyword.trim();

    if (trimmed.length >= 2) {
      saveLocalSearchHistory(trimmed);

      if (isLoggedIn()) {
        productService.saveSearchHistory(trimmed);
      }
    }

    closeSearch();
  };

  const renderSearchDropdown = () => {
    if (!searchFocused) return null;

    const hasQuery = searchQuery.trim().length > 0;

    return (
      <div className="absolute right-11 top-11 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border bg-white shadow-xl">
        {hasQuery ? (
          <div>
            <div className="border-b px-3 py-2 text-xs font-semibold text-muted-foreground">
              Gợi ý tìm kiếm
            </div>

            {searchLoading ? (
              <div className="px-3 py-3 text-sm text-muted-foreground">
                Đang tìm gợi ý...
              </div>
            ) : (
              <>
                {keywordSuggestions.length > 0 ? (
                  <div className="border-b py-1">
                    {keywordSuggestions.slice(0, 5).map((keyword) => (
                      <button
                        key={keyword}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => goToSearch(keyword)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                      >
                        <Search className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="line-clamp-1">{keyword}</span>
                      </button>
                    ))}
                  </div>
                ) : null}

                {suggestedProducts.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto py-1">
                    {suggestedProducts.map((product) => (
                      <Link
                        key={product.id}
                        to={`/san-pham/${product.slug}`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleSuggestionProductClick(searchQuery)}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50"
                      >
                        <img
                          src={product.hinhAnh || '/placeholder.svg'}
                          alt={product.ten}
                          className="h-12 w-12 shrink-0 rounded-md object-cover"
                          onError={(event) => {
                            event.currentTarget.src = '/placeholder.svg';
                          }}
                        />

                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-sm font-medium">
                            {product.ten}
                          </p>

                          <p className="text-sm font-semibold text-blue-600">
                            {formatPrice(product.gia)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-3 text-sm text-muted-foreground">
                    Chưa có sản phẩm phù hợp
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between border-b px-3 py-2">
              <span className="text-xs font-semibold text-muted-foreground">
                Tìm kiếm gần đây
              </span>

              {searchHistory.length > 0 ? (
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={handleClearSearchHistory}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Xóa
                </button>
              ) : null}
            </div>

            {searchHistory.length > 0 ? (
              <div className="py-1">
                {searchHistory.map((item) => (
                  <div
                    key={`${item.source}-${item.id || item.keyword}`}
                    className="group flex items-center hover:bg-slate-50"
                  >
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => goToSearch(item.keyword)}
                      className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-sm"
                    >
                      <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="line-clamp-1">{item.keyword}</span>
                    </button>

                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={(event) => handleDeleteSearchHistoryItem(item, event)}
                      className="mr-2 rounded-full p-1 text-slate-400 opacity-70 transition hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100"
                      aria-label={`Xóa lịch sử tìm kiếm ${item.keyword}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-3 py-3 text-sm text-muted-foreground">
                Chưa có lịch sử tìm kiếm
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="w-72">
            <SheetTitle className="text-xl font-bold tracking-tight">
              MATEWEAR
            </SheetTitle>

            <nav className="mt-6 flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={`${item.label}-${item.href}`}
                  to={item.href}
                  className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {item.icon && <Bot className="h-4 w-4 text-accent" />}
                  {item.label}
                </Link>
              ))}

              {isAdmin ? (
                <Link
                  to="/admin"
                  className="mt-2 flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Admin
                </Link>
              ) : null}
            </nav>
          </SheetContent>
        </Sheet>

        <Link
          to="/"
          className="flex items-center gap-2 font-bold text-xl tracking-tight text-foreground"
        >
          MATEWEAR
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={`${item.label}-${item.href}`}
              to={item.href}
              className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${item.icon
                ? 'text-accent hover:bg-accent/10'
                : 'text-foreground/70 hover:text-foreground hover:bg-secondary'
                }`}
            >
              {item.icon && <Bot className="h-4 w-4" />}
              {item.label}
            </Link>
          ))}

          {isAdmin ? (
            <Link
              to="/admin"
              className="ml-1 flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
            >
              <ShieldCheck className="h-4 w-4" />
              Admin
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-1">
          <div ref={searchWrapperRef} className="relative">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="relative flex items-center gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  placeholder="Tìm kiếm sản phẩm..."
                  className="h-9 w-40 md:w-64"
                  autoFocus
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={closeSearch}
                  className="h-9 w-9"
                >
                  <X className="h-4 w-4" />
                </Button>

                {renderSearchDropdown()}
              </form>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSearchOpen(true);
                  setSearchFocused(true);
                }}
                className="h-9 w-9"
              >
                <Search className="h-5 w-5" />
              </Button>
            )}
          </div>

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