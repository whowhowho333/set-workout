import test from 'node:test';
import assert from 'node:assert/strict';
import { createJournal } from '../dist/js/journal/journal.js';
import { localJournalStorage } from '../dist/js/journal/storage.js';

test('opens a v1 journal and preserves existing records when editing sets', () => {
  const key = 'set.training.v1.browser';
  const exercise = { id: 'old', name: 'Присед' };
  const set = { id: 'first', exerciseId: 'old', weight: 42.5, reps: 8, date: '2026-01-15' };
  const entries = new Map([[key, JSON.stringify({ exercises: [exercise], sets: [set] })]]);
  const storage = {
    getItem: (name) => entries.get(name) ?? null,
    setItem: (name, value) => entries.set(name, value),
  };
  const journal = createJournal(localJournalStorage(key, storage));
  journal.reload();
  assert.deepEqual(journal.state.sets, [set]);
  assert.equal(journal.saveExercise('other', '  ПРИСЕД  '), 'duplicateExercise');
  assert.equal(journal.saveExercise('old', 'Back squat'), undefined);
  const second = { ...set, id: 'second', reps: 6 };
  const third = { ...set, id: 'third', reps: 4 };
  assert.equal(journal.saveSets([second, third]), undefined);
  assert.equal(journal.saveSets([{ ...second, weight: 45 }], 'second'), undefined);
  assert.equal(journal.deleteSet('third'), undefined);
  const reopened = createJournal(localJournalStorage(key, storage));
  reopened.reload();
  assert.deepEqual(reopened.state, {
    exercises: [{ id: 'old', name: 'Back squat' }],
    sets: [set, { ...second, weight: 45 }],
  });
});

test('a failed write leaves the last loaded state intact', () => {
  const journal = createJournal({
    read: () => ({ exercises: [], sets: [] }),
    write() { throw new Error('Storage full'); },
  });
  journal.reload();
  assert.equal(journal.saveExercise('new', 'Squat'), 'storageError');
  assert.deepEqual(journal.state, { exercises: [], sets: [] });
});
