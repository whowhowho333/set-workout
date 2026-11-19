export function localJournalStorage(key, storage) {
  return {
    read() {
      const saved = (storage ?? globalThis.localStorage).getItem(key);
      if (saved === null) return { exercises: [], sets: [] };
      const journal = JSON.parse(saved);
      if (!Array.isArray(journal?.exercises) || !Array.isArray(journal.sets)) {
        throw new Error('Invalid workout journal');
      }
      return journal;
    },
    write(journal) {
      (storage ?? globalThis.localStorage).setItem(key, JSON.stringify(journal));
    },
  };
}
