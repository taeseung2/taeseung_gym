export const profile = {
  heightCm: null,
  baselineWeightKg: null,
  skeletalMuscleKg: null,
  bodyFatPercent: null,
  targetWeightKg: null,
};

const exercise = (id, name, sets, reps, restSeconds = 90, note = '') => ({
  id, name, sets, reps, restSeconds, note,
});

export const weeklyWorkouts = {
  mon: {
    dayName: '월요일', title: '상체 A · 가슴, 등, 팔', durationMinutes: 60,
    blocks: [
      { start: '06:00', end: '06:07', title: '준비운동', detail: '자전거 3분, 어깨 가동성, 가벼운 프레스 연습' },
      { start: '06:07', end: '06:19', title: '덤벨 벤치프레스', exerciseId: 'db-bench-press' },
      { start: '06:19', end: '06:31', title: '벤치 지지 원암 로우', exerciseId: 'one-arm-row' },
      { start: '06:31', end: '06:40', title: '덤벨 숄더프레스', exerciseId: 'shoulder-press' },
      { start: '06:40', end: '06:49', title: '덤벨 컬', exerciseId: 'dumbbell-curl' },
      { start: '06:49', end: '06:57', title: '누워서 덤벨 삼두 익스텐션', exerciseId: 'lying-triceps-extension' },
      { start: '06:57', end: '07:00', title: '정리 및 기록' },
    ],
    exercises: [
      exercise('db-bench-press', '덤벨 벤치프레스', 3, '8~15회', 120),
      exercise('one-arm-row', '벤치 지지 원암 로우', 3, '10~15회/쪽', 90),
      exercise('shoulder-press', '덤벨 숄더프레스', 2, '8~12회', 90),
      exercise('dumbbell-curl', '덤벨 컬', 3, '10~15회', 75),
      exercise('lying-triceps-extension', '누워서 덤벨 삼두 익스텐션', 3, '10~15회', 75),
    ],
  },
  tue: {
    dayName: '화요일', title: '하체 A · 스쿼트, 힙힌지', durationMinutes: 60,
    blocks: [
      { start: '06:00', end: '06:07', title: '준비운동', detail: '자전거 3분, 맨몸 스쿼트와 힙힌지 연습' },
      { start: '06:07', end: '06:19', title: '지지대 잡고 스플릿 스쿼트', exerciseId: 'supported-split-squat' },
      { start: '06:19', end: '06:31', title: '덤벨 루마니안 데드리프트', exerciseId: 'dumbbell-rdl' },
      { start: '06:31', end: '06:40', title: '고블릿 스쿼트', exerciseId: 'goblet-squat-a' },
      { start: '06:40', end: '06:49', title: '카프레이즈', exerciseId: 'calf-raise-a' },
      { start: '06:49', end: '06:57', title: '데드버그와 사이드 플랭크', exerciseId: 'core-a' },
      { start: '06:57', end: '07:00', title: '정리 및 기록' },
    ],
    exercises: [
      exercise('supported-split-squat', '지지대 잡고 스플릿 스쿼트', 3, '8~12회/쪽', 120, '맨몸으로 시작하고 균형이 안정된 뒤 덤벨을 듭니다.'),
      exercise('dumbbell-rdl', '덤벨 루마니안 데드리프트', 3, '10~15회', 120),
      exercise('goblet-squat-a', '고블릿 스쿼트', 2, '12~20회', 90),
      exercise('calf-raise-a', '카프레이즈', 3, '15~25회', 60),
      exercise('core-a', '데드버그 + 사이드 플랭크', 2, '6~10회/쪽 + 20~30초/쪽', 60),
    ],
  },
  wed: {
    dayName: '수요일', title: '유산소와 회복', durationMinutes: 60,
    blocks: [
      { start: '06:00', end: '06:07', title: '가벼운 준비운동', detail: '자전거를 아주 가볍게 타며 몸을 풉니다.' },
      { start: '06:07', end: '06:40', title: '실내 자전거', detail: '33분, 문장으로 대화할 수 있는 강도' },
      { start: '06:40', end: '06:57', title: '가동성 회복', detail: '가슴, 등, 고관절을 편안하게 움직입니다.' },
      { start: '06:57', end: '07:00', title: '정리 및 기록' },
    ],
    exercises: [],
  },
  thu: {
    dayName: '목요일', title: '상체 B · 등, 가슴, 팔', durationMinutes: 60,
    blocks: [
      { start: '06:00', end: '06:07', title: '준비운동', detail: '자전거 3분, 어깨 가동성, 가벼운 턱걸이 연습' },
      { start: '06:07', end: '06:19', title: '밴드 보조 턱걸이', exerciseId: 'band-pull-up' },
      { start: '06:19', end: '06:31', title: '인클라인 덤벨프레스', exerciseId: 'incline-db-press' },
      { start: '06:31', end: '06:40', title: '벤치 지지 원암 로우', exerciseId: 'one-arm-row-b' },
      { start: '06:40', end: '06:49', title: '해머컬', exerciseId: 'hammer-curl' },
      { start: '06:49', end: '06:57', title: '누워서 덤벨 삼두 익스텐션', exerciseId: 'lying-triceps-extension-b' },
      { start: '06:57', end: '07:00', title: '정리 및 기록' },
    ],
    exercises: [
      exercise('band-pull-up', '밴드 보조 턱걸이', 3, '5~10회', 120, '밴드 보조량을 유지한 채 반복수를 먼저 늘립니다.'),
      exercise('incline-db-press', '인클라인 덤벨프레스', 3, '8~15회', 120),
      exercise('one-arm-row-b', '벤치 지지 원암 로우', 2, '10~15회/쪽', 90),
      exercise('hammer-curl', '해머컬', 3, '10~15회', 75),
      exercise('lying-triceps-extension-b', '누워서 덤벨 삼두 익스텐션', 3, '10~15회', 75),
    ],
  },
  fri: {
    dayName: '금요일', title: '하체 B · 런지, 둔근, 코어', durationMinutes: 60,
    blocks: [
      { start: '06:00', end: '06:07', title: '준비운동', detail: '자전거 3분, 맨몸 스쿼트와 힙힌지 연습' },
      { start: '06:07', end: '06:19', title: '고블릿 스쿼트', exerciseId: 'goblet-squat-b' },
      { start: '06:19', end: '06:31', title: '지지대 잡고 리버스 런지', exerciseId: 'reverse-lunge' },
      { start: '06:31', end: '06:40', title: '덤벨 힙브리지', exerciseId: 'dumbbell-hip-bridge' },
      { start: '06:40', end: '06:49', title: '카프레이즈', exerciseId: 'calf-raise-b' },
      { start: '06:49', end: '06:57', title: '데드버그와 사이드 플랭크', exerciseId: 'core-b' },
      { start: '06:57', end: '07:00', title: '정리 및 기록' },
    ],
    exercises: [
      exercise('goblet-squat-b', '고블릿 스쿼트', 3, '10~20회', 120),
      exercise('reverse-lunge', '지지대 잡고 리버스 런지', 3, '8~12회/쪽', 120),
      exercise('dumbbell-hip-bridge', '덤벨 힙브리지', 3, '12~20회', 90),
      exercise('calf-raise-b', '카프레이즈', 3, '15~25회', 60),
      exercise('core-b', '데드버그 + 사이드 플랭크', 2, '6~10회/쪽 + 20~30초/쪽', 60),
    ],
  },
};

const meal = (time, foods) => ({ time, foods: foods.map(([name, amount]) => ({ name, amount })) });

export const weeklyMeals = {
  mon: {
    breakfast: meal('07:10 · 운동 후', [['오트밀', '80g'], ['무가당 두유', '250ml'], ['무지방 그릭요거트', '150g'], ['바나나', '1개'], ['호두', '10g']]),
    lunch: meal('12:00 전후', [['잡곡밥', '250g'], ['닭가슴살', '100g'], ['채소', '200g'], ['올리브유', '10g']]),
    snack: meal('16:00 전후', [['통밀빵', '2장'], ['무가당 두유', '250ml'], ['사과', '1개'], ['아몬드', '15g']]),
    dinner: meal('19:00 전후', [['잡곡밥', '250g'], ['두부', '250g'], ['삶은 콩', '100g'], ['채소', '200g'], ['올리브유', '5g']]),
  },
  tue: {
    breakfast: meal('07:10 · 운동 후', [['오트밀', '80g'], ['저지방 우유', '250ml'], ['무지방 그릭요거트', '150g'], ['바나나', '1개'], ['아몬드', '10g']]),
    lunch: meal('12:00 전후', [['잡곡밥', '250g'], ['돼지안심', '120g'], ['채소', '200g'], ['올리브유', '10g']]),
    snack: meal('16:00 전후', [['무지방 그릭요거트', '200g'], ['통밀빵', '2장'], ['키위', '2개'], ['호두', '15g']]),
    dinner: meal('19:00 전후', [['잡곡밥', '250g'], ['고등어', '120g'], ['두부', '100g'], ['채소', '200g']]),
  },
  wed: {
    breakfast: meal('07:10 · 회복운동 후', [['통밀빵', '3장'], ['달걀흰자', '150g'], ['무가당 두유', '250ml'], ['바나나', '1개'], ['무첨가 땅콩버터', '15g']]),
    lunch: meal('12:00 전후', [['잡곡밥', '250g'], ['두부', '200g'], ['삶은 렌틸콩', '100g'], ['채소', '200g'], ['올리브유', '10g']]),
    snack: meal('16:00 전후', [['무지방 그릭요거트', '200g'], ['오트밀', '40g'], ['사과', '1개'], ['아몬드', '15g']]),
    dinner: meal('19:00 전후', [['잡곡밥', '250g'], ['닭가슴살', '100g'], ['채소', '200g'], ['올리브유', '10g']]),
  },
  thu: {
    breakfast: meal('07:10 · 운동 후', [['오트밀', '80g'], ['무가당 두유', '250ml'], ['무지방 그릭요거트', '150g'], ['바나나', '1개'], ['호두', '10g']]),
    lunch: meal('12:00 전후', [['잡곡밥', '250g'], ['흰살생선', '150g'], ['두부', '100g'], ['채소', '200g'], ['올리브유', '10g']]),
    snack: meal('16:00 전후', [['통밀빵', '2장'], ['무지방 그릭요거트', '150g'], ['사과', '1개'], ['아몬드', '20g']]),
    dinner: meal('19:00 전후', [['잡곡밥', '250g'], ['껍질 제거 닭다리살', '120g'], ['삶은 콩', '100g'], ['채소', '200g']]),
  },
  fri: {
    breakfast: meal('07:10 · 운동 후', [['오트밀', '80g'], ['저지방 우유', '250ml'], ['무지방 그릭요거트', '150g'], ['바나나', '1개'], ['아몬드', '10g']]),
    lunch: meal('12:00 전후', [['잡곡밥', '250g'], ['닭가슴살', '100g'], ['삶은 콩', '100g'], ['채소', '200g'], ['올리브유', '10g']]),
    snack: meal('16:00 전후', [['무가당 두유', '250ml'], ['통밀빵', '2장'], ['사과', '1개'], ['호두', '15g']]),
    dinner: meal('19:00 전후', [['잡곡밥', '250g'], ['연어', '150g'], ['채소', '200g'], ['올리브유', '5g']]),
  },
};

const progression = [
  ['기술 익히기', '각 운동 1~2세트, 3~4회 여유를 두고 자세와 시작 중량을 익힌다.'],
  ['적응', '최대 2세트, 3회 여유. 같은 중량에서 세트당 1회 추가를 시도한다.'],
  ['기본량 적용', '기본 세트 수로 진행하고 2~3회 여유를 둔다. 중량은 유지한다.'],
  ['반복수 증가', '자세가 안정적이면 세트당 1회씩 늘린다.'],
  ['상단 반복 확인', '반복 범위 상단을 목표로 하되 실패 지점까지 가지 않는다.'],
  ['조건부 증량', '상단 반복을 연속 2회 운동일 달성한 종목만 소폭 증량한다.'],
  ['피로 점검', '피로·관절 불편·수행 저하가 있으면 세트를 절반으로 줄인다.'],
  ['회복 후 복귀', '마지막으로 안정적으로 수행한 중량과 횟수에서 다시 시작한다.'],
  ['점진 진행', '세트별 반복수를 1회씩 늘린다.'],
  ['반복 상단 도전', '상단 반복 달성 종목만 증량 또는 난도 증가를 검토한다.'],
  ['새 중량 적응', '새 중량과 난도에 적응하고 세트를 추가하지 않는다.'],
  ['12주 점검', '1주차 대비 체중·허리·팔둘레와 중량·반복수를 비교한다.'],
];

export const weeks12 = progression.map(([focus, progressionText], index) => {
  const start = new Date(Date.UTC(2026, 9, 1 + index * 7));
  const end = new Date(Date.UTC(2026, 9, 7 + index * 7));
  return {
    week: index + 1,
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    focus,
    progression: progressionText,
  };
});

export const nutritionGuidance = {
  dailyCalories: '하루 약 2,500~2,650kcal로 시작하고 2주 체중 평균으로 조정합니다.',
  protein: '단백질 하루 130~145g을 참고 목표로 합니다.',
  adjustments: [
    '2주 평균 체중이 거의 그대로면 하루 100~150kcal를 더합니다.',
    '주당 약 0.1~0.25kg 늘고 수행이 좋아지면 유지합니다.',
    '초기 2주 이후 주당 0.3kg 이상 계속 늘고 허리도 빠르게 증가하면 하루 100~150kcal를 줄입니다.',
  ],
  heartHealthyNote: '버터·크림·가공육·기름진 육류를 줄이고, 콩·생선·견과류·올리브유와 통곡물을 선택합니다. 가당 음료와 달콤한 가공식품의 첨가당을 줄입니다.',
  portionNote: '식품 중량은 조리 후 기준이며, 오트밀은 마른 중량입니다. 제품과 조리법에 따라 실제 열량과 단백질은 달라집니다.',
};
