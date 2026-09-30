import test from 'node:test';
import assert from 'node:assert/strict';

async function loadDates() {
  try {
    return await import('../src/dates.js');
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      assert.fail('src/dates.js must export the program date helpers');
    }
    throw error;
  }
}

test('converts the current instant to the correct Seoul calendar date', async () => {
  const { getSeoulDate } = await loadDates();
  assert.equal(getSeoulDate(new Date('2026-09-30T15:00:00Z')), '2026-10-01');
});

test('maps the 84-day program to week numbers with inclusive endpoints', async () => {
  const { getProgramWeek } = await loadDates();
  assert.equal(getProgramWeek('2026-10-01'), 1);
  assert.equal(getProgramWeek('2026-10-07'), 1);
  assert.equal(getProgramWeek('2026-10-08'), 2);
  assert.equal(getProgramWeek('2026-12-23'), 12);
  assert.equal(getProgramWeek('2026-09-30'), null);
  assert.equal(getProgramWeek('2026-12-24'), null);
});

test('selects Thursday training and Wednesday recovery for the start week', async () => {
  const { getDayPlan } = await loadDates();
  assert.equal(getDayPlan('2026-10-01').dayKey, 'thu');
  assert.equal(getDayPlan('2026-10-01').workout.type, 'strength');
  assert.equal(getDayPlan('2026-10-07').dayKey, 'wed');
  assert.equal(getDayPlan('2026-10-07').workout.type, 'recovery');
  assert.equal(getDayPlan('2026-10-03').workout.type, 'rest');
});
