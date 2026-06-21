import { FULL_URL_MAX_LENGTH } from '@url-shortener/shared';
import { PENDING_URL_QUERY_PARAM } from './landing.constants';

export function renderLandingShortenScript(): string {
  return `
(function () {
  var form = document.getElementById('hero-shorten-form');
  if (!form) return;

  var input = document.getElementById('hero-shorten-input');
  var error = document.getElementById('hero-shorten-error');
  var myLinksUrl = form.getAttribute('data-my-links-url') || '/my-links';
  var urlParam = form.getAttribute('data-url-param') || '${PENDING_URL_QUERY_PARAM}';
  var maxUrlLength = ${FULL_URL_MAX_LENGTH};
  var invalidMessage = 'Enter a valid URL, like https://example.com/page';

  function isValidHostname(hostname) {
    if (!hostname) return false;

    var lower = hostname.toLowerCase();
    if (lower === 'localhost') return true;
    if (/^\\d{1,3}(\\.\\d{1,3}){3}$/.test(hostname)) return true;
    if (hostname.indexOf('.') === -1) return false;

    var labels = hostname.split('.');
    for (var i = 0; i < labels.length; i += 1) {
      if (!labels[i] || labels[i].length > 63) return false;
    }

    if (labels[labels.length - 1].length < 2) return false;

    return (
      /^[a-z0-9.-]+$/i.test(hostname) &&
      hostname.charAt(0) !== '.' &&
      hostname.charAt(hostname.length - 1) !== '.'
    );
  }

  function normalizeUrl(value) {
    var trimmed = value.trim();
    if (!trimmed || trimmed.length > maxUrlLength) return null;

    var withProtocol = /^https?:\\/\\//i.test(trimmed)
      ? trimmed
      : 'https://' + trimmed;

    try {
      var parsed = new URL(withProtocol);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
      if (!isValidHostname(parsed.hostname)) return null;
      return parsed.toString();
    } catch (_) {
      return null;
    }
  }

  function buildDestination(basePath, normalizedUrl) {
    var params = new URLSearchParams();
    params.set(urlParam, normalizedUrl);
    return basePath + '?' + params.toString();
  }

  function showError(message) {
    error.hidden = false;
    error.textContent = message;
    input.setCustomValidity(message);
    input.reportValidity();
  }

  function clearError() {
    error.hidden = true;
    error.textContent = '';
    input.setCustomValidity('');
  }

  input.addEventListener('input', clearError);

  input.addEventListener('blur', function () {
    if (!input.value.trim()) {
      clearError();
      return;
    }

    if (!normalizeUrl(input.value)) {
      showError(invalidMessage);
    }
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    if (!input.value.trim()) {
      showError('Enter a URL to shorten');
      input.focus();
      return;
    }

    var normalized = normalizeUrl(input.value);
    if (!normalized) {
      showError(invalidMessage);
      input.focus();
      return;
    }

    clearError();
    window.location.href = buildDestination(myLinksUrl, normalized);
  });
})();
`.trim();
}
