'use strict';
const output = document.getElementById('output');
const buttons = document.querySelectorAll('[data-action]');
async function runAction(button) {
  const apiKey = window.prompt('Enter a restricted development API key:');
  if (!apiKey) { output.textContent = 'Request cancelled: an API key is required.'; return; }
  buttons.forEach(item => { item.disabled = true; });
  output.textContent = `Submitting ${button.dataset.action}...`;
  try {
    const response = await fetch('/execute', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey }, body: JSON.stringify({ actionType: button.dataset.action, payload: JSON.parse(button.dataset.payload) }) });
    output.textContent = JSON.stringify(await response.json(), null, 2);
  } catch (error) { output.textContent = `Request failed: ${error.message}`; }
  finally { buttons.forEach(item => { item.disabled = false; }); }
}
buttons.forEach(button => button.addEventListener('click', () => runAction(button)));
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/service-worker.js'));