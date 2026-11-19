const telegram = window.Telegram?.WebApp;
export const insideTelegram = Boolean(telegram?.platform && telegram.platform !== 'unknown');
const telegramUser = telegram?.initDataUnsafe?.user?.id;
export const journalOwner = insideTelegram ? telegramUser ?? 'telegram' : 'browser';

export function setBackButtonVisible(visible) {
  if (!insideTelegram || !telegram.BackButton) return;
  if (visible) telegram.BackButton.show();
  else telegram.BackButton.hide();
}

export function notifySuccess() {
  if (insideTelegram) telegram.HapticFeedback?.notificationOccurred('success');
}

export function setClosingConfirmation(enabled) {
  if (!insideTelegram || !telegram.isVersionAtLeast('6.2')) return;
  if (enabled) telegram.enableClosingConfirmation();
  else telegram.disableClosingConfirmation();
}

export function initializeTelegram(onBack) {
  telegram.ready();
  telegram.expand();
  if (telegram.isVersionAtLeast('6.9')) {
    telegram.setHeaderColor('#f5f5ef');
    telegram.setBackgroundColor('#f5f5ef');
  }
  telegram.BackButton?.onClick(onBack);
}
