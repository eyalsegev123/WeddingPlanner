import { describe, expect, it } from "vitest";

import { createId, normalizeData } from "./storage";

describe("createId", () => {
  it("starts with the given prefix", () => {
    expect(createId("guest")).toMatch(/^guest-/);
    expect(createId("task")).toMatch(/^task-/);
  });

  it("returns unique values across calls", () => {
    const ids = Array.from({ length: 10 }, () => createId("x"));
    const unique = new Set(ids);
    expect(unique.size).toBe(10);
  });
});

describe("normalizeData", () => {
  it("returns a valid structure for null input", () => {
    const result = normalizeData(null);
    expect(Array.isArray(result.guests)).toBe(true);
    expect(Array.isArray(result.tasks)).toBe(true);
    expect(Array.isArray(result.tables)).toBe(true);
    expect(Array.isArray(result.budget)).toBe(true);
    expect(Array.isArray(result.vendors)).toBe(true);
    expect(typeof result.meta).toBe("object");
  });

  it("returns a valid structure for undefined input", () => {
    const result = normalizeData(undefined);
    expect(typeof result.meta.title).toBe("string");
    expect(result.meta.title.length).toBeGreaterThan(0);
  });

  it("returns empty arrays and defaults for empty object", () => {
    const result = normalizeData({});
    expect(result.guests).toHaveLength(0);
    expect(result.tasks).toHaveLength(0);
    expect(result.tables).toHaveLength(0);
    expect(result.budget).toHaveLength(0);
    expect(result.vendors).toHaveLength(0);
  });

  it("coerces invalid rsvp to 'Pending'", () => {
    const result = normalizeData({
      guests: [{ id: "g1", name: "Alice", rsvp: "Maybe" }],
    });
    expect(result.guests[0].rsvp).toBe("Pending");
  });

  it("keeps valid rsvp unchanged", () => {
    const result = normalizeData({
      guests: [{ id: "g1", name: "Alice", rsvp: "Yes" }],
    });
    expect(result.guests[0].rsvp).toBe("Yes");
  });

  it("coerces invalid task status to 'Open'", () => {
    const result = normalizeData({
      tasks: [{ id: "t1", title: "Foo", status: "NotAStatus" }],
    });
    expect(result.tasks[0].status).toBe("Open");
  });

  it("splits legacy 'couple' field into partnerOne and partnerTwo", () => {
    const result = normalizeData({ meta: { couple: "Alice & Bob" } });
    expect(result.meta.partnerOne).toBe("Alice");
    expect(result.meta.partnerTwo).toBe("Bob");
  });

  it("strips guest IDs from tables that don't exist in guests array", () => {
    const result = normalizeData({
      guests: [{ id: "g1", name: "Alice", rsvp: "Yes" }],
      tables: [{ id: "t1", name: "Table 1", capacity: 8, guestIds: ["g1", "ghost-id"] }],
    });
    expect(result.tables[0].guestIds).toEqual(["g1"]);
  });

  it("deduplicates guest assigned to two tables — second assignment is stripped", () => {
    const result = normalizeData({
      guests: [{ id: "g1", name: "Alice", rsvp: "Yes" }],
      tables: [
        { id: "t1", name: "Table 1", capacity: 8, guestIds: ["g1"] },
        { id: "t2", name: "Table 2", capacity: 8, guestIds: ["g1"] },
      ],
    });
    const seated = result.tables.flatMap((t) => t.guestIds).filter((id) => id === "g1");
    expect(seated).toHaveLength(1);
  });

  it("clamps table x below minimum to 6", () => {
    const result = normalizeData({
      tables: [{ id: "t1", name: "T", capacity: 8, guestIds: [], x: -999, y: 50 }],
    });
    expect(result.tables[0].x).toBe(6);
  });

  it("clamps table y above maximum to 92", () => {
    const result = normalizeData({
      tables: [{ id: "t1", name: "T", capacity: 8, guestIds: [], x: 50, y: 999 }],
    });
    expect(result.tables[0].y).toBe(92);
  });

  it("clamps table capacity below 1 to 1", () => {
    const result = normalizeData({
      tables: [{ id: "t1", name: "T", capacity: -5, guestIds: [] }],
    });
    expect(result.tables[0].capacity).toBe(1);
  });

  it("generates new IDs for duplicate table IDs", () => {
    const result = normalizeData({
      tables: [
        { id: "dup", name: "T1", capacity: 8, guestIds: [] },
        { id: "dup", name: "T2", capacity: 8, guestIds: [] },
      ],
    });
    expect(result.tables[0].id).not.toBe(result.tables[1].id);
  });
});
