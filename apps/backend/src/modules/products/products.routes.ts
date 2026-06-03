import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { productsService } from "./products.service.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { sendError } from "../../lib/errors.js";

const createProductSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(2),
  category: z.string().min(1),
  barcode: z.string().optional(),
  unitOfMeasure: z.string().min(1),
  unitCost: z.number().positive(),
  sellingPrice: z.number().positive(),
  reorderPoint: z.number().int().min(0),
  initialQty: z.number().int().min(0),
  locationZone: z.string().min(1),
});

const adjustStockSchema = z.object({
  productId: z.string(),
  locationId: z.string(),
  delta: z.number().int(),
  reason: z.string().min(1),
});

export async function productsRoutes(fastify: FastifyInstance) {
  const auth = { preHandler: [authenticate] };
  const authOp = { preHandler: [authenticate, authorize("operator")] };
  const authMgr = { preHandler: [authenticate, authorize("manager")] };

  // GET /products
  fastify.get("/products", auth, async (request, reply) => {
    try {
      const q = request.query as Record<string, string>;
      const result = await productsService.getProducts({
        search: q.search,
        category: q.category,
        status: q.status,
        zone: q.zone,
        page: q.page ? Number(q.page) : undefined,
        pageSize: q.pageSize ? Number(q.pageSize) : undefined,
      });
      return reply.send(result);
    } catch (err) {
      return sendError(reply, err);
    }
  });

  // GET /products/low-stock (must come before /:id)
  fastify.get("/products/low-stock", auth, async (_request, reply) => {
    try {
      const items = await productsService.getLowStockProducts();
      return reply.send(items);
    } catch (err) {
      return sendError(reply, err);
    }
  });

  // GET /products/:id
  fastify.get("/products/:id", auth, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const product = await productsService.getProduct(id);
      return reply.send(product);
    } catch (err) {
      return sendError(reply, err);
    }
  });

  // POST /products
  fastify.post("/products", authOp, async (request, reply) => {
    try {
      const body = createProductSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({ message: body.error.errors[0]?.message });
      }
      const product = await productsService.createProduct(body.data, request.user.sub);
      return reply.status(201).send(product);
    } catch (err) {
      return sendError(reply, err);
    }
  });

  // PUT /products/:id
  fastify.put("/products/:id", authOp, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = createProductSchema.partial().safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({ message: body.error.errors[0]?.message });
      }
      const product = await productsService.updateProduct(id, body.data, request.user.sub);
      return reply.send(product);
    } catch (err) {
      return sendError(reply, err);
    }
  });

  // DELETE /products/:id
  fastify.delete("/products/:id", authMgr, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      await productsService.deleteProduct(id, request.user.sub);
      return reply.status(204).send();
    } catch (err) {
      return sendError(reply, err);
    }
  });

  // GET /inventory-levels/low-stock
  fastify.get("/inventory-levels/low-stock", auth, async (_request, reply) => {
    try {
      const items = await productsService.getLowStockProducts();
      return reply.send(items);
    } catch (err) {
      return sendError(reply, err);
    }
  });

  // GET /inventory-levels
  fastify.get("/inventory-levels", auth, async (request, reply) => {
    try {
      const q = request.query as { productId?: string };
      if (!q.productId) {
        return reply.status(400).send({ message: "productId is required" });
      }
      const product = await productsService.getProduct(q.productId);
      return reply.send(product.inventoryLevels);
    } catch (err) {
      return sendError(reply, err);
    }
  });

  // POST /inventory-levels/adjust
  fastify.post("/inventory-levels/adjust", authOp, async (request, reply) => {
    try {
      const body = adjustStockSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({ message: body.error.errors[0]?.message });
      }
      const adjustment = await productsService.adjustStock(
        body.data.productId,
        body.data.locationId,
        body.data.delta,
        body.data.reason,
        request.user.sub
      );
      return reply.status(201).send(adjustment);
    } catch (err) {
      return sendError(reply, err);
    }
  });

  // GET /stock-adjustments
  fastify.get("/stock-adjustments", auth, async (request, reply) => {
    try {
      const q = request.query as { productId?: string };
      if (!q.productId) {
        return reply.status(400).send({ message: "productId is required" });
      }
      const adjustments = await productsService.getStockAdjustments(q.productId);
      return reply.send(adjustments);
    } catch (err) {
      return sendError(reply, err);
    }
  });
  // GET /products/csv-template
fastify.get("/products/csv-template", auth, async (_request, reply) => {
  try {
    const { CSV_TEMPLATE_EXAMPLE } = await import("./csv-import.service.js");
    return reply
      .header("Content-Type", "text/csv")
      .header("Content-Disposition", 'attachment; filename="products-import-template.csv"')
      .send(CSV_TEMPLATE_EXAMPLE);
  } catch (err) {
    return sendError(reply, err);
  }
});

fastify.post("/products/import-csv", authOp, async (request, reply) => {
  try {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ message: "No file uploaded." });
    }

    const ext = data.filename.split(".").pop()?.toLowerCase();
    if (ext !== "csv") {
      return reply.status(400).send({ message: "File must be a .csv file." });
    }

    const chunks: Buffer[] = [];
    for await (const chunk of data.file) {
      chunks.push(chunk as Buffer);
    }
    const buffer = Buffer.concat(chunks);

    if (buffer.length > 10 * 1024 * 1024) {
      return reply.status(400).send({ message: "File exceeds 10MB limit." });
    }

    const { importProductsFromCsv } = await import("./csv-import.service.js");
    const result = await importProductsFromCsv(buffer, request.user.sub);

    return reply.status(200).send(result);
  } catch (err) {
    return sendError(reply, err);
  }
});
}