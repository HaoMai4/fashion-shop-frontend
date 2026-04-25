import { useEffect, useMemo, useState } from "react";
import { BarChart3, Download, RefreshCw, Users, ShoppingBag, Wallet, CheckCircle2, Clock3 } from "lucide-react";
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

function getStatusLabel(status?: string) {
  const map: Record<string, string> = {
    pending: "Đang chờ",
    confirm: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    completed: "Hoàn thành",
    shipped: "Đã giao",
    cancelled: "Đã hủy",
    da_huy: "Đã hủy",
    cho_xac_nhan: "Chờ xác nhận",
    dang_giao: "Đang giao",
    hoan_thanh: "Hoàn thành",
  };

  return map[status || ""] || status || "Không rõ";
}

function getPaymentLabel(status?: string) {
  const map: Record<string, string> = {
    paid: "Đã thanh toán",
    pending: "Chưa thanh toán",
    cancelled: "Đã hủy",
  };

  return map[status || ""] || status || "Không rõ";
}

function formatDateTime(value?: string) {
  if (!value) return "Không rõ";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
}

export default function AdminStatsPage() {
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [salesPeriod, setSalesPeriod] = useState<SalesPeriod>("day");
  const [salesRangeInput, setSalesRangeInput] = useState("30");

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

  const fetchStats = async (isManual = false) => {
    if (isManual) setReloading(true);
    else setLoading(true);

    try {
      const [overviewRes, salesRes, topProductsRes, slowProductsRes, topCustomersRes] =
        await Promise.all([
          statsService.getOverview(),
          statsService.getSales({
            period: salesPeriod,
            range: salesRange,
          }),
          statsService.getTopProducts({
            limit: 10,
            periodDays: 90,
          }),
          statsService.getSlowProducts({
            limit: 10,
            periodDays: 90,
          }),
          statsService.getTopCustomers({
            limit: 10,
            periodDays: 90,
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

  const handleApplySalesFilter = async () => {
    await fetchStats(true);
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      await statsService.exportExcel({
        period: salesPeriod,
        range: salesRange,
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
            
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => fetchStats(true)}
              disabled={reloading || loading}
            >
              <RefreshCw className="h-4 w-4" />
              Tải lại
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

        {loading ? (
          <Card>
            <CardContent className="py-16 text-center text-sm text-muted-foreground">
              Đang tải thống kê...
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Card>
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-sm text-muted-foreground">Tổng đơn hàng</p>
                    <p className="mt-2 text-2xl font-bold">{overview.totalOrders}</p>
                  </div>
                  <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-sm text-muted-foreground">Doanh thu đã thanh toán</p>
                    <p className="mt-2 text-2xl font-bold">
                      {formatPrice(overview.totalPaidRevenue || 0)}
                    </p>
                  </div>
                  <Wallet className="h-8 w-8 text-muted-foreground" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-sm text-muted-foreground">Số Khách Hàng</p>
                    <p className="mt-2 text-2xl font-bold">{overview.uniqueCustomers}</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-sm text-muted-foreground">Đơn chờ xử lý</p>
                    <p className="mt-2 text-2xl font-bold">{pendingOrders}</p>
                  </div>
                  <Clock3 className="h-8 w-8 text-muted-foreground" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-sm text-muted-foreground">Đơn hoàn thành</p>
                    <p className="mt-2 text-2xl font-bold">{completedOrders}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-sm text-muted-foreground">Tổng lượt bán top 10</p>
                    <p className="mt-2 text-2xl font-bold">{totalProductsSold}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">Doanh thu theo thời gian</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Dữ liệu này đang lấy từ các đơn đã thanh toán.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-end gap-2">
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Chu kỳ</label>
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
                      <label className="mb-1 block text-xs text-muted-foreground">Số mốc</label>
                      <Input
                        type="number"
                        min="1"
                        value={salesRangeInput}
                        onChange={(e) => setSalesRangeInput(e.target.value)}
                        className="w-28"
                      />
                    </div>

                    <Button onClick={handleApplySalesFilter} disabled={reloading}>
                      Áp dụng
                    </Button>
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
                          <TableCell>{formatPrice(sales.data[index]?.revenue || 0)}</TableCell>
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
                          <TableHead>SKU</TableHead>
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
                            <TableCell>{item.sku || "-"}</TableCell>
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
                  <CardTitle className="text-base">Sản phẩm bán chậm nhưng còn tồn</CardTitle>
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
                          <TableHead>Điểm chậm</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {slowProducts.map((item, index) => (
                          <TableRow key={`${item._id || index}`}>
                            <TableCell className="font-medium">
                              {item.name || "Không rõ"}
                            </TableCell>
                            <TableCell>{item.totalStock || 0}</TableCell>
                            <TableCell>{item.qtySold || 0}</TableCell>
                            <TableCell>
                              {typeof item.score === "number" ? item.score.toFixed(2) : "0.00"}
                            </TableCell>
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
                          <TableHead>Hạng</TableHead>
                          <TableHead>Khách hàng</TableHead>
                          <TableHead>Số đơn</TableHead>
                          <TableHead>Tổng chi tiêu</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topCustomers.map((item, index) => (
                          <TableRow key={`${item.email || item.name || index}`}>
                            <TableCell>{item.rank || index + 1}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.name || "Không rõ"}</p>
                                {item.email ? (
                                  <p className="text-xs text-muted-foreground">{item.email}</p>
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
                </CardHeader>
                <CardContent>
                  {overview.recentOrders.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      Chưa có dữ liệu.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã đơn</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead>Thanh toán</TableHead>
                          <TableHead>Tổng tiền</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {overview.recentOrders.map((order) => (
                          <TableRow key={order._id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{order.orderCode || order._id}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDateTime(order.createdAt)}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusLabel(order.orderStatus)}</TableCell>
                            <TableCell>
                              {getPaymentLabel(order.paymentMethod?.status)}
                            </TableCell>
                            <TableCell>{formatPrice(order.totalAmount || 0)}</TableCell>
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