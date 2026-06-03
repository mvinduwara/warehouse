import { prisma } from "../../lib/prisma.js";
import {
  NotFoundError,
  ValidationError,
} from "../../lib/errors.js";
import { generateTransferNumber } from "../../lib/counters.js";
import type { TransferStatus } from "@prisma/client";

export interface CreateTransferInput {
  fromLocationId: string;
  toLocationId: string;
  productId: string;
  quantity: number;
  reason: string;
}

function getRackStatus(
  pct: number
): "full" | "high" | "mid" | "low" | "empty" {
  if (pct === 0) return "empty";
  if (pct >= 90) return "full";
  if (pct >= 75) return "high";
  if (pct >= 50) return "mid";
  return "low";
}

async function mapTransfer(id: string) {
  const t = await prisma.transfer.findUnique({
    where: { id },
    include: {
      fromLocation: { include: { zone: true } },
      toLocation: { include: { zone: true } },
      product: true,
      createdBy: true,
    },
  });
  if (!t) throw new NotFoundError("Transfer");

  return {
    id: t.id,
    transferNumber: t.transferNumber,
    fromLocationId: t.fromLocationId,
    fromZone: t.fromLocation.zone.name,
    fromLocation: t.fromLocation.label,
    toLocationId: t.toLocationId,
    toZone: t.toLocation.zone.name,
    toLocation: t.toLocation.label,
    productId: t.productId,
    sku: t.product.sku,
    productName: t.product.name,
    quantity: t.quantity,
    reason: t.reason,
    status: t.status,
    createdBy: t.createdBy.name,
    createdAt: t.createdAt.toISOString(),
    completedAt: t.completedAt?.toISOString() ?? null,
  };
}

export const warehouseService = {
  // ── Zones ─────────────────────────────────────────────────────────────
  async getZones() {
    const zones = await prisma.zone.findMany({
      include: {
        locations: {
          include: { inventoryLevels: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return zones.map((zone) => {
      const totalCurrentQty = zone.locations.reduce(
        (sum, loc) =>
          sum +
          loc.inventoryLevels.reduce((s, l) => s + l.quantityOnHand, 0),
        0
      );
      const occupancyPercent = Math.min(
        100,
        Math.round(
          (totalCurrentQty / Math.max(zone.totalCapacity, 1)) * 100
        )
      );

      return {
        id: zone.id,
        name: zone.name,
        label: zone.label,
        category: zone.category,
        totalCapacity: zone.totalCapacity,
        usedCapacity: totalCurrentQty,
        occupancyPercent,
        totalLocations: zone.locations.length,
        activeLocations: zone.locations.filter((l) =>
          l.inventoryLevels.some((lvl) => lvl.quantityOnHand > 0)
        ).length,
      };
    });
  },

  async getZone(id: string) {
    const zone = await prisma.zone.findUnique({
      where: { id },
      include: {
        locations: { include: { inventoryLevels: true } },
      },
    });
    if (!zone) throw new NotFoundError("Zone");

    const totalCurrentQty = zone.locations.reduce(
      (sum, loc) =>
        sum +
        loc.inventoryLevels.reduce((s, l) => s + l.quantityOnHand, 0),
      0
    );

    return {
      id: zone.id,
      name: zone.name,
      label: zone.label,
      category: zone.category,
      totalCapacity: zone.totalCapacity,
      usedCapacity: totalCurrentQty,
      occupancyPercent: Math.min(
        100,
        Math.round(
          (totalCurrentQty / Math.max(zone.totalCapacity, 1)) * 100
        )
      ),
      totalLocations: zone.locations.length,
      activeLocations: zone.locations.filter((l) =>
        l.inventoryLevels.some((lvl) => lvl.quantityOnHand > 0)
      ).length,
    };
  },

  // ── Locations ─────────────────────────────────────────────────────────
  async getLocations(zoneId?: string) {
    const where = zoneId ? { zoneId } : {};
    const locations = await prisma.warehouseLocation.findMany({
      where,
      include: { inventoryLevels: true, zone: true },
      orderBy: [
        { zone: { name: "asc" } },
        { rack: "asc" },
        { bin: "asc" },
      ],
    });

    return locations.map((loc) => {
      const currentQty = loc.inventoryLevels.reduce(
        (s, l) => s + l.quantityOnHand,
        0
      );
      return {
        id: loc.id,
        zoneId: loc.zoneId,
        zone: loc.zone.name,
        rack: loc.rack,
        bin: loc.bin,
        label: loc.label,
        maxCapacity: loc.maxCapacity,
        currentQty,
        occupancyPercent: Math.min(
          100,
          Math.round((currentQty / Math.max(loc.maxCapacity, 1)) * 100)
        ),
        isEmpty: currentQty === 0,
      };
    });
  },

  async getRackMap() {
    const locations = await prisma.warehouseLocation.findMany({
      include: { inventoryLevels: true, zone: true },
      orderBy: [
        { zone: { name: "asc" } },
        { rack: "asc" },
        { bin: "asc" },
      ],
    });

    return locations.map((loc) => {
      const currentQty = loc.inventoryLevels.reduce(
        (s, l) => s + l.quantityOnHand,
        0
      );
      const occupancyPercent = Math.min(
        100,
        Math.round(
          (currentQty / Math.max(loc.maxCapacity, 1)) * 100
        )
      );

      return {
        locationId: loc.id,
        label: loc.label,
        rack: loc.rack,
        zone: loc.zone.name,
        occupancyPercent,
        status: getRackStatus(occupancyPercent),
      };
    });
  },

  // ── Transfers ─────────────────────────────────────────────────────────
  async getTransfers(status?: string) {
    const where = status ? { status: status as TransferStatus } : {};
    const transfers = await prisma.transfer.findMany({
      where,
      include: {
        fromLocation: { include: { zone: true } },
        toLocation: { include: { zone: true } },
        product: true,
        createdBy: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return transfers.map((t) => ({
      id: t.id,
      transferNumber: t.transferNumber,
      fromLocationId: t.fromLocationId,
      fromZone: t.fromLocation.zone.name,
      fromLocation: t.fromLocation.label,
      toLocationId: t.toLocationId,
      toZone: t.toLocation.zone.name,
      toLocation: t.toLocation.label,
      productId: t.productId,
      sku: t.product.sku,
      productName: t.product.name,
      quantity: t.quantity,
      reason: t.reason,
      status: t.status,
      createdBy: t.createdBy.name,
      createdAt: t.createdAt.toISOString(),
      completedAt: t.completedAt?.toISOString() ?? null,
    }));
  },

  async getTransfer(id: string) {
    return mapTransfer(id);
  },

  async createTransfer(input: CreateTransferInput, userId: string) {
    // Validate sufficient stock at source
    const fromLevel = await prisma.inventoryLevel.findUnique({
      where: {
        productId_locationId: {
          productId: input.productId,
          locationId: input.fromLocationId,
        },
      },
    });

    if (!fromLevel || fromLevel.quantityOnHand < input.quantity) {
      throw new ValidationError(
        `Insufficient stock at source location. Available: ${
          fromLevel?.quantityOnHand ?? 0
        }`
      );
    }

    if (input.fromLocationId === input.toLocationId) {
      throw new ValidationError(
        "Source and destination locations must be different."
      );
    }

    const transferNumber = await generateTransferNumber();

    const transfer = await prisma.transfer.create({
      data: {
        transferNumber,
        fromLocationId: input.fromLocationId,
        toLocationId: input.toLocationId,
        productId: input.productId,
        quantity: input.quantity,
        reason: input.reason,
        status: "draft",
        createdById: userId,
      },
    });

    return mapTransfer(transfer.id);
  },

  async confirmTransfer(id: string) {
    const transfer = await prisma.transfer.findUnique({
      where: { id },
      include: {
        product: true,
        fromLocation: { include: { zone: true } },
      },
    });
    if (!transfer) throw new NotFoundError("Transfer");

    if (transfer.status !== "draft") {
      throw new ValidationError(
        `Transfer cannot be confirmed — current status: ${transfer.status}`
      );
    }

    // Deduct stock from source location when sending
    await prisma.inventoryLevel.update({
      where: {
        productId_locationId: {
          productId: transfer.productId,
          locationId: transfer.fromLocationId,
        },
      },
      data: { quantityOnHand: { decrement: transfer.quantity } },
    });

    const updated = await prisma.transfer.update({
      where: { id },
      data: { status: "in_transit" },
    });

    await prisma.activityLog.create({
      data: {
        type: "transfer",
        message: `Transfer ${transfer.transferNumber} sent — ${transfer.product.sku} from ${transfer.fromLocation.zone.name}`,
        reference: transfer.transferNumber,
      },
    });

    return mapTransfer(updated.id);
  },

  async completeTransfer(id: string) {
    const transfer = await prisma.transfer.findUnique({
      where: { id },
      include: {
        product: true,
        fromLocation: { include: { zone: true } },
        toLocation: { include: { zone: true } },
      },
    });
    if (!transfer) throw new NotFoundError("Transfer");

    if (transfer.status !== "in_transit") {
      throw new ValidationError(
        `Transfer cannot be completed — current status: ${transfer.status}`
      );
    }

    // Add stock to destination location
    await prisma.inventoryLevel.upsert({
      where: {
        productId_locationId: {
          productId: transfer.productId,
          locationId: transfer.toLocationId,
        },
      },
      update: { quantityOnHand: { increment: transfer.quantity } },
      create: {
        productId: transfer.productId,
        locationId: transfer.toLocationId,
        quantityOnHand: transfer.quantity,
        quantityReserved: 0,
      },
    });

    const updated = await prisma.transfer.update({
      where: { id },
      data: { status: "completed", completedAt: new Date() },
    });

    await prisma.activityLog.create({
      data: {
        type: "transfer",
        message: `Transfer ${transfer.transferNumber} completed — ${transfer.product.sku}, ${transfer.quantity} units from ${transfer.fromLocation.zone.name} to ${transfer.toLocation.zone.name}`,
        reference: transfer.transferNumber,
      },
    });

    // Emit real-time event if SSE hub is available
    try {
      const { emitTransferUpdate } = await import(
        "../realtime/sse.service.js"
      );
      emitTransferUpdate(
        updated.id,
        transfer.transferNumber,
        "completed"
      );
    } catch {
      // SSE module may not be loaded yet — safe to ignore
    }

    return mapTransfer(updated.id);
  },

  async cancelTransfer(id: string) {
    const transfer = await prisma.transfer.findUnique({ where: { id } });
    if (!transfer) throw new NotFoundError("Transfer");

    if (transfer.status === "completed") {
      throw new ValidationError("Completed transfers cannot be cancelled.");
    }

    if (transfer.status === "in_transit") {
      await prisma.inventoryLevel.update({
        where: {
          productId_locationId: {
            productId: transfer.productId,
            locationId: transfer.fromLocationId,
          },
        },
        data: { quantityOnHand: { increment: transfer.quantity } },
      });
    }

    const updated = await prisma.transfer.update({
      where: { id },
      data: { status: "cancelled" },
    });

    return mapTransfer(updated.id);
  },
};