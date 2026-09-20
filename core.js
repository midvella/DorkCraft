(function (root) {
  'use strict';
  const phrase = value => {
    const clean = value.trim().replace(/^"|"$/g, '').replace(/"/g, '');
    return /\s/.test(clean) ? `"${clean}"` : clean;
  };
  const list = value => [...new Set(value.split(',').map(v => v.trim()).filter(Boolean))];
  function buildQuery(rows, fields = {}) {
    const parts = rows.filter(r => r.enabled !== false && r.value.trim()).map(r => {
      const value = r.value.trim();
      const formatted = r.op.startsWith('allin') ? value : phrase(value);
      return `${r.exclude ? '-' : ''}${r.op}${formatted}`;
    });
    if (fields.keywords?.trim()) parts.push(fields.keywords.trim());
    if (fields.exact?.trim()) parts.push(`"${fields.exact.trim().replace(/"/g, '')}"`);
    list(fields.exclude || '').forEach(v => parts.push(`-${phrase(v)}`));
    const ors = list(fields.orterms || '').map(phrase);
    if (ors.length) parts.push(ors.length > 1 ? `(${ors.join(' OR ')})` : ors[0]);
    if (fields.after) parts.push(`after:${fields.after}`);
    if (fields.before) parts.push(`before:${fields.before}`);
    return [...new Set(parts)].join(' ');
  }
  function domains(value) {
    return [...new Set(value.split(/[\s,]+/).filter(Boolean).map(v => {
      const url = new URL(v.includes('://') ? v : `https://${v}`);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port || !/^[a-z0-9.-]+$/i.test(url.hostname) || url.hostname.length > 253 || !url.hostname.replace(/\.$/, '').split('.').every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label))) throw Error('Kapsama geçerli alan adları girin: example.com, docs.example.com');
      return url.hostname.toLowerCase().replace(/\.$/, '');
    }))];
  }
  function scoped(query, scope) {
    const sites = domains(scope);
    if (!sites.length || !query.trim()) return query.trim();
    const group = sites.map(s => `site:${s}`).join(' OR ');
    return `${sites.length > 1 ? `(${group})` : group} (${query.trim()})`;
  }
  function analyze(query) {
    const issues = [];
    let quoted = false, depth = 0, invalid = false;
    for (const c of query) {
      if (c === '"') quoted = !quoted;
      if (!quoted && c === '(') depth++;
      if (!quoted && c === ')' && --depth < 0) invalid = true;
    }
    if (quoted) issues.push('Kapatılmamış çift tırnak var.');
    if (depth !== 0 || invalid) issues.push('Parantezler dengeli değil.');
    const outside = query.replace(/"[^"\n]*"/g, '"değer"');
    if (/\b[a-z]+:(?=\s|$|\))/i.test(outside)) issues.push('Bir operatörün değeri boş veya iki noktadan sonra boşluk var.');
    if (/\b(cache|link|related|info|numrange):/i.test(outside)) issues.push('Eski veya desteği belirsiz operatör var; sonucu arama motorunda doğrulayın.');
    if (/(?:^|\()\s*OR\b|\bOR\s*(?:$|\))|\bOR\s+OR\b/.test(outside)) issues.push('OR ifadesinin iki tarafında da terim olmalı.');
    const dates = {};
    for (const m of outside.matchAll(/\b(after|before):([^\s)]+)/g)) {
      const v = m[2];
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v)) || new Date(v).toISOString().slice(0,10) !== v) issues.push(`${m[1]} için YYYY-AA-GG biçiminde geçerli bir tarih kullanın.`);
      else dates[m[1]] = v;
    }
    if (dates.after && dates.before && dates.after >= dates.before) issues.push('Başlangıç tarihi bitiş tarihinden önce olmalı.');
    if (query.length > 2000) issues.push('Sorgu çok uzun; daha küçük sorgulara ayırmayı düşünün.');
    return [...new Set(issues)];
  }
  const engines = { google: 'https://www.google.com/search', bing: 'https://www.bing.com/search', duckduckgo: 'https://duckduckgo.com/' };
  function searchURL(query, engine = 'google') {
    const url = new URL(engines[engine] || engines.google);
    url.searchParams.set('q', query);
    return url.href;
  }
  function validateRecords(records) {
    if (!Array.isArray(records) || records.length > 500) throw Error('En fazla 500 kayıt içeren bir liste bekleniyor.');
    return records.map(r => {
      if (!r || typeof r.name !== 'string' || !r.name.trim() || r.name.length > 120 || typeof r.query !== 'string' || !r.query.trim() || r.query.length > 10000) throw Error('Kayıtlarda geçersiz ad veya sorgu var.');
      return { name: r.name.trim(), query: r.query.trim() };
    });
  }
  const api = { phrase, buildQuery, domains, scoped, analyze, searchURL, validateRecords };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DorkCore = api;
})(globalThis);
