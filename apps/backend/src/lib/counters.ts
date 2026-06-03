import { prisma } from "./prisma.js";

export async function generatePoNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.purchaseOrder.count();
  return `PO-${year}-${String(count + 1).padStart(3, "0")}`;
}

export async function generateSoNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.salesOrder.count();
  return `SO-${year}-${String(count + 1).padStart(3, "0")}`;
}

export async function generateTransferNumber(): Promise<string> {
  const count = await prisma.transfer.count();
  return `TR-${String(count + 1).padStart(4, "0")}`;
}