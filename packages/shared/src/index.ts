New-Item -ItemType Directory -Force packages\shared\src
Set-Content packages\shared\src\index.ts '// Shared types and schemas for WMS monorepo
export * from "./types/index.js";
export * from "./schemas/index.js";
'

New-Item -ItemType Directory -Force packages\shared\src\types
Set-Content packages\shared\src\types\index.ts 'export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type Role = "admin" | "manager" | "operator" | "viewer";

export type StockStatus = "in_stock" | "low" | "critical" | "out_of_stock";

export type POStatus =
  | "draft"
  | "confirmed"
  | "shipped"
  | "in_transit"
  | "received"
  | "cancelled";

export type SOStatus =
  | "processing"
  | "picking"
  | "packing"
  | "dispatched"
  | "delivered"
  | "cancelled";

export type TransferStatus = "draft" | "in_transit" | "completed" | "cancelled";
'

New-Item -ItemType Directory -Force packages\shared\src\schemas
Set-Content packages\shared\src\schemas\index.ts 'import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const productSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(2),
  category: z.string().min(1),
  barcode: z.string().optional(),
  unitOfMeasure: z.string().min(1),
  unitCost: z.number().positive(),
  sellingPrice: z.number().positive(),
  reorderPoint: z.number().int().min(0),
});

export type ProductSchema = z.infer<typeof productSchema>;
'

Set-Content packages\shared\tsconfig.json '{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "skipLibCheck": true
  },
  "include": ["src"]
}'