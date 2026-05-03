import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import {
  BarChart3,
  Download,
  RefreshCw,
  Users,
  ShoppingBag,
  Wallet,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/utils/format";
import { toast } from "sonner";
import {
  statsService,
  type AdminOverviewStats,
  type AdminSalesStats,
  type AdminTopCustomer,
  type AdminTopProduct,
  type AdminSlowProduct,
} from "@/services/api/statsService";

type SalesPeriod = "day" | "week" | "month";

type StatCardProps = {
  title: string;
  value: ReactNode;
  description?: string;
  icon: ComponentType<{ className?: string }>;
};

const emptyOverview: AdminOverviewStats = {
  totalOrders: 0,
  totalRevenueAll: 0,
  totalPaidRevenue: 0,
  totalPaidOrders: 0,
  uniqueCustomers: 0,
  statusCounts: {},
  paymentCounts: {},
  recentOrders: [],
};

const emptySales: AdminSalesStats = {
  period: "day",
  range: 30,
  labels: [],
  data: [],
};

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDefaultStartDate() {
  const date = new Date();
  date.setDate(date.getDate() - 29);
  return toDateInputValue(date);
}

function getDefaultEndDate() {
  return toDateInputValue(new Date());
}

function StatCard({ title, value, description, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusLabel(status?: string) {
  const value = String(status || "").trim().toLowerCase();

  const map: Record<string, string> = {
    pending: "Chờ xác nhận",
    confirm: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    processing: "Đang xử lý",
    shipped: "Đang giao",
    delivered: "Đã giao",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
    canceled: "Đã hủy",
    reported: "Chờ duyệt hủy",

    cho_xac_nhan: "Chờ xác nhận",
    da_xac_nhan: "Đã xác nhận",
    dang_xu_ly: "Đang xử lý",
    dang_giao: "Đang giao",
    da_giao: "Đã giao",
    hoan_thanh: "Hoàn thành",
    da_huy: "Đã hủy",
  };

  return map[value] || status || "Không rõ";
}

function getPaymentLabel(status?: string) {
  const value = String(status || "").trim().toLowerCase();

  const map: Record<string, string> = {
    paid: "Đã thanh toán",
    pending: "Chưa thanh toán",
    failed: "Thanh toán thất bại",
    cancelled: "Đã hủy",
    canceled: "Đã hủy",
  };

  return map[value] || status || "Không rõ";
}

function formatDateTime(value?: string) {
  if (!value) return "Không rõ";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("vi-VN");
}

function getPeriodLabel(period: SalesPeriod) {
  const map: Record<SalesPeriod, string> = {
    day: "ngày",
    week: "tuần",
    month: "tháng",
  };

  return map[period];
}

function renderProductVariant(item: AdminTopProduct) {
  const color = item.color || "Không rõ màu";
  const size = item.size || "Không rõ size";

  return (
    <div className="flex items-center gap-2">
      {item.colorCode ? (
        <span
          className="h-3.5 w-3.5 rounded-full border border-border"
          style={{ backgroundColor: item.colorCode }}
        />
      ) : null}

      <span>
        {color} / {size}
      </span>
    </div>
  );
}

export default function AdminStatsPage() {
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [salesPeriod, setSalesPeriod] = useState<SalesPeriod>("day");
  const [salesRangeInput, setSalesRangeInput] = useState("30");
  const [startDate, setStartDate] = useState(getDefaultStartDate);
  const [endDate, setEndDate] = useState(getDefaultEndDate);

  const [overview, setOverview] = useState<AdminOverviewStats>(emptyOverview);
  const [sales, setSales] = useState<AdminSalesStats>(emptySales);
  const [topProducts, setTopProducts] = useState<AdminTopProduct[]>([]);
  const [slowProducts, setSlowProducts] = useState<AdminSlowProduct[]>([]);
  const [topCustomers, setTopCustomers] = useState<AdminTopCustomer[]>([]);

  const salesRange = useMemo(() => {
    const parsed = Number(salesRangeInput);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return salesPeriod === "month" ? 12 : 30;
    }

    return Math.floor(parsed);
  }, [salesRangeInput, salesPeriod]);

  const dateRangeParams = useMemo(
    () => ({
      startDate,
      endDate,
    }),
    [startDate, endDate]
  );

  const fetchStats = async (isManual = false) => {
    if (startDate && endDate && startDate > endDate) {
      toast.error("Ngày bắt đầu không được lớn hơn ngày kết thúc");
      return;
    }

    if (isManual) {
      setReloading(true);
    } else {
      setLoading(true);
    }

    try {
      const [overviewRes, salesRes, topProductsRes, slowProductsRes, topCustomersRes] =
        await Promise.all([
          statsService.getOverview(dateRangeParams),
          statsService.getSales({
            period: salesPeriod,
            range: salesRange,
            ...dateRangeParams,
          }),
          statsService.getTopProducts({
            limit: 10,
            periodDays: 90,
            ...dateRangeParams,
          }),
          statsService.getSlowProducts({
            limit: 10,
            periodDays: 90,
            ...dateRangeParams,
          }),
          statsService.getTopCustomers({
            limit: 10,
            periodDays: 90,
            ...dateRangeParams,
          }),
        ]);

      setOverview(overviewRes || emptyOverview);
      setSales(salesRes || emptySales);
      setTopProducts(Array.isArray(topProductsRes?.data) ? topProductsRes.data : []);
      setSlowProducts(Array.isArray(slowProductsRes?.data) ? slowProductsRes.data : []);
      setTopCustomers(Array.isArray(topCustomersRes?.data) ? topCustomersRes.data : []);
    } catch (error: any) {
      console.error("fetchStats error:", error);
      toast.error(error?.message || "Không thể tải thống kê");
    } finally {
      setLoading(false);
      setReloading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleApplyFilter = async () => {
    await fetchStats(true);
  };

  const handleResetDateRange = async () => {
    const defaultStart = getDefaultStartDate();
    const defaultEnd = getDefaultEndDate();

    setStartDate(defaultStart);
    setEndDate(defaultEnd);

    setTimeout(() => {
      fetchStats(true);
    }, 0);
  };

  const handleExportExcel = async () => {
    if (startDate && endDate && startDate > endDate) {
      toast.error("Ngày bắt đầu không được lớn hơn ngày kết thúc");
      return;
    }

    setExporting(true);

    try {
      await statsService.exportExcel({
        period: salesPeriod,
        range: salesRange,
        ...dateRangeParams,
      });

      toast.success("Đã tải file Excel");
    } catch (error: any) {
      console.error("exportExcel error:", error);
      toast.error(error?.message || "Không thể xuất Excel");
    } finally {
      setExporting(false);
    }
  };

  const pendingOrders =
    overview.statusCounts?.confirm ||
    overview.statusCounts?.pending ||
    overview.statusCounts?.cho_xac_nhan ||
    0;

  const completedOrders =
    overview.statusCounts?.completed ||
    overview.statusCounts?.hoan_thanh ||
    0;

  const totalProductsSold = topProducts.reduce(
    (sum, item) => sum + (item.qtySold || 0),
    0
  );

  return (
    <MainLayout>
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Thống kê quản trị</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Theo dõi đơn hàng, doanh thu, sản phẩm và khách hàng của StyleHub.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => fetchStats(true)}
              disabled={reloading || loading}
            >
              <RefreshCw className={`h-4 w-4 ${reloading ? "animate-spin" : ""}`} />
              {reloading ? "Đang tải..." : "Tải lại"}
            </Button>

            <Button
              className="gap-2"
              variant="outline"
              onClick={handleExportExcel}
              disabled={exporting}
            >
              <Download className="h-4 w-4" />
              {exporting ? "Đang xuất..." : "Xuất Excel"}
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Từ ngày
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-[180px]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Đến ngày
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-[180px]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Chu kỳ doanh thu
                </label>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={salesPeriod}
                  onChange={(e) => setSalesPeriod(e.target.value as SalesPeriod)}
                >
                  <option value="day">Ngày</option>
                  <option value="week">Tuần</option>
                  <option value="month">Tháng</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Số mốc khi không chọn ngày
                </label>
                <Input
                  type="number"
                  min="1"
                  value={salesRangeInput}
                  onChange={(e) => setSalesRangeInput(e.target.value)}
                  className="w-40"
                />
              </div>

              <Button onClick={handleApplyFilter} disabled={reloading || loading}>
                Áp dụng
              </Button>

              <Button
                variant="outline"
                onClick={handleResetDateRange}
                disabled={reloading || loading}
              >
                30 ngày gần nhất
              </Button>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Bộ lọc ngày được áp dụng cho doanh thu, đơn hàng, top sản phẩm,
              sản phẩm bán chậm và top khách hàng.
            </p>
          </CardContent>
        </Card>

        {loading ? (
          <Card>
            <CardContent className="py-16 text-center text-sm text-muted-foreground">
              Đang tải thống kê...
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Tổng đơn hàng"
                value={overview.totalOrders || 0}
                description="Theo khoảng ngày đã chọn"
                icon={ShoppingBag}
              />

              <StatCard
                title="Tổng doanh thu"
                value={formatPrice(overview.totalRevenueAll || 0)}
                description="Tính trên toàn bộ đơn hàng"
                icon={BarChart3}
              />

              <StatCard
                title="Doanh thu đã thanh toán"
                value={formatPrice(overview.totalPaidRevenue || 0)}
                description="Chỉ tính đơn đã thanh toán"
                icon={Wallet}
              />

              <StatCard
                title="Đơn đã thanh toán"
                value={overview.totalPaidOrders || 0}
                description="Số đơn có trạng thái paid"
                icon={CheckCircle2}
              />

              <StatCard
                title="Khách hàng"
                value={overview.uniqueCustomers || 0}
                description="Tài khoản và khách vãng lai"
                icon={Users}
              />

              <StatCard
                title="Đơn chờ xác nhận"
                value={pendingOrders}
                description="Cần admin xử lý"
                icon={Clock3}
              />

              <StatCard
                title="Đơn hoàn thành"
                value={completedOrders}
                description="Đơn đã hoàn tất"
                icon={CheckCircle2}
              />

              <StatCard
                title="Lượt bán top sản phẩm"
                value={totalProductsSold}
                description="Tổng số lượng bán của top 10"
                icon={BarChart3}
              />
            </div>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">Doanh thu theo thời gian</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Dữ liệu lấy từ các đơn đã thanh toán, nhóm theo{" "}
                      {getPeriodLabel(salesPeriod)}.
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {sales.labels.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Chưa có dữ liệu doanh thu.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mốc thời gian</TableHead>
                        <TableHead>Số đơn</TableHead>
                        <TableHead>Doanh thu</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.labels.map((label, index) => (
                        <TableRow key={`${label}-${index}`}>
                          <TableCell>{label}</TableCell>
                          <TableCell>{sales.data[index]?.orders || 0}</TableCell>
                          <TableCell>
                            {formatPrice(sales.data[index]?.revenue || 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Top sản phẩm bán chạy</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Xếp hạng theo số lượng bán trong khoảng ngày đã chọn.
                  </p>
                </CardHeader>

                <CardContent>
                  {topProducts.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      Chưa có dữ liệu.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sản phẩm</TableHead>
                          <TableHead>Phân loại</TableHead>
                          <TableHead>Đã bán</TableHead>
                          <TableHead>Doanh thu</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topProducts.map((item, index) => (
                          <TableRow key={`${item._id || index}`}>
                            <TableCell className="font-medium">
                              {item.productName || "Không rõ"}
                            </TableCell>
                            <TableCell>{renderProductVariant(item)}</TableCell>
                            <TableCell>{item.qtySold || 0}</TableCell>
                            <TableCell>{formatPrice(item.revenue || 0)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Sản phẩm bán chậm nhưng còn tồn
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Ưu tiên sản phẩm còn tồn nhiều nhưng bán ít.
                  </p>
                </CardHeader>

                <CardContent>
                  {slowProducts.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      Chưa có dữ liệu.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sản phẩm</TableHead>
                          <TableHead>Tồn kho</TableHead>
                          <TableHead>Đã bán</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {slowProducts.map((item) => (
                          <TableRow key={item._id}>
                            <TableCell className="font-medium">
                              {item.name || "Không rõ"}
                            </TableCell>
                            <TableCell>{item.totalStock || 0}</TableCell>
                            <TableCell>{item.qtySold || 0}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Top khách hàng</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Xếp hạng theo tổng giá trị đơn hàng đã thanh toán.
                  </p>
                </CardHeader>

                <CardContent>
                  {topCustomers.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      Chưa có dữ liệu.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Khách hàng</TableHead>
                          <TableHead>Số đơn</TableHead>
                          <TableHead>Tổng chi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topCustomers.map((item, index) => (
                          <TableRow key={`${item.userId || item.email || index}`}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.name || "Khách hàng"}</p>
                                {item.email ? (
                                  <p className="text-xs text-muted-foreground">
                                    {item.email}
                                  </p>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell>{item.orders || 0}</TableCell>
                            <TableCell>{formatPrice(item.totalSpent || 0)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Đơn hàng gần đây</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Các đơn mới nhất trong khoảng ngày đang xem.
                  </p>
                </CardHeader>

                <CardContent>
                  {overview.recentOrders.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      Chưa có đơn hàng gần đây.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã đơn</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead>Thanh toán</TableHead>
                          <TableHead>Ngày tạo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {overview.recentOrders.map((order) => (
                          <TableRow key={order._id}>
                            <TableCell className="font-medium">
                              {order.orderCode || order._id}
                            </TableCell>
                            <TableCell>{getStatusLabel(order.orderStatus)}</TableCell>
                            <TableCell>
                              {getPaymentLabel(order.paymentMethod?.status)}
                            </TableCell>
                            <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}