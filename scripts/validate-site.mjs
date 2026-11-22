import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const script = readFileSync('script.js', 'utf8');
const requiredFiles = ['style.css', 'script.js', 'logo.jpg'];
for (const file of requiredFiles) {
  assert.ok(existsSync(file), `Fichier requis manquant : ${file}`);
}

assert.match(html, /^<!doctype html>/i, 'Le document doit commencer par un doctype HTML.');
assert.match(html, /<\/body>\s*<\/html>\s*$/i, 'Le document HTML doit se terminer avec les balises body et html.');
assert.match(html, /<main\b[^>]*id="main-content"/i, 'La zone principale accessible est absente.');

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const idSet = new Set(ids);
assert.equal(ids.length, idSet.size, 'Des identifiants HTML sont dupliqués.');

const requiredIds = [
  'main-content', 'navbar', 'menuToggle', 'navLinks', 'year',
  'particlesCanvas', 'quoteForm', 'name', 'phone', 'country',
  'productSelect', 'whatsappLine', 'message', 'emailSubmitBtn',
  'formStatus', 'cursorGlow', 'devis', 'solutions', 'specifications', 'expertise'
];
for (const id of requiredIds) {
  assert.ok(idSet.has(id), `Élément HTML requis absent : #${id}`);
}

const internalLinks = [...html.matchAll(/\bhref="#([^"]+)"/g)].map((match) => match[1]);
for (const target of internalLinks) {
  assert.ok(idSet.has(target), `Lien interne sans destination : #${target}`);
}

const tabButtons = [...html.matchAll(/<button\b([^>]*\bdata-tab="([^"]+)"[^>]*)>/g)];
assert.ok(tabButtons.length >= 2, 'Les onglets des fiches techniques sont absents.');
for (const [, attributes, panelId] of tabButtons) {
  assert.ok(idSet.has(panelId), `Panneau d’onglet absent : #${panelId}`);
  assert.match(attributes, new RegExp('aria-controls="' + panelId + '"'), `aria-controls ne correspond pas à #${panelId}`);
  assert.match(html, new RegExp('<[^>]+id="' + panelId + '"[^>]*role="tabpanel"'), `Panneau non déclaré comme tabpanel : #${panelId}`);
}

const productValues = new Set(
  [...html.matchAll(/<option\b[^>]*\bvalue="([^"]+)"/g)].map((match) => match[1])
);
const selectableProducts = [
  ...[...html.matchAll(/<article\b[^>]*\bdata-product="([^"]+)"/g)].map((match) => match[1]),
  ...[...html.matchAll(/<button\b[^>]*\bdata-product="([^"]+)"/g)].map((match) => match[1])
];
for (const product of selectableProducts) {
  assert.ok(productValues.has(product), `Produit prérempli absent de la liste du formulaire : ${product}`);
}

assert.match(html, /id="quoteForm"/, 'Le formulaire de devis est absent.');
assert.match(script, /quoteForm\.reportValidity\(\)/, 'La validation native du formulaire est absente.');
assert.match(script, /encodeURIComponent\(buildQuoteMessage\(data\)\)/, 'Le message WhatsApp doit être encodé dans son ensemble.');
assert.match(script, /aria-expanded/, 'Le menu mobile doit exposer son état accessible.');
assert.match(html, /target="_blank"[^>]*rel="noopener noreferrer"/, 'Un lien externe ouvert dans un nouvel onglet doit protéger window.opener.');

console.log('Validation du site réussie : contenu complet, ancres, onglets, formulaire, scripts et ressources vérifiés.');
