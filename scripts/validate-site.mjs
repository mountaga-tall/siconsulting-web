import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import vm from 'node:vm';

const pages = [
  'index.html',
  'solutions.html',
  'fiches-techniques.html',
  'expertise.html',
  'contact.html'
];
const assets = [
  'style.css',
  'script.js',
  'translations.js',
  'manifest.webmanifest',
  'service-worker.js',
  'icon.svg',
  'offline.html',
  'logo.jpg'
];

for (const path of [...pages, ...assets]) {
  assert.ok(existsSync(path), `Required site file is missing: ${path}`);
}
const htmlByPage = new Map(pages.map((path) => [path, readFileSync(path, 'utf8')]));
const css = readFileSync('style.css', 'utf8');
const script = readFileSync('script.js', 'utf8');
const translationsSource = readFileSync('translations.js', 'utf8');
const serviceWorker = readFileSync('service-worker.js', 'utf8');

const translationContext = { window: {} };
vm.runInNewContext(translationsSource, translationContext);
const translations = translationContext.window.SI_TRANSLATIONS;
assert.ok(translations, 'The language dictionary is not available.');
const languages = ['fr', 'en', 'de'];

for (const language of languages) {
  assert.ok(translations[language], `Missing language dictionary: ${language}`);
}

for (const [page, html] of htmlByPage) {
  assert.match(html, /^<!doctype html>/i, `${page} is missing its HTML doctype.`);
  assert.match(html, /<\/body>\s*<\/html>\s*$/i, `${page} is not properly closed.`);
  assert.ok(html.includes('id="main-content"'), `${page} is missing its main landmark.`);
  assert.ok(html.includes('href="manifest.webmanifest"'), `${page} is missing the PWA manifest.`);
  assert.ok(html.includes('src="translations.js"'), `${page} is missing the translation layer.`);
  assert.ok(html.includes('src="script.js"'), `${page} is missing the main script.`);
  assert.ok(html.includes('data-lang="fr"') && html.includes('data-lang="en"') && html.includes('data-lang="de"'), `${page} must expose all three language controls.`);
  assert.ok(html.includes('id="themeToggle"'), `${page} is missing the theme toggle.`);
  assert.ok(html.includes('id="menuToggle"'), `${page} is missing the mobile menu control.`);

  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, new Set(ids).size, `${page} contains duplicate HTML IDs.`);

  const keys = [...new Set([...html.matchAll(/data-i18n="([^"]+)"/g)].map((match) => match[1]))];
  const placeholderKeys = [...new Set([...html.matchAll(/data-i18n-placeholder="([^"]+)"/g)].map((match) => match[1]))];
  for (const language of languages) {
    for (const key of [...keys, ...placeholderKeys]) {
      assert.ok(Object.hasOwn(translations[language], key), `Missing ${language} translation for "${key}" on ${page}.`);
    }
  }
}

for (const [page, html] of htmlByPage) {
  const links = [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
  for (const href of links) {
    if (/^(https?:|mailto:|tel:|javascript:)/i.test(href) || href.startsWith('#')) continue;
    const [path, hash] = href.split('#');
    const targetPage = path.split('?')[0] || page;
    if (targetPage.endsWith('.html')) {
      assert.ok(existsSync(targetPage), `Broken local page link in ${page}: ${href}`);
      if (hash && htmlByPage.has(targetPage)) {
        const targetHtml = htmlByPage.get(targetPage);
        assert.ok(new RegExp('id="' + hash.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"').test(targetHtml), `Broken in-page anchor in ${page}: ${href}`);
      }
    }
  }
}

const manifest = JSON.parse(readFileSync('manifest.webmanifest', 'utf8'));
assert.equal(manifest.display, 'standalone', 'PWA display mode must be standalone.');
assert.equal(manifest.scope, './', 'PWA scope must be relative to the GitHub Pages project.');
assert.ok(manifest.icons.some((icon) => icon.src === './icon.svg'), 'PWA icon is missing from the manifest.');
assert.ok(pages.every((page) => serviceWorker.includes("'./" + page + "'")), 'Service worker must precache all multipage routes.');
assert.ok(serviceWorker.includes('./offline.html'), 'Service worker must include an offline fallback.');
assert.ok(script.includes("register('./service-worker.js', {scope:'./'})"), 'Service worker must use a GitHub Pages-safe relative scope.');
assert.ok(script.includes("localStorage"), 'Language and theme preferences should persist locally.');
assert.ok(script.includes("data-lang"), 'Language switching support is missing.');
assert.ok(script.includes("themeToggle"), 'Theme switching support is missing.');
assert.ok(script.includes('wa.me/22377194647'), 'WhatsApp quote handling is missing.');
assert.ok((css.match(/\{/g) || []).length === (css.match(/\}/g) || []).length, 'CSS braces are unbalanced.');

console.log('Site validation passed: 5 pages, FR/EN/DE translations, theme toggle, mobile menu, quote form and PWA files.');
