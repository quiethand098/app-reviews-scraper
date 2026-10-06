import { Actor } from 'apify';

await Actor.init();
const input = (await Actor.getInput()) || {};
const apple = (input.appStoreApps || []).map((s) => String(s).match(/id?(\d{5,})/)?.[1]).filter(Boolean);
const play = (input.googlePlayApps || []).map((s) => String(s).match(/[?&]id=([\w.]+)/)?.[1] || String(s).trim()).filter((s) => /^[\w.]+$/.test(s));
const countries = (input.countries?.length ? input.countries : ['us']).map((c) => c.toLowerCase());
const lang = input.language || 'en';
const max = input.maxReviewsPerApp || 100;
const lo = input.minRating || 1, hi = input.maxRating || 5;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const get = async (url, opts = {}) => {
  for (let i = 0; i < 3; i++) {
    try { const r = await fetch(url, { ...opts, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0', ...(opts.headers || {}) }, signal: AbortSignal.timeout(30000) }); if (r.ok) return r; } catch { /* retry */ }
    await sleep(1000 * (i + 1));
  }
  return null;
};
const ok = (rating) => rating >= lo && rating <= hi;

for (const id of apple) {
  let name = null;
  const meta = await get(`https://itunes.apple.com/lookup?id=${id}&country=${countries[0]}`);
  if (meta) name = (await meta.json()).results?.[0]?.trackName || null;
  for (const cc of countries) {
    let n = 0;
    for (let page = 1; page <= 10 && n < max; page++) {
      const r = await get(`https://itunes.apple.com/${cc}/rss/customerreviews/page=${page}/id=${id}/sortby=mostrecent/json`);
      if (!r) break;
      let entries = (await r.json()).feed?.entry || [];
      if (!Array.isArray(entries)) entries = [entries];
      entries = entries.filter((e) => e['im:rating']);
      if (!entries.length) break;
      for (const e of entries) {
        const rating = +e['im:rating'].label;
        if (!ok(rating) || n >= max) continue;
        n++;
        await Actor.pushData({ store: 'app_store', appId: id, appName: name, country: cc, reviewId: e.id.label, author: e.author?.name?.label,
          rating, title: e.title?.label, text: e.content?.label, version: e['im:version']?.label, date: e.updated?.label,
          voteCount: +e['im:voteCount']?.label || 0, url: `https://apps.apple.com/${cc}/app/id${id}` });
      }
    }
    console.log(`app store ${id} ${cc}: ${n} reviews`);
  }
}

for (const pkg of play) {
  let token = null, n = 0;
  const sort = input.sort === 'helpful' ? 1 : 2;
  while (n < max) {
    const inner = JSON.stringify([null, null, [2, sort, [Math.min(150, max), null, token], null, []], [pkg, 7]]);
    const body = 'f.req=' + encodeURIComponent(JSON.stringify([[['UsvDTd', inner, null, 'generic']]]));
    const r = await get(`https://play.google.com/_/PlayStoreUi/data/batchexecute?hl=${lang}&gl=${countries[0]}`, { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' } });
    if (!r) break;
    let d;
    try { d = JSON.parse(JSON.parse((await r.text()).split('\n')[2])[0][2]); } catch { break; }
    const list = d?.[0] || [];
    if (!list.length) break;
    for (const x of list) {
      const rating = x[2];
      if (!ok(rating) || n >= max) continue;
      n++;
      await Actor.pushData({ store: 'google_play', appId: pkg, country: countries[0], reviewId: x[0], author: x[1]?.[0], rating, text: x[4],
        date: x[5]?.[0] ? new Date(x[5][0] * 1000).toISOString() : null, thumbsUp: x[6] || 0, version: x[10] || null,
        replyText: x[7]?.[1] || null, replyDate: x[7]?.[2]?.[0] ? new Date(x[7][2][0] * 1000).toISOString() : null, url: `https://play.google.com/store/apps/details?id=${pkg}` });
    }
    token = d?.[1]?.[1];
    if (!token) break;
  }
  console.log(`google play ${pkg}: ${n} reviews`);
}
await Actor.exit();
