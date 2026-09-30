import test from 'node:test';
import assert from 'node:assert/strict';
import { profile, weeklyWorkouts } from '../src/content.js';

async function loadApp() {
  try {
    return await import('../src/app.js');
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      assert.fail('src/app.js must export getTodayViewModel');
    }
    throw error;
  }
}

function records(overrides = {}) {
  return {
    version: 1,
    profile: { heightCm: 180, baselineWeightKg: 70, skeletalMuscleKg: 32, bodyFatPercent: 18, targetWeightKg: 80 },
    workouts: {},
    measurements: [],
    ...overrides,
  };
}

test('today view model uses Seoul date and returns the matching week, workout, meal, and target', async () => {
  const { getTodayViewModel } = await loadApp();
  const model = getTodayViewModel(new Date('2026-10-01T03:00:00Z'), profile, records());
  assert.equal(model.date, '2026-10-01');
  assert.equal(model.weekNumber, 1);
  assert.equal(model.plan.dayKey, 'thu');
  assert.equal(model.plan.workout.title, weeklyWorkouts.thu.title);
  assert.equal(model.plan.meal.breakfast.foods[0].name, '오트밀');
  assert.equal(model.profile.targetWeightKg, 80);
});

test('today view model attaches saved set logs and same-day measurements', async () => {
  const { getTodayViewModel } = await loadApp();
  const existing = records({
    workouts: { '2026-10-01': { 'band-pull-up': { sets: [{ weightKg: 0.5, reps: 8, done: true }] } } },
    measurements: [{ date: '2026-10-01', weightKg: 70.5, waistCm: 82 }],
  });
  const model = getTodayViewModel(new Date('2026-10-01T23:00:00+09:00'), profile, existing);
  assert.deepEqual(model.measurement, existing.measurements[0]);
  assert.equal(model.workoutLogs['band-pull-up'].sets[0].done, true);
});

test('today view model shows recovery and rest days without inventing strength sessions', async () => {
  const { getTodayViewModel } = await loadApp();
  const wednesday = getTodayViewModel(new Date('2026-10-07T03:00:00Z'), profile, records());
  const saturday = getTodayViewModel(new Date('2026-10-03T03:00:00Z'), profile, records());
  const outside = getTodayViewModel(new Date('2026-12-24T03:00:00Z'), profile, records());
  assert.equal(wednesday.plan.workout.type, 'recovery');
  assert.match(wednesday.plan.workout.blocks[1].title, /자전거/);
  assert.equal(saturday.plan.workout.type, 'rest');
  assert.equal(saturday.plan.meal, null);
  assert.equal(outside.weekNumber, null);
});

test('clear remains available when saved JSON is corrupt so the user can recover', async () => {
  const { renderApp } = await loadApp();
  const root = {
    dataset: {},
    innerHTML: '',
    addEventListener() {},
    querySelectorAll() { return []; },
  };
  const storage = {
    getItem() { return '{broken'; },
    setItem() {},
    removeItem() {},
  };
  renderApp(root, { date: new Date('2026-10-01T03:00:00Z'), storage });
  const clearButton = root.innerHTML.match(/<button[^>]*data-action="clear"[^>]*>/)?.[0];
  assert.ok(clearButton, 'clear action should render');
  assert.doesNotMatch(clearButton, /\sdisabled(?:\s|>)/);
  assert.match(root.innerHTML, /id="backup-file"[^>]*disabled/);
});
