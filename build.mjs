// Fabrique le site dans dist/ à partir de site.json et des dossiers games/<nom>/.
// Aucune dépendance : node build.mjs
//
// Pages (français à la racine, anglais sous /en/) :
//   /                         accueil du studio
//   /<jeu>/                   page d'un jeu ou d'une appli
//   /<jeu>/privacy/           sa politique de confidentialité (URL à donner à Google Play)
//   /mentions-legales/        /en/legal/
//   /confidentialite/         /en/privacy/      (confidentialité du site lui-même)

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const OUT = 'dist';
const site = JSON.parse(readFileSync('site.json', 'utf8'));
const games = readdirSync('games', { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith('_') && existsSync(join('games', d.name, 'game.json')))
  .map((d) => ({ dir: join('games', d.name), ...JSON.parse(readFileSync(join('games', d.name, 'game.json'), 'utf8')) }))
  .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const year = new Date().getFullYear();

const T = {
  fr: {
    games: 'Jeux & applis', studio: 'Studio', contact: 'Contact', other: 'EN', otherLabel: 'English',
    legal: 'Mentions légales', sitePrivacy: 'Confidentialité du site', privacy: 'Confidentialité',
    ourGames: 'Nos jeux et applis', soon: 'Bientôt', available: 'Disponible', inDev: 'En développement',
    soonOn: (s) => `Bientôt sur ${s}`, getOn: (s) => `Télécharger sur ${s}`, discover: 'Découvrir',
    seed: 'Le prochain projet est en train de germer.', write: 'Une question, une idée, un bug ? Écrivez-nous.',
    about: 'Le studio', privacyOf: (n) => `${n} — Politique de confidentialité`, updated: 'Mise à jour',
    otherLang: 'English version', support: 'Assistance', back: 'Tous nos jeux', shots: 'Aperçu',
    skip: 'Aller au contenu', notFound: 'Page introuvable', notFoundText: "Cette page n'existe pas, ou plus.", home: "Retour à l'accueil",
    kindGame: 'Jeu', kindApp: 'Appli',
  },
  en: {
    games: 'Games & apps', studio: 'Studio', contact: 'Contact', other: 'FR', otherLabel: 'Français',
    legal: 'Legal notice', sitePrivacy: 'Website privacy', privacy: 'Privacy',
    ourGames: 'Our games and apps', soon: 'Coming soon', available: 'Available', inDev: 'In development',
    soonOn: (s) => `Coming soon to ${s}`, getOn: (s) => `Get it on ${s}`, discover: 'Discover',
    seed: 'The next project is sprouting.', write: 'A question, an idea, a bug? Write to us.',
    about: 'The studio', privacyOf: (n) => `${n} — Privacy policy`, updated: 'Updated',
    otherLang: 'Version française', support: 'Support', back: 'All our games', shots: 'Screenshots',
    skip: 'Skip to content', notFound: 'Page not found', notFoundText: 'This page does not exist, or no longer does.', home: 'Back to home',
    kindGame: 'Game', kindApp: 'App',
  },
};

// Chemins des pages : clé -> { fr, en } (dossiers, sans slash au début).
const PATHS = {
  home: { fr: '', en: 'en/' },
  legal: { fr: 'mentions-legales/', en: 'en/legal/' },
  sitePrivacy: { fr: 'confidentialite/', en: 'en/privacy/' },
};
for (const g of games) {
  PATHS[g.slug] = { fr: `${g.slug}/`, en: `en/${g.slug}/` };
  PATHS[`${g.slug}:privacy`] = { fr: `${g.slug}/privacy/`, en: `en/${g.slug}/privacy/` };
}

/** Lien relatif d'une page vers une autre (le site marche aussi hors de la racine d'un domaine). */
function href(fromPath, toPath) {
  const depth = fromPath.split('/').filter(Boolean).length;
  return ('../'.repeat(depth) || './') + toPath;
}
const media = (g, file) => `media/${g.slug}/${file}`;

function statusLabel(g, t) {
  if (g.status === 'available') return t.available;
  if (g.status === 'in-development') return t.inDev;
  return t.soon;
}

function layout({ lang, key, title, description, body, bodyClass = '', style = '', image, jsonld }) {
  const t = T[lang];
  const path = PATHS[key][lang];
  const other = lang === 'fr' ? 'en' : 'fr';
  const to = (k, l = lang) => href(path, PATHS[k][l]);
  const r = (p) => href(path, p);
  const canonical = `${site.url}/${path}`;
  const og = image ? `${site.url}/${image}` : `${site.url}/static/img/og.png`;
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="fr" href="${site.url}/${PATHS[key].fr}">
<link rel="alternate" hreflang="en" href="${site.url}/${PATHS[key].en}">
<link rel="alternate" hreflang="x-default" href="${site.url}/${PATHS[key].fr}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${og}">
<meta property="og:locale" content="${lang === 'fr' ? 'fr_FR' : 'en_US'}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#f2ede3">
<link rel="icon" href="${r('static/img/logo.svg')}" type="image/svg+xml">
<link rel="icon" href="${r('static/img/icon-192.png')}" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="${r('static/img/apple-touch-icon.png')}">
<link rel="preload" href="${r('static/fonts/jost-latin-400-normal.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${r('static/style.css')}">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
</head>
<body class="${bodyClass}"${style ? ` style="${style}"` : ''}>
<a class="skip" href="#main">${t.skip}</a>
<header class="site-header"><div class="wrap">
  <a class="brand" href="${to('home')}"><img src="${r('static/img/logo.svg')}" alt="" width="36" height="36"><span>${esc(site.name)}</span></a>
  <nav class="site-nav" aria-label="${t.games}">
    <a class="opt" href="${to('home')}#games">${t.games}</a>
    <a class="opt" href="${to('home')}#studio">${t.studio}</a>
    <a href="${to('home')}#contact">${t.contact}</a>
    <a class="lang" href="${to(key, other)}" hreflang="${other}" lang="${other}" aria-label="${t.otherLabel}">${t.other}</a>
  </nav>
</div></header>
<main id="main">
${body}
</main>
<footer class="site-footer"><div class="wrap">
  <a class="brand" href="${to('home')}"><img src="${r('static/img/logo.svg')}" alt="" width="26" height="26"><span>© ${site.since === year ? year : `${site.since}–${year}`} ${esc(site.publisher)}</span></a>
  <nav aria-label="${t.legal}">
    <a href="mailto:${site.email}">${site.email}</a>
    <a href="${to('legal')}">${t.legal}</a>
    <a href="${to('sitePrivacy')}">${t.sitePrivacy}</a>
    <a href="${to(key, other)}" hreflang="${other}" lang="${other}">${t.otherLang}</a>
  </nav>
</div></footer>
</body>
</html>
`;
}

function write(path, html) {
  const file = join(OUT, path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

// ---------- Accueil ----------

function homePage(lang) {
  const t = T[lang];
  const s = site[lang];
  const path = PATHS.home[lang];
  const cards = games
    .map((g) => {
      const c = g[lang];
      const th = g.theme || {};
      const feature = g.feature?.[lang];
      return `<a class="card" href="${href(path, PATHS[g.slug][lang])}" style="--card-paper:${th.paper};--card-ink:${th.ink};--card-soft:${th.soft}">
  ${feature ? `<div class="card-art"><img src="${href(path, media(g, feature))}" alt="" loading="lazy" width="1024" height="500"></div>` : ''}
  <div class="card-body"><img src="${href(path, media(g, g.icon))}" alt="" width="56" height="56">
    <div><h3>${esc(g.name)}</h3><p>${esc(c.short)}</p><span class="pill">${g.kind === 'app' ? t.kindApp : t.kindGame} · ${statusLabel(g, t)}</span></div></div>
</a>`;
    })
    .join('\n');
  const body = `<section class="hero"><div class="wrap">
  <p class="eyebrow">${esc(site.publisher)}</p>
  <h1>${esc(s.tagline)}</h1>
  <p class="lead">${esc(s.intro)}</p>
  <div class="hero-art" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
</div></section>
<section id="games"><div class="wrap">
  <h2>${t.ourGames}</h2>
  <div class="cards">
${cards}
  <div class="card seed"><img src="${href(path, 'static/img/logo.svg')}" alt=""><p>${t.seed}</p></div>
  </div>
</div></section>
<section id="studio"><div class="wrap">
  <h2>${t.about}</h2>
  ${s.about.map((p) => `<p class="lead">${esc(p)}</p>`).join('\n  ')}
  <div class="values">${s.values.map(([h, p]) => `<div><h3>${esc(h)}</h3><p class="muted">${esc(p)}</p></div>`).join('')}</div>
</div></section>
<section id="contact"><div class="wrap">
  <h2>${t.contact}</h2>
  <p class="lead">${t.write}</p>
  <a class="contact-mail" href="mailto:${site.email}">${site.email}</a>
</div></section>`;
  return layout({
    lang,
    key: 'home',
    title: `${site.name} — ${s.tagline}`,
    description: s.intro,
    body,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: site.publisher,
      url: site.url,
      logo: `${site.url}/static/img/icon-512.png`,
      email: site.email,
    },
  });
}

// ---------- Page d'un jeu ----------

const PLAY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3.5v17l14-8.5z" fill="currentColor"/></svg>';

function gamePage(g, lang) {
  const t = T[lang];
  const c = g[lang];
  const path = PATHS[g.slug][lang];
  const th = g.theme || {};
  const buttons = (g.platforms || [])
    .map((p) =>
      p.url
        ? `<a class="btn" href="${esc(p.url)}" rel="noopener">${PLAY_ICON}${t.getOn(esc(p.store))}</a>`
        : `<span class="btn soon">${t.soonOn(esc(p.store))}</span>`,
    )
    .join(' ');
  const body = `<section class="game-hero"><div class="wrap">
  <div>
    <div class="game-id"><img src="${href(path, media(g, g.icon))}" alt="" width="76" height="76"><div><h1>${esc(g.name)}</h1><div class="sub">${esc(g.subtitle || '')}</div></div></div>
    <h2>${esc(c.tagline)}</h2>
    <p class="lead">${esc(c.short)}</p>
    <ul class="facts">${c.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
    ${buttons}
  </div>
  ${g.poster ? `<img class="poster" src="${href(path, media(g, g.poster))}" alt="${esc(g.name)}" width="1080" height="1440">` : ''}
</div></section>
<section><div class="wrap">
  ${c.description.map((p) => `<p class="lead">${esc(p)}</p>`).join('\n  ')}
  <div class="features">${c.features.map(([h, p]) => `<div><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`).join('')}</div>
</div></section>
${g.screenshots?.length ? `<section><div class="wrap">
  <h2>${t.shots}</h2>
  <div class="shots">${g.screenshots.map((s) => `<figure><img src="${href(path, media(g, s.src))}" alt="${esc(s[lang])}" loading="lazy" width="1080" height="1920"><figcaption>${esc(s[lang])}</figcaption></figure>`).join('')}</div>
  ${c.note ? `<p class="muted">${esc(c.note)}</p>` : ''}
</div></section>` : ''}
<section><div class="wrap">
  <div class="game-links">
    <a href="mailto:${site.email}?subject=${encodeURIComponent(g.name)}">${t.support} : ${site.email}</a>
    <a href="${href(path, PATHS[`${g.slug}:privacy`][lang])}">${t.privacy}</a>
    <a href="${href(path, PATHS.home[lang])}#games">${t.back}</a>
  </div>
</div></section>`;
  return layout({
    lang,
    key: g.slug,
    title: `${g.name}${g.subtitle ? ': ' + g.subtitle : ''} — ${site.name}`,
    description: c.short,
    body,
    bodyClass: 'game',
    style: `--g-accent:${th.accent};--g-paper:${th.paper};--g-ink:${th.ink}`,
    image: g.feature?.[lang] ? media(g, g.feature[lang]) : undefined,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': g.kind === 'app' ? 'MobileApplication' : 'VideoGame',
      name: g.subtitle ? `${g.name}: ${g.subtitle}` : g.name,
      description: c.short,
      operatingSystem: 'Android',
      applicationCategory: g.kind === 'app' ? 'Application' : 'Game',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      publisher: { '@type': 'Organization', name: site.publisher, url: site.url },
      image: `${site.url}/${media(g, g.icon)}`,
      inLanguage: 'fr',
    },
  });
}

function gamePrivacyPage(g, lang) {
  const t = T[lang];
  const key = `${g.slug}:privacy`;
  const content = readFileSync(join(g.dir, `privacy.${lang}.html`), 'utf8');
  const date = new Date(g.privacyUpdated + 'T12:00:00Z').toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const body = `<section><div class="wrap doc">
  <p class="eyebrow"><a href="${href(PATHS[key][lang], PATHS[g.slug][lang])}">${esc(g.name)}</a></p>
  <h1>${t.privacyOf(esc(g.name))}</h1>
  <p class="meta">${t.updated} : ${date}</p>
  ${content}
</div></section>`;
  return layout({ lang, key, title: `${t.privacyOf(g.name)} — ${site.name}`, description: t.privacyOf(g.name), body });
}

// ---------- Mentions légales et confidentialité du site ----------

const LEGAL = {
  fr: `<h1>Mentions légales</h1>
<h2>Éditeur</h2>
<p>${esc(site.publisher)}<br>Contact : <a href="mailto:${site.email}">${site.email}</a></p>
<h2>Hébergement</h2>
<p>GitHub Pages — GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis — <a href="https://github.com">github.com</a></p>
<h2>Propriété intellectuelle</h2>
<p>Les jeux, applications, textes, images et logos présentés sur ce site appartiennent à ${esc(site.publisher)}, sauf mention contraire. La police Jost est distribuée sous licence SIL Open Font License 1.1.</p>
<h2>Marques</h2>
<p>Google Play est une marque de Google LLC.</p>`,
  en: `<h1>Legal notice</h1>
<h2>Publisher</h2>
<p>${esc(site.publisher)}<br>Contact: <a href="mailto:${site.email}">${site.email}</a></p>
<h2>Hosting</h2>
<p>GitHub Pages — GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, United States — <a href="https://github.com">github.com</a></p>
<h2>Intellectual property</h2>
<p>The games, apps, texts, images and logos on this website belong to ${esc(site.publisher)} unless stated otherwise. The Jost typeface is distributed under the SIL Open Font License 1.1.</p>
<h2>Trademarks</h2>
<p>Google Play is a trademark of Google LLC.</p>`,
};
const SITE_PRIVACY = {
  fr: `<h1>Confidentialité du site</h1>
<p>Ce site ne dépose aucun cookie, n'utilise aucun outil de mesure d'audience, aucune publicité et aucun formulaire. Les polices et images sont servies depuis ce site, sans service tiers.</p>
<p>Comme tout hébergeur, GitHub peut enregistrer des données techniques de connexion (adresse IP, navigateur) pour assurer la sécurité et le fonctionnement du service : voir la <a href="https://docs.github.com/fr/site-policy/privacy-policies/github-general-privacy-statement">déclaration de confidentialité de GitHub</a>.</p>
<p>Si vous nous écrivez à <a href="mailto:${site.email}">${site.email}</a>, votre adresse et votre message servent uniquement à vous répondre. Vous pouvez demander leur suppression à tout moment.</p>
<p>Chaque jeu ou application a sa propre politique de confidentialité, accessible depuis sa page.</p>`,
  en: `<h1>Website privacy</h1>
<p>This website sets no cookies and uses no analytics, advertising or forms. Fonts and images are served from this website, with no third-party service.</p>
<p>Like any host, GitHub may record technical connection data (IP address, browser) to keep the service secure and running: see <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">GitHub's privacy statement</a>.</p>
<p>If you write to <a href="mailto:${site.email}">${site.email}</a>, your address and message are used only to reply to you. You can ask for them to be deleted at any time.</p>
<p>Each game or app has its own privacy policy, linked from its page.</p>`,
};

function docPage(key, lang, html, title) {
  return layout({ lang, key, title: `${title} — ${site.name}`, description: title, body: `<section><div class="wrap doc">${html}</div></section>` });
}

function notFoundPage() {
  // Servie à n'importe quelle profondeur : liens absolus depuis la racine du domaine.
  const t = T.fr;
  const te = T.en;
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${t.notFound} — ${esc(site.name)}</title><link rel="icon" href="/static/img/logo.svg" type="image/svg+xml"><link rel="stylesheet" href="/static/style.css"><meta name="robots" content="noindex"></head>
<body><main id="main"><section class="hero"><div class="wrap">
<img src="/static/img/logo.svg" alt="" width="72" height="72" style="margin-bottom:24px">
<h1>${t.notFound}</h1><p class="lead">${t.notFoundText} <span lang="en">— ${te.notFoundText}</span></p>
<p><a href="/">${t.home}</a> · <a href="/en/" lang="en">${te.home}</a></p>
</div></section></main></body></html>
`;
}

// ---------- Construction ----------

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync('static', join(OUT, 'static'), { recursive: true });
for (const g of games) {
  cpSync(g.dir, join(OUT, 'media', g.slug), {
    recursive: true,
    filter: (src) => !/\.(json|html)$/.test(src),
  });
}

const urls = [];
for (const lang of ['fr', 'en']) {
  const page = (key, html) => {
    write(PATHS[key][lang], html);
    urls.push(`${site.url}/${PATHS[key][lang]}`);
  };
  page('home', homePage(lang));
  for (const g of games) {
    page(g.slug, gamePage(g, lang));
    page(`${g.slug}:privacy`, gamePrivacyPage(g, lang));
  }
  page('legal', docPage('legal', lang, LEGAL[lang], T[lang].legal));
  page('sitePrivacy', docPage('sitePrivacy', lang, SITE_PRIVACY[lang], T[lang].sitePrivacy));
}
writeFileSync(join(OUT, '404.html'), notFoundPage());
writeFileSync(join(OUT, 'CNAME'), site.domain + '\n');
writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`);
writeFileSync(
  join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`,
);
console.log(`Site construit : ${urls.length} pages, ${games.length} jeu(x) → ${OUT}/`);
