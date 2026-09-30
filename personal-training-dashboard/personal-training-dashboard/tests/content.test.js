import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function loadContent() {
  try {
    return await import('../src/content.js');
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      assert.fail('src/content.js must export the training plan data');
    }
    throw error;
  }
}

test('public profile template leaves personal values blank for device-only setup', async () => {
  const { profile } = await loadContent();
  assert.deepEqual(profile, {
    heightCm: null,
    baselineWeightKg: null,
    skeletalMuscleKg: null,
    bodyFatPercent: null,
    targetWeightKg: null,
  });
});

test('public plan data does not embed private body measurements or target weight', async () => {
  const { profile } = await loadContent();
  assert.deepEqual(
    [profile.heightCm, profile.baselineWeightKg, profile.skeletalMuscleKg, profile.bodyFatPercent, profile.targetWeightKg],
    [null, null, null, null, null],
  );
});

test('every weekday has a one-hour exercise schedule and four meals', async () => {
  const { weeklyWorkouts, weeklyMeals } = await loadContent();
  const days = ['mon', 'tue', 'wed', 'thu', 'fri'];

  for (const day of days) {
    assert.ok(weeklyWorkouts[day], `${day} workout exists`);
    assert.equal(weeklyWorkouts[day].durationMinutes, 60);
    assert.ok(weeklyWorkouts[day].blocks.length > 0);
    assert.deepEqual(Object.keys(weeklyMeals[day]), ['breakfast', 'lunch', 'snack', 'dinner']);
  }
});

test('each workout includes exercise ids, set counts, and rep ranges', async () => {
  const { weeklyWorkouts } = await loadContent();
  for (const [day, plan] of Object.entries(weeklyWorkouts)) {
    for (const exercise of plan.exercises) {
      assert.ok(exercise.id, `${day} exercise id`);
      assert.ok(exercise.name, `${day} exercise name`);
      assert.ok(Number.isInteger(exercise.sets) && exercise.sets > 0);
      assert.ok(exercise.reps, `${day}/${exercise.id} rep range`);
    }
  }
});

test('12-week progression has 12 dated stages', async () => {
  const { weeks12 } = await loadContent();
  assert.equal(weeks12.length, 12);
  assert.equal(weeks12[0].start, '2026-10-01');
  assert.equal(weeks12[11].end, '2026-12-23');
  assert.ok(weeks12.every((week) => week.focus && week.progression));
});

test('document shell provides a skip link and a non-main mount point', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /class="skip-link" href="#today"/);
  assert.match(html, /<div id="app"/);
  assert.doesNotMatch(html, /<main id="app"/);
  assert.match(html, /rel="stylesheet" href="\.\/styles\.css"/);
});

test('responsive styles provide phone and desktop layouts with visible keyboard focus', async () => {
  let css;
  try {
    css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  } catch {
    assert.fail('styles.css must define responsive layouts');
  }
  assert.match(css, /@media\s*\(min-width:\s*48rem\)/);
  assert.match(css, /@media\s*\(min-width:\s*64rem\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /min-height:\s*44px/);
});
