import { PrismaClient, Role, POStatus, SOStatus, TransferStatus, ActivityType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Users ──────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@wms.com" },
    update: {},
    create: {
      name: "Alex Donovan",
      email: "admin@wms.com",
      passwordHash,
      role: Role.admin,
      avatarInitials: "AD",
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "sara@wms.com" },
    update: {},
    create: {
      name: "Sara Ramos",
      email: "sara@wms.com",
      passwordHash,
      role: Role.manager,
      avatarInitials: "SR",
    },
  });

  const operator = await prisma.user.upsert({
    where: { email: "james@wms.com" },
    update: {},
    create: {
      name: "James Chen",
      email: "james@wms.com",
      passwordHash,
      role: Role.operator,
      avatarInitials: "JC",
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: "mike@wms.com" },
    update: {},
    create: {
      name: "Mike Kim",
      email: "mike@wms.com",
      passwordHash,
      role: Role.viewer,
      avatarInitials: "MK",
    },
  });

  console.log("✅ Users created");

  // ── Zones ──────────────────────────────────────────────────────────────
  const zoneA = await prisma.zone.upsert({
    where: { name: "Zone A" },
    update: {},
    create: { name: "Zone A", label: "Zone A", category: "Electronics", totalCapacity: 1200 },
  });

  const zoneB = await prisma.zone.upsert({
    where: { name: "Zone B" },
    update: {},
    create: { name: "Zone B", label: "Zone B", category: "Mixed", totalCapacity: 1000 },
  });

  const zoneC = await prisma.zone.upsert({
    where: { name: "Zone C" },
    update: {},
    create: { name: "Zone C", label: "Zone C", category: "Apparel", totalCapacity: 800 },
  });

  const zoneD = await prisma.zone.upsert({
    where: { name: "Zone D" },
    update: {},
    create: { name: "Zone D", label: "Zone D", category: "Food & Bev / Temp", totalCapacity: 600 },
  });

  console.log("✅ Zones created");

  // ── Locations ──────────────────────────────────────────────────────────
  const locationData = [
    { zoneId: zoneA.id, rack: "R01", bin: "B1", label: "Zone A / R01 / B1", maxCapacity: 150 },
    { zoneId: zoneA.id, rack: "R01", bin: "B2", label: "Zone A / R01 / B2", maxCapacity: 150 },
    { zoneId: zoneA.id, rack: "R02", bin: "B1", label: "Zone A / R02 / B1", maxCapacity: 200 },
    { zoneId: zoneA.id, rack: "R02", bin: "B2", label: "Zone A / R02 / B2", maxCapacity: 200 },
    { zoneId: zoneA.id, rack: "R04", bin: "B2", label: "Zone A / R04 / B2", maxCapacity: 150 },
    { zoneId: zoneA.id, rack: "R07", bin: "B2", label: "Zone A / R07 / B2", maxCapacity: 120 },
    { zoneId: zoneB.id, rack: "R05", bin: "B2", label: "Zone B / R05 / B2", maxCapacity: 100 },
    { zoneId: zoneB.id, rack: "R11", bin: "B4", label: "Zone B / R11 / B4", maxCapacity: 80 },
    { zoneId: zoneC.id, rack: "R01", bin: "B3", label: "Zone C / R01 / B3", maxCapacity: 200 },
    { zoneId: zoneC.id, rack: "R02", bin: "B1", label: "Zone C / R02 / B1", maxCapacity: 150 },
    { zoneId: zoneD.id, rack: "R03", bin: "B5", label: "Zone D / R03 / B5", maxCapacity: 100 },
    { zoneId: zoneD.id, rack: "R08", bin: "B1", label: "Zone D / R08 / B1", maxCapacity: 200 },
  ];

  const locations: Record<string, string> = {};
  for (const loc of locationData) {
    const created = await prisma.warehouseLocation.upsert({
      where: { label: loc.label },
      update: {},
      create: loc,
    });
    locations[loc.label] = created.id;
  }

  console.log("✅ Locations created");

  // ── Products ───────────────────────────────────────────────────────────
  const productData = [
    { sku: "SKU-1204", name: "USB-C Hub 7-in-1", category: "Electronics", unitOfMeasure: "ea", unitCost: 24.50, sellingPrice: 49.99, reorderPoint: 200, location: "Zone A / R04 / B2", qty: 842 },
    { sku: "SKU-0882", name: "HDMI 4K Cable 2m", category: "Electronics", unitOfMeasure: "ea", unitCost: 8.90, sellingPrice: 19.99, reorderPoint: 300, location: "Zone A / R02 / B1", qty: 1204 },
    { sku: "SKU-4821", name: "Wireless Mouse Ergonomic", category: "Electronics", unitOfMeasure: "ea", unitCost: 32.00, sellingPrice: 64.99, reorderPoint: 50, location: "Zone B / R11 / B4", qty: 12 },
    { sku: "SKU-2210", name: "Classic Denim Jacket M", category: "Apparel", unitOfMeasure: "ea", unitCost: 45.20, sellingPrice: 89.99, reorderPoint: 100, location: "Zone C / R01 / B3", qty: 388 },
    { sku: "SKU-3301", name: "AA Alkaline Batteries x4", category: "Hardware", unitOfMeasure: "Box", unitCost: 3.20, sellingPrice: 7.99, reorderPoint: 100, location: "Zone D / R08 / B1", qty: 64 },
    { sku: "SKU-4120", name: "Aluminum Laptop Stand", category: "Electronics", unitOfMeasure: "ea", unitCost: 28.40, sellingPrice: 59.99, reorderPoint: 80, location: "Zone A / R07 / B2", qty: 244 },
    { sku: "SKU-5510", name: "Organic Green Tea 50 Bags", category: "Food & Bev", unitOfMeasure: "Box", unitCost: 12.00, sellingPrice: 24.99, reorderPoint: 50, location: "Zone D / R03 / B5", qty: 0 },
    { sku: "SKU-6640", name: "Mechanical Keyboard TKL", category: "Electronics", unitOfMeasure: "ea", unitCost: 89.00, sellingPrice: 159.99, reorderPoint: 60, location: "Zone B / R05 / B2", qty: 56 },
    { sku: "SKU-7710", name: "Wireless Charging Pad", category: "Electronics", unitOfMeasure: "ea", unitCost: 18.50, sellingPrice: 39.99, reorderPoint: 75, location: "Zone A / R01 / B1", qty: 320 },
    { sku: "SKU-8820", name: "Running Shoes Size 10", category: "Apparel", unitOfMeasure: "ea", unitCost: 62.00, sellingPrice: 129.99, reorderPoint: 40, location: "Zone C / R02 / B1", qty: 95 },
    { sku: "SKU-9900", name: "Stainless Steel Water Bottle", category: "Hardware", unitOfMeasure: "ea", unitCost: 14.00, sellingPrice: 34.99, reorderPoint: 60, location: "Zone A / R02 / B2", qty: 445 },
    { sku: "SKU-0011", name: "Bluetooth Speaker Portable", category: "Electronics", unitOfMeasure: "ea", unitCost: 42.00, sellingPrice: 89.99, reorderPoint: 30, location: "Zone A / R01 / B2", qty: 178 },
  ];

  const products: Record<string, string> = {};
  for (const p of productData) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        sku: p.sku,
        name: p.name,
        category: p.category,
        unitOfMeasure: p.unitOfMeasure,
        unitCost: p.unitCost,
        sellingPrice: p.sellingPrice,
        reorderPoint: p.reorderPoint,
      },
    });
    products[p.sku] = product.id;

    const locationId = locations[p.location];
    if (locationId) {
      await prisma.inventoryLevel.upsert({
        where: { productId_locationId: { productId: product.id, locationId } },
        update: { quantityOnHand: p.qty },
        create: { productId: product.id, locationId, quantityOnHand: p.qty, quantityReserved: 0 },
      });
    }
  }

  console.log("✅ Products and inventory levels created");

  // ── Suppliers ──────────────────────────────────────────────────────────
  const supplierData = [
    { name: "Acme Electronics Ltd", contactEmail: "orders@acme-electronics.com", contactPhone: "+1-555-0101", onTimeDeliveryRate: 98 },
    { name: "Global Textiles Co", contactEmail: "supply@globaltextiles.com", contactPhone: "+1-555-0202", onTimeDeliveryRate: 93 },
    { name: "Hardware Direct Inc", contactEmail: "b2b@hardwaredirect.com", contactPhone: "+1-555-0303", onTimeDeliveryRate: 85 },
    { name: "Fresh Foods Corp", contactEmail: "wholesale@freshfoods.com", contactPhone: "+1-555-0404", onTimeDeliveryRate: 76 },
  ];

  const suppliers: Record<string, string> = {};
  for (const s of supplierData) {
    const supplier = await prisma.supplier.upsert({
      where: { contactEmail: s.contactEmail },
      update: {},
      create: s,
    });
    suppliers[s.name] = supplier.id;
  }

  // add unique constraint workaround for supplier
  await prisma.$executeRaw`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'suppliers_contact_email_key') THEN
        ALTER TABLE suppliers ADD CONSTRAINT suppliers_contact_email_key UNIQUE (contact_email);
      END IF;
    END $$;
  `.catch(() => {});

  console.log("✅ Suppliers created");

  // ── Purchase Orders ────────────────────────────────────────────────────
  const po1 = await prisma.purchaseOrder.upsert({
    where: { poNumber: "PO-2024-089" },
    update: {},
    create: {
      poNumber: "PO-2024-089",
      supplierId: suppliers["Acme Electronics Ltd"]!,
      createdById: admin.id,
      totalItems: 4,
      totalValue: 5880,
      expectedDate: new Date("2024-12-14"),
      receivingDock: "Dock A",
      status: POStatus.received,
      notes: "Rush order for Q4 stock",
    },
  });

  const po2 = await prisma.purchaseOrder.upsert({
    where: { poNumber: "PO-2024-090" },
    update: {},
    create: {
      poNumber: "PO-2024-090",
      supplierId: suppliers["Hardware Direct Inc"]!,
      createdById: admin.id,
      totalItems: 22,
      totalValue: 34100,
      expectedDate: new Date("2024-12-20"),
      receivingDock: "Dock B",
      status: POStatus.confirmed,
    },
  });

  const po3 = await prisma.purchaseOrder.upsert({
    where: { poNumber: "PO-2024-091" },
    update: {},
    create: {
      poNumber: "PO-2024-091",
      supplierId: suppliers["Global Textiles Co"]!,
      createdById: manager.id,
      totalItems: 8,
      totalValue: 9840,
      expectedDate: new Date("2024-12-17"),
      receivingDock: "Dock A",
      status: POStatus.shipped,
    },
  });

  const po4 = await prisma.purchaseOrder.upsert({
    where: { poNumber: "PO-2024-092" },
    update: {},
    create: {
      poNumber: "PO-2024-092",
      supplierId: suppliers["Acme Electronics Ltd"]!,
      createdById: manager.id,
      totalItems: 12,
      totalValue: 18420,
      expectedDate: new Date("2024-12-18"),
      receivingDock: "Dock C",
      status: POStatus.in_transit,
    },
  });

  // PO items
  await prisma.purchaseOrderItem.createMany({
    skipDuplicates: true,
    data: [
      { purchaseOrderId: po1.id, productId: products["SKU-1204"]!, orderedQty: 200, receivedQty: 200, unitCost: 24.50 },
      { purchaseOrderId: po1.id, productId: products["SKU-0882"]!, orderedQty: 100, receivedQty: 100, unitCost: 8.90 },
      { purchaseOrderId: po2.id, productId: products["SKU-3301"]!, orderedQty: 500, receivedQty: 0, unitCost: 3.20 },
      { purchaseOrderId: po3.id, productId: products["SKU-2210"]!, orderedQty: 200, receivedQty: 0, unitCost: 45.20 },
      { purchaseOrderId: po4.id, productId: products["SKU-4120"]!, orderedQty: 100, receivedQty: 0, unitCost: 28.40 },
      { purchaseOrderId: po4.id, productId: products["SKU-6640"]!, orderedQty: 50, receivedQty: 0, unitCost: 89.00 },
    ],
  });

  console.log("✅ Purchase orders created");

  // ── Sales Orders ───────────────────────────────────────────────────────
  await prisma.salesOrder.upsert({
    where: { soNumber: "SO-2024-441" },
    update: {},
    create: {
      soNumber: "SO-2024-441",
      customerName: "Customer #4421",
      createdById: operator.id,
      totalItems: 2,
      totalValue: 340,
      requiredBy: new Date("2024-12-14"),
      carrier: "FedEx",
      trackingNumber: "FX88291",
      shippingAddress: "123 Main St, Springfield, IL 62701",
      status: SOStatus.dispatched,
      isUrgent: false,
    },
  });

  await prisma.salesOrder.upsert({
    where: { soNumber: "SO-2024-445" },
    update: {},
    create: {
      soNumber: "SO-2024-445",
      customerName: "Enterprise Client X",
      createdById: admin.id,
      totalItems: 4,
      totalValue: 12100,
      requiredBy: new Date("2024-12-19"),
      shippingAddress: "456 Corporate Blvd, Chicago, IL 60601",
      status: SOStatus.processing,
      isUrgent: false,
    },
  });

  await prisma.salesOrder.upsert({
    where: { soNumber: "SO-2024-446" },
    update: {},
    create: {
      soNumber: "SO-2024-446",
      customerName: "Wholesale Partner A",
      createdById: manager.id,
      totalItems: 15,
      totalValue: 28400,
      requiredBy: new Date("2024-12-18"),
      carrier: "FedEx",
      shippingAddress: "789 Warehouse Rd, Dallas, TX 75201",
      status: SOStatus.picking,
      isUrgent: false,
    },
  });

  await prisma.salesOrder.upsert({
    where: { soNumber: "SO-2024-447" },
    update: {},
    create: {
      soNumber: "SO-2024-447",
      customerName: "Online Store B2C",
      createdById: operator.id,
      totalItems: 3,
      totalValue: 890,
      requiredBy: new Date("2024-12-17"),
      carrier: "UPS",
      shippingAddress: "321 E-Commerce Ave, Seattle, WA 98101",
      status: SOStatus.packing,
      isUrgent: false,
    },
  });

  await prisma.salesOrder.upsert({
    where: { soNumber: "SO-2024-448" },
    update: {},
    create: {
      soNumber: "SO-2024-448",
      customerName: "Retail Chain #4",
      createdById: manager.id,
      totalItems: 6,
      totalValue: 4200,
      requiredBy: new Date("2024-12-16"),
      shippingAddress: "555 Retail Park, Miami, FL 33101",
      status: SOStatus.processing,
      isUrgent: true,
    },
  });

  console.log("✅ Sales orders created");

  // ── Transfers ──────────────────────────────────────────────────────────
  const locZoneAR04B2 = locations["Zone A / R04 / B2"]!;
  const locZoneBR11B4 = locations["Zone B / R11 / B4"]!;
  const locZoneCR01B3 = locations["Zone C / R01 / B3"]!;
  const locZoneDR08B1 = locations["Zone D / R08 / B1"]!;
  const locZoneAR02B1 = locations["Zone A / R02 / B1"]!;

  await prisma.transfer.upsert({
    where: { transferNumber: "TR-0082" },
    update: {},
    create: {
      transferNumber: "TR-0082",
      fromLocationId: locZoneAR04B2,
      toLocationId: locZoneCR01B3,
      productId: products["SKU-1204"]!,
      quantity: 88,
      reason: "Rebalancing",
      status: TransferStatus.completed,
      createdById: operator.id,
      completedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
  });

  await prisma.transfer.upsert({
    where: { transferNumber: "TR-0083" },
    update: {},
    create: {
      transferNumber: "TR-0083",
      fromLocationId: locZoneDR08B1,
      toLocationId: locZoneBR11B4,
      productId: products["SKU-3301"]!,
      quantity: 80,
      reason: "Overflow",
      status: TransferStatus.completed,
      createdById: manager.id,
      completedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
  });

  await prisma.transfer.upsert({
    where: { transferNumber: "TR-0084" },
    update: {},
    create: {
      transferNumber: "TR-0084",
      fromLocationId: locZoneBR11B4,
      toLocationId: locZoneAR02B1,
      productId: products["SKU-4821"]!,
      quantity: 415,
      reason: "Rebalancing",
      status: TransferStatus.draft,
      createdById: admin.id,
    },
  });

  await prisma.transfer.upsert({
    where: { transferNumber: "TR-0085" },
    update: {},
    create: {
      transferNumber: "TR-0085",
      fromLocationId: locZoneAR04B2,
      toLocationId: locZoneCR01B3,
      productId: products["SKU-0882"]!,
      quantity: 200,
      reason: "Zone Maintenance",
      status: TransferStatus.in_transit,
      createdById: manager.id,
    },
  });

  console.log("✅ Transfers created");

  // ── Activity Logs ──────────────────────────────────────────────────────
  await prisma.activityLog.createMany({
    data: [
      {
        type: ActivityType.received,
        message: "Received PO-2024-089 — 240 units of SKU-1204 from Acme Supplies",
        reference: "PO-2024-089",
        location: "Dock A",
        createdAt: new Date(Date.now() - 14 * 60 * 1000),
      },
      {
        type: ActivityType.shipped,
        message: "Dispatched SO-2024-441 — 18 units to Customer #4421",
        reference: "SO-2024-441",
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
      },
      {
        type: ActivityType.alert,
        message: "Low stock triggered for SKU-4821 — Reorder point: 50, Current: 12",
        reference: "SKU-4821",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        type: ActivityType.transfer,
        message: "Transfer TR-0082 completed — Zone A to Zone C (88 units)",
        reference: "TR-0082",
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
      {
        type: ActivityType.cycle_count,
        message: "Cycle count completed for Zone B — 99.2% accuracy",
        reference: "Zone B",
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      },
      {
        type: ActivityType.received,
        message: "Received PO-2024-088 — Fresh Foods Corp delivery logged",
        reference: "PO-2024-088",
        location: "Dock A",
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      },
      {
        type: ActivityType.adjustment,
        message: "Stock adjustment applied to SKU-6640 — delta: -4 (damaged goods)",
        reference: "SKU-6640",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        type: ActivityType.shipped,
        message: "Dispatched SO-2024-440 — 42 units via UPS to Wholesale Partner B",
        reference: "SO-2024-440",
        createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000),
      },
    ],
  });

  console.log("✅ Activity logs created");

  // ── Settings ───────────────────────────────────────────────────────────
  const settingsData = [
    { key: "warehouse_name", value: "Main Distribution Center — LK01" },
    { key: "currency", value: "USD" },
    { key: "weight_unit", value: "kg" },
    { key: "low_stock_threshold_pct", value: "20" },
    { key: "api_key", value: "wms_live_sk_a1b2c3d4e5f6g7h8i9j0" },
    { key: "webhook_url", value: "" },
    { key: "notif_low_stock", value: "true" },
    { key: "notif_po_reminders", value: "true" },
    { key: "notif_daily_summary", value: "false" },
    { key: "notif_transfers", value: "true" },
  ];

  for (const s of settingsData) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }

  console.log("✅ Settings created");

  console.log("\n🎉 Seed complete!");
  console.log("   Admin login: admin@wms.com / password123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });