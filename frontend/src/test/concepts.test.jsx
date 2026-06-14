import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Concepts from "../pages/concepts.jsx";

function renderConcepts() {
  return render(
    <MemoryRouter>
      <Concepts />
    </MemoryRouter>
  );
}

describe("Concepts page", () => {
  it("renders the page heading", () => {
    renderConcepts();
    expect(screen.getByText("IAM, one flow at a time.")).toBeInTheDocument();
  });

  it("renders all five IAM flows", () => {
    renderConcepts();
    // Each heading appears in both a jump-link and a section title, so assert ≥1.
    for (const heading of [
      "How logging in works",
      "How access is decided",
      "Role-Based Access Control",
      "Temporary access that expires itself",
      "Revoking a session, instantly",
    ]) {
      expect(screen.getAllByText(heading).length).toBeGreaterThan(0);
    }
  });

  it("shows a concrete step inside a flow", () => {
    renderConcepts();
    expect(screen.getByText("Verify password")).toBeInTheDocument();
  });
});
