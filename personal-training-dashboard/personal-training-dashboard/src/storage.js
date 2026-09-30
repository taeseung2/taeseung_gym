import { profile as initialProfile } from './content.js';

export const STORAGE_KEY = 'personal-training-dashboard.records.v1';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function cleanInitialProfile() {
  const { heightCm, baselineWeightKg, skeletalMuscleKg, bodyFatPercent, targetWeightKg } = initialProfile;
  return { heightCm, baselineWeightKg, skeletalMuscleKg, bodyFatPercent, targetWeightKg };
}

function initialRecords() {
  return { version: 1, profile: cleanInitialProfile(), workouts: {}, measurements: [] };
}

function validDate(value) {
  return typeof value === 'string'
    && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))
    && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
}

function positiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function validateOptionalPositive(record, key, context) {
  if (record[key] !== undefined && !positiveNumber(record[key])) {
    throw new TypeError(`${context}.${key} must be a positive number.`);
  }
}

export function validateRecords(records) {
  if (!records || typeof records !== 'object' || Array.isArray(records)) {
    throw new TypeError('Backup must be a JSON object.');
  }
  if (records.version !== 1) throw new TypeError('Unsupported backup version.');
  if (!records.profile || typeof records.profile !== 'object' || Array.isArray(records.profile)) {
    throw new TypeError('Backup profile is missing.');
  }
  for (const key of ['heightCm', 'baselineWeightKg', 'skeletalMuscleKg', 'bodyFatPercent', 'targetWeightKg']) {
    if (records.profile[key] !== null && !positiveNumber(records.profile[key])) {
      throw new TypeError(`profile.${key} must be blank or a positive number.`);
    }
  }
  if (!records.workouts || typeof records.workouts !== 'object' || Array.isArray(records.workouts)) {
    throw new TypeError('Backup workouts must be an object.');
  }
  for (const [date, dailyLogs] of Object.entries(records.workouts)) {
    if (!validDate(date)) throw new TypeError(`Workout date ${date} must use YYYY-MM-DD.`);
    if (!dailyLogs || typeof dailyLogs !== 'object' || Array.isArray(dailyLogs)) {
      throw new TypeError(`workouts.${date} must be an object.`);
    }
    for (const [exerciseId, log] of Object.entries(dailyLogs)) {
      if (!exerciseId || !log || typeof log !== 'object' || !Array.isArray(log.sets)) {
        throw new TypeError(`workouts.${date} contains an invalid exercise log.`);
      }
      for (const [index, set] of log.sets.entries()) {
        if (!set || typeof set !== 'object' || typeof set.done !== 'boolean') {
          throw new TypeError(`workouts.${date}.${exerciseId}.sets[${index}] is invalid.`);
        }
        validateOptionalPositive(set, 'weightKg', `workouts.${date}.${exerciseId}.sets[${index}]`);
        if (set.reps !== undefined && (!Number.isInteger(set.reps) || set.reps <= 0)) {
          throw new TypeError(`workouts.${date}.${exerciseId}.sets[${index}].reps must be a positive integer.`);
        }
      }
    }
  }
  if (!Array.isArray(records.measurements)) throw new TypeError('Backup measurements must be an array.');
  for (const [index, measurement] of records.measurements.entries()) {
    if (!measurement || typeof measurement !== 'object' || Array.isArray(measurement) || !validDate(measurement.date)) {
      throw new TypeError(`measurements[${index}] must include a valid YYYY-MM-DD date.`);
    }
    for (const key of ['weightKg', 'waistCm', 'armCm']) {
      validateOptionalPositive(measurement, key, `measurements[${index}]`);
    }
    if (!['weightKg', 'waistCm', 'armCm'].some((key) => measurement[key] !== undefined)) {
      throw new TypeError(`measurements[${index}] must include a weight or circumference value.`);
    }
  }
  return records;
}

function mergeRecords(current, imported) {
  const measurementsByDate = new Map(current.measurements.map((item) => [item.date, item]));
  for (const item of imported.measurements) {
    measurementsByDate.set(item.date, { ...measurementsByDate.get(item.date), ...item });
  }
  const workouts = clone(current.workouts);
  for (const [date, dayLogs] of Object.entries(imported.workouts)) {
    workouts[date] = { ...workouts[date], ...dayLogs };
  }
  return {
    version: 1,
    profile: clone(imported.profile),
    workouts,
    measurements: [...measurementsByDate.values()].sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export function createRecordStore(storage) {
  for (const method of ['getItem', 'setItem', 'removeItem']) {
    if (typeof storage?.[method] !== 'function') throw new TypeError(`StorageLike must provide ${method}().`);
  }

  return {
    load() {
      const serialized = storage.getItem(STORAGE_KEY);
      if (serialized === null) return initialRecords();
      let parsed;
      try {
        parsed = JSON.parse(serialized);
      } catch {
        throw new TypeError('Saved records contain invalid JSON. Export or clear the corrupted data before continuing.');
      }
      return clone(validateRecords(parsed));
    },

    save(records) {
      validateRecords(records);
      storage.setItem(STORAGE_KEY, JSON.stringify(records));
    },

    exportJson() {
      return JSON.stringify(this.load(), null, 2);
    },

    importJson(text, replace) {
      if (typeof text !== 'string') throw new TypeError('Backup must be text.');
      let imported;
      try {
        imported = JSON.parse(text);
      } catch {
        throw new TypeError('Invalid JSON backup file.');
      }
      validateRecords(imported);
      const result = replace ? clone(imported) : mergeRecords(this.load(), imported);
      this.save(result);
      return clone(result);
    },

    clear() {
      storage.removeItem(STORAGE_KEY);
    },
  };
}
