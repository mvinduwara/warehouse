import type { FastifyInstance } from "fastify";
import { reportsService } from "./reports.service.js";
import { authenticate } from "../../middleware/authenticate.js";
import { sendError } from "../../lib/errors.js";

export async function reportsRoutes(fastify: FastifyInstance) {
  const auth = { preHandler: [authenticate] };

  fastify.get("/reports/summary", auth, async (_req, reply) => {
    try {
      return reply.send(await reportsService.getSummary());
    } catch (err) {
      return sendError(reply, err);
    }
  });

  fastify.get("/reports/movement", auth, async (request, reply) => {
    try {
      const q = request.query as { period?: string };
      const period = ["6m", "1y", "ytd"].includes(q.period ?? "") ? q.period! : "6m";
      return reply.send(await reportsService.getMovement(period));
    } catch (err) {
      return sendError(reply, err);
    }
  });

  fastify.get("/reports/aging", auth, async (_req, reply) => {
    try {
      return reply.send(await reportsService.getAgingReport());
    } catch (err) {
      return sendError(reply, err);
    }
  });

  fastify.get("/reports/supplier-performance", auth, async (_req, reply) => {
    try {
      return reply.send(await reportsService.getSupplierPerformance());
    } catch (err) {
      return sendError(reply, err);
    }
  });

 fastify.get("/reports/export", auth, async (request, reply) => {
  try {
    const q = request.query as { type?: string; format?: string };
    const type = q.type ?? "inventory";
    const fmt = q.format ?? "pdf";

    if (fmt !== "pdf") {
      return reply.status(400).send({ message: "Only PDF export is currently supported." });
    }

    const { generateInventoryReportPdf, generateAgingReportPdf } = await import("../orders/picklist.service.js");

    let buffer: Buffer;
    let filename: string;

    if (type === "aging") {
      buffer = await generateAgingReportPdf();
      filename = `aging-report-${format(new Date(), "yyyy-MM-dd")}.pdf`;
    } else {
      buffer = await generateInventoryReportPdf();
      filename = `inventory-report-${format(new Date(), "yyyy-MM-dd")}.pdf`;
    }

    return reply
      .header("Content-Type", "application/pdf")
      .header("Content-Disposition", `attachment; filename="${filename}"`)
      .header("Content-Length", buffer.length)
      .send(buffer);
  } catch (err) {
    return sendError(reply, err);
  }
});
}