'use strict';

const messages = {
  en: {
    prototype: 'Prototype', developmentTitle: 'Development Environment', developmentBody: 'Actions and outcomes are simulated recommendations. Do not enter personal, classified, or operational data.',
    workflowsEyebrow: 'Authorized workflows', actionsTitle: 'Action Catalogue', breachAction: 'Breach Response', impactAction: 'Impact Assessment', riskAction: 'Risk Model', oversightAction: 'Oversight Review', rightsAction: 'Rights & Remedy',
    authorizationTitle: 'Development Authorization', selectAction: 'Select an action before submitting.', selectedAction: 'Selected action: {action}', tokenLabel: 'Short-Lived Identity Token', tokenHelp: 'The token remains in this page only for the current request.', envelopeLabel: 'A2SPA-R Authorization Envelope', envelopeHelp: 'Paste a valid externally issued JSON envelope. Never paste a private key.', submitAction: 'Submit Authorized Action',
    evidenceEyebrow: 'Execution evidence', resultTitle: 'Result', initialResult: 'No action has been submitted.', serviceTitle: 'Review, Appeal & Manual Service', serviceBody: 'This prototype cannot accept a real appeal or provide a manual service route. A deploying institution must publish accessible contact, correction, human-review, appeal, and non-digital service channels before use.',
    online: 'Online. Authorized requests can be submitted.', offline: 'Offline. Actions are unavailable; use the institution\'s published manual service route.', tokenRequired: 'Enter a short-lived identity token.', envelopeRequired: 'Enter an externally issued authorization envelope.', envelopeInvalid: 'The authorization envelope must be valid JSON. Check the envelope and retry.', actionRequired: 'Select an action from the catalogue.', submitting: 'Submitting authorized action\u2026', requestFailed: 'The request could not be completed. Check connectivity and retry.', responseFailed: 'The service rejected the request. Review the reason code and contact the institution\'s published support or appeal channel.', completed: 'The simulated action completed. Review the receipt and reason codes below.'
  },
  fr: {
    prototype: 'Prototype', developmentTitle: 'Environnement de developpement', developmentBody: 'Les actions et resultats sont des recommandations simulees. Ne saisissez aucune donnee personnelle, classifiee ou operationnelle.',
    workflowsEyebrow: 'Flux autorises', actionsTitle: 'Catalogue des actions', breachAction: 'Reponse aux incidents', impactAction: 'Evaluation des impacts', riskAction: 'Modele de risque', oversightAction: 'Controle reglementaire', rightsAction: 'Droits et recours',
    authorizationTitle: 'Autorisation de developpement', selectAction: 'Selectionnez une action avant de soumettre.', selectedAction: 'Action selectionnee : {action}', tokenLabel: 'Jeton d\'identite de courte duree', tokenHelp: 'Le jeton reste uniquement dans cette page pendant la requete.', envelopeLabel: 'Enveloppe d\'autorisation A2SPA-R', envelopeHelp: 'Collez une enveloppe JSON valide emise par un service externe. Ne collez jamais de cle privee.', submitAction: 'Soumettre l\'action autorisee',
    evidenceEyebrow: 'Preuve d\'execution', resultTitle: 'Resultat', initialResult: 'Aucune action n\'a ete soumise.', serviceTitle: 'Revision, recours et service manuel', serviceBody: 'Ce prototype ne peut accepter un recours reel ni fournir un service manuel. Avant utilisation, l\'institution doit publier des canaux accessibles de contact, correction, revision humaine, recours et service non numerique.',
    online: 'En ligne. Les requetes autorisees peuvent etre soumises.', offline: 'Hors ligne. Les actions sont indisponibles; utilisez le service manuel publie par l\'institution.', tokenRequired: 'Saisissez un jeton d\'identite de courte duree.', envelopeRequired: 'Saisissez une enveloppe d\'autorisation emise par un service externe.', envelopeInvalid: 'L\'enveloppe doit etre un JSON valide. Verifiez-la puis reessayez.', actionRequired: 'Selectionnez une action dans le catalogue.', submitting: 'Soumission de l\'action autorisee\u2026', requestFailed: 'La requete a echoue. Verifiez la connexion puis reessayez.', responseFailed: 'Le service a refuse la requete. Consultez le code de motif et le canal de soutien ou de recours publie par l\'institution.', completed: 'L\'action simulee est terminee. Consultez le recu et les codes de motif ci-dessous.'
  }
};

const form = document.getElementById('authorization-form');
const output = document.getElementById('output');
const buttons = [...document.querySelectorAll('[data-action]')];
const tokenInput = document.getElementById('identity-token');
const envelopeInput = document.getElementById('authorization-envelope');
const tokenError = document.getElementById('token-error');
const envelopeError = document.getElementById('envelope-error');
const selectedAction = document.getElementById('selected-action');
const connectionStatus = document.getElementById('connection-status');
const language = document.getElementById('language');
let actionButton = null;
let locale = navigator.languages && navigator.languages.some(value => value.toLowerCase().startsWith('fr')) ? 'fr' : 'en';

function text(key, values = {}) {
  return Object.entries(values).reduce((value, [name, replacement]) => value.replace(`{${name}}`, replacement), messages[locale][key]);
}

function applyLocale() {
  document.documentElement.lang = locale;
  language.value = locale;
  document.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = text(element.dataset.i18n); });
  if (actionButton) selectedAction.textContent = text('selectedAction', { action: actionButton.textContent });
  updateConnection();
}

function updateConnection() {
  connectionStatus.textContent = navigator.onLine ? text('online') : text('offline');
}

function selectAction(button) {
  actionButton = button;
  buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  selectedAction.textContent = text('selectedAction', { action: button.textContent });
  tokenInput.focus();
}

function validate() {
  tokenError.textContent = tokenInput.value.trim() ? '' : text('tokenRequired');
  envelopeError.textContent = envelopeInput.value.trim() ? '' : text('envelopeRequired');
  tokenInput.setAttribute('aria-invalid', String(Boolean(tokenError.textContent)));
  envelopeInput.setAttribute('aria-invalid', String(Boolean(envelopeError.textContent)));
  if (!actionButton) {
    selectedAction.textContent = text('actionRequired');
    buttons[0].focus();
    return null;
  }
  if (!tokenInput.value.trim()) { tokenInput.focus(); return null; }
  if (!envelopeInput.value.trim()) { envelopeInput.focus(); return null; }
  try { return JSON.parse(envelopeInput.value); }
  catch {
    envelopeError.textContent = text('envelopeInvalid');
    envelopeInput.setAttribute('aria-invalid', 'true');
    envelopeInput.focus();
    return null;
  }
}

async function submitAction(event) {
  event.preventDefault();
  const authorization = validate();
  if (!authorization) return;
  const token = tokenInput.value;
  buttons.forEach(button => { button.disabled = true; });
  form.querySelector('button[type="submit"]').disabled = true;
  output.textContent = text('submitting');
  try {
    const response = await fetch('/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ actionType: actionButton.dataset.action, payload: JSON.parse(actionButton.dataset.payload), authorization })
    });
    const body = await response.json();
    output.textContent = `${response.ok ? text('completed') : text('responseFailed')}\n\n${JSON.stringify(body, null, 2)}`;
    output.focus();
  } catch {
    output.textContent = text('requestFailed');
    output.focus();
  } finally {
    tokenInput.value = '';
    buttons.forEach(button => { button.disabled = false; });
    form.querySelector('button[type="submit"]').disabled = false;
  }
}

buttons.forEach(button => {
  button.setAttribute('aria-pressed', 'false');
  button.addEventListener('click', () => selectAction(button));
});
language.addEventListener('change', () => { locale = language.value; applyLocale(); });
form.addEventListener('submit', submitAction);
window.addEventListener('online', updateConnection);
window.addEventListener('offline', updateConnection);
applyLocale();

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/service-worker.js'));