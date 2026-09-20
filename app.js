'use strict';
const $ = id => document.getElementById(id);
const C = DorkCore;
const STORAGE_KEY = 'dorkcraft.workspace.v1';
const fieldIds = ['keywords', 'exact', 'exclude', 'orterms', 'after', 'before'];
const tabs = ['builder', 'custom', 'templates', 'library', 'reference'];
let state = { rows: [{ op: 'site:', value: '', enabled: true, exclude: false }], fields: {}, custom: '', scope: '', engine: 'google', tab: 'builder', saved: [], history: [], remember: true };
let storageFailed = false, statusTimer;
function notify(message) {
  $('status').textContent = message;
  $('status').hidden = false;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => { $('status').hidden = true; }, 4500);
}
function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { if (!storageFailed) notify('Tarayıcı depolaması kullanılamıyor. JSON dışa aktararak kayıtlarınızı saklayın.'); storageFailed = true; }
}
function restore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (!s || typeof s !== 'object') throw Error();
    if (Array.isArray(s.rows) && s.rows.length && s.rows.length <= 100 && s.rows.every(r => r && OPERATORS.some(o => o.op === r.op) && typeof r.value === 'string' && r.value.length <= 10000)) state.rows = s.rows;
    for (const key of fieldIds) if (typeof s.fields?.[key] === 'string') state.fields[key] = s.fields[key].slice(0, 10000);
    for (const key of ['custom', 'scope']) if (typeof s[key] === 'string') state[key] = s[key].slice(0, 10000);
    if (['google', 'bing', 'duckduckgo'].includes(s.engine)) state.engine = s.engine;
    if (tabs.includes(s.tab)) state.tab = s.tab;
    state.saved = C.validateRecords(s.saved || []);
    state.history = C.validateRecords(s.history || []).slice(0, 50);
    state.remember = s.remember !== false;
  } catch { notify('Kayıtlı çalışma alanı okunamadı; geçerli alanlarla devam ediliyor.'); }
}
function rawQuery() { return state.tab === 'custom' ? state.custom.trim() : C.buildQuery(state.rows, state.fields); }
function finalQuery(raw = rawQuery()) { return C.scoped(raw, state.scope); }
function update() {
  let query = '', issues = [], scopeError = false;
  try { query = finalQuery(); issues = C.analyze(query); C.domains(state.scope); }
  catch (e) { issues = [e.message]; scopeError = true; }
  $('scope').setAttribute('aria-invalid', String(scopeError));
  $('outputBox').textContent = query || '— dork ifadesi burada görünecek —';
  $('outputBox').classList.toggle('empty', !query);
  $('queryStats').textContent = `${query.length} KARAKTER`;
  $('diagnostics').replaceChildren(...issues.map(message => element('li', '', message)));
  for (const id of ['searchBtn', 'copyBtn', 'copyLinkBtn', 'saveBtn', 'editBtn']) $(id).disabled = !query || scopeError;
  $('searchBtn').textContent = `${{ google: 'GOOGLE', bing: 'BING', duckduckgo: 'DUCKDUCKGO' }[state.engine]}'DA ARA`;
  $('editBtn').hidden = state.tab === 'custom';
  persist();
}
function element(tag, className, text) {
  const el = document.createElement(tag); el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
function button(text, action, className = 'dork-btn') {
  const el = element('button', className, text); el.type = 'button'; el.addEventListener('click', action); return el;
}
function switchTab(tab) {
  state.tab = tab;
  document.querySelectorAll('.tab').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tab);
    if (el.dataset.tab === tab) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current');
  });
  document.querySelectorAll('.tab-content').forEach(el => el.classList.toggle('active', el.id === `tab-${tab}`));
  $('outputPanel').hidden = !['builder', 'custom'].includes(tab);
  if (tab === 'templates') renderTemplates();
  if (tab === 'library') renderLibrary();
  update();
}
function renderRows() {
  $('opRows').replaceChildren();
  state.rows.forEach((row, i) => {
    const div = element('div', 'op-row');
    const enabled = element('input', 'row-toggle'); enabled.type = 'checkbox'; enabled.checked = row.enabled !== false; enabled.setAttribute('aria-label', `Operatör ${i + 1} etkin`);
    enabled.addEventListener('change', () => { row.enabled = enabled.checked; update(); });
    const select = element('select', 'op-select'); select.setAttribute('aria-label', `Operatör ${i + 1}`);
    OPERATORS.forEach(o => { const opt = element('option', '', o.op); opt.value = o.op; select.append(opt); }); select.value = row.op;
    const input = element('input', 'input'); input.value = row.value; input.setAttribute('aria-label', `Operatör ${i + 1} değeri`); input.placeholder = OPERATORS.find(o => o.op === row.op)?.placeholder || 'değer';
    select.addEventListener('change', () => { row.op = select.value; input.placeholder = OPERATORS.find(o => o.op === row.op)?.placeholder || 'değer'; update(); });
    input.addEventListener('input', () => { row.value = input.value; update(); });
    const negate = button(row.exclude ? 'HARİÇ' : 'DAHİL', () => { row.exclude = !row.exclude; negate.textContent = row.exclude ? 'HARİÇ' : 'DAHİL'; negate.setAttribute('aria-pressed', String(row.exclude)); update(); }, 'btn-remove negate');
    negate.setAttribute('aria-label', `Operatör ${i + 1} hariç tut`); negate.setAttribute('aria-pressed', String(!!row.exclude));
    const remove = button('Sil', () => { state.rows.splice(i, 1); if (!state.rows.length) state.rows.push({ op: 'site:', value: '' }); renderRows(); update(); }, 'btn-remove');
    remove.setAttribute('aria-label', `Operatör ${i + 1} sil`);
    div.append(enabled, select, input, negate, remove); $('opRows').append(div);
  });
}
async function copy(text) {
  if (!text) return;
  try { await navigator.clipboard.writeText(text); notify('Panoya kopyalandı.'); }
  catch {
    const area = element('textarea', 'clipboard-fallback'); area.value = text; document.body.append(area); area.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch {} area.remove();
    notify(ok ? 'Panoya kopyalandı.' : 'Panoya erişilemedi. Çıktıyı seçip elle kopyalayın.');
  }
}
function openSearch(query) {
  if (!query) return;
  if (query.length > 10000) { notify('Sorgu 10.000 karakter sınırını aşıyor. Sorguyu küçültün.'); return; }
  window.open(C.searchURL(query, state.engine), '_blank', 'noopener,noreferrer');
  if (state.remember) {
    state.history = [{ name: new Date().toLocaleString('tr-TR'), query }, ...state.history.filter(r => r.query !== query)].slice(0, 50);
    persist();
  }
}
function save(query, name = '') {
  if (!query) return;
  if (query.length > 10000) { notify('Bir kayıtta en fazla 10.000 karakter olabilir.'); return; }
  if (state.saved.some(r => r.query === query)) { notify('Bu sorgu zaten kayıtlı.'); return; }
  if (state.saved.length >= 500) { notify('500 kayıt sınırına ulaşıldı.'); return; }
  state.saved.unshift({ name: name.trim().slice(0,120) || query.slice(0,80), query }); persist(); notify('Sorgu kaydedildi.');
}
function loadQuery(query, resolved = false) {
  state.custom = query; $('customInput').value = query;
  if (resolved) { state.scope = ''; $('scope').value = ''; }
  switchTab('custom'); $('customInput').focus();
}
function guarded(action) { try { action(); } catch (e) { notify(e.message); } }
function renderTemplates() {
  const filter = $('templateSearch').value.trim().toLocaleLowerCase('tr');
  const category = $('categoryFilter').value;
  const grid = $('templatesGrid'); grid.replaceChildren(); let total = 0;
  TEMPLATES.forEach(cat => {
    if (category && category !== cat.category) return;
    const items = cat.items.filter(item => `${cat.category} ${item.name} ${item.dork}`.toLocaleLowerCase('tr').includes(filter));
    if (!items.length) return; total += items.length;
    const card = element('div', 'cat-card'); const heading = element('div', 'cat-header', cat.category); heading.style.color = cat.color; card.append(heading);
    items.forEach(item => {
      const row = element('div', 'dork-item'); const actions = element('div', 'dork-actions');
      actions.append(button('kopyala', () => guarded(() => copy(finalQuery(item.dork)))), button('ara', () => guarded(() => openSearch(finalQuery(item.dork))), 'dork-btn search'), button('düzenle', () => loadQuery(item.dork)), button('kaydet', () => guarded(() => save(finalQuery(item.dork), item.name))));
      row.append(element('div', 'dork-name', item.name), element('div', 'dork-code', item.dork), actions); card.append(row);
    }); grid.append(card);
  });
  $('templateCount').textContent = total ? `${total} şablon / Etkin kapsam eylemlere uygulanır.` : 'Eşleşen şablon yok. Aramayı veya kategori filtresini değiştirin.';
}
function renderLibrary() {
  const filter = $('librarySearch').value.toLocaleLowerCase('tr').trim();
  for (const [key, target] of [['saved', 'savedList'], ['history', 'historyList']]) {
    $(target).replaceChildren();
    const records = state[key].filter(r => key === 'history' || `${r.name} ${r.query}`.toLocaleLowerCase('tr').includes(filter));
    if (!records.length) $(target).append(element('p', 'hint', key === 'saved' ? 'Gösterilecek kayıt yok. Oluşturduğunuz sorguyu kaydedin veya JSON içe aktarın.' : 'Arama geçmişi boş.'));
    records.forEach(record => {
      const row = element('div', 'dork-item'); const actions = element('div', 'dork-actions');
      actions.append(button('aç', () => loadQuery(record.query, true)), button('kopyala', () => copy(record.query)), button('ara', () => { openSearch(record.query); renderLibrary(); }), button('sil', () => { state[key] = state[key].filter(r => r !== record); persist(); renderLibrary(); }));
      if (key === 'history') actions.append(button('kaydet', () => { save(record.query); renderLibrary(); }));
      row.append(element('div', 'dork-name', record.name), element('div', 'dork-code', record.query), actions); $(target).append(row);
    });
  }
}
function exportRecords() {
  const blob = new Blob([JSON.stringify({ version: 1, records: state.saved }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const a = element('a', ''); a.href = url; a.download = 'dorkcraft-kayitlar.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); notify(`${state.saved.length} kayıt dışa aktarıldı.`);
}
async function importRecords(file) {
  if (!file) return;
  try {
    if (file.size > 2 * 1024 * 1024) throw Error('Dosya en fazla 2 MB olabilir.');
    const data = JSON.parse(await file.text());
    if (data?.version !== 1) throw Error('Desteklenmeyen dosya sürümü. DorkCraft sürüm 1 JSON dosyası seçin.');
    const records = C.validateRecords(data.records);
    const combined = [...state.saved]; let added = 0;
    for (const r of records) if (!combined.some(existing => existing.query === r.query)) { combined.push(r); added++; }
    if (combined.length > 500) throw Error('İçe aktarma 500 kayıt sınırını aşıyor. Önce kayıtları azaltın.');
    state.saved = combined; persist(); renderLibrary(); notify(`${added} kayıt eklendi; tekrarlar atlandı.`);
  } catch (e) { notify(`İçe aktarılamadı: ${e.message}`); }
  finally { $('importFile').value = ''; }
}
restore();
for (const id of fieldIds) { $(id).value = state.fields[id] || ''; $(id).addEventListener('input', () => { state.fields[id] = $(id).value; update(); }); }
for (const [id, key] of [['scope', 'scope'], ['customInput', 'custom'], ['engine', 'engine']]) { $(id).value = state[key]; $(id).addEventListener('input', () => { state[key] = $(id).value; update(); }); }
$('rememberHistory').checked = state.remember;
$('rememberHistory').addEventListener('change', () => { state.remember = $('rememberHistory').checked; persist(); });
document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
$('addRowBtn').addEventListener('click', () => { if (state.rows.length >= 100) return notify('En fazla 100 operatör eklenebilir.'); state.rows.push({ op: 'inurl:', value: '' }); renderRows(); update(); $('opRows').lastElementChild.querySelector('.input').focus(); });
$('searchBtn').addEventListener('click', () => guarded(() => openSearch(finalQuery())));
$('copyBtn').addEventListener('click', () => guarded(() => copy(finalQuery())));
$('copyLinkBtn').addEventListener('click', () => guarded(() => copy(C.searchURL(finalQuery(), state.engine))));
$('editBtn').addEventListener('click', () => loadQuery(rawQuery()));
$('saveBtn').addEventListener('click', () => guarded(() => save(finalQuery(), $('saveName').value)));
$('clearBtn').addEventListener('click', () => {
  if (state.tab === 'custom') { state.custom = ''; $('customInput').value = ''; }
  else { state.rows = [{ op: 'site:', value: '' }]; state.fields = {}; fieldIds.forEach(id => { $(id).value = ''; }); renderRows(); }
  $('saveName').value = ''; update();
});
TEMPLATES.forEach(cat => { const opt = element('option', '', cat.category); opt.value = cat.category; $('categoryFilter').append(opt); });
$('templateSearch').addEventListener('input', renderTemplates); $('categoryFilter').addEventListener('change', renderTemplates);
$('librarySearch').addEventListener('input', renderLibrary);
$('exportBtn').addEventListener('click', exportRecords);
$('importBtn').addEventListener('click', () => $('importFile').click());
$('importFile').addEventListener('change', () => importRecords($('importFile').files[0]));
$('clearHistoryBtn').addEventListener('click', () => { state.history = []; persist(); renderLibrary(); });
const reference = [...OPERATORS, ...EXTRA_REF];
reference.forEach(item => { const card = element('div', 'ref-card'); card.append(element('div', 'ref-op', item.op), element('div', 'ref-desc', item.desc), element('div', 'ref-eg', item.eg || item.placeholder || '')); $('refGrid').append(card); });
document.addEventListener('keydown', e => {
  if (!(e.ctrlKey || e.metaKey) || !['builder', 'custom'].includes(state.tab)) return;
  if (e.key === 'Enter') { e.preventDefault(); if (!$('searchBtn').disabled) $('searchBtn').click(); }
  if (e.shiftKey && e.key.toLowerCase() === 's') { e.preventDefault(); if (!$('saveBtn').disabled) $('saveBtn').click(); }
});
renderRows(); switchTab(state.tab);
