import { byId, exerciseOptions, showError, toast } from './components.js';
import { describeSet } from './format.js';
import { today } from '../journal/dates.js';
import { setClosingConfirmation } from '../platform/telegram.js';

const formErrors = {
  nameRequired: 'Enter an exercise name.',
  duplicateExercise: 'An exercise with this name already exists.',
  chooseExercise: 'Choose a saved exercise.',
  setMissing: 'This set has already been deleted.',
  storageError: 'Could not save your data. Check whether storage is available on this device.',
};

export function initializeDialogs(journal, render, updateBackButton) {
  const exerciseDialog = byId('exercise-dialog');
  const logDialog = byId('log-dialog');
  const deleteDialog = byId('delete-dialog');
  const discardDialog = byId('discard-dialog');
  const exerciseForm = byId('exercise-form');
  const logForm = byId('log-form');
  const dateField = byId('log-date-field');
  const setFields = byId('set-fields');

  let exerciseIdToEdit = null;
  let setIdToEdit = null;
  let logAfterCreating = false;
  const initialValues = new WeakMap();
  let unsaved = false;

  const values = (dialog) => JSON.stringify(
    [...dialog.querySelectorAll('input, select')].map((field) => field.validity.badInput ? null : field.value),
  );
  const editingDialog = () => exerciseDialog.open ? exerciseDialog : logDialog.open ? logDialog : null;
  const hasChanges = (dialog) => dialog.open && values(dialog) !== initialValues.get(dialog);
  const hasUnsavedChanges = () => hasChanges(exerciseDialog) || hasChanges(logDialog);
  const finePointer = window.matchMedia('(pointer: fine)');

  function warnBeforeUnload(event) {
    if (!hasUnsavedChanges()) return;
    event.preventDefault();
    event.returnValue = true;
  }

  function updateUnsaved() {
    const next = hasUnsavedChanges();
    if (next === unsaved) return;
    unsaved = next;
    setClosingConfirmation(unsaved);
    if (unsaved) window.addEventListener('beforeunload', warnBeforeUnload);
    else window.removeEventListener('beforeunload', warnBeforeUnload);
  }

  function requestClose(dialog) {
    if (dialog === editingDialog() && hasChanges(dialog)) {
      discardDialog.showModal();
      updateBackButton();
      return;
    }
    dialog.close();
  }

  function openExercise({ id = null, thenLog = false } = {}) {
    const exercise = journal.state.exercises.find((item) => item.id === id);
    exerciseIdToEdit = exercise?.id ?? null;
    logAfterCreating = thenLog;
    exerciseForm.reset();
    showError(exerciseForm);
    byId('exercise-dialog-title').textContent = exercise ? 'Rename exercise' : 'New exercise';
    exerciseForm.elements.name.value = exercise?.name ?? '';
    initialValues.set(exerciseDialog, values(exerciseDialog));
    exerciseDialog.showModal();
    if (finePointer.matches) exerciseForm.elements.name.focus();
    updateBackButton();
  }

  function refreshSetLabels() {
    const rows = Array.from(setFields.children);
    rows.forEach((row, index) => {
      const number = index + 1;
      row.querySelector('.set-index').textContent = number;
      row.querySelector('[name="weight"]').setAttribute('aria-label', `Weight (kg), set ${number}`);
      row.querySelector('[name="reps"]').setAttribute('aria-label', `Reps, set ${number}`);
      const button = row.querySelector('.remove-row');
      button.setAttribute('aria-label', `Remove set ${number}`);
      button.hidden = rows.length === 1;
    });
  }

  function addSetRow(set, focus = false) {
    const row = byId('set-template').content.firstElementChild.cloneNode(true);
    const weight = row.querySelector('[name="weight"]');
    if (set) {
      weight.value = String(set.weight);
      row.querySelector('[name="reps"]').value = set.reps;
    }
    setFields.append(row);
    refreshSetLabels();
    if (focus) {
      weight.focus();
      updateUnsaved();
    }
  }

  function openLog({ exerciseId, set } = {}) {
    if (!journal.state.exercises.length) {
      openExercise({ thenLog: true });
      return;
    }
    setIdToEdit = set?.id ?? null;
    logForm.reset();
    showError(logForm);
    byId('log-dialog-title').textContent = set ? 'Edit set' : 'Log sets';
    exerciseOptions(journal.state.exercises, logForm.elements.exercise, false, set?.exerciseId ?? exerciseId);
    dateField.hidden = !set;
    logForm.elements.date.disabled = !set;
    logForm.elements.date.value = set?.date ?? '';
    logForm.querySelector('[data-action="add-log-exercise"]').hidden = Boolean(set);
    logForm.querySelector('[data-action="add-set"]').hidden = Boolean(set);
    logForm.querySelector('[data-action="delete-set"]').hidden = !set;
    logForm.querySelector('[type="submit"]').textContent = set ? 'Save changes' : 'Save sets';
    setFields.replaceChildren();
    addSetRow(set);
    initialValues.set(logDialog, values(logDialog));
    logDialog.showModal();
    if (finePointer.matches) {
      if (set || exerciseId) setFields.querySelector('input').focus();
      else logForm.querySelector('[data-select="log-exercise"]').focus();
    }
    updateBackButton();
  }

  exerciseForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const existingId = exerciseIdToEdit;
    const id = existingId ?? crypto.randomUUID();
    const error = journal.saveExercise(id, exerciseForm.elements.name.value);
    if (error) {
      const field = error === 'nameRequired' || error === 'duplicateExercise' ? exerciseForm.elements.name : undefined;
      showError(exerciseForm, formErrors[error], field);
      return;
    }

    exerciseDialog.close();
    render();
    if (logDialog.open) {
      const select = logForm.elements.exercise;
      exerciseOptions(journal.state.exercises, select, false, id);
      if (select.getAttribute('aria-invalid') === 'true') showError(logForm);
      logForm.querySelector('[data-select="log-exercise"]').focus();
      updateUnsaved();
    } else if (logAfterCreating) {
      openLog({ exerciseId: id });
    } else {
      toast(existingId ? 'Exercise renamed' : 'Exercise added');
    }
  });

  logForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const { exercise, date } = logForm.elements;
    if (setIdToEdit && (!date.validity.valid || !/^\d{4}-\d{2}-\d{2}$/.test(date.value))) {
      showError(logForm, 'Enter a valid workout date.', date);
      return;
    }

    const workoutDate = setIdToEdit ? date.value : today();
    const sets = [];
    for (const row of setFields.children) {
      const weightInput = row.querySelector('[name="weight"]');
      const value = weightInput.value.trim().replace(',', '.');
      const weight = Number(value);
      if (!/^(?:\d+(?:\.\d{1,3})?|\.\d{1,3})$/.test(value) || weight > 99999) {
        showError(logForm, 'Enter a weight from 0 to 99,999 kg, with up to three decimal places.', weightInput);
        return;
      }
      const repsInput = row.querySelector('[name="reps"]');
      if (!repsInput.validity.valid) {
        showError(logForm, 'Enter a whole number of reps from 1 to 99,999.', repsInput);
        return;
      }
      const reps = repsInput.valueAsNumber;
      sets.push({ id: setIdToEdit ?? crypto.randomUUID(), exerciseId: exercise.value, date: workoutDate, weight, reps });
    }

    const editId = setIdToEdit;

    const error = journal.saveSets(sets, editId);
    if (error) {
      showError(logForm, formErrors[error], error === 'chooseExercise' ? exercise : undefined);
      return;
    }

    logDialog.close();
    render();
    toast(editId ? 'Set updated' : sets.length === 1 ? 'Set saved' : 'Sets saved');
  });

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const id = button.dataset.id;
    switch (button.dataset.action) {
      case 'exercise':
      case 'add-log-exercise': openExercise(); break;
      case 'rename': openExercise({ id }); break;
      case 'log': openLog({ exerciseId: id }); break;
      case 'edit-set': {
        const set = journal.state.sets.find((item) => item.id === id);
        if (set) openLog({ set });
        break;
      }
      case 'close': requestClose(button.closest('dialog')); break;
      case 'add-set': addSetRow(null, true); break;
      case 'remove-row': {
        const row = button.closest('.set-row');
        const remaining = row.nextElementSibling ?? row.previousElementSibling;
        if (remaining) {
          if (row.querySelector('[aria-invalid="true"]')) showError(logForm);
          row.remove();
          refreshSetLabels();
          remaining.querySelector('input').focus();
          updateUnsaved();
        }
        break;
      }
      case 'delete-set': {
        const set = journal.state.sets.find((item) => item.id === setIdToEdit);
        if (!set) {
          showError(logForm, formErrors.setMissing);
          break;
        }
        byId('delete-summary').textContent = describeSet(set);
        showError(deleteDialog);
        deleteDialog.showModal();
        updateBackButton();
        break;
      }
      case 'cancel-delete': deleteDialog.close(); break;
      case 'keep-editing': discardDialog.close(); break;
      case 'discard':
        discardDialog.close();
        editingDialog()?.close();
        break;
      case 'confirm-delete': {

        const error = journal.deleteSet(setIdToEdit);
        if (error) {
          showError(deleteDialog, formErrors[error]);
          break;
        }

        deleteDialog.close();
        logDialog.close();
        render();
        toast('Set deleted');
        break;
      }
    }
  });

  for (const dialog of [exerciseDialog, logDialog, deleteDialog, discardDialog]) {
    dialog.addEventListener('close', updateBackButton);
  }

  for (const dialog of [exerciseDialog, logDialog]) {
    dialog.addEventListener('close', updateUnsaved);
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      requestClose(dialog);
    });
    for (const type of ['input', 'change']) {
      dialog.addEventListener(type, ({ target }) => {
        if (target.matches('[aria-invalid="true"]')) showError(target.form);
        updateUnsaved();
      });
    }
  }

  return () => {
    const picker = byId('picker-dialog');
    if (picker.open) {
      picker.close();
      return true;
    }
    const top = discardDialog.open ? discardDialog : deleteDialog.open ? deleteDialog : editingDialog();
    if (!top) return false;
    requestClose(top);
    return true;
  };
}
