import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { eventRangeLabel, formatEventDateTime, formatTimeBR } from "./events";

describe("Event start and end date and time", () => {
  test("shows start date and time for a one-day event", () => {
    assert.equal(
      eventRangeLabel({ start_date: "2026-11-20", start_time: "19:00", end_date: null, end_time: null }),
      "20/11/2026 às 19:00",
    );
  });

  test("shows start and end with date and time for a multi-day event", () => {
    assert.equal(
      eventRangeLabel({
        start_date: "2026-11-20",
        start_time: "19:00:00",
        end_date: "2026-11-22",
        end_time: "22:30:00",
      }),
      "20/11/2026 às 19:00 até 22/11/2026 às 22:30",
    );
  });

  test("keeps the time when the end date equals the start date", () => {
    assert.equal(
      eventRangeLabel({
        start_date: "2026-11-20",
        start_time: "19:00",
        end_date: "2026-11-20",
        end_time: "23:00",
      }),
      "20/11/2026 às 19:00 até 20/11/2026 às 23:00",
    );
  });

  test("omits the time when none was set", () => {
    assert.equal(
      eventRangeLabel({ start_date: "2026-11-20", start_time: null, end_date: null, end_time: null }),
      "20/11/2026",
    );
  });

  test("cuts the seconds off a time coming from the database", () => {
    assert.equal(formatTimeBR("07:05:00"), "07:05");
    assert.equal(formatTimeBR(null), "");
  });

  test("joins date and time", () => {
    assert.equal(formatEventDateTime("2026-11-20", "14:00"), "20/11/2026 às 14:00");
  });
});
