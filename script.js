/* =========================================================
   CONFIG — fill these in. Leave "" to show placeholders.
   ========================================================= */
const CONFIG = {
  substack: "",               // e.g. "https://kdramaticgirls.substack.com"
  spotifyShowId: "",          // part after /show/ in your Spotify share link
  latestEpisodeSpotifyId: "", // part after /episode/
  spotifyUrl: "#",
  appleUrl: "#",
  youtubeMusicUrl: "#",
  formspree: "",              // e.g. "https://formspree.io/f/abcdwxyz" (empty = opens email app)
  email: "hello@kdramaticgirls.com",
  instagram: "#",
  tiktok: "#",
  youtube: "#"
};

/* Episodes: newest FIRST */
const EPISODES = [
  { num: 3, title: "Not All Cool Girls Wear Bikinis", date: "Coming soon", length: "— min", link: "#",
    summary: "On individuality and the pressure to fit one version of cool, pretty, or confident. Is sexualizing yourself empowering, or just another standard dressed up as freedom? We talk about the expectations Korean women face every day, how individuality is treated in Korea, and being unapologetically yourself, bikini or not." },
  { num: 2, title: "Kimbap Is NOT Sushi", date: "Coming soon", length: "— min", link: "#",
    summary: "The Korea we know vs. the Korea the world thinks it knows. We clear up misconceptions, stereotypes, and the moments Korean culture gets mixed up with its neighbors." },
  { num: 1, title: "Not All Sisters Share Blood", date: "Coming soon", length: "— min", link: "#",
    summary: "What it’s really like to live abroad as a Korean: racism, sexism, loneliness, and what independence means to us. And the people we found far from home who became family without sharing a drop of blood." }
];

const COMING_SOON = [
  { title: "Family First, Me Never?", note: "When love and duty start to hurt" },
  { title: "Faith, Maybe?", note: "No state religion, fortune-tellers everywhere" },
  { title: "“Did You Eat?” Is Not About Food", note: "Korea’s love language" },
  { title: "Nunchi: The Superpower Nobody Taught Us", note: "Reading the room, Korean style" }
];

const CURRENTLY = {
  updated: "Last updated: add a date",
  people: [
    { name: "Cat", mood: "Currently feeling: add a mood", items: [
      { kind: "Listening", title: "Lucky Girl Syndrome", by: "ILLIT", note: "Why it’s on repeat" },
      { kind: "Reading",   title: "Book title", by: "Author", note: "One line about it" },
      { kind: "Watching",  title: "Show or film", by: "Where to watch", note: "One line about it" },
      { kind: "Obsessed with",    title: "Anything", by: "", note: "Where you get it" }
    ]},
    { name: "Mandu", mood: "Currently feeling: add a mood", items: [
      { kind: "Listening", title: "Song title", by: "Artist", note: "Why it’s on repeat" },
      { kind: "Reading",   title: "Book title", by: "Author", note: "One line about it" },
      { kind: "Watching",  title: "Show or film", by: "Where to watch", note: "One line about it" },
      { kind: "Obsessed with", title: "Anything", by: "", note: "No gatekeeping" }
    ]}
  ]
};


/* ========================================================= helpers */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = n => String(n).padStart(2, "0");
const store = {
  get(k, f) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch (e) { return f; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ========================================================= intro */
function fitMast() {
  const m = $("#mast"), w = m.parentElement.clientWidth;
  if (!m || !w) return;
  m.style.fontSize = "100px";
  m.style.fontSize = (100 * w / m.scrollWidth) + "px";
}
fitMast();
if (document.fonts) document.fonts.ready.then(fitMast);
window.addEventListener("resize", fitMast);
/* ---------- speed: bake the object shadows ONCE ----------
   CSS filters (drop-shadow / blur) on 11 big images that are also animating get recalculated
   every frame, which is what made the cover laggy. Here every object is drawn one time onto a
   canvas together with its shadows, and that finished picture replaces the <img>.
   Same look, nothing left to calculate while it moves.
   Shadow numbers below are the old CSS ones: [x, y, blur, colour]. L = objects left of the magazine, R = right. */
const SHADOWS = {
  L: [[-14, 22, 22, "rgba(120,28,70,.30)"], [-2, 4, 2, "rgba(90,18,48,.38)"]],
  R: [[14, 22, 22, "rgba(120,28,70,.30)"], [2, 4, 2, "rgba(90,18,48,.38)"]],
  // phones: objects above / below the magazine, so shadows fall away from it
  T: [[0, -20, 22, "rgba(120,28,70,.30)"], [0, -3, 2, "rgba(90,18,48,.38)"]],
  B: [[0, 22, 22, "rgba(120,28,70,.30)"], [0, 4, 2, "rgba(90,18,48,.38)"]]
};
const phoneLayout = () => window.matchMedia("(max-aspect-ratio: 7/10)").matches;
const BAKE_PAD = 80;                       // px of room around each object for its soft shadow
const baked = new Map();                   // canvas -> source image
function paintObject(cv, src, W) {
  const side = (phoneLayout() && (cv.classList.contains("T") || cv.classList.contains("B"))) ? (cv.classList.contains("T") ? "T" : "B") : cv.dataset.side;
  const blur = parseFloat(cv.dataset.blur) || 0;
  const H = W * src.naturalHeight / src.naturalWidth;
  const k = Math.min(Math.min(window.devicePixelRatio || 1, 2), Math.max(src.naturalWidth / W, 1));
  const w = Math.round((W + 2 * BAKE_PAD) * k), h = Math.round((H + 2 * BAKE_PAD) * k);
  const tmp = document.createElement("canvas"); tmp.width = w; tmp.height = h;
  const t = tmp.getContext("2d"); t.imageSmoothingQuality = "high";
  const off = w + 400;                     // draw the picture off-canvas so only its shadow lands inside
  // soft, wide shadow: it is blurry anyway, so make it at 1/4 size (much cheaper) and scale it up
  const q = 0.25, sw = Math.max(Math.round(w * q), 1), sh = Math.max(Math.round(h * q), 1);
  const soft = document.createElement("canvas"); soft.width = sw; soft.height = sh;
  const s = soft.getContext("2d"); s.imageSmoothingQuality = "high";
  const [sx, sy, sb, scol] = SHADOWS[side][0], so = sw + 100;
  s.shadowColor = scol; s.shadowOffsetX = sx * k * q + so; s.shadowOffsetY = sy * k * q; s.shadowBlur = sb * 2 * k * q;
  s.drawImage(src, BAKE_PAD * k * q - so, BAKE_PAD * k * q, W * k * q, H * k * q);
  t.imageSmoothingEnabled = true;
  t.drawImage(soft, 0, 0, w, h);
  // tight contact shadow at full size (small blur, cheap)
  const [cx, cy, cb, ccol] = SHADOWS[side][1];
  t.shadowColor = ccol; t.shadowOffsetX = cx * k + off; t.shadowOffsetY = cy * k; t.shadowBlur = cb * 2 * k;
  t.drawImage(src, BAKE_PAD * k - off, BAKE_PAD * k, W * k, H * k);
  t.shadowColor = "transparent";
  t.drawImage(src, BAKE_PAD * k, BAKE_PAD * k, W * k, H * k);   // the crisp object on top, drawn once
  cv.width = w; cv.height = h;
  const ctx = cv.getContext("2d");
  if (blur && "filter" in ctx) ctx.filter = `blur(${blur * k}px)`;   // soft focus for far corners (skipped where unsupported)
  ctx.drawImage(tmp, 0, 0);
  cv.style.setProperty("--pad", BAKE_PAD + "px");
}
async function bakeObjects() {
  const room = $(".room");
  if (room && getComputedStyle(room).display === "none") return;      // phone layout: objects are off, nothing to bake
  const imgs = $$("#intro img.room-obj:not(.ready)");
  await Promise.all(imgs.map(async img => {
    try {
      await img.decode();
      await new Promise(r => setTimeout(r));   // let the browser draw a frame between objects
      const W = img.offsetWidth;
      const cv = document.createElement("canvas");
      cv.className = img.className + " baked";
      cv.setAttribute("style", img.getAttribute("style") || "");
      cv.setAttribute("aria-hidden", "true");
      cv.dataset.side = img.classList.contains("L") ? "L" : "R";
      cv.dataset.blur = getComputedStyle(img).getPropertyValue("--blur");
      paintObject(cv, img, W);
      img.replaceWith(cv);
      baked.set(cv, img);
      cv.classList.add("ready");
    } catch (e) { img.classList.add("ready", "plain"); }   // if anything fails the plain picture just shows
  }));
}
bakeObjects();
let rebakeTimer;
window.addEventListener("resize", () => {
  clearTimeout(rebakeTimer);
  rebakeTimer = setTimeout(() => {
    if (entered) return;
    bakeObjects();                                                      // e.g. phone turned sideways: objects appear now
    baked.forEach((img, cv) => { const W = cv.offsetWidth - 2 * BAKE_PAD; if (W > 0) paintObject(cv, img, W); });   // skip while hidden (phone upright)
  }, 250);
});
/* ---------- fonts: show the cover only once its fonts are really loaded ---------- */
(function () {
  const root = document.documentElement;
  const done = () => { fitMast(); root.classList.remove("fonts-pending"); };
  if (!document.fonts || !document.fonts.load) return done();
  const sample = "K-Dramatic Girls Kat Mandu & 0123456789 Not all sisters share blood";
  const faces = ['700 1em "Bodoni Moda"', 'italic 600 1em "Bodoni Moda"', '1em "Pinyon Script"', '600 1em "Instrument Sans"', '1em "Instrument Serif"', 'italic 1em "Instrument Serif"', '1em Ranchers'];
  Promise.race([
    Promise.all(faces.map(f => document.fonts.load(f, sample))),
    new Promise(r => setTimeout(r, 2500))          // never wait longer than 2.5s
  ]).then(done, done);
})();
let entered = false;
// while the cover is showing, the site behind it is not reachable by keyboard / screen reader
const behind = [".skip-link", "header.top", "main", "footer"].map(sel => $(sel)).filter(Boolean);
behind.forEach(el => el.inert = true);
// (no auto-focus here, so mouse users don't see a focus ring; the first Tab lands on "Open the issue")
$("#enterBtn").addEventListener("click", () => {
  if (entered) return;
  entered = true;
  behind.forEach(el => el.inert = false);
  $("#intro").setAttribute("aria-hidden", "true");
  setTimeout(() => focusTitle(current), reduceMotion ? 60 : 1250);
  $("#cover").classList.add("open");
  $("#intro").classList.add("gone");
  setTimeout(() => { $("#intro").style.display = "none"; }, reduceMotion ? 50 : 1400);
});

/* ========================================================= router + page turn */
const PAGES = ["home", "about", "episodes", "blog", "currently", "ask", "guestbook", "contact"];
let current = null, busy = false;

const PAGE_NAMES = { home: "Contents", about: "About", episodes: "Episodes", blog: "Blog", currently: "Currently", ask: "Ask us", guestbook: "Guestbook", contact: "Contact" };
function focusTitle(p) {
  const t = $(`#p-${p} .title`);
  if (!t) return;
  t.setAttribute("tabindex", "-1");
  t.focus({ preventScroll: true });
}
function showPage(p) {
  const first = current === null;
  $$(".page").forEach(s => s.classList.toggle("show", s.id === "p-" + p));
  $$("nav.menu a").forEach(a => {
    a.classList.toggle("active", a.dataset.go === p);
    if (a.dataset.go === p) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  document.title = (p === "home" ? "" : PAGE_NAMES[p] + " · ") + "K-Dramatic Girls — A Podcast by Cat & Mandu";
  if (!first && entered) setTimeout(() => focusTitle(p), 0);
  const nav = $("nav.menu"), link = $(`nav.menu a[data-go="${p}"]`);
  if (nav && link) {   // slide the menu so the current tab sits in the middle (measured against the menu itself)
    const nr = nav.getBoundingClientRect(), lr = link.getBoundingClientRect();
    nav.scrollTo({ left: nav.scrollLeft + (lr.left - nr.left) - (nr.width - lr.width) / 2, behavior: reduceMotion ? "auto" : "smooth" });
  }
  window.scrollTo(0, 0);
  current = p;
}
function go(p, push = true) {
  if (!PAGES.includes(p)) p = "home";
  if (p === current || busy) return;
  if (push) { try { history.pushState({ p }, "", "#" + p); } catch (e) {} }
  if (reduceMotion || current === null) { showPage(p); return; }
  busy = true;
  const t = $("#turn");
  // the page turn covers only the magazine spread, not the whole screen
  window.scrollTo(0, 0);
  const sp = $(`#p-${current} .spread`);
  if (sp) {
    const r = sp.getBoundingClientRect();
    Object.assign(t.style, { top: r.top + scrollY + "px", left: r.left + scrollX + "px", width: r.width + "px", height: r.height + "px" });
  }
  // earlier section = flip backwards (left page turns right), later section = flip forwards
  t.classList.toggle("back", PAGES.indexOf(p) < PAGES.indexOf(current));
  t.classList.remove("run"); void t.offsetWidth; t.classList.add("run");
  setTimeout(() => showPage(p), 430);
  setTimeout(() => { t.classList.remove("run"); busy = false; }, 920);
}
document.addEventListener("click", e => {
  const a = e.target.closest("[data-go]");
  if (a) { e.preventDefault(); go(a.dataset.go); }
});
window.addEventListener("popstate", () => go(location.hash.slice(1) || "home", false));

/* tiny sparkle where you click */
document.addEventListener("pointerdown", e => {
  if (reduceMotion || e.target.closest("input,textarea,select,iframe,label")) return;
  const s = document.createElement("span");
  s.className = "pop";
  s.style.left = e.clientX + "px"; s.style.top = e.clientY + "px";
  document.body.appendChild(s);
  setTimeout(() => s.remove(), 700);
});

/* ========================================================= episodes */
function platformButtons() {
  return `<a class="btn dark" href="${esc(CONFIG.spotifyUrl)}" target="_blank" rel="noopener">Spotify</a>
    <a class="btn" href="${esc(CONFIG.appleUrl)}" target="_blank" rel="noopener">Apple Podcasts</a>
    <a class="btn" href="${esc(CONFIG.youtubeMusicUrl)}" target="_blank" rel="noopener">YouTube Music</a>`;
}
function renderLatest() {
  const ep = EPISODES[0]; if (!ep) return;
  $("#latestNum").textContent = "Ep. " + pad(ep.num);
  $("#latestMeta").textContent = "Latest · " + ep.date + " · " + ep.length;
  $("#latestTitle").textContent = ep.title;
  $("#latestSum").textContent = ep.summary;
  $("#latestPlatforms").innerHTML = platformButtons();
  if (CONFIG.latestEpisodeSpotifyId) {
    $("#latestPlayer").innerHTML = `<iframe class="embed" style="height:152px" src="https://open.spotify.com/embed/episode/${encodeURIComponent(CONFIG.latestEpisodeSpotifyId)}?utm_source=generator" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="Latest episode on Spotify"></iframe>`;
  }
}
function renderEpisodes() {
  $("#listen").innerHTML = [
    ["Spotify", CONFIG.spotifyUrl, "Spotify icon"],
    ["Apple Podcasts", CONFIG.appleUrl, "Apple icon"],
    ["YouTube Music", CONFIG.youtubeMusicUrl, "YT Music icon"]
  ].map(([n, u, l]) => `<a href="${esc(u)}" target="_blank" rel="noopener"><b>${n}</b><span class="png-slot" data-label="${l}"></span></a>`).join("");
  $("#showEmbed").innerHTML = CONFIG.spotifyShowId
    ? `<iframe class="embed" style="height:352px" src="https://open.spotify.com/embed/show/${encodeURIComponent(CONFIG.spotifyShowId)}?utm_source=generator" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="K-Dramatic Girls on Spotify"></iframe>`
    : `<div class="notice">Add your Spotify show ID in CONFIG and the full episode player appears here.</div>`;
  $("#epList").innerHTML = EPISODES.map(ep => `
    <article class="ep">
      <div class="num chrome">${pad(ep.num)}</div>
      <div>
        <h3 class="h3">${esc(ep.title)}</h3>
        <div class="meta">${esc(ep.date)} · ${esc(ep.length)} · <a href="${esc(ep.link)}" target="_blank" rel="noopener">Listen</a></div>
        <p>${esc(ep.summary)}</p>
      </div>
    </article>`).join("");
  $("#soon").innerHTML = COMING_SOON.map(s => `<li>${esc(s.title)}<span>${esc(s.note)}</span></li>`).join("");
}

/* ========================================================= blog (Substack RSS) */
const SAMPLE_POSTS = [
  { title: "The first time someone asked if kimbap was sushi", date: "Sample post", excerpt: "Connect your Substack in CONFIG and your real posts replace these automatically.", link: "#", img: "" },
  { title: "Notes on being “the foreigner”", date: "Sample post", excerpt: "Each entry shows the title, date, first lines and cover image of a post.", link: "#", img: "" },
  { title: "A love letter to my found family", date: "Sample post", excerpt: "Clicking an entry opens the full post on Substack.", link: "#", img: "" },
  { title: "What my mom means by “did you eat?”", date: "Sample post", excerpt: "Newest post shows up big on the left page.", link: "#", img: "" }
];
const thumb = (p, label) => p.img ? `<img src="${esc(p.img)}" alt="" loading="lazy">` : `<div class="png-slot" data-label="${label}"></div>`;
function renderPosts(list) {
  const [lead, ...rest] = list;
  $("#leadPost").innerHTML = lead ? `<a class="lead-post" href="${esc(lead.link)}" target="_blank" rel="noopener">
    <div class="thumb">${thumb(lead, "post image")}</div>
    <div class="small">${esc(lead.date)}</div><h3>${esc(lead.title)}</h3><p style="margin:0">${esc(lead.excerpt)}</p></a>` : "";
  $("#postList").innerHTML = rest.slice(0, 5).map(p => `<li><a href="${esc(p.link)}" target="_blank" rel="noopener">
    <div class="thumb">${thumb(p, "image")}</div>
    <div><div class="small">${esc(p.date)}</div><h4>${esc(p.title)}</h4><p>${esc(p.excerpt)}</p></div></a></li>`).join("");
}
async function loadBlog() {
  if (!CONFIG.substack) {
    renderPosts(SAMPLE_POSTS);
    $("#subscribeSlot").innerHTML = `<div class="notice">Add your Substack address in CONFIG to show the subscribe box here.</div>`;
    return;
  }
  const base = CONFIG.substack.replace(/\/$/, "");
  $("#subscribeSlot").innerHTML = `<iframe src="${esc(base)}/embed" title="Subscribe on Substack" scrolling="no"></iframe>`;
  try {
    const r = await fetch("https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(base + "/feed"));
    const data = await r.json();
    if (!data.items || !data.items.length) throw new Error("no posts");
    renderPosts(data.items.map(it => {
      const tmp = document.createElement("div"); tmp.innerHTML = it.description || "";
      const imgEl = tmp.querySelector("img");
      const d = new Date(String(it.pubDate || "").replace(" ", "T"));
      return {
        title: it.title, link: it.link,
        date: isNaN(d) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
        excerpt: (tmp.textContent || "").trim().slice(0, 220),
        img: it.thumbnail || (it.enclosure && it.enclosure.link) || (imgEl ? imgEl.src : "")
      };
    }));
  } catch (e) {
    renderPosts(SAMPLE_POSTS);
    $("#blogNotice").innerHTML = `<div class="notice" style="margin-bottom:16px">Posts didn’t load from Substack. Check the address in CONFIG, or read them at <a href="${esc(base)}" target="_blank" rel="noopener">${esc(base)}</a>.</div>`;
  }
}

/* ========================================================= currently */
function renderCurrently() {
  $("#currSpread").innerHTML = CURRENTLY.people.map((p, i) => `
    <div class="pg">
      <div class="run">${i === 0 ? `<span>K-Dramatic Girls</span><span>Currently</span>` : `<span>Currently, cont.</span><span>Issue 01</span>`}</div>
      ${i === 1 ? `<svg class="deco" style="--s:clamp(40px,4vw,58px);--r:-8deg;top:clamp(60px,5.5vw,84px);right:clamp(18px,4vw,54px)" aria-hidden="true"><use href="#s-sparkle"/></svg>` : ""}
      ${i === 0 ? `<svg class="deco" style="--s:clamp(84px,8.5vw,120px);--r:12deg;top:clamp(56px,5vw,80px);right:clamp(18px,4vw,54px)" aria-hidden="true"><use href="#s-star"/></svg><h2 class="title">Currently obsessed</h2><p class="deck">No gatekeeping. Just what’s on repeat.</p><div class="pearls" aria-hidden="true"></div>` : ""}
      <div class="who"><div class="png-slot" data-label="${esc(p.name)} face"></div><div><h3 class="mname">${esc(p.name)}</h3><div class="small">${esc(p.mood)}</div></div></div>
      ${p.items.map(it => `<div class="item"><div class="png-slot" data-label="cover / photo"></div>
        <div><div class="kind">${esc(it.kind)}</div><h4>${esc(it.title)}</h4><p>${it.by ? esc(it.by) + " · " : ""}${esc(it.note)}</p></div></div>`).join("")}
      ${i === 1 ? `<p class="small" style="margin-top:18px">${esc(CURRENTLY.updated)}</p>` : ""}
      <span class="folio">${pad(10 + i)}</span>
    </div>`).join("");
}

/* ========================================================= forms */
function wireForm(form, subject) {
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const msg = form.querySelector(".form-msg");
    const empty = [...form.querySelectorAll("[required]")].find(el => !el.value.trim());
    if (empty) {
      const lab = form.querySelector(`label[for="${empty.id}"]`);
      msg.className = "form-msg err";
      msg.textContent = "Fill in “" + (lab ? lab.textContent : "this field") + "” to send.";
      empty.focus(); return;
    }
    const fd = new FormData(form);
    if (CONFIG.formspree) {
      msg.className = "form-msg"; msg.textContent = "Sending…";
      try {
        const r = await fetch(CONFIG.formspree, { method: "POST", body: fd, headers: { Accept: "application/json" } });
        if (!r.ok) throw new Error();
        form.reset(); msg.className = "form-msg ok"; msg.textContent = "Sent. Thank you ♡";
      } catch (err) {
        msg.className = "form-msg err"; msg.textContent = "Not sent. Check your connection and try again, or email " + CONFIG.email + ".";
      }
    } else {
      const body = [...fd.entries()].filter(([k]) => !k.startsWith("_")).map(([k, v]) => `${k}: ${v}`).join("\n");
      location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      msg.className = "form-msg ok"; msg.textContent = "Your email app should open with the letter ready to send.";
    }
  });
}

/* ========================================================= guestbook
   Entries are saved in each visitor's own browser (localStorage).
   For one shared guestbook, connect a backend (Firebase/Supabase) and
   replace loadGB() / saveGB(). */
const GB_KEY = "kdg-guestbook", NOW = Date.now();
const GB_SEED = [
  { name: "Cat", mini: "🐱", msg: "Pls be nice to each other here ♡ this is a safe space (with snacks).", ts: NOW - 86400000, secret: false },
  { name: "Mandu", mini: "🥟", msg: "First!! Welcome to our little home on the internet. Leave a note, we read every single one.", ts: NOW - 2 * 86400000, secret: false }
];
const loadGB = () => store.get(GB_KEY, GB_SEED);
const saveGB = l => store.set(GB_KEY, l);
const fmt = ts => { const d = new Date(ts); return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
function renderGB() {
  const list = loadGB();
  $("#gbCount").textContent = list.length + " notes";
  $("#gbList").innerHTML = list.map((g, i) => `
    <div class="gb-entry">
      <div class="gb-head"><span>No. ${list.length - i} · <b>${esc(g.name)}</b></span><span>${fmt(g.ts)}</span></div>
      <div class="gb-row"><div class="gb-mini" aria-hidden="true">${esc(g.mini)}</div>
        ${g.secret ? `<p class="gb-secret">Secret message. Only Cat & Mandu can read it.</p>` : `<p>${esc(g.msg)}</p>`}</div>
    </div>`).join("");
}
$("#gbForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = $("#gbName").value.trim(), msg = $("#gbMsg").value.trim();
  if (!name || !msg) { (name ? $("#gbMsg") : $("#gbName")).focus(); return; }
  const list = loadGB();
  list.unshift({ name, msg, mini: $('input[name="mini"]:checked').value, secret: $("#gbSecret").checked, ts: Date.now() });
  saveGB(list); $("#gbForm").reset(); renderGB();
});
(function counter() {
  const today = new Date().toISOString().slice(0, 10);
  const c = store.get("kdg-counter", { date: today, today: 0, total: 0 });
  if (c.date !== today) { c.date = today; c.today = 0; }
  c.today++; c.total++; store.set("kdg-counter", c);
  $("#cyToday").textContent = c.today;
  $("#cyTotal").textContent = (1004 + c.total).toLocaleString("en-US");
})();
$("#bgmBtn").addEventListener("click", () => {
  const on = $("#bgm").classList.toggle("on");
  $("#bgmBtn").textContent = on ? "❚❚" : "▶";
  $("#bgmBtn").setAttribute("aria-pressed", String(on));
});

/* ========================================================= contact + footer */
function renderContact() {
  $("#contactList").innerHTML = [
    ["Email", CONFIG.email, "mailto:" + CONFIG.email],
    ["Instagram", "@kdramaticgirls", CONFIG.instagram],
    ["TikTok", "@kdramaticgirls", CONFIG.tiktok],
    ["YouTube", "K-Dramatic Girls", CONFIG.youtube]
  ].map(([k, v, u]) => `<li><small>${k}</small><a href="${esc(u)}" target="_blank" rel="noopener">${esc(v)}</a></li>`).join("");
  $("#footLinks").innerHTML = [["Spotify", CONFIG.spotifyUrl], ["Apple Podcasts", CONFIG.appleUrl], ["YouTube Music", CONFIG.youtubeMusicUrl], ["Instagram", CONFIG.instagram]]
    .map(([n, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${n}</a>`).join("");
}

/* ========================================================= init */
renderLatest(); renderEpisodes(); renderCurrently(); renderGB(); renderContact(); loadBlog();
wireForm($("#askForm"), "Mailbag letter for K-Dramatic Girls");
wireForm($("#contactForm"), "Contact — K-Dramatic Girls");
go(location.hash.slice(1) || "home", false);
