import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Landing from "../pages/landing.jsx";

function renderLanding() {
  return render(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>
  );
}

describe("Landing page", () => {
  it("renders the hero headline", () => {
    renderLanding();
    expect(screen.getByText("actually using it")).toBeInTheDocument();
  });

  it("explains who the platform is for", () => {
    renderLanding();
    expect(
      screen.getByText("One live system, four kinds of learner")
    ).toBeInTheDocument();
    expect(screen.getByText("Students")).toBeInTheDocument();
    expect(screen.getByText("Teachers")).toBeInTheDocument();
    expect(screen.getByText("Recruiters")).toBeInTheDocument();
    expect(screen.getByText("Developers")).toBeInTheDocument();
  });

  it("shows demo credentials so reviewers can log in", () => {
    renderLanding();
    expect(screen.getByText("Demo@12345")).toBeInTheDocument();
    expect(screen.getByText("admin@example.com")).toBeInTheDocument();
  });
});
