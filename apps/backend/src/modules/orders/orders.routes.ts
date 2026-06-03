import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ordersService } from "./orders.service.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { sendError } from "../../lib/errors.js";

const createPOSchema = z.object({
  supplierId: z.string().min(1),
  expectedDate: z.string().min(1),
  receivingDock: z.string().min(1),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    orderedQty: z.number().int().positive(),
    unitCost: z.number().positive(),
  })),
});

const receivePOSchema = z.object({
  items: z.array(z.object({
    purchaseOrderItemId: z.string(),
    receivedQty: z.number().int().positive(),
    locationId: z.string(),
  })),
  notes: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.string(),
  notes: z.string().optional(),
});

const createSOSchema = z.object({
  customerName: z.string().min(1),
  customerId: z.string().optional(),
  requiredBy: z.string().min(1),
  carrier: z.string().optional(),
  shippingAddress: z.string().min(5),
  items: z.array(z.object({
    productId: z.string(),
    orderedQty: z.number().int().positive(),
    unitPrice: z.number().positive(),
  })),
});

const dispatchSchema = z.object({
  carrier: z.string().min(1),
  trackingNumber: z.string().optional(),
});

export async function ordersRoutes(fastify: FastifyInstance) {
  const auth = { preHandler: [authenticate] };
  const authOp = { preHandler: [authenticate, authorize("operator")] };

  // Suppliers
  fastify.get("/suppliers", auth, async (_req, reply) => {
    try {
      return reply.send(await ordersService.getSuppliers());
    } catch (err) {
      return sendError(reply, err);
    }
  });

  // Purchase Orders
  fastify.get("/purchase-orders", auth, async (request, reply) => {
    try {
      const q = request.query as Record<string, string>;
      return reply.send(await ordersService.getPurchaseOrders({
        search: q.search,
        status: q.status,
        supplierId: q.supplierId,
        page: q.page ? Number(q.page) : undefined,
        pageSize: q.pageSize ? Number(q.pageSize) : undefined,
      }));
    } catch (err) {
      return sendError(reply, err);
    }
  });

  fastify.get("/purchase-orders/:id", auth, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      return reply.send(await ordersService.getPurchaseOrder(id));
    } catch (err) {
      return sendError(reply, err);
    }
  });

  fastify.post("/purchase-orders", authOp, async (request, reply) => {
    try {
      const body = createPOSchema.safeParse(request.body);
      if (!body.success) return reply.status(400).send({ message: body.error.errors[0]?.message });
      return reply.status(201).send(await ordersService.createPurchaseOrder(body.data, request.user.sub));
    } catch (err) {
      return sendError(reply, err);
    }
  });

  fastify.patch("/purchase-orders/:id/status", authOp, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = updateStatusSchema.safeParse(request.body);
      if (!body.success) return reply.status(400).send({ message: body.error.errors[0]?.message });
      return reply.send(await ordersService.updatePOStatus(
        id,
        body.data.status as Parameters<typeof ordersService.updatePOStatus>[1],
        body.data.notes
      ));
    } catch (err) {
      return sendError(reply, err);
    }
  });

  fastify.post("/purchase-orders/:id/receive", authOp, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = receivePOSchema.safeParse(request.body);
      if (!body.success) return reply.status(400).send({ message: body.error.errors[0]?.message });
      return reply.send(await ordersService.receivePurchaseOrder(id, body.data));
    } catch (err) {
      return sendError(reply, err);
    }
  });

  // Sales Orders
  fastify.get("/sales-orders", auth, async (request, reply) => {
    try {
      const q = request.query as Record<string, string>;
      return reply.send(await ordersService.getSalesOrders({
        search: q.search,
        status: q.status,
        page: q.page ? Number(q.page) : undefined,
        pageSize: q.pageSize ? Number(q.pageSize) : undefined,
      }));
    } catch (err) {
      return sendError(reply, err);
    }
  });

  fastify.get("/sales-orders/:id", auth, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      return reply.send(await ordersService.getSalesOrder(id));
    } catch (err) {
      return sendError(reply, err);
    }
  });

  fastify.post("/sales-orders", authOp, async (request, reply) => {
    try {
      const body = createSOSchema.safeParse(request.body);
      if (!body.success) return reply.status(400).send({ message: body.error.errors[0]?.message });
      return reply.status(201).send(await ordersService.createSalesOrder(body.data, request.user.sub));
    } catch (err) {
      return sendError(reply, err);
    }
  });

  fastify.patch("/sales-orders/:id/status", authOp, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = updateStatusSchema.safeParse(request.body);
      if (!body.success) return reply.status(400).send({ message: body.error.errors[0]?.message });
      return reply.send(await ordersService.updateSOStatus(
        id,
        body.data.status as Parameters<typeof ordersService.updateSOStatus>[1]
      ));
    } catch (err) {
      return sendError(reply, err);
    }
  });

  fastify.post("/sales-orders/:id/dispatch", authOp, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = dispatchSchema.safeParse(request.body);
      if (!body.success) return reply.status(400).send({ message: body.error.errors[0]?.message });
      return reply.send(await ordersService.dispatchOrder(id, body.data.carrier, body.data.trackingNumber));
    } catch (err) {
      return sendError(reply, err);
    }
  });

  fastify.get("/sales-orders/:id/pick-list", auth, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const so = await ordersService.getSalesOrder(id);
      return reply.send({ url: `/api/pick-lists/${so.soNumber}.pdf`, soNumber: so.soNumber });
    } catch (err) {
      return sendError(reply, err);
    }
  });
  fastify.get("/sales-orders/:id/pick-list", auth, async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    const { generatePickListPdf } = await import("./picklist.service.js");
    const buffer = await generatePickListPdf(id);
    const so = await ordersService.getSalesOrder(id);

    return reply
      .header("Content-Type", "application/pdf")
      .header("Content-Disposition", `attachment; filename="pick-list-${so.soNumber}.pdf"`)
      .header("Content-Length", buffer.length)
      .send(buffer);
  } catch (err) {
    return sendError(reply, err);
  }
});
}