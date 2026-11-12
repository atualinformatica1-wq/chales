import { test } from "node:test";
import { strict as assert } from "node:assert";
import { toggleWeekday, activityScheduleLabel } from "./activities";

test("marking and unmarking weekdays preserves the other selected days", () => {
  const selected = toggleWeekday([1, 5], 3);
  assert.deepEqual(selected, [1, 3, 5]);
  assert.deepEqual(toggleWeekday(selected, 3), [1, 5]);
});

test("date schedules keep the selected arrival and ending dates", () => {
  assert.equal(activityScheduleLabel({ schedule_mode: "datas", weekdays: [], start_date: "2026-11-20", end_date: "2026-11-22", start_time: "07:00", end_time: "08:00" }), "20/11/2026 às 07:00 até 22/11/2026 às 08:00");
});