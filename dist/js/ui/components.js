import { notifySuccess } from '../platform/telegram.js';

export const byId = (id) => document.getElementById(id);
let toastTimer;

export function element(tag, className, label) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (label) node.textContent = label;
  return node;
}

export function icon(name) {
  const node = element('i', `icon icon-${name}`);
  node.setAttribute('aria-hidden', 'true');
  return node;
}

export function actionButton(className, action, label, iconName, id) {
  const button = element('button', className, iconName ? '' : label);
  button.type = 'button';
  button.dataset.action = action;
  if (id) button.dataset.id = id;
  if (iconName) {
    button.append(icon(iconName));
    button.setAttribute('aria-label', label);
    button.title = label;
  }
  return button;
}

export function emptyState(iconName, title, description, action, label) {
  const block = element('div', 'empty');
  block.append(icon(iconName), element('strong', '', title), element('p', '', description));
  if (action) block.append(actionButton('text-button', action, label));
  return block;
}

export function exerciseOptions(exercises, select, includeAll = false, selected = select.value) {
  const options = exercises.map(({ id, name }) => new Option(name, id));
  if (includeAll) options.unshift(new Option('All exercises', ''));
  select.replaceChildren(...options);
  if (options.some((option) => option.value === selected)) select.value = selected;
}

export function showError(container, message = '', field) {
  const previous = container.querySelector('[aria-invalid="true"]');
  const inlineId = `${container.id}-field-error`;
  if (previous) {
    previous.removeAttribute('aria-invalid');
    const next = previous.getAttribute('aria-describedby').split(/\s+/).filter((id) => id !== inlineId);
    if (next.length) previous.setAttribute('aria-describedby', next.join(' '));
    else previous.removeAttribute('aria-describedby');
  }
  byId(inlineId)?.remove();

  const error = container.querySelector('.form-error');
  error.classList.toggle('visually-hidden', Boolean(field));
  error.textContent = message;
  if (!field) return;

  const inline = element('p', 'field-error', message);
  inline.id = inlineId;
  field.closest('.field, .set-row').append(inline);
  field.setAttribute('aria-invalid', 'true');
  const hint = field.getAttribute('aria-describedby');
  field.setAttribute('aria-describedby', hint ? `${hint} ${inlineId}` : inlineId);
  field.focus();
}

export function toast(message, success = true) {
  const status = byId('toast');
  status.textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { status.textContent = ''; }, 3800);
  if (success) notifySuccess();
}
