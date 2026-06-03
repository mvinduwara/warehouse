import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../utils.js";
import { Badge, StockBadge, POStatusBadge, SOStatusBadge } from "../../components/ui/Badge.js";

describe("Badge", () => {
  it("renders children correctly", () => {
    renderWithProviders(<Badge variant="green">In Stock</Badge>);
    expect(screen.getByText("In Stock")).toBeInTheDocument();
  });

  it("applies the correct color class for each variant", () => {
    const { rerender } = renderWithProviders(<Badge variant="red">Error</Badge>);
    expect(screen.getByText("Error").className).toContain("text-[#f87171]");

    rerender(<Badge variant="green">OK</Badge>);
    expect(screen.getByText("OK").className).toContain("text-[#4ade80]");
  });
});

describe("StockBadge", () => {
  it.each([
    ["in_stock", "● In Stock"],
    ["low", "⚡ Low Stock"],
    ["critical", "⚠ Critical"],
    ["out_of_stock", "✕ Out of Stock"],
  ] as const)("renders correct label for %s", (status, label) => {
    renderWithProviders(<StockBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

describe("POStatusBadge", () => {
  it("renders received status", () => {
    renderWithProviders(<POStatusBadge status="received" />);
    expect(screen.getByText("✓ Received")).toBeInTheDocument();
  });
});

describe("SOStatusBadge", () => {
  it("shows urgent badge when isUrgent is true", () => {
    renderWithProviders(<SOStatusBadge status="processing" isUrgent={true} />);
    expect(screen.getByText("🔴 Urgent")).toBeInTheDocument();
  });

  it("shows normal status when not urgent", () => {
    renderWithProviders(<SOStatusBadge status="dispatched" />);
    expect(screen.getByText("✓ Dispatched")).toBeInTheDocument();
  });
});