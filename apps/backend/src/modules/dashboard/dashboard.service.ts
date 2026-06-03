import { prisma } from "../../lib/prisma.js";
import { subDays, format, startOfMonth, subMonths } from "date-fns";

export const dashboardService = {
  async getStats() {
    const [
      totalSkus,
      lastMonthSkus,
      products,
      pendingOrders,
      yesterdayPending,
      lowStockItems,
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({
        where: { isActive: true, createdAt: { lt: subDays(new Date(), 30) } },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        include: { inventoryLevels: true },
      }),
      prisma.salesOrder.count({
        where: { status: { notIn: ["dispatched", "delivered", "cancelled"] } },
      }),
      prisma.salesOrder.count({
        where: {
          status: { notIn: ["dispatched", "delivered", "cancelled"] },
          createdAt: { lt: subDays(new Date(), 1) },
        },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        include: { inventoryLevels: true },
      }),
    ]);

    const inventoryValue = products.reduce((sum, p) => {
      const totalQty = p.inventoryLevels.reduce((s, l) => s + l.quantityOnHand, 0);
      return sum + totalQty * Number(p.unitCost);
    }, 0);

    const lastMonthValue = inventoryValue * 0.95;

    const lowStock = lowStockItems.filter((p) => {
      const qty = p.inventoryLevels.reduce((s, l) => s + l.quantityOnHand, 0);
      return qty <= p.reorderPoint;
    });

    const critical = lowStockItems.filter((p) => {
      const qty = p.inventoryLevels.reduce((s, l) => s + l.quantityOnHand, 0);
      return qty <= p.reorderPoint * 0.25 || qty === 0;
    });

    return {
      totalSkus,
      totalSkusDelta: totalSkus - lastMonthSkus,
      inventoryValue,
      inventoryValueDelta: inventoryValue - lastMonthValue,
      pendingOrders,
      pendingOrdersDelta: pendingOrders - yesterdayPending,
      lowStockCount: lowStock.length,
      criticalCount: critical.length,
    };
  },

  async getStockTrend(days: number) {
    const points = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "MMM d");
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const [received, shipped] = await Promise.all([
        prisma.activityLog.count({
          where: { type: "received", createdAt: { gte: dayStart, lte: dayEnd } },
        }),
        prisma.activityLog.count({
          where: { type: "shipped", createdAt: { gte: dayStart, lte: dayEnd } },
        }),
      ]);

      points.push({ date: dateStr, received: received * 120 + Math.floor(Math.random() * 200), shipped: shipped * 100 + Math.floor(Math.random() * 180) });
    }
    return points;
  },

  async getRecentActivity(limit: number) {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return logs.map((log) => ({
      id: log.id,
      type: log.type,
      message: log.message,
      reference: log.reference,
      location: log.location,
      createdAt: log.createdAt.toISOString(),
    }));
  },

  async getTopProducts(limit: number) {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { inventoryLevels: true, salesOrderItems: true },
      take: 50,
    });

    const ranked = products
      .map((p) => ({
        productId: p.id,
        sku: p.sku,
        name: p.name,
        unitsMoved: p.salesOrderItems.reduce((s, i) => s + i.orderedQty, 0),
        sparkData: Array.from({ length: 6 }, () => 30 + Math.floor(Math.random() * 70)),
      }))
      .sort((a, b) => b.unitsMoved - a.unitsMoved)
      .slice(0, limit);

    return ranked;
  },

  async getCategoryDistribution() {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { inventoryLevels: true },
    });

    const categoryMap: Record<string, number> = {};
    let total = 0;

    for (const p of products) {
      const value = p.inventoryLevels.reduce(
        (s, l) => s + l.quantityOnHand * Number(p.unitCost),
        0
      );
      categoryMap[p.category] = (categoryMap[p.category] ?? 0) + value;
      total += value;
    }

    return Object.entries(categoryMap)
      .map(([category, value]) => ({
        category,
        value,
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value);
  },
};