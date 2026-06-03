import { prisma } from "../../lib/prisma.js";
import { NotFoundError, ConflictError } from "../../lib/errors.js";
import { getPaginationArgs, buildPaginatedResult } from "../../lib/pagination.js";
import type { Prisma } from "@prisma/client";

export interface CreateProductInput {
  sku: string;
  name: string;
  category: string;
  barcode?: string;
  unitOfMeasure: string;
  unitCost: number;
  sellingPrice: number;
  reorderPoint: number;
  initialQty: number;
  locationZone: string;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  status?: string;
  zone?: string;
  page?: number;
  pageSize?: number;
}

function computeStockStatus(qty: number, reorderPoint: number) {
  if (qty === 0) return "out_of_stock";
  if (qty <= reorderPoint * 0.25) return "critical";
  if (qty <= reorderPoint) return "low";
  return "in_stock";
}

function mapProduct(product: Prisma.ProductGetPayload<{
  include: { inventoryLevels: { include: { location: { include: { zone: true } } } } };
}>) {
  const totalOnHand = product.inventoryLevels.reduce(
    (sum, l) => sum + l.quantityOnHand,
    0
  );
  const totalReserved = product.inventoryLevels.reduce(
    (sum, l) => sum + l.quantityReserved,
    0
  );

  return {
    ...product,
    unitCost: Number(product.unitCost),
    sellingPrice: Number(product.sellingPrice),
    totalOnHand,
    totalAvailable: totalOnHand - totalReserved,
    stockStatus: computeStockStatus(totalOnHand, product.reorderPoint),
    inventoryLevels: product.inventoryLevels.map((lvl) => ({
      id: lvl.id,
      productId: lvl.productId,
      locationId: lvl.locationId,
      locationLabel: lvl.location.label,
      zone: lvl.location.zone.name,
      rack: lvl.location.rack,
      bin: lvl.location.bin,
      quantityOnHand: lvl.quantityOnHand,
      quantityReserved: lvl.quantityReserved,
      quantityAvailable: lvl.quantityOnHand - lvl.quantityReserved,
      updatedAt: lvl.updatedAt.toISOString(),
    })),
  };
}

export const productsService = {
  async getProducts(filters: ProductFilters) {
    const { page, pageSize, skip, take } = getPaginationArgs(filters);

    const where: Prisma.ProductWhereInput = { isActive: true };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { sku: { contains: filters.search, mode: "insensitive" } },
        { barcode: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters.category) {
      where.category = { equals: filters.category, mode: "insensitive" };
    }

    const include = {
      inventoryLevels: {
        include: { location: { include: { zone: true } } },
      },
    };

    const [rawProducts, total] = await Promise.all([
      prisma.product.findMany({ where, include, skip, take, orderBy: { name: "asc" } }),
      prisma.product.count({ where }),
    ]);

    let products = rawProducts.map(mapProduct);

    if (filters.status) {
      products = products.filter((p) => p.stockStatus === filters.status);
    }

    if (filters.zone) {
      products = products.filter((p) =>
        p.inventoryLevels.some((l) => l.zone === filters.zone)
      );
    }

    return buildPaginatedResult(products, total, page, pageSize);
  },

  async getProduct(id: string) {
    const product = await prisma.product.findUnique({
      where: { id, isActive: true },
      include: {
        inventoryLevels: {
          include: { location: { include: { zone: true } } },
        },
      },
    });
    if (!product) throw new NotFoundError("Product");
    return mapProduct(product);
  },

  async createProduct(input: CreateProductInput, userId: string) {
    const exists = await prisma.product.findUnique({ where: { sku: input.sku } });
    if (exists) throw new ConflictError(`SKU "${input.sku}" already exists.`);

    const zone = await prisma.zone.findFirst({
      where: { name: { contains: input.locationZone, mode: "insensitive" } },
    });

    const product = await prisma.product.create({
      data: {
        sku: input.sku,
        name: input.name,
        category: input.category,
        barcode: input.barcode,
        unitOfMeasure: input.unitOfMeasure,
        unitCost: input.unitCost,
        sellingPrice: input.sellingPrice,
        reorderPoint: input.reorderPoint,
      },
    });

    if (zone && input.initialQty > 0) {
      let location = await prisma.warehouseLocation.findFirst({
        where: { zoneId: zone.id },
      });

      if (!location) {
        location = await prisma.warehouseLocation.create({
          data: {
            zoneId: zone.id,
            rack: "R01",
            bin: "B1",
            label: `${zone.name} / R01 / B1`,
            maxCapacity: 100,
          },
        });
      }

      await prisma.inventoryLevel.create({
        data: {
          productId: product.id,
          locationId: location.id,
          quantityOnHand: input.initialQty,
          quantityReserved: 0,
        },
      });

      await prisma.activityLog.create({
        data: {
          type: "adjustment",
          message: `Initial stock set for ${product.name} (${product.sku}): ${input.initialQty} units`,
          reference: product.sku,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: "CREATE",
        entity: "Product",
        entityId: product.id,
        after: { sku: product.sku, name: product.name },
      },
    });

    return productsService.getProduct(product.id);
  },

  async updateProduct(id: string, input: Partial<CreateProductInput>, userId: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundError("Product");

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: input.name,
        category: input.category,
        barcode: input.barcode,
        unitOfMeasure: input.unitOfMeasure,
        unitCost: input.unitCost,
        sellingPrice: input.sellingPrice,
        reorderPoint: input.reorderPoint,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: "UPDATE",
        entity: "Product",
        entityId: id,
        before: { name: product.name },
        after: { name: updated.name },
      },
    });

    return productsService.getProduct(id);
  },

  async deleteProduct(id: string, userId: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundError("Product");

    await prisma.product.update({ where: { id }, data: { isActive: false } });

    await prisma.auditLog.create({
      data: { userId, action: "DELETE", entity: "Product", entityId: id },
    });
  },

  async getLowStockProducts() {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        inventoryLevels: {
          include: { location: { include: { zone: true } } },
        },
      },
    });

    return products
      .map(mapProduct)
      .filter((p) => p.stockStatus === "low" || p.stockStatus === "critical" || p.stockStatus === "out_of_stock");
  },

  async adjustStock(
    productId: string,
    locationId: string,
    delta: number,
    reason: string,
    userId: string
  ) {
    const level = await prisma.inventoryLevel.findUnique({
      where: { productId_locationId: { productId, locationId } },
    });

    if (!level) {
      await prisma.inventoryLevel.create({
        data: { productId, locationId, quantityOnHand: Math.max(0, delta), quantityReserved: 0 },
      });
    } else {
      const newQty = Math.max(0, level.quantityOnHand + delta);
      await prisma.inventoryLevel.update({
        where: { productId_locationId: { productId, locationId } },
        data: { quantityOnHand: newQty },
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { sku: true, name: true, reorderPoint: true } });

    const adjustment = await prisma.stockAdjustment.create({
      data: {
        productId,
        locationId,
        delta,
        reason,
        performedBy: user?.name ?? "Unknown",
        userId,
      },
    });

    await prisma.activityLog.create({
      data: {
        type: "adjustment",
        message: `Stock adjustment for ${product?.name} (${product?.sku}): ${delta > 0 ? "+" : ""}${delta} units — ${reason}`,
        reference: product?.sku ?? productId,
      },
    });

    const updatedLevel = await prisma.inventoryLevel.findUnique({
      where: { productId_locationId: { productId, locationId } },
    });

    if (product && updatedLevel && updatedLevel.quantityOnHand <= product.reorderPoint) {
      await prisma.activityLog.create({
        data: {
          type: "alert",
          message: `Low stock triggered for ${product.sku} — Reorder point: ${product.reorderPoint}, Current: ${updatedLevel.quantityOnHand}`,
          reference: product.sku,
        },
      });
    }
    const { emitLowStockAlert } = await import("../realtime/sse.service.js");
    if (updatedLevel && product && updatedLevel.quantityOnHand <= product.reorderPoint) {
      emitLowStockAlert([{
        sku: product.sku,
        name: product.name,
        qty: updatedLevel.quantityOnHand,
      }]);
    }

    return adjustment;
  },

  async getStockAdjustments(productId: string) {
    return prisma.stockAdjustment.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  },
};