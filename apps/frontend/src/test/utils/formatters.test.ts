import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatNumber,
  formatDate,
  getStockStatus,
} from "../../lib/utils.js";

describe("formatCurrency", () => {
  it("formats regular amounts", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
  });

  it("formats compact millions", () => {
    expect(formatCurrency(2_400_000, "USD", true)).toBe("$2.4M");
  });

  it("formats compact thousands", () => {
    expect(formatCurrency(124_000, "USD", true)).toBe("$124k");
  });
});

describe("formatNumber", () => {
  it("formats with thousands separator", () => {
    expect(formatNumber(4821)).toBe("4,821");
  });

  it("formats compact", () => {
    expect(formatNumber(1500, true)).toBe("1.5k");
  });
});

describe("getStockStatus", () => {
  it("returns out_of_stock when qty is 0", () => {
    expect(getStockStatus(0, 50)).toBe("out_of_stock");
  });

  it("returns critical when qty is ≤25% of reorder point", () => {
    expect(getStockStatus(12, 50)).toBe("critical");
  });

  it("returns low when qty is ≤ reorder point", () => {
    expect(getStockStatus(40, 50)).toBe("low");
  });

  it("returns in_stock when qty is > reorder point", () => {
    expect(getStockStatus(100, 50)).toBe("in_stock");
  });
});