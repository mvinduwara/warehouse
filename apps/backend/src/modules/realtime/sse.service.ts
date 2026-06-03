import type { FastifyReply } from "fastify";

interface SseClient {
  id: string;
  userId: string;
  reply: FastifyReply;
}

class SseHub {
  private clients: Map<string, SseClient> = new Map();

  addClient(userId: string, reply: FastifyReply): string {
    const id = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.clients.set(id, { id, userId, reply });
    console.info(`[SSE] Client connected: ${id} (user: ${userId}) — total: ${this.clients.size}`);
    return id;
  }

  removeClient(id: string): void {
    this.clients.delete(id);
    console.info(`[SSE] Client disconnected: ${id} — total: ${this.clients.size}`);
  }

  broadcast(event: string, data: unknown): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const [id, client] of this.clients) {
      try {
        client.reply.raw.write(payload);
      } catch {
        this.clients.delete(id);
      }
    }
  }

  sendToUser(userId: string, event: string, data: unknown): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const [id, client] of this.clients) {
      if (client.userId === userId) {
        try {
          client.reply.raw.write(payload);
        } catch {
          this.clients.delete(id);
        }
      }
    }
  }

  get size(): number {
    return this.clients.size;
  }
}

export const sseHub = new SseHub();

export interface SseEvent {
  type: "low_stock_alert" | "order_update" | "transfer_update" | "po_update" | "ping";
  payload: unknown;
  timestamp: string;
}

export function emitLowStockAlert(items: Array<{ sku: string; name: string; qty: number }>) {
  sseHub.broadcast("low_stock_alert", {
    type: "low_stock_alert",
    payload: { items },
    timestamp: new Date().toISOString(),
  });
}

export function emitOrderUpdate(orderId: string, soNumber: string, status: string) {
  sseHub.broadcast("order_update", {
    type: "order_update",
    payload: { orderId, soNumber, status },
    timestamp: new Date().toISOString(),
  });
}

export function emitTransferUpdate(transferId: string, transferNumber: string, status: string) {
  sseHub.broadcast("transfer_update", {
    type: "transfer_update",
    payload: { transferId, transferNumber, status },
    timestamp: new Date().toISOString(),
  });
}