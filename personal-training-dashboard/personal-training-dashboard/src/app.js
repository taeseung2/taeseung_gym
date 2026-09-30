import { nutritionGuidance, profile as defaultProfile, weeklyMeals, weeklyWorkouts, weeks12 } from './content.js';
import { getDayPlan, getProgramWeek, getSeoulDate } from './dates.js';
import { createRecordStore, STORAGE_KEY } from './storage.js';

const MEASUREMENT_FIELDS = [
  ['weightKg', '체중', 'kg'],
  ['waistCm', '허리둘레', 'cm'],
  ['armCm', '팔둘레', 'cm'],
];

const PROFILE_FIELDS = [
  ['heightCm', '키', 'cm'],
  ['baselineWeightKg', '시작 체중', 'kg'],
  ['skeletalMuscleKg', '골격근량', 'kg'],
  ['bodyFatPercent', '체지방률', '%'],
  ['targetWeightKg', '목표 체중', 'kg'],
];

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function formatDate(dateISO) {
  const value = new Date(`${dateISO}T00:00:00.000Z`);
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', weekday: 'long',
  }).format(value);
}

export function getTodayViewModel(date, profile, records) {
  const dateISO = getSeoulDate(date);
  const plan = getDayPlan(dateISO);
  const storedProfile = records.profile ?? profile ?? defaultProfile;
  return {
    date: dateISO,
    displayDate: formatDate(dateISO),
    weekNumber: getProgramWeek(dateISO),
    plan,
    profile: { ...storedProfile },
    workoutLogs: records.workouts?.[dateISO] ?? {},
    measurement: records.measurements?.find((entry) => entry.date === dateISO) ?? null,
  };
}

function formatProfileValue(value) {
  if (!Number.isFinite(value)) return '—';
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(1)));
}

function renderMeasurementForm(measurement = {}) {
  return `<form class="measurement-form" id="measurement-form">
    <div class="field-grid">
      ${MEASUREMENT_FIELDS.map(([key, label, unit]) => `<label class="field">
        <span>${label}<small> ${unit}</small></span>
        <input type="number" name="${key}" min="0.1" step="0.1" inputmode="decimal" placeholder="기록 선택" value="${measurement[key] ?? ''}">
      </label>`).join('')}
    </div>
    <button class="button button-primary" type="submit">오늘 기록 저장</button>
  </form>`;
}

function renderSetInputs(exercise, dateISO, workoutLogs) {
  const savedSets = workoutLogs[exercise.id]?.sets ?? [];
  return `<div class="set-list" aria-label="${escapeHtml(exercise.name)} 세트 기록">
    ${Array.from({ length: exercise.sets }, (_, index) => {
      const set = savedSets[index] ?? { done: false };
      const prefix = `${escapeHtml(exercise.name)} 세트 ${index + 1}`;
      return `<div class="set-row">
        <span class="set-index">${String(index + 1).padStart(2, '0')}</span>
        <label class="field set-field"><span>${prefix} 중량 <small>kg</small></span>
          <input type="number" min="0.1" step="0.1" inputmode="decimal" data-workout-field="weightKg" data-exercise-id="${escapeHtml(exercise.id)}" data-date="${dateISO}" data-set-index="${index}" value="${set.weightKg ?? ''}" placeholder="—">
        </label>
        <label class="field set-field"><span>${prefix} 반복</span>
          <input type="number" min="1" step="1" inputmode="numeric" data-workout-field="reps" data-exercise-id="${escapeHtml(exercise.id)}" data-date="${dateISO}" data-set-index="${index}" value="${set.reps ?? ''}" placeholder="—">
        </label>
        <label class="done-field"><input type="checkbox" data-workout-done data-exercise-id="${escapeHtml(exercise.id)}" data-date="${dateISO}" data-set-index="${index}" ${set.done ? 'checked' : ''}><span>완료</span></label>
      </div>`;
    }).join('')}
  </div>`;
}

function renderExercise(exercise, dateISO, workoutLogs, editable) {
  const id = escapeHtml(exercise.id);
  return `<article class="exercise-card" ${editable ? `data-exercise-id="${id}"` : ''}>
    <div class="exercise-heading">
      <div><h4>${escapeHtml(exercise.name)}</h4><p>${exercise.sets}세트 · ${escapeHtml(exercise.reps)} · 휴식 ${Math.round(exercise.restSeconds / 60)}분</p></div>
      <span class="exercise-mark" aria-hidden="true">↗</span>
    </div>
    ${exercise.note ? `<p class="exercise-note">${escapeHtml(exercise.note)}</p>` : ''}
    ${editable ? renderSetInputs(exercise, dateISO, workoutLogs) : ''}
  </article>`;
}

function renderWorkoutDay(dayKey, day, dateISO, workoutLogs, editable = false) {
  const typeLabel = dayKey === 'wed' ? '회복' : '근력';
  return `<article class="day-card ${editable ? 'day-card-today' : ''}">
    <div class="day-card-header"><div><span class="eyebrow">${day.dayName}</span><h3>${escapeHtml(day.title)}</h3></div><span class="tag">${typeLabel} · 60분</span></div>
    <ol class="timeline">
      ${day.blocks.map((block) => `<li class="timeline-item ${block.exerciseId ? 'timeline-exercise' : ''}">
        <time>${block.start}–${block.end}</time><div><strong>${escapeHtml(block.title)}</strong>${block.detail ? `<p>${escapeHtml(block.detail)}</p>` : ''}</div>
      </li>`).join('')}
    </ol>
    ${day.exercises.length ? `<div class="exercise-list">${day.exercises.map((item) => renderExercise(item, dateISO, workoutLogs, editable)).join('')}</div>` : '<p class="recovery-note">대화가 가능한 강도로 자전거를 타고, 가동성 운동은 무리 없이 진행하세요.</p>'}
    ${editable ? '<p class="local-note">세트 입력은 이 브라우저에 저장됩니다.</p>' : ''}
  </article>`;
}

function renderMealCard(dayName, meals) {
  const summaries = Object.entries(meals).map(([, item]) => item.foods[0]?.name).filter(Boolean).join(' · ');
  return `<details class="meal-day" open>
    <summary><span><strong>${dayName}</strong><small>${summaries}</small></span><span class="chevron" aria-hidden="true">⌄</span></summary>
    <div class="meal-list">${Object.entries(meals).map(([key, item]) => `<article class="meal-card">
      <div class="meal-card-heading"><h4>${({ breakfast: '아침', lunch: '점심', snack: '간식', dinner: '저녁' })[key]}</h4><span>${escapeHtml(item.time)}</span></div>
      <ul>${item.foods.map((food) => `<li><span>${escapeHtml(food.name)}</span><strong>${escapeHtml(food.amount)}</strong></li>`).join('')}</ul>
    </article>`).join('')}</div>
  </details>`;
}

function renderProgression() {
  return weeks12.map((week) => `<article class="week-card">
    <div class="week-card-header"><span class="week-number">W${String(week.week).padStart(2, '0')}</span><time>${week.start.slice(5).replace('-', '/')} — ${week.end.slice(5).replace('-', '/')}</time></div>
    <h3>${escapeHtml(week.focus)}</h3><p>${escapeHtml(week.progression)}</p>
  </article>`).join('');
}

function renderProfileForm(profile) {
  return `<form id="profile-form" class="profile-form">
    <div class="field-grid profile-grid">${PROFILE_FIELDS.map(([key, label, unit]) => `<label class="field">
      <span>${label}<small> ${unit}</small></span>
      <input type="number" name="${key}" min="0.1" step="0.1" inputmode="decimal" value="${profile[key] ?? ''}">
    </label>`).join('')}</div>
    <button class="button button-secondary" type="submit">기준 수정 저장</button>
  </form>`;
}

function renderHistory(measurements) {
  if (!measurements.length) return '<div class="empty-state"><span aria-hidden="true">＋</span><h3>첫 기록을 남겨보세요</h3><p>주 1회 같은 조건에서 측정하면 변화를 보기 쉽습니다.</p></div>';
  const rows = [...measurements].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 16);
  return `<div class="table-wrap"><table><thead><tr><th scope="col">날짜</th><th scope="col">체중</th><th scope="col">허리</th><th scope="col">팔</th></tr></thead><tbody>
    ${rows.map((entry) => `<tr><th scope="row">${escapeHtml(entry.date)}</th><td>${entry.weightKg ? `${formatProfileValue(entry.weightKg)} kg` : '—'}</td><td>${entry.waistCm ? `${formatProfileValue(entry.waistCm)} cm` : '—'}</td><td>${entry.armCm ? `${formatProfileValue(entry.armCm)} cm` : '—'}</td></tr>`).join('')}
    </tbody></table></div>`;
}

function defaultRecords(profile) {
  const { heightCm, baselineWeightKg, skeletalMuscleKg, bodyFatPercent, targetWeightKg } = profile;
  return { version: 1, profile: { heightCm, baselineWeightKg, skeletalMuscleKg, bodyFatPercent, targetWeightKg }, workouts: {}, measurements: [] };
}

export function renderApp(root, dependencies = {}) {
  const date = dependencies.date ?? new Date();
  const dateISO = getSeoulDate(date);
  let localStorageRef;
  let store;
  let records;
  let storageError = '';
  let statusMessage = '';
  let pendingImportText = '';
  try {
    localStorageRef = dependencies.storage ?? window.localStorage;
    store = createRecordStore(localStorageRef);
    records = store.load();
  } catch (error) {
    storageError = `이 브라우저에서 기록을 읽지 못했습니다. 브라우저 저장소 설정을 확인해 주세요. (${error.message})`;
    records = defaultRecords(defaultProfile);
  }

  const model = getTodayViewModel(date, records.profile, records);
  const todayType = model.plan.workout.type;
  const isInProgram = model.weekNumber !== null;
  const todayWorkout = isInProgram && todayType === 'strength'
    ? renderWorkoutDay(model.plan.dayKey, model.plan.workout, model.date, model.workoutLogs, true)
    : `<article class="rest-card"><span class="eyebrow">${model.plan.workout.type === 'recovery' ? 'ACTIVE RECOVERY' : 'REST DAY'}</span><h3>${escapeHtml(model.plan.workout.title)}</h3><p>${model.plan.workout.type === 'recovery' ? '자전거는 대화할 수 있는 강도로, 오늘은 몸을 편하게 풀어주세요.' : '회복을 우선하고 평일 운동 계획을 확인해 두세요.'}</p></article>`;
  const hasWeightGoal = Number.isFinite(model.profile.baselineWeightKg) && Number.isFinite(model.profile.targetWeightKg) && model.profile.targetWeightKg > model.profile.baselineWeightKg;
  const progressValue = hasWeightGoal ? Math.min(100, Math.max(0, (((model.measurement?.weightKg ?? model.profile.baselineWeightKg) - model.profile.baselineWeightKg) / (model.profile.targetWeightKg - model.profile.baselineWeightKg)) * 100)) : 0;
  const progressWidth = `${Math.round(progressValue)}%`;
  const startIndex = Math.max(0, Math.min(weekIndex(model.weekNumber), weeks12.length - 1));
  const focusText = model.weekNumber ? weeks12[startIndex].focus : '기록을 이어가세요';
  const days = [
    ['mon', weeklyWorkouts.mon], ['tue', weeklyWorkouts.tue], ['wed', weeklyWorkouts.wed],
    ['thu', weeklyWorkouts.thu], ['fri', weeklyWorkouts.fri],
  ];

  const render = () => {
    root.innerHTML = `<div class="app-shell">
      <header class="site-header">
        <a class="brand" href="#today" aria-label="나의 12주 트레이닝 첫 화면"><span class="brand-mark" aria-hidden="true">＋</span><span>FORM<span class="brand-dot">.</span><small>TRAINING JOURNAL</small></span></a>
        <nav class="main-nav" aria-label="주요 메뉴">
          <a href="#today">오늘</a><a href="#workouts">운동</a><a href="#meals">식단</a><a href="#progression">12주 계획</a><a href="#records">내 기록</a>
        </nav>
        <button class="button button-quiet export-button" type="button" data-action="export">기록 백업 <span aria-hidden="true">↓</span></button>
      </header>

      ${storageError ? `<div class="global-alert" role="alert">${escapeHtml(storageError)} 개인 기록 입력은 저장되지 않습니다.</div>` : ''}
      <div class="status-line" id="save-status" role="status" aria-live="polite">${escapeHtml(statusMessage || '기록은 이 기기의 브라우저에 저장됩니다.')}</div>

      <main>
        <section class="hero-section" id="today" aria-labelledby="page-title">
          <div class="hero-copy"><span class="eyebrow">YOUR TRAINING JOURNAL · 2026</span>
            <h1 id="page-title">오늘도 <em>한 걸음</em><br>쌓아가요.</h1>
            <p>${escapeHtml(model.displayDate)}${model.weekNumber ? ` · ${model.weekNumber}주차` : ''} · ${escapeHtml(focusText)}</p>
            <a class="button button-primary hero-link" href="#workouts">오늘 운동 보기 <span aria-hidden="true">↘</span></a>
          </div>
          <div class="hero-art" aria-hidden="true"><div class="orb orb-one"></div><div class="orb orb-two"></div><div class="hero-ring"><span>12</span><small>WEEK<br>PLAN</small></div><div class="hero-caption">BUILD<br>WITH<br>INTENTION</div></div>
          <div class="hero-week">${model.weekNumber ? `W${String(model.weekNumber).padStart(2, '0')} <span>/ 12</span>` : '12 <span>WEEKS</span>'}</div>
        </section>

        <section class="quick-stats" aria-label="현재 목표">
          <article class="stat-card stat-weight"><span class="stat-label">현재 체중</span><strong>${formatProfileValue(model.measurement?.weightKg ?? model.profile.baselineWeightKg)}<small>${Number.isFinite(model.measurement?.weightKg ?? model.profile.baselineWeightKg) ? 'kg' : ''}</small></strong><div class="stat-progress"><span style="width:${progressWidth}"></span></div><p>${hasWeightGoal ? `목표 ${formatProfileValue(model.profile.targetWeightKg)}kg까지 천천히` : '내 기록에서 기준 체중과 목표를 입력해 주세요'}</p></article>
          <article class="stat-card"><span class="stat-label">오늘의 운동</span><strong class="stat-text">${escapeHtml(model.plan.workout.type === 'strength' ? '근력 운동' : model.plan.workout.type === 'recovery' ? '회복 운동' : '휴식')}</strong><p>${model.plan.workout.type === 'strength' ? `${model.plan.workout.exercises.length}개 동작 · 60분` : '회복도 훈련의 일부예요'}</p></article>
          <article class="stat-card"><span class="stat-label">영양 가이드</span><strong class="stat-text">단백질 130~145g</strong><p>첨가당과 포화지방은 줄여요</p></article>
        </section>

        <section class="content-section today-section" aria-labelledby="today-workout-title">
          <div class="section-heading"><div><span class="eyebrow">TODAY'S SESSION</span><h2 id="today-workout-title">오늘 운동</h2></div><a class="text-link" href="#workouts">주간 운동표 <span aria-hidden="true">→</span></a></div>
          ${todayWorkout}
        </section>

        <section class="content-section quick-log-section" aria-labelledby="quick-log-title">
          <div class="section-heading"><div><span class="eyebrow">WEEKLY CHECK-IN</span><h2 id="quick-log-title">오늘 몸 상태 기록</h2></div><span class="section-hint">아침 공복에 같은 조건으로 측정해요</span></div>
          ${renderMeasurementForm(model.measurement ?? {})}
        </section>

        <section class="content-section" id="workouts" aria-labelledby="workout-plan-title">
          <div class="section-heading"><div><span class="eyebrow">MONDAY — FRIDAY · 60 MIN</span><h2 id="workout-plan-title">이번 주 운동</h2></div><p class="section-hint">첫 2주는 각 동작 1~2세트로 자세를 익혀요.</p></div>
          <div class="day-grid">${days.map(([dayKey, day]) => renderWorkoutDay(dayKey, day, model.date, model.workoutLogs, false)).join('')}</div>
          <aside class="note-card"><span class="note-icon" aria-hidden="true">i</span><div><strong>중량은 여유를 남기며 올려요</strong><p>첫 2주는 3~4회 더 할 수 있는 정도로 마치고, 이후에도 대략 2회 여유를 둡니다. 반복 상단을 좋은 자세로 2회 연속 달성한 종목만 조금 무겁게 하세요.</p></div></aside>
        </section>

        <section class="content-section meals-section" id="meals" aria-labelledby="meal-plan-title">
          <div class="section-heading"><div><span class="eyebrow">SIMPLE FOOD, STEADY GROWTH</span><h2 id="meal-plan-title">평일 식단</h2></div><p class="section-hint">시작 가이드 · 약 2,500~2,650kcal</p></div>
          <p class="section-intro">단백질은 하루 130~145g을 참고 목표로 하고, 음식 중량은 조리 후 기준이에요. 오트밀은 마른 중량입니다.</p>
          <div class="meal-days">${days.map(([dayKey, day]) => renderMealCard(day.dayName, weeklyMeals[dayKey])).join('')}</div>
          <aside class="health-note"><span class="health-icon" aria-hidden="true">♡</span><div><strong>균형 잡힌 식단 선택</strong><p>${escapeHtml(nutritionGuidance.heartHealthyNote)} 실제 영양량은 제품과 조리법에 따라 달라질 수 있습니다.</p></div></aside>
          <div class="calorie-rules"><h3>체중 추이에 따라 조절하기</h3><ul>${nutritionGuidance.adjustments.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>
        </section>

        <section class="content-section progression-section" id="progression" aria-labelledby="progression-title">
          <div class="section-heading"><div><span class="eyebrow">SMALL STEPS, 12 WEEKS</span><h2 id="progression-title">12주 진행표</h2></div><p class="section-hint">기간은 2026.10.01 — 12.23</p></div>
          <div class="week-grid">${renderProgression()}</div>
          <p class="section-footnote">바벨은 2kg 단위로만 추가하고, 덤벨은 무게 차이가 크면 반복수를 늘리거나 내려가는 동작을 3초로 늦춰 난도를 조절하세요.</p>
        </section>

        <section class="content-section records-section" id="records" aria-labelledby="records-title">
          <div class="section-heading"><div><span class="eyebrow">YOUR NUMBERS, YOUR PACE</span><h2 id="records-title">내 기록</h2></div><button class="button button-quiet" type="button" data-action="export">JSON 백업</button></div>
          <div class="records-grid">
            <article class="panel profile-panel"><div class="panel-heading"><div><span class="eyebrow">STARTING POINT</span><h3>기준 정보</h3></div><span class="edit-mark" aria-hidden="true">✳</span></div>
              <p class="panel-note">개인 신체 수치는 공개 사이트 코드에 포함하지 않았어요. 이 기기에서 직접 입력하거나 백업 파일을 가져오세요.</p>${renderProfileForm(model.profile)}
              <p class="private-note">이 기준 정보와 측정 기록은 이 기기의 브라우저에만 저장됩니다.</p>
            </article>
            <article class="panel history-panel"><div class="panel-heading"><div><span class="eyebrow">MEASUREMENTS</span><h3>최근 변화</h3></div><span class="history-count">${records.measurements.length}회 기록</span></div>
              ${renderHistory(records.measurements)}
            </article>
          </div>
          <div class="data-tools"><div><strong>기기 변경 전 기록 백업하기</strong><p>휴대폰과 PC는 기록이 자동으로 연결되지 않아요. JSON 파일을 내보낸 뒤 다른 기기에서 가져오세요.</p></div><div class="data-buttons"><label class="button button-secondary file-button" for="backup-file">기록 가져오기<input id="backup-file" type="file" accept="application/json,.json" ${storageError ? 'disabled' : ''}></label><button class="button button-quiet danger-text" type="button" data-action="clear">기록 초기화</button></div></div>
        </section>
      </main>
      <footer class="site-footer"><span class="brand-mark" aria-hidden="true">＋</span><p>꾸준함은 기록에서 시작돼요.</p><span>FORM · TRAINING JOURNAL</span></footer>
      <dialog class="import-dialog" id="import-dialog" aria-labelledby="import-title"><div class="dialog-content"><span class="eyebrow">IMPORT BACKUP</span><h2 id="import-title">기록을 어떻게 가져올까요?</h2><p>가져온 날짜의 기록은 백업 파일 내용으로 갱신됩니다.</p><button class="button button-primary" type="button" data-import-choice="replace">가져온 기록으로 바꾸기</button><button class="button button-secondary" type="button" data-import-choice="merge">기존 기록과 합치기</button><button class="button button-quiet" type="button" data-import-choice="cancel">취소</button></div></dialog>
    </div>`;

    if (storageError) {
      root.querySelectorAll('#measurement-form input, #measurement-form button, #profile-form input, #profile-form button, [data-workout-field], [data-workout-done]').forEach((element) => { element.disabled = true; });
    }
  };

  function updateStatus(message, isError = false) {
    statusMessage = message;
    const status = root.querySelector('#save-status');
    if (status) {
      status.textContent = message;
      status.classList.toggle('status-error', isError);
    }
  }

  function saveRecords(successMessage = '이 기기에 저장했어요.') {
    try {
      store.save(records);
      storageError = '';
      updateStatus(successMessage);
      return true;
    } catch (error) {
      updateStatus(`저장하지 못했습니다. 입력값과 브라우저 저장소를 확인해 주세요. (${error.message})`, true);
      return false;
    }
  }

  function updateWorkoutField(target) {
    const exerciseId = target.dataset.exerciseId;
    const dateForLog = target.dataset.date;
    const setIndex = Number(target.dataset.setIndex);
    records.workouts[dateForLog] ??= {};
    const exerciseLog = records.workouts[dateForLog][exerciseId] ?? { sets: [] };
    const existing = exerciseLog.sets[setIndex] ?? { done: false };
    const next = { ...existing };
    if (target.hasAttribute('data-workout-done')) next.done = target.checked;
    else {
      const value = target.value.trim();
      const field = target.dataset.workoutField;
      if (value === '') delete next[field];
      else next[field] = field === 'reps' ? Number.parseInt(value, 10) : Number.parseFloat(value);
    }
    while (exerciseLog.sets.length <= setIndex) exerciseLog.sets.push({ done: false });
    exerciseLog.sets[setIndex] = next;
    records.workouts[dateForLog][exerciseId] = exerciseLog;
    saveRecords('세트 기록을 저장했어요.');
  }

  if (root.dataset.bound !== 'true') {
    root.dataset.bound = 'true';
    root.addEventListener('change', (event) => {
      const target = event.target;
      if (target.matches('[data-workout-field], [data-workout-done]')) {
        updateWorkoutField(target);
        return;
      }
      if (target.matches('#backup-file') && target.files?.[0]) {
        target.files[0].text().then((text) => {
          pendingImportText = text;
          const dialog = root.querySelector('#import-dialog');
          if (dialog?.showModal) dialog.showModal();
          else updateStatus('이 브라우저는 백업 가져오기를 지원하지 않습니다.', true);
        }).catch((error) => updateStatus(`백업 파일을 읽지 못했습니다. (${error.message})`, true));
      }
    });

    root.addEventListener('submit', (event) => {
      event.preventDefault();
      if (event.target.id === 'measurement-form') {
        const formData = new FormData(event.target);
        const values = Object.fromEntries(MEASUREMENT_FIELDS.map(([key]) => {
          const value = String(formData.get(key) ?? '').trim();
          return [key, value === '' ? undefined : Number.parseFloat(value)];
        }).filter(([, value]) => value !== undefined));
        if (!Object.keys(values).length) {
          updateStatus('체중 또는 둘레를 하나 이상 입력해 주세요.', true);
          return;
        }
        const existingIndex = records.measurements.findIndex((entry) => entry.date === dateISO);
        const entry = { ...(existingIndex >= 0 ? records.measurements[existingIndex] : {}), date: dateISO, ...values };
        if (existingIndex >= 0) records.measurements[existingIndex] = entry;
        else records.measurements.push(entry);
        if (saveRecords('오늘 기록을 저장했어요.')) render();
      }
      if (event.target.id === 'profile-form') {
        const formData = new FormData(event.target);
        records.profile = Object.fromEntries(PROFILE_FIELDS.map(([key]) => {
          const value = String(formData.get(key) ?? '').trim();
          return [key, value ? Number.parseFloat(value) : null];
        }));
        if (saveRecords('기준 정보를 저장했어요.')) render();
      }
    });

    root.addEventListener('click', (event) => {
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (action === 'export') {
        try {
          const blob = new Blob([store.exportJson()], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `training-records-${dateISO}.json`;
          link.click();
          URL.revokeObjectURL(url);
          updateStatus('기록 백업 파일을 만들었어요.');
        } catch (error) {
          updateStatus(`기록을 내보내지 못했습니다. (${error.message})`, true);
        }
        return;
      }
      if (action === 'clear') {
        if (window.confirm('이 브라우저에 저장된 운동·측정 기록을 지울까요? 내보낸 백업 파일은 삭제되지 않습니다.')) {
          try {
            store.clear();
            records = store.load();
            updateStatus('이 기기의 기록을 초기화했어요.');
            render();
          } catch (error) {
            updateStatus(`기록을 초기화하지 못했습니다. (${error.message})`, true);
          }
        }
        return;
      }
      const choice = event.target.closest('[data-import-choice]')?.dataset.importChoice;
      if (choice) {
        const dialog = root.querySelector('#import-dialog');
        dialog?.close();
        const file = root.querySelector('#backup-file');
        if (choice === 'cancel') {
          pendingImportText = '';
          if (file) file.value = '';
          updateStatus('백업 가져오기를 취소했어요. 기존 기록은 유지됩니다.');
          return;
        }
        try {
          records = store.importJson(pendingImportText, choice === 'replace');
          pendingImportText = '';
          if (file) file.value = '';
          statusMessage = choice === 'replace' ? '백업 기록으로 바꿨어요.' : '기존 기록과 합쳐 가져왔어요.';
          render();
          updateStatus(statusMessage);
        } catch (error) {
          pendingImportText = '';
          if (file) file.value = '';
          updateStatus(`백업을 가져오지 못했습니다. ${error.message}`, true);
        }
      }
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key !== STORAGE_KEY) return;
        try {
          records = store.load();
          render();
          updateStatus('다른 탭에서 변경된 기록을 불러왔어요.');
        } catch (error) {
          updateStatus(`다른 탭의 기록을 읽지 못했습니다. (${error.message})`, true);
        }
      });
    }
  }

  render();
}

function weekIndex(weekNumber) {
  return (weekNumber ?? 1) - 1;
}
