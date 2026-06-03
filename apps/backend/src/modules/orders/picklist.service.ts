import { prisma } from "../../lib/prisma.js";
import { generatePdf } from "../../lib/pdf.js";
import { NotFoundError } from "../../lib/errors.js";
import { format } from "date-fns";

export async function generatePickListPdf(soId: string): Promise<Buffer> {
  const so = await prisma.salesOrder.findUnique({
    where: { id: soId },
    include: {
      items: {
        include: {
          product: {
            include: {
              inventoryLevels: {
                include: { location: { include: { zone: true } } },
              },
            },
          },
        },
      },
      createdBy: true,
    },
  });

  if (!so) throw new NotFoundError("Sales Order");

  const rows = so.items.map((item) => {
    const level = item.product.inventoryLevels[0];
    return [
      item.product.sku,
      item.product.name,
      level?.location.zone.name ?? "—",
      level?.location.rack ?? "—",
      level?.location.bin ?? "—",
      String(item.orderedQty),
      String(item.pickedQty),
      item.pickedQty >= item.orderedQty ? "✓ Done" : "○ Pending",
    ];
  });

  return generatePdf({
    title: `Pick List — ${so.soNumber}`,
    subtitle: `Customer: ${so.customerName}  ·  Required by: ${format(so.requiredBy, "MMM d, yyyy")}  ·  Items: ${so.totalItems}`,
    sections: [
      {
        title: "Order Information",
        table: {
          headers: ["Field", "Value"],
          colWidths: [150, 350],
          rows: [
            ["Order Number", so.soNumber],
            ["Customer", so.customerName],
            ["Required By", format(so.requiredBy, "MMMM d, yyyy")],
            ["Carrier", so.carrier ?? "TBD"],
            ["Shipping Address", so.shippingAddress],
            ["Status", so.status.toUpperCase()],
            ["Created By", so.createdBy.name],
          ],
        },
      },
      { spacer: 0.5 },
      {
        title: "Items to Pick",
        table: {
          headers: ["SKU", "Product Name", "Zone", "Rack", "Bin", "Qty Required", "Qty Picked", "Status"],
          colWidths: [70, 130, 55, 45, 40, 70, 65, 65],
          rows,
        },
      },
      {
        spacer: 1,
      },
      {
        title: "Confirmation",
        table: {
          headers: ["Field", "Value"],
          colWidths: [200, 300],
          rows: [
            ["Picked by (name)", "___________________________"],
            ["Date & time", "___________________________"],
            ["Signature", "___________________________"],
          ],
        },
      },
    ],
  });
}

export async function generateInventoryReportPdf(): Promise<Buffer> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      inventoryLevels: {
        include: { location: { include: { zone: true } } },
      },
    },
    orderBy: { category: "asc" },
  });

  const rows = products.map((p) => {
    const totalQty = p.inventoryLevels.reduce((s, l) => s + l.quantityOnHand, 0);
    const value = totalQty * Number(p.unitCost);
    const status = totalQty === 0 ? "Out of Stock" : totalQty <= p.reorderPoint * 0.25 ? "Critical" : totalQty <= p.reorderPoint ? "Low" : "In Stock";
    return [
      p.sku,
      p.name,
      p.category,
      String(totalQty),
      String(p.reorderPoint),
      `$${Number(p.unitCost).toFixed(2)}`,
      `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      status,
    ];
  });

  const totalValue = products.reduce((sum, p) => {
    const qty = p.inventoryLevels.reduce((s, l) => s + l.quantityOnHand, 0);
    return sum + qty * Number(p.unitCost);
  }, 0);

  return generatePdf({
    title: "Inventory Valuation Report",
    subtitle: `Generated ${format(new Date(), "MMMM d, yyyy 'at' HH:mm")}  ·  ${products.length} active SKUs  ·  Total value: $${totalValue.toLocaleString()}`,
    sections: [
      {
        title: "Summary",
        table: {
          headers: ["Metric", "Value"],
          colWidths: [200, 300],
          rows: [
            ["Total Active SKUs", String(products.length)],
            ["Total Inventory Value", `$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`],
            ["Out of Stock Items", String(rows.filter((r) => r[7] === "Out of Stock").length)],
            ["Low / Critical Items", String(rows.filter((r) => r[7] === "Low" || r[7] === "Critical").length)],
          ],
        },
      },
      { spacer: 0.5 },
      {
        title: "Product Inventory",
        table: {
          headers: ["SKU", "Product", "Category", "On Hand", "Reorder Pt.", "Unit Cost", "Total Value", "Status"],
          colWidths: [65, 110, 75, 50, 60, 60, 80, 60],
          rows,
        },
      },
    ],
  });
}

export async function generateAgingReportPdf(): Promise<Buffer> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { inventoryLevels: true },
    orderBy: { createdAt: "asc" },
  });

  const now = new Date();
  const rows = products.map((p) => {
    const qty = p.inventoryLevels.reduce((s, l) => s + l.quantityOnHand, 0);
    const ageDays = Math.floor((now.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const value = qty * Number(p.unitCost);
    let bucket = "0–30 days";
    if (ageDays > 90) bucket = ">90 days";
    else if (ageDays > 60) bucket = "61–90 days";
    else if (ageDays > 30) bucket = "31–60 days";
    return [p.sku, p.name, format(p.createdAt, "MMM d, yyyy"), String(ageDays) + "d", String(qty), `$${value.toFixed(2)}`, bucket];
  });

  return generatePdf({
    title: "Aging Inventory Report",
    subtitle: `Generated ${format(new Date(), "MMMM d, yyyy")}`,
    sections: [
      {
        title: "Aging Breakdown",
        table: {
          headers: ["SKU", "Product", "Added", "Age", "Qty", "Value", "Bucket"],
          colWidths: [65, 130, 80, 40, 40, 80, 75],
          rows,
        },
      },
    ],
  });
}