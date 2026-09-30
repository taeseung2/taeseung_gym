import { weeklyMeals, weeklyWorkouts } from './content.js';

export const PROGRAM_START = '2026-10-01';
export const PROGRAM_DAYS = 84;

function parseISODate(dateISO) {
  if (typeof dateISO !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) return null;
  const value = new Date(`${dateISO}T00:00:00.000Z`);
  if (Number.isNaN(value.getTime()) || value.toISOString().slice(0, 10) !== dateISO) return null;
  return value;
}

export function getSeoulDate(now = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

export function getProgramWeek(dateISO) {
  const date = parseISODate(dateISO);
  const start = parseISODate(PROGRAM_START);
  if (!date) return null;
  const daysSinceStart = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  if (daysSinceStart < 0 || daysSinceStart >= PROGRAM_DAYS) return null;
  return Math.floor(daysSinceStart / 7) + 1;
}

export function getDayPlan(dateISO) {
  const weekNumber = getProgramWeek(dateISO);
  if (weekNumber === null) {
    return { date: dateISO, dayKey: null, weekNumber: null, workout: { type: 'rest', title: '계획 기간 외', blocks: [], exercises: [] }, meal: null };
  }

  const date = parseISODate(dateISO);
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const dayKey = dayKeys[date.getUTCDay()];
  const workout = weeklyWorkouts[dayKey] ?? { dayName: '주말', title: '휴식', type: 'rest', blocks: [], exercises: [] };
  return {
    date: dateISO,
    dayKey,
    weekNumber,
    workout: { type: dayKey === 'wed' ? 'recovery' : (weeklyWorkouts[dayKey] ? 'strength' : 'rest'), ...workout },
    meal: weeklyMeals[dayKey] ?? null,
  };
}
