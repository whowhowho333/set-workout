function cleanName(name) {
  return name.trim().replace(/\s+/gu, ' ');
}

function copyBlocks(blocks) {
  return blocks.map(({ name, entries }) => ({
    id: crypto.randomUUID(),
    name,
    entries: entries.map(({ exerciseId }) => ({ id: crypto.randomUUID(), exerciseId })),
  }));
}

export function workoutEntries(workout) {
  return workout?.blocks.flatMap((block) => block.entries) ?? [];
}

export function workoutActions(commit) {
  function changeActive(id, change) {
    return commit((state) => {
      if (state.activeWorkout?.id !== id) return 'workoutMissing';
      return change(state.activeWorkout, state);
    });
  }

  return {
    startWorkout(name, templateId) {
      return commit((state) => {
        if (state.activeWorkout) return 'workoutActive';
        const template = state.templates?.find(({ id }) => id === templateId);
        if (templateId && !template) return 'templateMissing';
        const blocks = template?.blocks ?? [{ name: 'Exercises', entries: [] }];
        state.activeWorkout = {
          id: crypto.randomUUID(),
          name: template?.name ?? (cleanName(name) || 'Workout'),
          blocks: copyBlocks(blocks),
        };
      });
    },
    saveBlock(workoutId, name, blockId) {
      const title = cleanName(name);
      if (!title) return 'nameRequired';
      return changeActive(workoutId, (workout) => {
        if (!blockId) {
          workout.blocks.push({ id: crypto.randomUUID(), name: title, entries: [] });
          return;
        }
        const block = workout.blocks.find(({ id }) => id === blockId);
        if (!block) return 'blockMissing';
        block.name = title;
      });
    },
    addWorkoutExercise(workoutId, blockId, exerciseId) {
      return changeActive(workoutId, (workout, state) => {
        const block = workout.blocks.find(({ id }) => id === blockId);
        if (!block) return 'blockMissing';
        if (!state.exercises.some(({ id }) => id === exerciseId)) return 'chooseExercise';
        if (block.entries.some((entry) => entry.exerciseId === exerciseId)) return 'exerciseInBlock';
        block.entries.push({ id: crypto.randomUUID(), exerciseId });
      });
    },
    removeWorkoutExercise(workoutId, entryId) {
      return changeActive(workoutId, (workout, state) => {
        const block = workout.blocks.find(({ entries }) => entries.some(({ id }) => id === entryId));
        if (!block) return 'workoutEntryMissing';
        if (state.sets.some(({ workoutEntryId }) => workoutEntryId === entryId)) return 'entryHasSets';
        block.entries = block.entries.filter(({ id }) => id !== entryId);
      });
    },
    saveTemplate(workoutId, name) {
      const title = cleanName(name);
      if (!title) return 'nameRequired';
      return changeActive(workoutId, (workout, state) => {
        if (!workoutEntries(workout).length) return 'templateEmpty';
        const templates = state.templates ??= [];
        if (templates.some((template) => template.name.toLowerCase() === title.toLowerCase())) {
          return 'templateDuplicate';
        }
        templates.push({ id: crypto.randomUUID(), name: title, blocks: copyBlocks(workout.blocks) });
      });
    },
    removeTemplate(templateId) {
      return commit((state) => {
        if (!state.templates?.some(({ id }) => id === templateId)) return 'templateMissing';
        state.templates = state.templates.filter(({ id }) => id !== templateId);
      });
    },
    finishWorkout(workoutId) {
      return changeActive(workoutId, (workout, state) => {
        if (state.sets.some(({ workoutId: id }) => id === workoutId)) (state.workouts ??= []).push(workout);
        delete state.activeWorkout;
      });
    },
  };
}
