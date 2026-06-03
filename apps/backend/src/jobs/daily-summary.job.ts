import { prisma } from "../lib/prisma.js";
import { sendEmail } from "../lib/mailer.js";
import { dailySummaryTemplate } from "../lib/email-templates.js";
import { env } from "../config/env.js";
import { startOfDay, endOfDay, format } from "date-fns";

export async function runDailySummaryJob(): Promise<void> {
  const summaryEmails = env.DAILY_SUMMARY_EMAILS
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  const notifSetting = await prisma.setting.findUnique({ where: { key: "notif_daily_summary" } });
  if (notifSetting?.value !== "true") {
    console.info("[daily-summary-job] Daily summary disabled in settings — skipping");
    return;
  }

  if (summaryEmails.length === 0) {
    console.info("[daily-summary-job] No DAILY_SUMMARY_EMAILS configured — skipping");
    return;
  }

  const today = new Date();
  const dayStart = startOfDay(today);
  const dayEnd = endOfDay(today);

  const [dispatched, received, transfers, products] = await Promise.all([
    prisma.salesOrder.count({ where: { status: "dispatched", updatedAt: { gte: dayStart, lte: dayEnd } } }),
    prisma.purchaseOrder.count({ where: { status: "received", updatedAt: { gte: dayStart, lte: dayEnd } } }),
    prisma.transfer.count({ where: { status: "completed", completedAt: { gte: dayStart, lte: dayEnd } } }),
    prisma.product.findMany({ where: { isActive: true }, include: { inventoryLevels: true } }),
  ]);

  const lowStockCount = products.filter((p) => {
    const qty = p.inventoryLevels.reduce((s, l) => s + l.quantityOnHand, 0);
    return qty <= p.reorderPoint;
  }).length;

  const inventoryValue = products.reduce((sum, p) => {
    const qty = p.inventoryLevels.reduce((s, l) => s + l.quantityOnHand, 0);
    return sum + qty * Number(p.unitCost);
  }, 0);

  const warehouseSetting = await prisma.setting.findUnique({ where: { key: "warehouse_name" } });

  const template = dailySummaryTemplate({
    date: format(today, "MMMM d, yyyy"),
    warehouseName: warehouseSetting?.value ?? "WarehouseOS",
    stats: {
      ordersDispatched: dispatched,
      ordersReceived: received,
      lowStockCount,
      transfersCompleted: transfers,
      inventoryValue: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact" }).format(inventoryValue),
    },
    dashboardUrl: env.FRONTEND_URL,
  });

  await sendEmail({ to: summaryEmails, ...template });
  console.info(`[daily-summary-job] Summary sent to ${summaryEmails.join(", ")}`);
}