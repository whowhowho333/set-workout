export function createJournal(storage) {
  let state = { exercises: [], sets: [] };

  function commit(change) {
    try {
      const next = storage.read();
      const error = change(next);
      if (error) return error;
      storage.write(next);
      state = next;
    } catch {
      return 'storageError';
    }
  }

  return {
    get state() { return state; },
    reload() {
      state = storage.read();
    },
    saveExercise(id, input) {
      const name = input.trim().replace(/\s+/gu, ' ');
      if (!name) return 'nameRequired';
      return commit(({ exercises }) => {
        const normalized = name.toLocaleLowerCase('ru');
        if (exercises.some((item) => item.id !== id && item.name.toLocaleLowerCase('ru') === normalized)) {
          return 'duplicateExercise';
        }
        const existing = exercises.find((item) => item.id === id);
        if (existing) existing.name = name;
        else exercises.push({ id, name });
      });
    },
    saveSets(sets, editId = null) {
      return commit((next) => {
        if (sets.some((set) => !next.exercises.some((item) => item.id === set.exerciseId))) return 'chooseExercise';
        if (!editId) {
          next.sets.push(...sets);
          return;
        }
        const index = next.sets.findIndex((set) => set.id === editId);
        if (index < 0) return 'setMissing';
        next.sets[index] = sets[0];
      });
    },
    deleteSet(id) {
      return commit((next) => {
        next.sets = next.sets.filter((set) => set.id !== id);
      });
    },
  };
}
