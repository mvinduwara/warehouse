import { parse } from "csv-parse/sync";
import { prisma } from "../../lib/prisma.js";
import { ValidationError } from "../../lib/errors.js";
import { z } from "zod";

const csvRowSchema = z.object({
  sku: z.string().min(1, "SKU required"),
  name: z.string().min(2, "Name required"),
  category: z.string().min(1, "Category required"),
  barcode: z.string().optional(),
  unit_of_measure: z.string().default("ea"),
  unit_cost: z.coerce.number().positive("Unit cost must be positive"),
  selling_price: z.coerce.number().positive("Selling price must be positive"),
  reorder_point: z.coerce.number().int().min(0).default(50),
  initial_qty: z.coerce.number().int().min(0).default(0),
  zone: z.string().default("Zone A"),
});

export interface CsvImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; sku: string; error: string }>;
}

export async function importProductsFromCsv(
  buffer: Buffer,
  userId: string
): Promise<CsvImportResult> {
  let records: Record<string, string>[];

  try {
    records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (err) {
    throw new ValidationError("Invalid CSV format. Ensure the file has correct headers and UTF-8 encoding.");
  }

  if (records.length === 0) {
    throw new ValidationError("CSV file is empty.");
  }

  if (records.length > 5000) {
    throw new ValidationError("CSV file exceeds the 5,000 row limit. Split into smaller files.");
  }

  const result: CsvImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };

  for (let i = 0; i < records.length; i++) {
    const rowNum = i + 2;
    const raw = records[i]!;

    const parsed = csvRowSchema.safeParse(raw);
    if (!parsed.success) {
      result.errors.push({
        row: rowNum,
        sku: raw.sku ?? `row-${rowNum}`,
        error: parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; "),
      });
      result.skipped++;
      continue;
    }

    const d = parsed.data;

    try {
      const existing = await prisma.product.findUnique({ where: { sku: d.sku } });

      if (existing) {
        await prisma.product.update({
          where: { sku: d.sku },
          data: {
            name: d.name,
            category: d.category,
            barcode: d.barcode,
            unitOfMeasure: d.unit_of_measure,
            unitCost: d.unit_cost,
            sellingPrice: d.selling_price,
            reorderPoint: d.reorder_point,
            isActive: true,
          },
        });
        result.updated++;
      } else {
        const zone = await prisma.zone.findFirst({
          where: { name: { contains: d.zone, mode: "insensitive" } },
        });

        const product = await prisma.product.create({
          data: {
            sku: d.sku,
            name: d.name,
            category: d.category,
            barcode: d.barcode,
            unitOfMeasure: d.unit_of_measure,
            unitCost: d.unit_cost,
            sellingPrice: d.selling_price,
            reorderPoint: d.reorder_point,
          },
        });

        if (zone && d.initial_qty > 0) {
          const location = await prisma.warehouseLocation.findFirst({ where: { zoneId: zone.id } });
          if (location) {
            await prisma.inventoryLevel.create({
              data: {
                productId: product.id,
                locationId: location.id,
                quantityOnHand: d.initial_qty,
                quantityReserved: 0,
              },
            });
          }
        }

        result.created++;
      }
    } catch (err) {
      result.errors.push({
        row: rowNum,
        sku: d.sku,
        error: err instanceof Error ? err.message : "Unknown error",
      });
      result.skipped++;
    }
  }

  await prisma.activityLog.create({
    data: {
      type: "adjustment",
      message: `CSV import: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`,
      reference: "CSV_IMPORT",
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: "CSV_IMPORT",
      entity: "Product",
      entityId: "bulk",
      after: { created: result.created, updated: result.updated, skipped: result.skipped },
    },
  });

  return result;
}

export const CSV_TEMPLATE_HEADERS = [
  "sku",
  "name",
  "category",
  "barcode",
  "unit_of_measure",
  "unit_cost",
  "selling_price",
  "reorder_point",
  "initial_qty",
  "zone",
].join(",");

export const CSV_TEMPLATE_EXAMPLE = `${CSV_TEMPLATE_HEADERS}
SKU-0001,Example Product,Electronics,,ea,25.00,49.99,100,200,Zone A
SKU-0002,Another Product,Apparel,,ea,15.50,34.99,50,0,Zone C`;