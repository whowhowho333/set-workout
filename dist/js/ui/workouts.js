import { actionButton, byId, element, exerciseOptions, showError, toast } from './components.js';
import { describeSet } from './format.js';

const errors = {
  workoutActive: 'Finish your current workout first.',
  workoutMissing: 'This workout is no longer in progress.',
  blockMissing: 'This block is no longer in the workout.',
  workoutEntryMissing: 'This exercise is no longer in the workout.',
  entryHasSets: 'This exercise already has logged sets.',
  chooseExercise: 'Choose a saved exercise.',
  exerciseInBlock: 'This exercise is already in the block.',
  nameRequired: 'Enter a name.',
  templateEmpty: 'Add an exercise before saving a template.',
  templateDuplicate: 'A template with this name already exists.',
  templateMissing: 'This template no longer exists.',
  storageError: 'Could not save your changes on this device.',
};

function workoutButton(action, label, id, primary = false) {
  return actionButton(`button button-${primary ? 'primary' : 'secondary'}`, action, label, null, id);
}

export function renderWorkout(state) {
  const panel = byId('workout-panel');
  const heading = element('div', 'panel-heading');
  const workout = state.activeWorkout;
  if (!workout) {
    heading.append(element('h2', '', 'Workouts'), workoutButton('workout-start', 'Start workout', null, true));
    panel.replaceChildren(heading);
    if (!state.templates?.length) return;

    const templates = element('div', 'workout-templates');
    templates.append(element('h3', '', 'Templates'));
    for (const template of state.templates) {
      const row = element('div', 'workout-row');
      row.append(
        element('strong', 'workout-name', template.name),
        workoutButton('workout-use-template', 'Start', template.id),
        actionButton('icon-button', 'workout-delete-template', `Delete template ${template.name}`, 'close', template.id),
      );
      row.querySelector('[data-action="workout-use-template"]').setAttribute('aria-label', `Start ${template.name}`);
      templates.append(row);
    }
    panel.append(templates);
    return;
  }

  heading.append(element('h2', 'workout-name', workout.name), workoutButton('workout-save-template', 'Save template'));
  heading.lastElementChild.disabled = !workout.blocks.some(({ entries }) => entries.length);
  panel.replaceChildren(heading);
  const names = new Map(state.exercises.map(({ id, name }) => [id, name]));
  const setsByEntry = new Map();
  for (const set of state.sets) {
    if (set.workoutId !== workout.id) continue;
    if (!setsByEntry.has(set.workoutEntryId)) setsByEntry.set(set.workoutEntryId, []);
    setsByEntry.get(set.workoutEntryId).push(set);
  }

  for (const block of workout.blocks) {
    const section = element('section', 'workout-block');
    const title = element('div', 'workout-row workout-block-heading');
    title.append(
      element('h3', 'workout-name', block.name),
      actionButton('icon-button', 'workout-rename-block', `Rename block ${block.name}`, 'edit', block.id),
    );
    section.append(title);
    for (const entry of block.entries) {
      const name = names.get(entry.exerciseId) ?? 'Exercise';
      const row = element('div', 'workout-row workout-exercise');
      const sets = setsByEntry.get(entry.id) ?? [];
      row.append(element('h4', 'workout-name', name));
      const log = workoutButton('workout-log', 'Log sets', entry.id);
      log.setAttribute('aria-label', `Log sets for ${name} in ${block.name}`);
      row.append(log);
      if (!sets.length) row.append(actionButton('icon-button', 'workout-remove-entry', `Remove ${name} from ${block.name}`, 'close', entry.id));
      section.append(row);
      if (sets.length) {
        const list = element('ul', 'workout-sets');
        for (const set of sets) {
          const item = element('li', 'workout-row');
          const summary = describeSet(set);
          item.append(
            element('span', 'workout-name', summary),
            actionButton('icon-button', 'edit-set', `Edit ${name}: ${summary}`, 'edit', set.id),
          );
          list.append(item);
        }
        section.append(list);
      }
    }
    const add = actionButton('text-button', 'workout-add-exercise', 'Add exercise', null, block.id);
    add.setAttribute('aria-label', `Add exercise to ${block.name}`);
    section.append(add);
    panel.append(section);
  }

  const actions = element('div', 'workout-actions');
  actions.append(workoutButton('workout-add-block', 'Add block'), workoutButton('workout-finish', 'Finish workout', null, true));
  panel.append(actions);
}

export function initializeWorkout(journal, render, updateBackButton, openExercise) {
  const dialog = byId('workout-dialog');
  const form = byId('workout-form');
  const nameInput = byId('workout-name');
  const select = byId('workout-exercise');
  const submit = byId('workout-submit');
  let save;
  let createExercise;

  function complete(error, message) {
    if (error) {
      toast(errors[error], false);
      return;
    }
    render();
    if (message) toast(message);
  }

  function open({ title, button, name, addExercise, copy, onSave, message }) {
    showError(form);
    byId('workout-dialog-title').textContent = title;
    byId('workout-name-field').hidden = !name;
    byId('workout-name-label').textContent = name?.label ?? 'Name';
    nameInput.disabled = !name;
    nameInput.required = Boolean(name?.required);
    nameInput.placeholder = name?.placeholder ?? '';
    nameInput.value = name?.value ?? '';
    byId('workout-exercise-field').hidden = !addExercise;
    const options = addExercise?.options ?? [];
    exerciseOptions(options, select, false, '');
    select.disabled = options.length === 0;
    const description = byId('workout-dialog-copy');
    description.textContent = copy ?? '';
    description.hidden = !copy;
    submit.textContent = button;
    submit.hidden = Boolean(addExercise && !options.length);
    createExercise = addExercise?.save;
    save = () => finish(onSave(name ? nameInput.value : select.value), message);
    dialog.showModal();
    if (addExercise && !select.disabled) select.focus();
    updateBackButton();
  }

  function finish(error, message) {
    if (error) {
      showError(form, errors[error]);
      return;
    }
    dialog.close();
    complete(null, message);
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!submit.hidden) save();
  });
  dialog.addEventListener('close', updateBackButton);

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action^="workout-"]');
    if (!button) return;
    const id = button.dataset.id;
    const { activeWorkout, templates, exercises } = journal.state;
    if (button.dataset.action === 'workout-start') {
      open({ title: 'Start workout', button: 'Start workout', name: { label: 'Workout name (optional)', placeholder: 'Workout' }, onSave: (name) => journal.startWorkout(name) });
      return;
    }
    if (button.dataset.action === 'workout-use-template') {
      complete(journal.startWorkout('', id));
      return;
    }
    if (button.dataset.action === 'workout-delete-template') {
      const template = templates?.find((item) => item.id === id);
      if (template) open({
        title: 'Delete template?',
        button: 'Delete template',
        copy: template.name,
        onSave: () => journal.removeTemplate(id),
        message: 'Template deleted',
      });
      return;
    }
    if (!activeWorkout) return;
    const workoutId = activeWorkout.id;
    const block = activeWorkout.blocks.find((item) => item.id === id);
    switch (button.dataset.action) {
      case 'workout-add-block':
      case 'workout-rename-block': {
        if (id && !block) return;
        open({
          title: block ? 'Rename block' : 'Add block',
          button: block ? 'Save name' : 'Add block',
          name: { label: 'Block name', value: block?.name, placeholder: 'e.g. Warm-up', required: true },
          onSave: (name) => journal.saveBlock(workoutId, name, id),
        });
        break;
      }
      case 'workout-add-exercise': {
        if (!block) return;
        const options = exercises.filter(({ id }) => !block.entries.some(({ exerciseId }) => exerciseId === id));
        const add = (exerciseId) => journal.addWorkoutExercise(workoutId, id, exerciseId);
        open({
          title: `Add exercise to ${block.name}`,
          button: 'Add exercise',
          addExercise: { options, save: add },
          onSave: add,
        });
        break;
      }
      case 'workout-new-exercise': {
        const add = createExercise;
        openExercise({ onCreated: (exerciseId) => finish(add(exerciseId), 'Exercise added') });
        break;
      }
      case 'workout-remove-entry':
        complete(journal.removeWorkoutExercise(workoutId, id));
        break;
      case 'workout-save-template':
        open({
          title: 'Save workout template',
          button: 'Save template',
          name: { label: 'Template name', value: activeWorkout.name, required: true },
          onSave: (name) => journal.saveTemplate(workoutId, name),
          message: 'Template saved',
        });
        break;
      case 'workout-finish':
        complete(journal.finishWorkout(workoutId), 'Workout finished');
        break;
    }
  });

  return () => {
    if (!dialog.open) return false;
    dialog.close();
    return true;
  };
}
