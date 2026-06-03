import { prisma } from "../../lib/prisma.js";
import { NotFoundError, ValidationError } from "../../lib/errors.js";
import {
  getPaginationArgs,
  buildPaginatedResult,
} from "../../lib/pagination.js";
import {
  generatePoNumber,
  generateSoNumber,
} from "../../lib/counters.js";
import type { POStatus, SOStatus, Prisma } from "@prisma/client";

export interface CreatePOInput {
  supplierId: string;
  expectedDate: string;
  receivingDock: string;
  notes?: string;
  items: Array<{
    productId: string;
    orderedQty: number;
    unitCost: number;
  }>;
}

export interface ReceivePOInput {
  items: Array<{
    purchaseOrderItemId: string;
    receivedQty: number;
    locationId: string;
  }>;
  notes?: string;
}

export interface CreateSOInput {
  customerName: string;
  customerId?: string;
  requiredBy: string;
  carrier?: string;
  shippingAddress: string;
  items: Array<{
    productId: string;
    orderedQty: number;
    unitPrice: number;
  }>;
}

export interface OrderFilters {
  search?: string;
  status?: string;
  supplierId?: string;
  page?: number;
  pageSize?: number;
}

function mapPO(
  po: Prisma.PurchaseOrderGetPayload<{
    include: {
      supplier: true;
      items: { include: { product: true } };
      createdBy: true;
    };
  }>
) {
  return {
    ...po,
    totalValue: Number(po.totalValue),
    expectedDate: po.expectedDate.toISOString(),
    createdAt: po.createdAt.toISOString(),
    updatedAt: po.updatedAt.toISOString(),
    items: po.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      sku: item.product.sku,
      productName: item.product.name,
      orderedQty: item.orderedQty,
      receivedQty: item.receivedQty,
      unitCost: Number(item.unitCost),
      totalCost: Number(item.unitCost) * item.orderedQty,
    })),
  };
}

function mapSO(
  so: Prisma.SalesOrderGetPayload<{
    include: {
      items: { include: { product: true } };
      createdBy: true;
    };
  }>
) {
  return {
    ...so,
    totalValue: Number(so.totalValue),
    requiredBy: so.requiredBy.toISOString(),
    createdAt: so.createdAt.toISOString(),
    updatedAt: so.updatedAt.toISOString(),
    items: so.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      sku: item.product.sku,
      productName: item.product.name,
      orderedQty: item.orderedQty,
      pickedQty: item.pickedQty,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.unitPrice) * item.orderedQty,
    })),
  };
}

export const ordersService = {
  // ── Suppliers ─────────────────────────────────────────────────────────
  async getSuppliers() {
    const suppliers = await prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    return suppliers.map((s) => ({
      ...s,
      onTimeDeliveryRate: Number(s.onTimeDeliveryRate),
    }));
  },

  // ── Purchase Orders ───────────────────────────────────────────────────
  async getPurchaseOrders(filters: OrderFilters) {
    const { page, pageSize, skip, take } = getPaginationArgs(filters);

    const where: Prisma.PurchaseOrderWhereInput = {};
    if (filters.status) where.status = filters.status as POStatus;
    if (filters.supplierId) where.supplierId = filters.supplierId;
    if (filters.search) {
      where.OR = [
        { poNumber: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const include = {
      supplier: true,
      items: { include: { product: true } },
      createdBy: true,
    } as const;

    const [rawPOs, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return buildPaginatedResult(rawPOs.map(mapPO), total, page, pageSize);
  },

  async getPurchaseOrder(id: string) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: { include: { product: true } },
        createdBy: true,
      },
    });
    if (!po) throw new NotFoundError("Purchase Order");
    return mapPO(po);
  },

  async createPurchaseOrder(input: CreatePOInput, userId: string) {
    const poNumber = await generatePoNumber();
    const totalValue = input.items.reduce(
      (sum, item) => sum + item.orderedQty * item.unitCost,
      0
    );

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: input.supplierId,
        createdById: userId,
        expectedDate: new Date(input.expectedDate),
        receivingDock: input.receivingDock,
        notes: input.notes,
        totalItems: input.items.length,
        totalValue,
        status: "draft",
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            orderedQty: item.orderedQty,
            unitCost: item.unitCost,
          })),
        },
      },
      include: {
        supplier: true,
        items: { include: { product: true } },
        createdBy: true,
      },
    });

    return mapPO(po);
  },

  async updatePOStatus(id: string, status: POStatus, notes?: string) {
    const po = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new NotFoundError("Purchase Order");

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: { status, notes: notes ?? po.notes },
      include: {
        supplier: true,
        items: { include: { product: true } },
        createdBy: true,
      },
    });

    return mapPO(updated);
  },

  async receivePurchaseOrder(id: string, input: ReceivePOInput) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, supplier: true },
    });
    if (!po) throw new NotFoundError("Purchase Order");

    for (const line of input.items) {
      const poItem = po.items.find((i) => i.id === line.purchaseOrderItemId);
      if (!poItem) continue;

      await prisma.purchaseOrderItem.update({
        where: { id: line.purchaseOrderItemId },
        data: { receivedQty: { increment: line.receivedQty } },
      });

      await prisma.inventoryLevel.upsert({
        where: {
          productId_locationId: {
            productId: poItem.productId,
            locationId: line.locationId,
          },
        },
        update: { quantityOnHand: { increment: line.receivedQty } },
        create: {
          productId: poItem.productId,
          locationId: line.locationId,
          quantityOnHand: line.receivedQty,
          quantityReserved: 0,
        },
      });

      await prisma.poReceiptLine.create({
        data: {
          purchaseOrderId: id,
          purchaseOrderItemId: line.purchaseOrderItemId,
          locationId: line.locationId,
          receivedQty: line.receivedQty,
        },
      });
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: { status: "received" },
      include: {
        supplier: true,
        items: { include: { product: true } },
        createdBy: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        type: "received",
        message: `Received ${po.poNumber} from ${po.supplier.name}`,
        reference: po.poNumber,
        location: po.receivingDock,
      },
    });

    return mapPO(updated);
  },

  // ── Sales Orders ──────────────────────────────────────────────────────
  async getSalesOrders(filters: OrderFilters) {
    const { page, pageSize, skip, take } = getPaginationArgs(filters);

    const where: Prisma.SalesOrderWhereInput = {};
    if (filters.status) where.status = filters.status as SOStatus;
    if (filters.search) {
      where.OR = [
        { soNumber: { contains: filters.search, mode: "insensitive" } },
        { customerName: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const include = {
      items: { include: { product: true } },
      createdBy: true,
    } as const;

    const [rawSOs, total] = await Promise.all([
      prisma.salesOrder.findMany({
        where,
        include,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.salesOrder.count({ where }),
    ]);

    return buildPaginatedResult(rawSOs.map(mapSO), total, page, pageSize);
  },

  async getSalesOrder(id: string) {
    const so = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        createdBy: true,
      },
    });
    if (!so) throw new NotFoundError("Sales Order");
    return mapSO(so);
  },

  async createSalesOrder(input: CreateSOInput, userId: string) {
    const soNumber = await generateSoNumber();
    const totalValue = input.items.reduce(
      (sum, item) => sum + item.orderedQty * item.unitPrice,
      0
    );

    const daysUntilDue = Math.ceil(
      (new Date(input.requiredBy).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    );

    const so = await prisma.salesOrder.create({
      data: {
        soNumber,
        customerName: input.customerName,
        customerId: input.customerId,
        createdById: userId,
        requiredBy: new Date(input.requiredBy),
        carrier: input.carrier,
        shippingAddress: input.shippingAddress,
        totalItems: input.items.length,
        totalValue,
        status: "processing",
        isUrgent: daysUntilDue <= 2,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            orderedQty: item.orderedQty,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: {
        items: { include: { product: true } },
        createdBy: true,
      },
    });

    return mapSO(so);
  },

  async updateSOStatus(id: string, status: SOStatus) {
    const so = await prisma.salesOrder.findUnique({ where: { id } });
    if (!so) throw new NotFoundError("Sales Order");

    const updated = await prisma.salesOrder.update({
      where: { id },
      data: { status },
      include: {
        items: { include: { product: true } },
        createdBy: true,
      },
    });

    return mapSO(updated);
  },

  async dispatchOrder(
    id: string,
    carrier: string,
    trackingNumber?: string
  ) {
    const so = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        createdBy: true,
      },
    });
    if (!so) throw new NotFoundError("Sales Order");

    // Deduct stock for each item from the first available location
    for (const item of so.items) {
      const level = await prisma.inventoryLevel.findFirst({
        where: {
          productId: item.productId,
          quantityOnHand: { gte: item.orderedQty },
        },
        orderBy: { quantityOnHand: "desc" },
      });

      if (level) {
        await prisma.inventoryLevel.update({
          where: { id: level.id },
          data: { quantityOnHand: { decrement: item.orderedQty } },
        });
      }
    }

    const updated = await prisma.salesOrder.update({
      where: { id },
      data: { status: "dispatched", carrier, trackingNumber },
      include: {
        items: { include: { product: true } },
        createdBy: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        type: "shipped",
        message: `Dispatched ${so.soNumber} — ${so.totalItems} items to ${so.customerName} via ${carrier}`,
        reference: so.soNumber,
      },
    });

    try {
      const { emitOrderUpdate } = await import(
        "../realtime/sse.service.js"
      );
      emitOrderUpdate(updated.id, updated.soNumber, updated.status);
    } catch {
    }

    return mapSO(updated);
  },
};