import { prisma } from "../lib/prisma.js";
import { sendEmail } from "../lib/mailer.js";
import { lowStockAlertTemplate } from "../lib/email-templates.js";
import { env } from "../config/env.js";

export async function runLowStockAlertJob(): Promise<void> {
  const alertEmails = env.LOW_STOCK_ALERT_EMAILS
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (alertEmails.length === 0) {
    console.info("[low-stock-job] No LOW_STOCK_ALERT_EMAILS configured — skipping");
    return;
  }

  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      inventoryLevels: {
        include: { location: { include: { zone: true } } },
      },
    },
  });

  const lowStockItems = products
    .map((p) => {
      const qty = p.inventoryLevels.reduce((s, l) => s + l.quantityOnHand, 0);
      const zone = p.inventoryLevels[0]?.location.zone.name ?? "Unknown";
      return { sku: p.sku, name: p.name, qty, reorderPoint: p.reorderPoint, zone };
    })
    .filter((p) => p.qty <= p.reorderPoint)
    .sort((a, b) => a.qty - b.qty);

  if (lowStockItems.length === 0) {
    console.info("[low-stock-job] No low-stock items found");
    return;
  }

  const warehouseSetting = await prisma.setting.findUnique({ where: { key: "warehouse_name" } });

  const template = lowStockAlertTemplate({
    items: lowStockItems,
    warehouseName: warehouseSetting?.value ?? "WarehouseOS",
    dashboardUrl: env.FRONTEND_URL,
  });

  await sendEmail({ to: alertEmails, ...template });
  console.info(`[low-stock-job] Alert sent for ${lowStockItems.length} items to ${alertEmails.join(", ")}`);
}