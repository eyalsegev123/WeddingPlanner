import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useWeddingData } from "./useWeddingData";

describe("useWeddingData", () => {
  describe("addGuest", () => {
    it("appends a guest with a generated id", () => {
      const { result } = renderHook(() => useWeddingData());
      act(() => {
        result.current.addGuest({ name: "Alice", side: "", phone: "", email: "", rsvp: "Pending", notes: "" });
      });
      expect(result.current.data.guests).toHaveLength(1);
      expect(result.current.data.guests[0].name).toBe("Alice");
      expect(result.current.data.guests[0].id).toMatch(/^guest-/);
    });

    it("sets hasPendingSave to true after adding", () => {
      const { result } = renderHook(() => useWeddingData());
      act(() => {
        result.current.addGuest({ name: "Bob", side: "", phone: "", email: "", rsvp: "Yes", notes: "" });
      });
      expect(result.current.hasPendingSave).toBe(true);
    });
  });

  describe("deleteGuest", () => {
    it("removes the guest from the guests array", () => {
      const { result } = renderHook(() => useWeddingData());
      act(() => {
        result.current.addGuest({ name: "Alice", side: "", phone: "", email: "", rsvp: "Pending", notes: "" });
      });
      const guestId = result.current.data.guests[0].id;
      act(() => {
        result.current.deleteGuest(guestId);
      });
      expect(result.current.data.guests).toHaveLength(0);
    });

    it("removes the guest from all table guestIds", () => {
      const { result } = renderHook(() => useWeddingData());
      // Add a guest
      act(() => {
        result.current.addGuest({ name: "Alice", side: "", phone: "", email: "", rsvp: "Yes", notes: "" });
      });
      const guestId = result.current.data.guests[0].id;
      // Add a table and assign the guest
      act(() => {
        result.current.addTable({ name: "Table 1", capacity: 8, guestIds: [], shape: "round", x: 50, y: 50 });
      });
      const tableId = result.current.data.tables[0].id;
      act(() => {
        result.current.patchTable(tableId, { guestIds: [guestId] });
      });
      expect(result.current.data.tables[0].guestIds).toContain(guestId);
      // Now delete the guest
      act(() => {
        result.current.deleteGuest(guestId);
      });
      expect(result.current.data.guests).toHaveLength(0);
      expect(result.current.data.tables[0].guestIds).not.toContain(guestId);
    });
  });

  describe("patchTask", () => {
    it("updates only the targeted task", () => {
      const { result } = renderHook(() => useWeddingData());
      act(() => {
        result.current.addTask({ title: "Task A", status: "Open", priority: "Low", dueDate: "", owner: "", notes: "" });
        result.current.addTask({ title: "Task B", status: "Open", priority: "High", dueDate: "", owner: "", notes: "" });
      });
      const idA = result.current.data.tasks[0].id;
      const idB = result.current.data.tasks[1].id;
      act(() => {
        result.current.patchTask(idA, { status: "Done" });
      });
      expect(result.current.data.tasks.find((t) => t.id === idA)?.status).toBe("Done");
      expect(result.current.data.tasks.find((t) => t.id === idB)?.status).toBe("Open");
    });
  });

  describe("applyJson", () => {
    it("returns { error: null } and updates data for valid JSON", () => {
      const { result } = renderHook(() => useWeddingData());
      const validPayload = JSON.stringify({
        meta: { title: "My Wedding" },
        guests: [],
        tasks: [],
        tables: [],
        budget: [],
        vendors: [],
      });
      let error: string | null = "not-run";
      act(() => {
        error = result.current.applyJson(validPayload).error;
      });
      expect(error).toBeNull();
      expect(result.current.data.meta.title).toBe("My Wedding");
    });

    it("returns an error string and leaves data unchanged for invalid JSON", () => {
      const { result } = renderHook(() => useWeddingData());
      const before = result.current.data.meta.title;
      let error: string | null = null;
      act(() => {
        error = result.current.applyJson("{ bad json }").error;
      });
      expect(typeof error).toBe("string");
      expect(error!.length).toBeGreaterThan(0);
      expect(result.current.data.meta.title).toBe(before);
    });
  });

  describe("resetAllData", () => {
    it("does nothing when confirmed is false", () => {
      const { result } = renderHook(() => useWeddingData());
      act(() => {
        result.current.addGuest({ name: "Alice", side: "", phone: "", email: "", rsvp: "Yes", notes: "" });
      });
      act(() => {
        result.current.resetAllData(false);
      });
      expect(result.current.data.guests).toHaveLength(1);
    });

    it("resets data to defaults when confirmed is true", () => {
      const { result } = renderHook(() => useWeddingData());
      act(() => {
        result.current.addGuest({ name: "Alice", side: "", phone: "", email: "", rsvp: "Yes", notes: "" });
        result.current.addTask({ title: "Book venue", status: "Open", priority: "High", dueDate: "", owner: "", notes: "" });
      });
      expect(result.current.data.guests.length).toBeGreaterThan(0);
      act(() => {
        result.current.resetAllData(true);
      });
      // After reset, hasPendingSave is true and data is back to the default snapshot
      expect(result.current.hasPendingSave).toBe(true);
      // Guests we added should be gone (default data has no guests)
      const hasAlice = result.current.data.guests.some((g) => g.name === "Alice");
      expect(hasAlice).toBe(false);
    });
  });

  describe("stats", () => {
    it("calculates rsvpCompletion as percentage of confirmed guests", () => {
      const { result } = renderHook(() => useWeddingData());
      act(() => {
        result.current.addGuest({ name: "A", side: "", phone: "", email: "", rsvp: "Pending", notes: "" });
        result.current.addGuest({ name: "B", side: "", phone: "", email: "", rsvp: "Yes", notes: "" });
      });
      // 1 out of 2 confirmed = 50%
      expect(result.current.stats.rsvpCompletion).toBe(50);
    });

    it("calculates totalGuests correctly", () => {
      const { result } = renderHook(() => useWeddingData());
      act(() => {
        result.current.addGuest({ name: "X", side: "", phone: "", email: "", rsvp: "No", notes: "" });
        result.current.addGuest({ name: "Y", side: "", phone: "", email: "", rsvp: "Yes", notes: "" });
        result.current.addGuest({ name: "Z", side: "", phone: "", email: "", rsvp: "Yes", notes: "" });
      });
      expect(result.current.stats.totalGuests).toBe(3);
      expect(result.current.stats.confirmedGuests).toBe(2);
    });
  });
});
