import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { deleteDB } from "idb";
import App from "../App";
import { closeRoadTagDb } from "../db/database";

describe("app screens", () => {
  beforeEach(async () => {
    await closeRoadTagDb();
    await deleteDB("roadtag");
  });

  afterEach(async () => {
    cleanup();
    await closeRoadTagDb();
  });

  it("exposes accessible names for primary controls", async () => {
    render(<App />);
    expect(
      await screen.findByRole("button", { name: "Create trip" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rules / About" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "RoadTag" })).toBeInTheDocument();
  });

  it("creates a trip from the home screen", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Create trip" }));
    await user.type(screen.getByLabelText("Trip name"), "Lake run");
    await user.click(screen.getByLabelText(/I understand/));
    await user.click(screen.getByRole("button", { name: "Create trip" }));
    expect(await screen.findByRole("heading", { name: "Lake run" })).toBeInTheDocument();
    expect(screen.getByText("0 of 50")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Search"), "California");
    await user.click(screen.getByRole("button", { name: "Mark California as spotted" }));
    expect(await screen.findByText("1 of 50")).toBeInTheDocument();
  });
});
