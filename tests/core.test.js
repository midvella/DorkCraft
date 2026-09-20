'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../core.js');

test('builder quotes phrases, exclusions and OR terms without changing raw keywords', () => {
  assert.equal(C.buildQuery([{op:'intitle:',value:'annual report'}, {op:'site:',value:'example.com',exclude:true}, {op:'inurl:',value:'ignored',enabled:false}], {keywords:'research', exact:'"climate change"', exclude:'old version, spam, spam', orterms:'public data, report, report',after:'2025-01-01'}), 'intitle:"annual report" -site:example.com research "climate change" -"old version" -spam ("public data" OR report) after:2025-01-01');
});
test('allin operators retain separate words and identical operators deduplicate', () => {
  assert.equal(C.buildQuery([{op:'allintitle:',value:'annual report'}, {op:'filetype:',value:'pdf'}, {op:'filetype:',value:'pdf'}]), 'allintitle:annual report filetype:pdf');
});
test('scope normalizes URLs and groups all alternatives', () => {
  assert.deepEqual(C.domains('https://EXAMPLE.com/path, example.com docs.example.com'), ['example.com', 'docs.example.com']);
  assert.equal(C.scoped('report OR paper', 'example.com, docs.example.com'), '(site:example.com OR site:docs.example.com) (report OR paper)');
  assert.equal(C.scoped('', 'example.com'), '');
});
test('invalid scope cannot silently widen a query', () => {
  for (const s of ['javascript:alert(1)', 'https://user:pass@example.com', 'example..com', '-example.com', 'example-.com', 'https://example.com:1234']) assert.throws(() => C.domains(s));
});
test('diagnostics catch malformed syntax and date ranges', () => {
  for (const q of ['"unterminated', ')(', 'site: example.com', '(OR report)', 'report OR', 'after:2026-02-30', 'after:2026-04-01 before:2026-01-01']) assert.ok(C.analyze(q).length, q);
  assert.deepEqual(C.analyze('site:example.com intitle:"report (draft)" after:2025-01-01 before:2026-01-01'), []);
  assert.deepEqual(C.analyze('"site: OR )"'), []);
});
test('search URLs encode syntax and Unicode and restrict engine origins', () => {
  const query = 'site:example.com "araştırma & rapor"';
  for (const engine of ['google', 'bing', 'duckduckgo', 'javascript:alert(1)']) {
    const url = new URL(C.searchURL(query, engine)); assert.equal(url.searchParams.get('q'), query); assert.equal(url.protocol,'https:');
  }
});
test('import validation is bounded and does not accept partial malformed files', () => {
  assert.deepEqual(C.validateRecords([{name:' Rapor ',query:' filetype:pdf ',extra:'ignored'}]), [{name:'Rapor',query:'filetype:pdf'}]);
  for (const data of [null, {}, [{name:'x',query:''}], [{name:'ok',query:'valid'}, {name:'bad',query:3}], Array(501).fill({name:'x',query:'x'})]) assert.throws(() => C.validateRecords(data));
});
