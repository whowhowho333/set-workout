import { createJournal } from './js/journal/journal.js';
import { localJournalStorage } from './js/journal/storage.js';
import { journalOwner, insideTelegram, initializeTelegram, setBackButtonVisible } from './js/platform/telegram.js';
import { byId, toast, initializeExercisePicker } from './js/ui/components.js';
import { initializeDialogs } from './js/ui/dialogs.js';
import { renderPage } from './js/ui/screens.js';

const storageKey = `set.training.v1.${journalOwner}`;
const journal = createJournal(localJournalStorage(storageKey));
const pages = ['today', 'exercises', 'history'];
let page;
const main = byId('main-content');
const historyFilter = byId('history-filter');

function render() {
  const active = document.activeElement;
  const action = main.contains(active) ? active.dataset.action : null;
  const exerciseId = new URLSearchParams(location.search).get('exercise') ?? '';
  renderPage(page, journal.state, exerciseId);
  if (action && !active.isConnected) {
    const replacement = [...main.querySelectorAll('[data-action]')].find(
      (button) => !button.closest('[hidden]') && button.dataset.action === action && button.dataset.id === active.dataset.id,
    );
    (replacement ?? main).focus({ preventScroll: true });
  }
}

function updateBackButton() {
  setBackButtonVisible(page !== 'today' || Boolean(document.querySelector('dialog[open]')));
}

function showPage(requested) {
  const next = pages.includes(requested) ? requested : 'today';
  const changed = page && next !== page;
  page = next;
  for (const candidate of pages) byId(`page-${candidate}`).hidden = candidate !== page;
  for (const link of document.querySelectorAll('.nav a')) {
    if (link.hash === `#${page}`) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  render();
  updateBackButton();
  if (changed) {
    if (!document.querySelector('dialog[open]')) byId(`page-${page}`).querySelector('h1').focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
}

function reloadJournal() {
  try {
    journal.reload();
  } catch {
    toast('Could not open your workout log.', false);
  }
}

reloadJournal();
initializeExercisePicker();
const closeTopDialog = initializeDialogs(journal, render, updateBackButton);
document.querySelector('.skip-link').addEventListener('click', (event) => {
  event.preventDefault();
  main.focus();
  main.scrollIntoView({ block: 'start' });
});
historyFilter.addEventListener('change', () => {
  const url = new URL(location.href);
  if (historyFilter.value) url.searchParams.set('exercise', historyFilter.value);
  else url.searchParams.delete('exercise');
  history.replaceState(history.state, '', url);
  render();
});
window.addEventListener('storage', (event) => {
  if (event.key === null || event.key === storageKey) {
    reloadJournal();
    render();
  }
});
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) render();
});

if (insideTelegram) {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (link && pages.includes(link.hash.slice(1)) && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      showPage(link.hash.slice(1));
    }
  });
  initializeTelegram(() => {
    if (!closeTopDialog()) showPage('today');
  });
  showPage('today');
} else {
  const fromHash = () => showPage(location.hash.slice(1));
  window.addEventListener('hashchange', fromHash);
  fromHash();
}
