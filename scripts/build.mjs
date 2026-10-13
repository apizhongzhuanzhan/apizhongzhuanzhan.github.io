import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { renderHomepage } from "./homepage.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_PATH = path.join(ROOT, "data.json");
const PAGE_ROOT = path.join(ROOT, "page");
const STYLES_PATH = path.join(ROOT, "assets", "styles.css");
const MINIFIED_STYLES_PATH = path.join(ROOT, "assets", "styles.min.css");
const SOURCE_URL = process.env.DATA_SOURCE_URL
  || "https://raw.githubusercontent.com/hvoyai/awesome-ai-api/main/data.json";
const SOURCE_PATH = process.env.DATA_SOURCE_PATH || "";
const ORIGIN = "https://apizhongzhuanzhan.github.io";
const BAIDU_TONGJI_SCRIPT = [
  "<script>",
  "var _hmt = _hmt || [];",
  "(function() {",
  "  var hm = document.createElement(\"script\");",
  "  hm.src = \"https://hm.baidu.com/hm.js?1e0e6340f21d079321ccb3c3ba8a8d3e\";",
  "  var s = document.getElementsByTagName(\"script\")[0];",
  "  s.parentNode.insertBefore(hm, s);",
  "})();",
  "</script>",
].join("\n");
const MAX_SITES = 400;
const PAGE_SIZE = 50;
const SHOULD_SYNC = process.argv.includes("--sync");
const number = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 1 });

const TOPICS = [
  {
    slug: "gpt-zhongzhuanzhan",
    label: "GPT 中转站",
    short: "GPT / OpenAI",
    terms: ["gpt", "openai", "chatgpt"],
    intro: "GPT 中转站通常提供 OpenAI 兼容接口，适合对话、代码、结构化输出、工具调用与多模态任务。除了模型名，还要确认具体版本、上下文长度、Responses API、缓存和工具调用是否完整。",
  },
  {
    slug: "claude-zhongzhuanzhan",
    label: "Claude 中转站",
    short: "Claude / Anthropic",
    terms: ["claude", "anthropic"],
    intro: "Claude 中转站常用于长文本、代码和 Agent 任务。选择时应确认原生协议或兼容层差异，并重点测试 Prompt Caching、工具调用、长输出稳定性和具体模型映射。",
  },
  {
    slug: "codex-zhongzhuanzhan",
    label: "Codex 中转站",
    short: "Codex",
    terms: ["codex"],
    intro: "Codex 中转站面向编程 Agent 与仓库任务。选择时重点体验工具调用、上下文缓存、并发和错误恢复，按客户端需要的接口能力选择线路。",
  },
  {
    slug: "gemini-zhongzhuanzhan",
    label: "Gemini 中转站",
    short: "Gemini / Google",
    terms: ["gemini", "google"],
    intro: "Gemini 中转站常用于多模态、长上下文、代码和文档处理。需要区分原生接口与 OpenAI 兼容接口，并分别测试图片、文件、工具调用、安全过滤和模型版本。",
  },
  {
    slug: "glm-zhongzhuanzhan",
    label: "GLM 中转站",
    short: "GLM / 智谱",
    terms: ["glm", "智谱"],
    intro: "GLM 中转站主要提供智谱系列模型的统一 API 接入。应确认具体型号、工具调用、结构化输出、视觉能力和上下文限制。",
  },
  {
    slug: "qwen-zhongzhuanzhan",
    label: "Qwen 中转站",
    short: "Qwen / 通义千问",
    terms: ["qwen", "通义", "千问", "阿里云"],
    intro: "Qwen 中转站覆盖通义千问文本、代码和多模态模型。选择时要区分不同尺寸与用途，确认上下文、视觉或音频能力、工具调用和兼容协议。",
  },
  {
    slug: "kimi-zhongzhuanzhan",
    label: "Kimi 中转站",
    short: "Kimi / 月之暗面",
    terms: ["kimi", "moonshot", "月之暗面"],
    intro: "Kimi 中转站常用于中文长文本、文件处理和对话场景。按模型版本、上下文长度、文件能力、工具调用和费用选择适合任务的线路。",
  },
];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function finite(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function booleanOrNull(value) {
  return typeof value === "boolean" ? value : null;
}

function validDate(value) {
  const text = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

function normalizeSite(site, index) {
  const models = Array.isArray(site.models) ? site.models.map(String).map((item) => item.trim()).filter(Boolean) : [];
  const payments = Array.isArray(site.paymentMethods) ? site.paymentMethods.map(String).map((item) => item.trim()).filter(Boolean) : [];
  return {
    sourceRank: Math.max(1, Math.round(finite(site.sourceRank ?? site.rank) || index + 1)),
    name: String(site.name || "未命名站点").trim(),
    url: safeUrl(site.url),
    description: String(site.description || "").trim(),
    establishedDate: validDate(site.establishedDate),
    modelCount: Math.max(0, Math.round(finite(site.modelCount) ?? models.length)),
    models: [...new Set(models)].slice(0, 24),
    uptime: finite(site.uptime),
    latencyMs: finite(site.latencyMs),
    userRating: finite(site.userRating),
    ratingCount: Math.max(0, Math.round(finite(site.ratingCount) || 0)),
    paymentMethods: [...new Set(payments)].slice(0, 12),
    supportsRefund: booleanOrNull(site.supportsRefund),
    supportsInvoice: booleanOrNull(site.supportsInvoice),
  };
}

function validatePayload(payload) {
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.sites) || !payload.sites.length) {
    throw new Error("data.json 缺少非空 sites 数组");
  }
  payload.sites.forEach((site, index) => {
    if (!site || typeof site !== "object" || !String(site.name || "").trim()) throw new Error(`第 ${index + 1} 条缺少名称`);
    if (!safeUrl(site.url)) throw new Error(`第 ${index + 1} 条链接无效`);
  });
}

async function atomicWrite(target, content) {
  await mkdir(path.dirname(target), { recursive: true });
  const temporary = `${target}.tmp`;
  await writeFile(temporary, content, "utf8");
  await rename(temporary, target);
}

function shanghaiParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function buildTime(date = new Date()) {
  const part = shanghaiParts(date);
  const day = `${part.year}-${part.month}-${part.day}`;
  return {
    day,
    iso: `${day}T${part.hour}:${part.minute}:${part.second}+08:00`,
    visible: `${part.year} 年 ${part.month} 月 ${part.day} 日 ${part.hour}:${part.minute}（北京时间）`,
  };
}

function prepareSites(rawSites) {
  return rawSites
    .map(normalizeSite)
    .sort((a, b) => a.sourceRank - b.sourceRank)
    .slice(0, MAX_SITES)
    .map((site, index) => ({ ...site, rank: index + 1 }));
}

async function syncData() {
  let incoming;
  if (SOURCE_PATH) {
    incoming = JSON.parse(await readFile(path.resolve(SOURCE_PATH), "utf8"));
  } else {
    const response = await fetch(SOURCE_URL, {
      headers: { "user-agent": "apizhongzhuanzhan-static-builder/1.0" },
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok) throw new Error(`数据同步失败：HTTP ${response.status}`);
    incoming = JSON.parse(await response.text());
  }
  validatePayload(incoming);
  const sites = incoming.sites.map(normalizeSite).sort((a, b) => a.sourceRank - b.sourceRank).slice(0, MAX_SITES);
  const snapshot = {
    source: SOURCE_URL,
    sourceUpdatedDate: validDate(incoming.updatedDate),
    syncedAt: new Date().toISOString(),
    maxItems: MAX_SITES,
    sites,
  };
  await atomicWrite(DATA_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
}

function formatDate(value) {
  if (!value) return "未注明";
  const [year, month, day] = value.split("-");
  return `${year}.${month}.${day}`;
}

function formatUptime(value) {
  return value === null ? "—" : `${number.format(value)}%`;
}

function formatLatency(value) {
  if (value === null) return "—";
  return value >= 1000 ? `${number.format(value / 1000)} 秒` : `${Math.round(value)} 毫秒`;
}

function policy(value) {
  return value === true ? "支持" : value === false ? "不支持" : "—";
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function stats(sites) {
  const uptimes = sites.map((site) => site.uptime).filter((value) => value !== null);
  const latencies = sites.map((site) => site.latencyMs).filter((value) => value !== null);
  const models = sites.map((site) => site.modelCount).filter((value) => value > 0);
  const ratings = sites.filter((site) => site.ratingCount > 0 && site.userRating !== null).map((site) => site.userRating);
  return {
    uptime: { value: median(uptimes), sample: uptimes.length },
    latency: { value: median(latencies), sample: latencies.length },
    models: { value: median(models), sample: models.length },
    rating: { value: median(ratings), sample: ratings.length },
  };
}

function descriptionSummary(text, limit = 130) {
  const compact = String(text || "").replace(/\s+/g, " ").trim();
  return compact.length > limit ? `${compact.slice(0, limit).trim()}…` : compact;
}

function fullDescription(text) {
  return String(text || "").split(/\n\s*\n|\n+/).map((part) => part.trim()).filter(Boolean)
    .map((part) => `<p>${escapeHtml(part)}</p>`).join("");
}

function renderChips(items) {
  if (!items.length) return '<span class="chip">模型 —</span>';
  return items.slice(0, 8).map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join("");
}

function renderStation(site) {
  const scoreClass = site.uptime === null ? "score-unknown" : site.uptime >= 99 ? "score-good" : "score-mid";
  const description = site.description ? `<p class="station-description">${escapeHtml(descriptionSummary(site.description))}</p>` : '<p class="station-description">模型、价格与服务详情见站点资料页。</p>';
  const details = site.description.length > 130 ? `<details class="ranking-rules"><summary><span class="rules-title">查看完整公开简介</span></summary><div class="rules-body">${fullDescription(site.description)}</div></details>` : "";
  return `<article class="station-card" id="rank-${site.rank}" data-station-card aria-labelledby="station-${site.rank}">
    <span class="rank-number" aria-label="推荐顺序第 ${site.rank} 名">${site.rank}</span>
    <div class="station-main">
      <div class="station-head"><h3 id="station-${site.rank}"><a href="${escapeHtml(site.url)}" target="_blank" rel="nofollow noopener" referrerpolicy="origin">${escapeHtml(site.name)}</a></h3><span class="station-date">收录日期 ${escapeHtml(formatDate(site.establishedDate))}</span></div>
      ${description}
      <div class="station-meta"><span>延迟 <strong>${formatLatency(site.latencyMs)}</strong></span><span>模型 <strong>${site.modelCount} 个</strong></span><span>评价 <strong>${site.userRating !== null && site.ratingCount ? `${number.format(site.userRating)}/5 · ${site.ratingCount} 条` : "暂无"}</strong></span></div>
      <div class="chips">${renderChips(site.models)}</div>
      <div class="station-actions"><a class="detail-link" href="${escapeHtml(site.url)}" target="_blank" rel="nofollow noopener" referrerpolicy="origin">查看公开资料</a><span class="policy">退款：${policy(site.supportsRefund)} · 发票：${policy(site.supportsInvoice)}</span><span class="policy">支付：${escapeHtml(site.paymentMethods.join(" / ") || "—")}</span></div>
      ${details}
    </div>
    <div class="station-score ${scoreClass}"><strong>${formatUptime(site.uptime)}</strong><span>公开在线率</span></div>
  </article>`;
}

function pagePath(page) {
  return page === 1 ? "/directory/" : `/page/${page}/`;
}

function renderPagination(current, total) {
  const links = [];
  links.push(current > 1 ? `<a class="page-link" href="${pagePath(current - 1)}">上一页</a>` : '<span class="page-link is-disabled">上一页</span>');
  for (let page = 1; page <= total; page += 1) {
    links.push(page === current ? `<span class="page-link is-current" aria-current="page">${page}</span>` : `<a class="page-link" href="${pagePath(page)}" aria-label="前往第 ${page} 页">${page}</a>`);
  }
  links.push(current < total ? `<a class="page-link" href="${pagePath(current + 1)}">下一页</a>` : '<span class="page-link is-disabled">下一页</span>');
  return `<nav class="pagination" aria-label="排行榜分页">${links.join("")}</nav>`;
}

function topicMatches(site, topic) {
  const searchable = [site.name, site.description, ...site.models].join(" ").toLowerCase();
  return topic.terms.some((term) => searchable.includes(term.toLowerCase()));
}

function renderTopics(allSites) {
  return `<section class="content-section" id="topics" aria-labelledby="topics-title">
    <div class="section-heading"><div><p class="section-kicker">07 / 按模型选择</p><h2 id="topics-title">你需要哪种模型？</h2></div><p>GPT中转站、Gemini中转站和GLM中转站的接口能力各有差异。按下面的用途与接入要点选择模型，再查看对应的推荐站点。</p></div>
    <div class="topic-grid">${TOPICS.map((topic) => {
      const count = allSites.filter((site) => topicMatches(site, topic)).length;
      return `<a class="topic-card" href="/${topic.slug}/"><small>${escapeHtml(topic.short)}</small><h3>${escapeHtml(topic.label)}</h3><p>${escapeHtml(topic.intro)}</p><strong>${count} 家相关站点 →</strong></a>`;
    }).join("")}</div>
  </section>`;
}

function objectiveSummary(site) {
  const parts = [`推荐顺序第 ${site.rank}`];
  if (site.uptime !== null) parts.push(`公开在线率 ${formatUptime(site.uptime)}`);
  if (site.latencyMs !== null) parts.push(`平均延迟 ${formatLatency(site.latencyMs)}`);
  parts.push(`收录模型 ${site.modelCount} 个`);
  return `${parts.join("；")}。`;
}

function jsonLdForPage({ page, canonical, title, description, sites, allSites, built }) {
  const breadcrumb = [{ "@type": "ListItem", position: 1, name: "中转站指南", item: `${ORIGIN}/` }, { "@type": "ListItem", position: 2, name: `完整目录第 ${page} 页`, item: canonical }];
  const graph = [
    { "@type": "WebSite", "@id": `${ORIGIN}/#website`, url: `${ORIGIN}/`, name: "API 中转站评测与推荐", inLanguage: "zh-CN" },
    { "@type": "CollectionPage", "@id": `${canonical}#webpage`, url: canonical, name: title, description, inLanguage: "zh-CN", dateModified: built.iso, isPartOf: { "@id": `${ORIGIN}/#website` }, breadcrumb: { "@id": `${canonical}#breadcrumb` }, mainEntity: { "@id": `${canonical}#ranking` } },
    { "@type": "BreadcrumbList", "@id": `${canonical}#breadcrumb`, itemListElement: breadcrumb },
    { "@type": "ItemList", "@id": `${canonical}#ranking`, name: `AI API 中转站推荐列表第 ${page} 页`, numberOfItems: allSites.length, itemListOrder: "https://schema.org/ItemListOrderAscending", itemListElement: sites.map((site) => ({ "@type": "ListItem", position: site.rank, item: { "@type": "Service", name: site.name, url: site.url, description: objectiveSummary(site), serviceType: "AI API 中转服务" } })) },
  ];
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replaceAll("<", "\\u003c");
}

function renderPage({ page, totalPages, sites, allSites, built }) {
  const root = page === 1 ? ".." : "../..";
  const canonical = `${ORIGIN}${pagePath(page)}`;
  const first = sites[0].rank;
  const last = sites.at(-1).rank;
  const title = `API中转站完整目录第 ${page} 页｜第 ${first}–${last} 名`;
  const description = `API中转站完整目录第 ${page} 页，展示原始排名第 ${first}–${last} 名的 AI API 中转站公开在线率、延迟、模型和服务信息，共收录 ${allSites.length} 家。`;
  const relations = { previous: page > 1 ? `${ORIGIN}${pagePath(page - 1)}` : "", next: page < totalPages ? `${ORIGIN}${pagePath(page + 1)}` : "" };
  const pageStats = stats(sites);
  const jsonLd = jsonLdForPage({ page, canonical, title, description, sites, allSites, built });
  return `<!doctype html>
<html lang="zh-CN"><head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="keywords" content="API 中转站评测与推荐,API 中转站排名,中转站推荐,AI API 中转站,OpenAI 中转站,Claude 中转站,Gemini 中转站,Codex 中转站" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <meta name="author" content="API 中转站评测与推荐" />
  <meta name="theme-color" content="#ffffff" />
  <meta property="og:type" content="website" /><meta property="og:locale" content="zh_CN" /><meta property="og:site_name" content="API 中转站评测与推荐" />
  <meta property="og:title" content="${escapeHtml(title)}" /><meta property="og:description" content="${escapeHtml(description)}" /><meta property="og:url" content="${canonical}" /><meta property="og:image" content="${ORIGIN}/assets/og-image.png" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta property="og:image:alt" content="API 中转站评测与推荐榜" />
  <meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${escapeHtml(title)}" /><meta name="twitter:description" content="${escapeHtml(description)}" /><meta name="twitter:image" content="${ORIGIN}/assets/og-image.png" />
  <link rel="canonical" href="${canonical}" /><link rel="alternate" hreflang="zh-CN" href="${canonical}" /><link rel="alternate" hreflang="x-default" href="${canonical}" />
  ${relations.previous ? `<link rel="prev" href="${relations.previous}" />` : ""}${relations.next ? `<link rel="next" href="${relations.next}" />` : ""}
  <link rel="icon" href="${root}/assets/favicon.svg" type="image/svg+xml" /><link rel="stylesheet" href="${root}/assets/styles.min.css" />
  <script type="application/ld+json">${jsonLd}</script>
  ${BAIDU_TONGJI_SCRIPT}
</head><body data-generated-at="${built.iso}">
  <a class="skip-link" href="#main">跳到主要内容</a>
  <header class="site-header"><div class="header-inner"><a class="brand" href="/" aria-label="中转站指南首页"><span class="brand-mark">API</span><span>中转站指南</span></a><nav class="site-nav" aria-label="主要导航"><a href="/#ranking">精选清单</a><a href="/#topics">模型指南</a><a href="/#guide">怎么选</a><a href="/#faq">常见问题</a></nav></div></header>
  <main id="main">
    <nav class="breadcrumbs" aria-label="面包屑"><a href="/">中转站指南</a><span aria-hidden="true">/</span><span aria-current="page">完整目录第 ${page} 页</span></nav>
    <section class="hero"><p class="eyebrow">AI API DIRECTORY / ${allSites.length} SITES</p><h1>API中转站完整目录<br /><span>第 ${page} 页</span></h1><p class="hero-copy">按原始排名展示API中转站。在线率、响应速度、模型覆盖和服务政策集中对比，方便选择日常使用与项目接入的服务。</p><ul class="hero-meta"><li>本次更新 <time datetime="${built.iso}">${built.visible}</time></li><li>共 ${allSites.length} 家 · 本页 ${sites.length} 家</li><li><a href="/#guide">阅读完整选站指南 →</a></li></ul></section>
    <section id="ranking" aria-labelledby="ranking-title"><div class="ranking-toolbar"><div><p class="section-kicker">DIRECTORY / ${String(page).padStart(2, "0")}</p><h2 id="ranking-title">AI API 中转站推荐列表</h2><p>当前显示第 ${first}–${last} 名，共 ${allSites.length} 家</p></div><div class="search-box"><label for="station-search">筛选当前页（显示 <span data-visible-count>${sites.length}</span> 家）</label><input id="station-search" type="search" inputmode="search" autocomplete="off" placeholder="输入站点名、模型或支付方式" data-station-search /></div></div>
      <p class="ranking-note">按所需模型、响应速度与服务条件筛选。需要退款、发票或对公支付时，可直接查看每家站点对应的信息。</p>
      <section class="page-analysis" aria-label="本页数据概览"><h3>本页数据概览</h3><dl class="analysis-grid"><div><dt>在线率中位数</dt><dd>${pageStats.uptime.value === null ? "暂无" : formatUptime(pageStats.uptime.value)}</dd><small>有效样本 ${pageStats.uptime.sample}/${sites.length}</small></div><div><dt>延迟中位数</dt><dd>${pageStats.latency.value === null ? "暂无" : formatLatency(pageStats.latency.value)}</dd><small>有效样本 ${pageStats.latency.sample}/${sites.length}</small></div><div><dt>模型数量中位数</dt><dd>${pageStats.models.value === null ? "暂无" : `${number.format(pageStats.models.value)} 个`}</dd><small>有效样本 ${pageStats.models.sample}/${sites.length}</small></div><div><dt>评分中位数</dt><dd>${pageStats.rating.value === null ? "暂无" : `${number.format(pageStats.rating.value)} / 5`}</dd><small>有效样本 ${pageStats.rating.sample}/${sites.length}</small></div></dl></section>
      <div class="station-list">${sites.map(renderStation).join("")}</div><div class="search-empty" data-search-empty role="status">当前页没有匹配结果，请尝试更短的关键词。</div>${renderPagination(page, totalPages)}
    </section>
    <section class="continue-card"><h2>选好模型，开始接入</h2><p>回到首页查看上游来源、倍率与充值、缓存计费、模型用途、选择方法和常见问题。</p><a href="/#guide">阅读完整选择指南 →</a></section>
  </main>
  <footer class="site-footer"><div class="footer-inner"><div><a class="brand" href="/">中转站指南</a><p>API中转站推荐、模型对比与接入指南，每天自动更新两次。</p></div><a href="#main">返回顶部 ↑</a></div></footer>
  <script src="${root}/assets/site.js" defer></script>
</body></html>`;
}

function topicFaq(topic) {
  return [
    [`${topic.label}应该怎么选？`, `按所需模型、接口和预算选择站点，接入后体验流式输出、工具调用与上下文。用真实任务比较响应速度、完成效果和最终扣费。`],
    [`${topic.label}价格怎样比较？`, "统一换算人民币充值比例、输入价格、输出价格、缓存读写、模型倍率和用户分组倍率，再复算一条实际请求。"],
    [`${topic.label}可以直接用于生产环境吗？`, "生产项目按并发、数据处理与服务要求选择分组，配置独立密钥、用量限额和备用线路。团队接入时一并查看日志设置、服务条款和对接支持。"],
  ];
}

function renderTopicPage({ topic, matches, allSites, built }) {
  const shown = matches.slice(0, PAGE_SIZE);
  const canonical = `${ORIGIN}/${topic.slug}/`;
  const title = `${topic.label}推荐｜API 中转站评测与推荐`;
  const description = `${topic.label}专题收录 ${matches.length} 家相关 AI API 中转站公开资料，对比在线率、延迟、模型数量，并提供计费比较与接入指南。`;
  const topicStats = stats(matches);
  const faq = topicFaq(topic);
  const jsonLd = JSON.stringify({ "@context": "https://schema.org", "@graph": [
    { "@type": "CollectionPage", "@id": `${canonical}#webpage`, url: canonical, name: title, description, inLanguage: "zh-CN", dateModified: built.iso, mainEntity: { "@id": `${canonical}#ranking` } },
    { "@type": "BreadcrumbList", "@id": `${canonical}#breadcrumb`, itemListElement: [{ "@type": "ListItem", position: 1, name: "API 中转站评测与推荐", item: `${ORIGIN}/` }, { "@type": "ListItem", position: 2, name: topic.label, item: canonical }] },
    { "@type": "ItemList", "@id": `${canonical}#ranking`, name: `${topic.label}推荐列表`, numberOfItems: matches.length, itemListElement: shown.map((site, index) => ({ "@type": "ListItem", position: index + 1, item: { "@type": "Service", name: site.name, url: site.url, description: objectiveSummary(site) } })) },
    { "@type": "FAQPage", mainEntity: faq.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
  ] }).replaceAll("<", "\\u003c");
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}" /><meta name="keywords" content="${escapeHtml(topic.label)},${escapeHtml(topic.short)},API 中转站评测与推荐,API 中转站排名" /><meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" /><meta name="theme-color" content="#ffffff" /><meta property="og:type" content="website" /><meta property="og:locale" content="zh_CN" /><meta property="og:site_name" content="API 中转站评测与推荐" /><meta property="og:title" content="${escapeHtml(title)}" /><meta property="og:description" content="${escapeHtml(description)}" /><meta property="og:url" content="${canonical}" /><meta property="og:image" content="${ORIGIN}/assets/og-image.svg" /><meta name="twitter:card" content="summary_large_image" /><link rel="canonical" href="${canonical}" /><link rel="alternate" hreflang="zh-CN" href="${canonical}" /><link rel="icon" href="../assets/favicon.svg" type="image/svg+xml" /><link rel="stylesheet" href="../assets/styles.min.css" /><script type="application/ld+json">${jsonLd}</script>${BAIDU_TONGJI_SCRIPT}</head><body data-generated-at="${built.iso}"><a class="skip-link" href="#main">跳到主要内容</a><header class="site-header"><div class="header-inner"><a class="brand" href="../"><span class="brand-mark">API</span><span>API 中转站评测与推荐</span></a><nav class="site-nav" aria-label="主要导航"><a href="../#ranking">排行榜</a><a href="../#topics">模型专题</a><a href="../#guide">怎么选</a><a href="#faq">常见问题</a></nav></div></header><main id="main"><nav class="breadcrumbs" aria-label="面包屑"><a href="../">API 中转站评测与推荐</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHtml(topic.label)}</span></nav><section class="hero topic-hero"><p class="eyebrow">MODEL DIRECTORY · ${escapeHtml(topic.short)}</p><h1>${escapeHtml(topic.label)}<br /><span>推荐与对比</span></h1><p class="hero-copy topic-intro">${escapeHtml(topic.intro)}</p><ul class="hero-meta"><li>${matches.length} 家相关站点</li><li>展示前 ${shown.length} 家</li><li>更新 <time datetime="${built.iso}">${built.visible}</time></li></ul></section><dl class="topic-highlight"><div><dt>相关站点</dt><dd>${matches.length} 家</dd></div><div><dt>在线率中位数</dt><dd>${topicStats.uptime.value === null ? "暂无" : formatUptime(topicStats.uptime.value)}</dd></div><div><dt>延迟中位数</dt><dd>${topicStats.latency.value === null ? "暂无" : formatLatency(topicStats.latency.value)}</dd></div><div><dt>模型数量中位数</dt><dd>${topicStats.models.value === null ? "暂无" : `${number.format(topicStats.models.value)} 个`}</dd></div></dl><section aria-labelledby="topic-ranking-title"><div class="ranking-toolbar"><div><p class="section-kicker">MODEL RANKING</p><h2 id="topic-ranking-title">${escapeHtml(topic.label)}推荐站点</h2><p>按综合排名展示相关站点，集中比较模型、响应速度与服务政策。</p></div><div class="search-box"><label for="station-search">筛选当前专题（显示 <span data-visible-count>${shown.length}</span> 家）</label><input id="station-search" type="search" placeholder="输入站点名或模型" data-station-search /></div></div><p class="ranking-note">按完整模型名和接口选择线路，编程场景重点看缓存与工具调用，文档和多模态场景重点看上下文与输入能力。</p><div class="station-list">${shown.map(renderStation).join("")}</div><div class="search-empty" data-search-empty>当前专题没有匹配结果。</div></section><section class="content-section editorial"><h2>选择 ${escapeHtml(topic.label)} 的接入要点</h2><div class="editorial-body"><h3>核对协议和模型映射</h3><p>${escapeHtml(topic.intro)} 根据客户端使用的协议查看流式响应、工具调用、缓存与模型 ID，接入配置更清楚。</p><h3>用真实任务体验</h3><p>使用真实文档、代码仓库或多轮 Agent 任务，记录首字时间、完整耗时、任务完成情况和单次扣费。按自己的常用时段体验，找到速度与成本合适的分组。</p><h3>管理项目配置与备用线路</h3><p>把接口地址、模型映射和密钥集中管理，给项目配置用量限额和备用线路。团队项目按数据处理、并发与服务要求选择分组，后续维护更方便。</p></div></section><section class="content-section" id="faq"><div class="section-heading"><div><p class="section-kicker">FAQ</p><h2>${escapeHtml(topic.label)}常见问题</h2></div><p>从模型选择、价格比较到项目接入，下面是常用的操作方法。</p></div><div class="faq-list">${faq.map(([question, answer]) => `<details class="faq-item"><summary>${escapeHtml(question)}</summary><div class="faq-answer"><p>${escapeHtml(answer)}</p></div></details>`).join("")}</div></section>${renderTopics(allSites)}</main><footer class="site-footer"><div class="footer-inner"><div><a class="brand" href="../"><span class="brand-mark">API</span><span>API 中转站评测与推荐</span></a><p>API中转站推荐、模型对比与接入指南，每天自动更新两次。</p></div><a href="#main">返回顶部 ↑</a></div></footer><script src="../assets/site.js" defer></script></body></html>`;
}

function minifyHtml(html) {
  return `${html.split("\n").map((line) => line.trim()).filter(Boolean).join("").replace(/>\s+</g, "><")}\n`;
}

function minifyCss(css) {
  const strings = [];
  const protectedCss = css.replace(/(["'])(?:\\.|(?!\1)[^\\])*\1/g, (match) => {
    const token = `___CSS_STRING_${strings.length}___`;
    strings.push(match);
    return token;
  });
  let minified = protectedCss.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").replace(/\s*([{}:;,])\s*/g, "$1").replace(/;}/g, "}").trim();
  strings.forEach((value, index) => { minified = minified.replace(`___CSS_STRING_${index}___`, value); });
  return `${minified}\n`;
}

function renderSitemap(totalPages, built) {
  const urls = [`${ORIGIN}/`, ...Array.from({ length: totalPages }, (_, index) => `${ORIGIN}${pagePath(index + 1)}`), ...TOPICS.map((topic) => `${ORIGIN}/${topic.slug}/`)];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url, index) => `  <url><loc>${url}</loc><lastmod>${built.day}</lastmod><changefreq>daily</changefreq><priority>${index === 0 ? "1.0" : index < totalPages ? "0.8" : "0.9"}</priority></url>`).join("\n")}\n</urlset>\n`;
}

async function cleanOldPages(totalPages) {
  let entries = [];
  try { entries = await readdir(PAGE_ROOT, { withFileTypes: true }); } catch (error) { if (error?.code !== "ENOENT") throw error; }
  await Promise.all(entries.filter((entry) => entry.isDirectory() && /^\d+$/.test(entry.name) && Number(entry.name) > totalPages).map((entry) => rm(path.join(PAGE_ROOT, entry.name), { recursive: true, force: true })));
}

async function build() {
  if (SHOULD_SYNC) await syncData();
  const payload = JSON.parse(await readFile(DATA_PATH, "utf8"));
  validatePayload(payload);
  const built = buildTime();
  const sites = prepareSites(payload.sites);
  const totalPages = Math.ceil(sites.length / PAGE_SIZE);
  await cleanOldPages(totalPages);
  await atomicWrite(MINIFIED_STYLES_PATH, minifyCss(await readFile(STYLES_PATH, "utf8")));
  await atomicWrite(path.join(ROOT, "index.html"), minifyHtml(renderHomepage({ allSites: sites, built, topicsHtml: renderTopics(sites), analytics: BAIDU_TONGJI_SCRIPT })));
  for (let page = 1; page <= totalPages; page += 1) {
    const pageSites = sites.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const target = page === 1 ? path.join(ROOT, "directory", "index.html") : path.join(PAGE_ROOT, String(page), "index.html");
    await atomicWrite(target, minifyHtml(renderPage({ page, totalPages, sites: pageSites, allSites: sites, built })));
  }
  for (const topic of TOPICS) {
    const matches = sites.filter((site) => topicMatches(site, topic));
    await atomicWrite(path.join(ROOT, topic.slug, "index.html"), minifyHtml(renderTopicPage({ topic, matches, allSites: sites, built })));
  }
  await atomicWrite(path.join(ROOT, "sitemap.xml"), renderSitemap(totalPages, built));
  process.stdout.write(`已生成完整指南首页、${totalPages} 个静态分页、${TOPICS.length} 个模型专题，共 ${sites.length} 家；页面时间 ${built.visible}\n`);
}

await build();
