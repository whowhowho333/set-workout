import { byId, element, icon, actionButton, emptyState, exerciseOptions } from './components.js';
import { describeSet, describeReps, describeWeight, formatNumber, formatToday, formatHistoryDate } from './format.js';
import { today, dateFromKey } from '../journal/dates.js';
import { renderWorkout } from './workouts.js';

function groupSets(sets, property) {
  const groups = new Map();
  for (const set of sets) {
    const key = set[property];
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(set);
  }
  return groups;
}

function renderExercises(state, container, preview = false) {
  if (!state.exercises.length) {
    container.replaceChildren(emptyState('barbell', 'No exercises yet', 'Add an exercise you do regularly.', 'exercise', 'Add exercise'));
    return;
  }

  const latest = new Map();
  for (const set of state.sets) {
    const previous = latest.get(set.exerciseId);
    if (!previous || previous.date <= set.date) latest.set(set.exerciseId, set);
  }

  const exercises = preview ? state.exercises.slice(-3).reverse() : state.exercises;
  const rows = exercises.map(({ id, name }) => {
    const row = element('div', 'exercise-row');
    const info = element('div', 'exercise-info');
    const last = latest.get(id);
    info.append(element('h3', '', name), element('p', '', last ? describeSet(last) : 'No sets logged yet'));
    row.append(icon('barbell'), info);
    if (!preview) row.append(actionButton('icon-button', 'rename', `Rename ${name}`, 'edit', id));
    row.append(actionButton('icon-button', 'log', `Log sets for ${name}`, 'plus', id));
    return row;
  });

  if (preview && state.exercises.length > exercises.length) {
    const link = element('a', 'text-button', 'All exercises');
    link.href = '/exercises';
    rows.push(link);
  }
  container.replaceChildren(...rows);
}

function logGroups(state, sets, key = 'exerciseId') {
  const grouped = groupSets(sets, key);
  const names = new Map(state.exercises.map(({ id, name }) => [id, name]));
  return Array.from(grouped.values(), (exerciseSets) => {
    const group = element('section', 'log-group');
    const name = names.get(exerciseSets[0].exerciseId) ?? 'Exercise';
    group.append(element('h3', '', name));

    exerciseSets.forEach((set, index) => {
      const row = element('div', 'result-row');
      const number = index + 1;
      row.append(
        element('span', '', `${number}.`),
        element('strong', '', describeWeight(set.weight)),
        element('span', '', describeReps(set.reps)),
        actionButton('icon-button', 'edit-set', `Edit set ${number} for ${name}`, 'edit', set.id),
      );
      group.append(row);
    });
    return group;
  });
}

function dailyLog(state, sets) {
  const groups = groupSets(sets, 'workoutId');
  const rows = logGroups(state, groups.get(undefined) ?? []);
  const workouts = new Map((state.workouts ?? []).map((workout) => [workout.id, workout]));
  if (state.activeWorkout) workouts.set(state.activeWorkout.id, state.activeWorkout);

  for (const [id, workoutSets] of groups) {
    if (id === undefined) continue;
    const workout = workouts.get(id);
    if (!workout) {
      rows.push(...logGroups(state, workoutSets));
      continue;
    }
    const session = element('section', 'workout-history');
    session.append(element('h3', 'workout-name', workout.name));
    const setsByEntry = groupSets(workoutSets, 'workoutEntryId');
    for (const block of workout.blocks) {
      const blockSets = block.entries.flatMap(({ id }) => setsByEntry.get(id) ?? []);
      if (!blockSets.length) continue;
      const section = element('section', 'workout-block');
      section.append(element('h4', 'workout-name', block.name), ...logGroups(state, blockSets, 'workoutEntryId'));
      session.append(section);
    }
    rows.push(session);
  }
  return rows;
}

function renderToday(state) {
  const date = today();
  const sets = state.sets.filter((set) => set.date === date);
  byId('today-date').textContent = formatToday(dateFromKey(date));
  byId('stat-exercises').textContent = formatNumber(new Set(sets.map((set) => set.exerciseId)).size);
  byId('stat-sets').textContent = formatNumber(sets.length);
  byId('stat-reps').textContent = formatNumber(sets.reduce((total, set) => total + set.reps, 0));
  renderWorkout(state);
  const logSets = state.activeWorkout ? sets.filter(({ workoutId }) => workoutId !== state.activeWorkout.id) : sets;
  byId('today-log').closest('.panel').hidden = Boolean(state.activeWorkout && !logSets.length);
  byId('today-log').replaceChildren(...(logSets.length ? dailyLog(state, logSets) : [
    emptyState('stack', 'No sets logged today', 'Your first set will appear here after you save it.'),
  ]));
  renderExercises(state, byId('today-library'), true);
}

function renderHistory(state, exerciseId) {
  const historyFilter = byId('history-filter');
  exerciseOptions(state.exercises, historyFilter, true, exerciseId);
  historyFilter.disabled = !state.exercises.length;
  const sets = historyFilter.value ? state.sets.filter((set) => set.exerciseId === historyFilter.value) : state.sets;
  const dates = groupSets(sets, 'date');
  const days = Array.from(dates.keys()).sort().reverse().map((date) => {
    const card = element('section', 'history-day panel');
    card.append(element('h2', '', formatHistoryDate(dateFromKey(date))), ...dailyLog(state, dates.get(date)));
    return card;
  });
  if (!days.length) {
    const panel = element('div', 'panel');
    panel.append(emptyState('history', 'No sets logged yet', 'Your saved sets will be grouped by date.'));
    days.push(panel);
  }
  byId('history-list').replaceChildren(...days);
}

export function renderPage(page, state, exerciseId) {
  if (page === 'today') renderToday(state);
  if (page === 'exercises') renderExercises(state, byId('exercise-list'));
  if (page === 'history') renderHistory(state, exerciseId);
}
