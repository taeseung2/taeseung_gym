import test from 'node:test';
import assert from 'node:assert/strict';
import { profile } from '../src/content.js';

async function loadStore() {
  try {
    return await import('../src/storage.js');
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      assert.fail('src/storage.js must export createRecordStore');
    }
    throw error;
  }
}

function memoryStorage(initial = null, failures = {}) {
  let value = initial;
  return {
    getItem() {
      if (failures.read) throw new Error('read denied');
      return value;
    },
    setItem(_key, next) {
      if (failures.write) throw new Error('write denied');
      value = next;
    },
    removeItem() {
      if (failures.remove) throw new Error('remove denied');
      value = null;
    },
    raw() { return value; },
  };
}

function validRecords() {
  return {
    version: 1,
    profile: { heightCm: 180, baselineWeightKg: 70, skeletalMuscleKg: 32, bodyFatPercent: 18, targetWeightKg: 80 },
    workouts: {
      '2026-10-01': {
        'db-bench-press': { sets: [{ weightKg: 6, reps: 12, done: true }] },
      },
    },
    measurements: [{ date: '2026-10-01', weightKg: 71, waistCm: 82, armCm: 33 }],
  };
}

test('an empty browser store loads a versioned record with the default profile', async () => {
  const { createRecordStore } = await loadStore();
  const store = createRecordStore(memoryStorage());
  assert.deepEqual(store.load(), {
    version: 1,
    profile: {
      heightCm: profile.heightCm,
      baselineWeightKg: profile.baselineWeightKg,
      skeletalMuscleKg: profile.skeletalMuscleKg,
      bodyFatPercent: profile.bodyFatPercent,
      targetWeightKg: profile.targetWeightKg,
    },
    workouts: {},
    measurements: [],
  });
});

test('blank device-only profile values can be saved before the user enters measurements', async () => {
  const { createRecordStore } = await loadStore();
  const storage = memoryStorage();
  const store = createRecordStore(storage);
  const blankProfile = store.load();
  assert.equal(blankProfile.profile.heightCm, null);
  assert.doesNotThrow(() => store.save(blankProfile));
  assert.deepEqual(createRecordStore(storage).load(), blankProfile);
});

test('saved measurements and workout sets survive a fresh store instance', async () => {
  const { createRecordStore } = await loadStore();
  const storage = memoryStorage();
  createRecordStore(storage).save(validRecords());
  assert.deepEqual(createRecordStore(storage).load(), validRecords());
});

test('rejects invalid measurements and never writes the rejected data', async () => {
  const { createRecordStore } = await loadStore();
  const storage = memoryStorage();
  const store = createRecordStore(storage);
  const invalid = validRecords();
  invalid.measurements[0].weightKg = 0;
  assert.throws(() => store.save(invalid), /weightKg/);
  assert.equal(storage.raw(), null);
  invalid.measurements[0].weightKg = '70';
  assert.throws(() => store.save(invalid), /weightKg/);
  assert.equal(storage.raw(), null);
});

test('rejects malformed and unsupported backups without changing existing records', async () => {
  const { createRecordStore } = await loadStore();
  const storage = memoryStorage();
  const store = createRecordStore(storage);
  store.save(validRecords());
  const before = storage.raw();
  assert.throws(() => store.importJson('{broken', true), /JSON/);
  const unsupported = { ...validRecords(), version: 2 };
  assert.throws(() => store.importJson(JSON.stringify(unsupported), true), /version/);
  assert.equal(storage.raw(), before);
});

test('merges records from another device when replace is false', async () => {
  const { createRecordStore } = await loadStore();
  const storage = memoryStorage();
  const store = createRecordStore(storage);
  store.save(validRecords());
  const imported = validRecords();
  imported.measurements = [{ date: '2026-10-08', weightKg: 67.6 }];
  imported.workouts = {};
  const merged = store.importJson(JSON.stringify(imported), false);
  assert.deepEqual(merged.measurements.map((item) => item.date), ['2026-10-01', '2026-10-08']);
  assert.ok(merged.workouts['2026-10-01']);
});

test('replaces existing records only when explicitly requested', async () => {
  const { createRecordStore } = await loadStore();
  const store = createRecordStore(memoryStorage());
  store.save(validRecords());
  const imported = validRecords();
  imported.measurements = [{ date: '2026-10-08', waistCm: 79 }];
  imported.workouts = {};
  const result = store.importJson(JSON.stringify(imported), true);
  assert.deepEqual(result.measurements, imported.measurements);
  assert.deepEqual(result.workouts, {});
});

test('exported JSON round-trips with the supported schema version', async () => {
  const { createRecordStore } = await loadStore();
  const store = createRecordStore(memoryStorage());
  store.save(validRecords());
  const exported = store.exportJson();
  assert.deepEqual(JSON.parse(exported), validRecords());
});

test('clear returns to defaults and storage errors are surfaced', async () => {
  const { createRecordStore } = await loadStore();
  const storage = memoryStorage();
  const store = createRecordStore(storage);
  store.save(validRecords());
  store.clear();
  assert.deepEqual(store.load().measurements, []);
  assert.throws(() => createRecordStore(memoryStorage(null, { read: true })).load(), /read denied/);
  assert.throws(() => createRecordStore(memoryStorage(null, { write: true })).save(validRecords()), /write denied/);
});

test('corrupted local JSON can be removed and the store recovers to defaults', async () => {
  const { createRecordStore } = await loadStore();
  const storage = memoryStorage('{broken');
  const store = createRecordStore(storage);
  assert.throws(() => store.load(), /invalid JSON/i);
  store.clear();
  assert.equal(storage.raw(), null);
  assert.equal(store.load().version, 1);
});
