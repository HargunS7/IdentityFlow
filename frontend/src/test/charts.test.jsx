import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { BarChart, ColumnChart, DonutChart } from "../components/charts.jsx";

describe("chart components", () => {
  it("BarChart renders labels and values", () => {
    render(<BarChart data={[{ label: "admin", value: 3 }, { label: "user", value: 7 }]} />);
    expect(screen.getByText("admin")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("BarChart shows an empty state when there is no data", () => {
    render(<BarChart data={[]} emptyLabel="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("ColumnChart renders axis labels", () => {
    render(<ColumnChart data={[{ label: "Jun 1", value: 5 }]} />);
    expect(screen.getByText("Jun 1")).toBeInTheDocument();
  });

  it("DonutChart renders the total and segment labels", () => {
    render(
      <DonutChart
        centerLabel="sessions"
        segments={[
          { label: "Active", value: 2 },
          { label: "Revoked", value: 1 },
        ]}
      />
    );
    expect(screen.getByText("3")).toBeInTheDocument(); // total
    expect(screen.getByText("Active")).toBeInTheDocument();
  });
});
