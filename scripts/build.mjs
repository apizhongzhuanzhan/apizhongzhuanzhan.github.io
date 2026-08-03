import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_PATH = path.join(ROOT, "data.json");
const PAGE_ROOT = path.join(ROOT, "page");
const STYLES_PATH = path.join(ROOT, "assets", "styles.css");
const MINIFIED_STYLES_PATH = path.join(ROOT, "assets", "styles.min.css");
const SOURCE_URL = process.env.DATA_SOURCE_URL
  || "https://raw.githubusercontent.com/hvoyai/awesome-ai-api/main/data.json";
const SOURCE_PATH = process.env.DATA_SOURCE_PATH || "";
const ORIGIN = "https://apizhongzhuanzhan.github.io";
const MAX_SITES = 400;
const PAGE_SIZE = 50;
const SHUFFLE_GROUP_SIZE = 5;
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
    intro: "Codex 中转站面向编程 Agent 与仓库任务。短对话可用不代表长任务稳定，应测试工具调用、上下文缓存、并发、错误恢复以及客户端所需的接口能力。",
  },
  {
    slug: "gemini-zhongzhuanzhan",
    label: "Gemini 中转站",
    short: "Gemini / Google",
    terms: ["gemini"],
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
    terms: ["qwen", "通义", "千问"],
    intro: "Qwen 中转站覆盖通义千问文本、代码和多模态模型。选择时要区分不同尺寸与用途，确认上下文、视觉或音频能力、工具调用和兼容协议。",
  },
  {
    slug: "kimi-zhongzhuanzhan",
    label: "Kimi 中转站",
    short: "Kimi / 月之暗面",
    terms: ["kimi", "moonshot", "月之暗面"],
    intro: "Kimi 中转站常用于中文长文本、文件处理和对话场景。应核对具体模型、上下文长度、文件能力、工具调用和费用，避免直接用网页会员体验推断 API 能力。",
  },
];

const FAQ = [
  ["AI 中转站是什么？", "AI 中转站位于客户端与模型上游之间，通常负责鉴权、充值结算、限流、渠道调度和协议转换。它能用一个接口接入多个模型，但也意味着请求链路增加了第三方环节。"],
  ["怎样选择 AI API 中转站？", "先确认所需模型、接口协议和预算，再以最低金额充值。用同一组真实任务测试成功率、首字延迟、长上下文、工具调用、缓存和账单，白天与晚高峰都应测试。"],
  ["排名靠前就一定安全吗？", "不一定。本榜单根据公开资料做目录式初筛，并在相邻小分组内轻微调整展示顺序，不代表安全审计、官方授权或服务担保。敏感业务应优先选择官方 API 或可签约、可审计的服务。"],
  ["低倍率为什么不一定更便宜？", "实际费用还取决于人民币充值换算、输入与输出单价、缓存读写、分组倍率和模型倍率。比较价格时应复算一条真实请求，而不是只看首页展示的单个倍率。"],
  ["怎么判断模型有没有被替换？", "模型自报身份不能作为证据。更可靠的方法是保存固定测试集，长期比较上下文、工具调用、结构化输出、多模态能力、响应特征和请求级账单，并在异常时换时间和通道复测。"],
  ["使用中转站怎样保护隐私？", "默认按站点可能接触请求和响应内容来评估风险。不要发送密码、私钥、客户资料、未公开代码等敏感数据；为不同项目使用独立 Key、额度上限和可撤销凭据。"],
  ["为什么网页打开快，模型回复仍然慢？", "网页可能通过 CDN 加速，而完整模型请求还要经过网关处理、排队、上游网络和模型推理。应分别记录首字时间、完整响应时间、失败率和高峰期波动。"],
  ["为什么建议小额充值？", "中转服务可能受到上游政策、账号风控、线路和经营状况影响，站内余额也不等同银行存款。按近期用量充值，并为重要调用准备不同上游的备用方案更稳妥。"],
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

function stableHash(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function prepareSites(rawSites, day) {
  const selected = rawSites
    .map(normalizeSite)
    .sort((a, b) => a.sourceRank - b.sourceRank)
    .slice(0, MAX_SITES);
  const shuffled = [];
  for (let start = 0; start < selected.length; start += SHUFFLE_GROUP_SIZE) {
    const group = selected.slice(start, start + SHUFFLE_GROUP_SIZE)
      .sort((a, b) => stableHash(`${day}:${a.name}:${a.url}`) - stableHash(`${day}:${b.name}:${b.url}`));
    shuffled.push(...group);
  }
  return shuffled.map((site, index) => ({ ...site, rank: index + 1 }));
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
  return value === null ? "暂无" : `${number.format(value)}%`;
}

function formatLatency(value) {
  if (value === null) return "暂无";
  return value >= 1000 ? `${number.format(value / 1000)} 秒` : `${Math.round(value)} 毫秒`;
}

function policy(value) {
  return value === true ? "支持" : value === false ? "不支持" : "待确认";
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
  if (!items.length) return '<span class="chip">模型待确认</span>';
  return items.slice(0, 8).map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join("");
}

function renderStation(site) {
  const scoreClass = site.uptime === null ? "score-unknown" : site.uptime >= 99 ? "score-good" : "score-mid";
  const description = site.description ? `<p class="station-description">${escapeHtml(descriptionSummary(site.description))}</p>` : '<p class="station-description">暂未收录站点简介，访问资料页核对模型、价格与服务条款。</p>';
  const details = site.description.length > 130 ? `<details class="ranking-rules"><summary><span class="rules-title">查看完整公开简介</span></summary><div class="rules-body">${fullDescription(site.description)}</div></details>` : "";
  return `<article class="station-card" id="rank-${site.rank}" data-station-card aria-labelledby="station-${site.rank}">
    <span class="rank-number" aria-label="推荐顺序第 ${site.rank} 名">${site.rank}</span>
    <div class="station-main">
      <div class="station-head"><h3 id="station-${site.rank}"><a href="${escapeHtml(site.url)}" target="_blank" rel="nofollow noopener" referrerpolicy="origin">${escapeHtml(site.name)}</a></h3><span class="station-date">收录日期 ${escapeHtml(formatDate(site.establishedDate))}</span></div>
      ${description}
      <div class="station-meta"><span>延迟 <strong>${formatLatency(site.latencyMs)}</strong></span><span>模型 <strong>${site.modelCount} 个</strong></span><span>评价 <strong>${site.userRating !== null && site.ratingCount ? `${number.format(site.userRating)}/5 · ${site.ratingCount} 条` : "暂无"}</strong></span></div>
      <div class="chips">${renderChips(site.models)}</div>
      <div class="station-actions"><a class="detail-link" href="${escapeHtml(site.url)}" target="_blank" rel="nofollow noopener" referrerpolicy="origin">查看公开资料</a><span class="policy">退款：${policy(site.supportsRefund)} · 发票：${policy(site.supportsInvoice)}</span></div>
      ${details}
    </div>
    <div class="station-score ${scoreClass}"><strong>${formatUptime(site.uptime)}</strong><span>公开在线率</span></div>
  </article>`;
}

function pagePath(page) {
  return page === 1 ? "/" : `/page/${page}/`;
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
    <div class="section-heading"><div><p class="section-kicker">MODEL DIRECTORIES</p><h2 id="topics-title">按模型查找中转站</h2></div><p>模型专题页同样是构建时生成的 HTML。先确定协议和模型，再比较公开指标，会比只看综合顺序更接近真实需求。</p></div>
    <div class="topic-grid">${TOPICS.map((topic) => {
      const count = allSites.filter((site) => topicMatches(site, topic)).length;
      return `<a class="topic-card" href="/${topic.slug}/"><small>${escapeHtml(topic.short)}</small><h3>${escapeHtml(topic.label)}</h3><p>${escapeHtml(topic.intro)}</p><strong>${count} 家相关站点 →</strong></a>`;
    }).join("")}</div>
  </section>`;
}

function renderGuide() {
  const steps = [
    ["01", "先写清硬性需求", "列出必须支持的模型、协议、上下文、工具调用、文件能力、预算和并发，避免被无关的低价或模型数量带偏。"],
    ["02", "统一复算实际价格", "同时计算充值换算、输入输出单价、缓存读写、模型倍率和分组倍率，用一条真实账单比较不同站点。"],
    ["03", "用真实任务压测", "短问候无法暴露问题。应测试长上下文、结构化输出、工具调用、流式断连、错误恢复和高峰期成功率。"],
    ["04", "核对隐私与主体", "检查日志保留、数据用途、删除机制、运营主体、退款条款和公告渠道；敏感数据尽量不经过未知第三方。"],
    ["05", "小额充值并限额", "只充值近期用量，为不同项目使用独立密钥和额度限制，发现模型映射或账单异常时可以迅速止损。"],
    ["06", "始终准备备用接口", "关键业务不要依赖单一中转站。保留官方 API 或第二供应商，并提前验证切换流程和客户端配置。"],
  ];
  return `<section class="content-section" id="guide" aria-labelledby="guide-title">
    <div class="section-heading"><div><p class="section-kicker">SELECTION GUIDE</p><h2 id="guide-title">AI 中转站怎么选</h2></div><p>把排行榜当作候选目录，而不是结论。真正有效的比较来自同一网络、同一任务、同一时间段下的可复现测试。</p></div>
    <div class="guide-grid">${steps.map(([index, title, text]) => `<article class="guide-card"><span>${index}</span><h3>${title}</h3><p>${text}</p></article>`).join("")}</div>
  </section>
  <section class="content-section editorial" aria-labelledby="method-title">
    <h2 id="method-title">读懂中转站排名与公开指标</h2>
    <div class="editorial-body">
      <h3>在线率和延迟只能说明部分问题</h3><p>公开在线率、延迟和用户评价适合初步缩小范围，但不能替代模型真实性、上下文、缓存、工具调用和账单测试。网页能打开也不等于模型上游畅通；一次请求很快也不代表晚高峰稳定。</p>
      <h3>相邻名次不应被理解为精确差距</h3><p>本站先按数据源的公开顺序选择前 400 家以内的站点，再在每 5 家的小分组内使用当天固定种子轻微调整展示顺序。这样保留大致层级，同时避免把相邻名次包装成过度精确的质量结论。当天重复构建的顺序保持稳定。</p>
      <h3>模型数量多不等于每条线路都可靠</h3><p>同一站点可能接入官方渠道、云厂商渠道、订阅池或第三方适配服务，不同模型的稳定性和功能完整度可能差异很大。应针对具体模型测试，而不是把站点层面的指标直接套到所有渠道。</p>
      <h3>价格比较必须回到请求级账单</h3><p>“0.1 倍率”“美元额度”和“官方价折扣”常采用不同换算口径。至少要核对人民币充值可获得多少站内单位、输入输出是否分开计费、缓存是否单独计费，以及用户分组是否叠加倍率。</p>
      <h3>隐私、安全和余额风险需要单独判断</h3><p>本站收录不代表安全审计或商业背书。中转站可能接触请求和响应内容，也可能受到上游政策、账号风控、线路和经营状况影响。涉及私钥、客户数据、未公开代码或强 SLA 时，应优先使用官方 API 或可签约、可审计的企业服务。</p>
    </div>
  </section>
  <section class="content-section" id="faq" aria-labelledby="faq-title"><div class="section-heading"><div><p class="section-kicker">FAQ</p><h2 id="faq-title">AI 中转站常见问题</h2></div><p>这些答案用于建立筛选标准。具体模型、价格和政策会变化，最终以站点当前说明和自己的实测为准。</p></div><div class="faq-list">${FAQ.map(([question, answer]) => `<details class="faq-item"><summary>${escapeHtml(question)}</summary><div class="faq-answer"><p>${escapeHtml(answer)}</p></div></details>`).join("")}</div></section>`;
}

function objectiveSummary(site) {
  const parts = [`推荐顺序第 ${site.rank}`];
  if (site.uptime !== null) parts.push(`公开在线率 ${formatUptime(site.uptime)}`);
  if (site.latencyMs !== null) parts.push(`平均延迟 ${formatLatency(site.latencyMs)}`);
  parts.push(`收录模型 ${site.modelCount} 个`);
  return `${parts.join("；")}。公开信息仅用于初筛。`;
}

function jsonLdForPage({ page, canonical, title, description, sites, allSites, built }) {
  const breadcrumb = page === 1
    ? [{ "@type": "ListItem", position: 1, name: "AI 中转站推荐", item: canonical }]
    : [{ "@type": "ListItem", position: 1, name: "AI 中转站推荐", item: `${ORIGIN}/` }, { "@type": "ListItem", position: 2, name: `第 ${page} 页`, item: canonical }];
  const graph = [
    { "@type": "WebSite", "@id": `${ORIGIN}/#website`, url: `${ORIGIN}/`, name: "AI 中转站推荐", inLanguage: "zh-CN" },
    { "@type": "CollectionPage", "@id": `${canonical}#webpage`, url: canonical, name: title, description, inLanguage: "zh-CN", dateModified: built.iso, isPartOf: { "@id": `${ORIGIN}/#website` }, breadcrumb: { "@id": `${canonical}#breadcrumb` }, mainEntity: { "@id": `${canonical}#ranking` } },
    { "@type": "BreadcrumbList", "@id": `${canonical}#breadcrumb`, itemListElement: breadcrumb },
    { "@type": "ItemList", "@id": `${canonical}#ranking`, name: `AI API 中转站推荐列表第 ${page} 页`, numberOfItems: allSites.length, itemListOrder: "https://schema.org/ItemListOrderAscending", itemListElement: sites.map((site) => ({ "@type": "ListItem", position: site.rank, item: { "@type": "Service", name: site.name, url: site.url, description: objectiveSummary(site), serviceType: "AI API 中转服务" } })) },
  ];
  if (page === 1) graph.push({ "@type": "FAQPage", "@id": `${canonical}#faq`, mainEntity: FAQ.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) });
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replaceAll("<", "\\u003c");
}

function renderPage({ page, totalPages, sites, allSites, built }) {
  const root = page === 1 ? "." : "../..";
  const canonical = `${ORIGIN}${pagePath(page)}`;
  const first = sites[0].rank;
  const last = sites.at(-1).rank;
  const title = page === 1 ? "AI 中转站推荐" : `AI 中转站推荐第 ${page} 页｜第 ${first}–${last} 名`;
  const description = page === 1
    ? `AI 中转站推荐榜收录 ${allSites.length} 家 AI API 中转站的公开信息，提供 OpenAI、Claude、Gemini、Codex 等模型专题、在线率、延迟、选择指南与风险提示。`
    : `AI 中转站推荐榜第 ${page} 页，静态展示推荐顺序第 ${first}–${last} 名的 AI API 中转站公开在线率、延迟、模型和服务信息。`;
  const relations = { previous: page > 1 ? `${ORIGIN}${pagePath(page - 1)}` : "", next: page < totalPages ? `${ORIGIN}${pagePath(page + 1)}` : "" };
  const pageStats = stats(sites);
  const jsonLd = jsonLdForPage({ page, canonical, title, description, sites, allSites, built });
  return `<!doctype html>
<html lang="zh-CN"><head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="keywords" content="AI 中转站推荐,API 中转站排名,中转站推荐,AI API 中转站,OpenAI 中转站,Claude 中转站,Gemini 中转站,Codex 中转站" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <meta name="author" content="AI 中转站推荐" />
  <meta name="theme-color" content="#ffffff" />
  <meta property="og:type" content="website" /><meta property="og:locale" content="zh_CN" /><meta property="og:site_name" content="AI 中转站推荐" />
  <meta property="og:title" content="${escapeHtml(title)}" /><meta property="og:description" content="${escapeHtml(description)}" /><meta property="og:url" content="${canonical}" /><meta property="og:image" content="${ORIGIN}/assets/og-image.png" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta property="og:image:alt" content="AI 中转站推荐榜" />
  <meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${escapeHtml(title)}" /><meta name="twitter:description" content="${escapeHtml(description)}" /><meta name="twitter:image" content="${ORIGIN}/assets/og-image.png" />
  <link rel="canonical" href="${canonical}" /><link rel="alternate" hreflang="zh-CN" href="${canonical}" /><link rel="alternate" hreflang="x-default" href="${canonical}" />
  ${relations.previous ? `<link rel="prev" href="${relations.previous}" />` : ""}${relations.next ? `<link rel="next" href="${relations.next}" />` : ""}
  <link rel="icon" href="${root}/assets/favicon.svg" type="image/svg+xml" /><link rel="stylesheet" href="${root}/assets/styles.min.css" />
  <script type="application/ld+json">${jsonLd}</script>
</head><body data-generated-at="${built.iso}">
  <a class="skip-link" href="#main">跳到主要内容</a>
  <header class="site-header"><div class="header-inner"><a class="brand" href="${root}/" aria-label="AI 中转站推荐首页"><span class="brand-mark">API</span><span>AI 中转站推荐</span></a><nav class="site-nav" aria-label="主要导航"><a href="${root}/#ranking">排行榜</a><a href="${root}/#topics">模型专题</a><a href="${root}/#guide">怎么选</a><a href="${root}/#faq">常见问题</a></nav></div></header>
  <main id="main">
    <nav class="breadcrumbs" aria-label="面包屑">${page === 1 ? '<span aria-current="page">AI 中转站推荐</span>' : `<a href="${root}/">AI 中转站推荐</a><span aria-hidden="true">/</span><span aria-current="page">第 ${page} 页</span>`}</nav>
    <section class="hero"><p class="eyebrow">AI API RELAY DIRECTORY · 2026</p><h1>${page === 1 ? 'AI 中转站<span>推荐</span>' : `AI 中转站推荐<br /><span>第 ${page} 页</span>`}</h1><p class="hero-copy">收录最多 400 家 AI API 中转站公开资料，按静态 HTML 分页展示。比较在线率、延迟、模型覆盖和服务信息，并通过模型专题与选择指南建立自己的测试标准。</p><ul class="hero-meta"><li>每天自动更新两次</li><li>本次更新 <time datetime="${built.iso}">${built.visible}</time></li><li>公开信息仅用于初筛</li></ul></section>
    <dl class="summary-grid"><div class="summary-card summary-card--primary"><dt>本期收录</dt><dd>${allSites.length} 家</dd><small>上限 ${MAX_SITES} 家，全部写入静态 HTML</small></div><div class="summary-card"><dt>当前分页</dt><dd>${page} / ${totalPages}</dd><small>本页展示 ${sites.length} 家</small></div><div class="summary-card"><dt>在线率中位数</dt><dd>${pageStats.uptime.value === null ? "暂无" : formatUptime(pageStats.uptime.value)}</dd><small>样本 ${pageStats.uptime.sample}/${sites.length}</small></div><div class="summary-card"><dt>延迟中位数</dt><dd>${pageStats.latency.value === null ? "暂无" : formatLatency(pageStats.latency.value)}</dd><small>样本 ${pageStats.latency.sample}/${sites.length}</small></div></dl>
    ${page === 1 ? '<section class="answer-panel" aria-labelledby="answer-title"><div><p class="section-kicker">QUICK ANSWER</p><h2 id="answer-title">推荐榜应该怎么看？</h2><p>先用榜单筛出候选站，再根据自己需要的模型、协议和预算小额实测。相邻名次不是精确质量差，本站会在每 5 家的小分组内做轻微、当天稳定的顺序调整。</p></div><div class="answer-points"><div><strong>先看模型</strong><span>确认具体版本、协议和上下文</span></div><div><strong>再看实测</strong><span>比较成功率、延迟和工具调用</span></div><div><strong>复算账单</strong><span>统一充值与倍率口径</span></div><div><strong>控制风险</strong><span>小额充值并保留备用接口</span></div></div></section>' : ""}
    <section id="ranking" aria-labelledby="ranking-title"><div class="ranking-toolbar"><div><p class="section-kicker">RANKING / ${String(page).padStart(2, "0")}</p><h2 id="ranking-title">AI API 中转站推荐列表</h2><p>当前显示第 ${first}–${last} 名，共 ${allSites.length} 家</p></div><div class="search-box"><label for="station-search">筛选当前页（显示 <span data-visible-count>${sites.length}</span> 家）</label><input id="station-search" type="search" inputmode="search" autocomplete="off" placeholder="输入站点名、模型或支付方式" data-station-search /></div></div>
      <p class="ranking-note">本站不出售排名，也不构成安全审计、官方授权或服务担保。指标会随线路和上游变化，请在充值前访问资料页核对最新模型、价格、退款和隐私政策。</p>
      <div class="ranking-rules"><details><summary><span class="rules-title">排名与数据说明</span><span class="rules-brief">最多 400 条 · 相邻小组轻微扰动 · 页面更新时间取构建当前时间</span></summary><div class="rules-body"><p>数据来源为公开目录。构建器先按来源顺序截取前 ${MAX_SITES} 家，再按当天固定种子在每 ${SHUFFLE_GROUP_SIZE} 家范围内调整展示顺序，因此大致层级保留、相邻名次不过度精确。</p><ul><li>页面展示的更新时间来自本次构建时间，不使用 data.json 中的日期。</li><li>公开在线率、延迟和评价可能缺少样本，不能单独证明模型真实性或长期稳定性。</li><li>外部链接使用 nofollow，并指向公开资料页；充值和使用决策由访问者自行判断。</li></ul></div></details></div>
      <section class="page-analysis" aria-label="本页数据概览"><h3>本页数据概览</h3><p>第 ${first}–${last} 名中，在线率有效样本 ${pageStats.uptime.sample} 家，延迟有效样本 ${pageStats.latency.sample} 家，模型数量有效样本 ${pageStats.models.sample} 家，用户评分有效样本 ${pageStats.rating.sample} 家。</p><dl class="analysis-grid"><div><dt>在线率中位数</dt><dd>${pageStats.uptime.value === null ? "暂无" : formatUptime(pageStats.uptime.value)}</dd><small>${pageStats.uptime.sample}/${sites.length}</small></div><div><dt>延迟中位数</dt><dd>${pageStats.latency.value === null ? "暂无" : formatLatency(pageStats.latency.value)}</dd><small>${pageStats.latency.sample}/${sites.length}</small></div><div><dt>模型数量中位数</dt><dd>${pageStats.models.value === null ? "暂无" : `${number.format(pageStats.models.value)} 个`}</dd><small>${pageStats.models.sample}/${sites.length}</small></div><div><dt>评分中位数</dt><dd>${pageStats.rating.value === null ? "暂无" : `${number.format(pageStats.rating.value)} / 5`}</dd><small>${pageStats.rating.sample}/${sites.length}</small></div></dl></section>
      <div class="station-list">${sites.map(renderStation).join("")}</div><div class="search-empty" data-search-empty>当前页没有匹配结果，请尝试更短的关键词。</div>${renderPagination(page, totalPages)}
    </section>
    ${page === 1 ? `${renderTopics(allSites)}${renderGuide()}` : `<section class="continue-card"><h2>看完第 ${page} 页？</h2><p>返回首页查看模型专题、选择方法、费用口径、隐私风险和常见问题。</p><a href="${root}/#guide">阅读完整选择指南 →</a></section>`}
  </main>
  <footer class="site-footer"><div class="footer-inner"><div><a class="brand" href="${root}/"><span class="brand-mark">API</span><span>AI 中转站推荐</span></a><p>公开资料用于初筛；先小额测试，后决定长期使用。</p></div><a href="#main">返回顶部 ↑</a></div></footer>
  <script src="${root}/assets/site.js" defer></script>
</body></html>`;
}

function topicFaq(topic) {
  return [
    [`${topic.label}应该怎么选？`, `先确认站点明确支持所需模型和接口，再用自己的真实任务测试流式输出、工具调用、上下文、成功率和账单。不要只依据首页价格或一次短对话决定长期使用。`],
    [`${topic.label}价格怎样比较？`, "统一换算人民币充值比例、输入价格、输出价格、缓存读写、模型倍率和用户分组倍率，再复算一条实际请求。"],
    [`${topic.label}可以直接用于生产环境吗？`, "个人学习可以先小额测试；生产环境还要评估数据隐私、运营主体、日志政策、限流、故障公告、合同责任和备用供应商。"],
  ];
}

function renderTopicPage({ topic, matches, allSites, built }) {
  const shown = matches.slice(0, PAGE_SIZE);
  const canonical = `${ORIGIN}/${topic.slug}/`;
  const title = `${topic.label}推荐｜AI 中转站推荐`;
  const description = `${topic.label}专题收录 ${matches.length} 家相关 AI API 中转站公开资料，对比在线率、延迟、模型数量，并提供计费、能力验证和风险选择指南。`;
  const topicStats = stats(matches);
  const faq = topicFaq(topic);
  const jsonLd = JSON.stringify({ "@context": "https://schema.org", "@graph": [
    { "@type": "CollectionPage", "@id": `${canonical}#webpage`, url: canonical, name: title, description, inLanguage: "zh-CN", dateModified: built.iso, mainEntity: { "@id": `${canonical}#ranking` } },
    { "@type": "BreadcrumbList", "@id": `${canonical}#breadcrumb`, itemListElement: [{ "@type": "ListItem", position: 1, name: "AI 中转站推荐", item: `${ORIGIN}/` }, { "@type": "ListItem", position: 2, name: topic.label, item: canonical }] },
    { "@type": "ItemList", "@id": `${canonical}#ranking`, name: `${topic.label}候选列表`, numberOfItems: matches.length, itemListElement: shown.map((site, index) => ({ "@type": "ListItem", position: index + 1, item: { "@type": "Service", name: site.name, url: site.url, description: objectiveSummary(site) } })) },
    { "@type": "FAQPage", mainEntity: faq.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
  ] }).replaceAll("<", "\\u003c");
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}" /><meta name="keywords" content="${escapeHtml(topic.label)},${escapeHtml(topic.short)},AI 中转站推荐,API 中转站排名" /><meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" /><meta name="theme-color" content="#ffffff" /><meta property="og:type" content="website" /><meta property="og:locale" content="zh_CN" /><meta property="og:site_name" content="AI 中转站推荐" /><meta property="og:title" content="${escapeHtml(title)}" /><meta property="og:description" content="${escapeHtml(description)}" /><meta property="og:url" content="${canonical}" /><meta property="og:image" content="${ORIGIN}/assets/og-image.svg" /><meta name="twitter:card" content="summary_large_image" /><link rel="canonical" href="${canonical}" /><link rel="alternate" hreflang="zh-CN" href="${canonical}" /><link rel="icon" href="../assets/favicon.svg" type="image/svg+xml" /><link rel="stylesheet" href="../assets/styles.min.css" /><script type="application/ld+json">${jsonLd}</script></head><body data-generated-at="${built.iso}"><a class="skip-link" href="#main">跳到主要内容</a><header class="site-header"><div class="header-inner"><a class="brand" href="../"><span class="brand-mark">API</span><span>AI 中转站推荐</span></a><nav class="site-nav" aria-label="主要导航"><a href="../#ranking">排行榜</a><a href="../#topics">模型专题</a><a href="../#guide">怎么选</a><a href="#faq">常见问题</a></nav></div></header><main id="main"><nav class="breadcrumbs" aria-label="面包屑"><a href="../">AI 中转站推荐</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHtml(topic.label)}</span></nav><section class="hero topic-hero"><p class="eyebrow">MODEL DIRECTORY · ${escapeHtml(topic.short)}</p><h1>${escapeHtml(topic.label)}<br /><span>推荐与对比</span></h1><p class="hero-copy topic-intro">${escapeHtml(topic.intro)}</p><ul class="hero-meta"><li>${matches.length} 家相关站点</li><li>展示前 ${shown.length} 家</li><li>更新 <time datetime="${built.iso}">${built.visible}</time></li></ul></section><dl class="topic-highlight"><div><dt>相关站点</dt><dd>${matches.length} 家</dd></div><div><dt>在线率中位数</dt><dd>${topicStats.uptime.value === null ? "暂无" : formatUptime(topicStats.uptime.value)}</dd></div><div><dt>延迟中位数</dt><dd>${topicStats.latency.value === null ? "暂无" : formatLatency(topicStats.latency.value)}</dd></div><div><dt>模型数量中位数</dt><dd>${topicStats.models.value === null ? "暂无" : `${number.format(topicStats.models.value)} 个`}</dd></div></dl><section aria-labelledby="topic-ranking-title"><div class="ranking-toolbar"><div><p class="section-kicker">MODEL RANKING</p><h2 id="topic-ranking-title">${escapeHtml(topic.label)}候选站</h2><p>按综合推荐顺序展示匹配站点，模型与线路请在充值前复核。</p></div><div class="search-box"><label for="station-search">筛选当前专题（显示 <span data-visible-count>${shown.length}</span> 家）</label><input id="station-search" type="search" placeholder="输入站点名或模型" data-station-search /></div></div><p class="ranking-note">公开资料提及相关模型不代表当前通道始终可用，也不代表官方授权。请测试具体模型版本、协议、上下文、工具调用、账单和高峰期稳定性。</p><div class="station-list">${shown.map(renderStation).join("")}</div><div class="search-empty" data-search-empty>当前专题没有匹配结果。</div></section><section class="content-section editorial"><h2>选择 ${escapeHtml(topic.label)} 的验证重点</h2><div class="editorial-body"><h3>核对协议和模型映射</h3><p>${escapeHtml(topic.intro)} 不要把“兼容 OpenAI”直接理解为保留全部原生能力，应逐项测试错误格式、流式响应、工具调用、缓存和模型标识。</p><h3>用长任务而不是问候语测试</h3><p>使用真实文档、代码仓库或多轮 Agent 任务，记录首字时间、完整耗时、失败率、上下文截断、重试次数和单次扣费。换时间段复测，才能发现高峰期排队和账号池切换问题。</p><h3>为生产调用准备退路</h3><p>把接口地址、模型映射和密钥配置集中管理，确保能快速切换到官方 API 或第二供应商。敏感数据、强 SLA 和不可重试任务不应只依赖无法审计的第三方链路。</p></div></section><section class="content-section" id="faq"><div class="section-heading"><div><p class="section-kicker">FAQ</p><h2>${escapeHtml(topic.label)}常见问题</h2></div><p>模型、价格和政策会变化，最终以站点实时说明和自己的请求级测试为准。</p></div><div class="faq-list">${faq.map(([question, answer]) => `<details class="faq-item"><summary>${escapeHtml(question)}</summary><div class="faq-answer"><p>${escapeHtml(answer)}</p></div></details>`).join("")}</div></section>${renderTopics(allSites)}</main><footer class="site-footer"><div class="footer-inner"><div><a class="brand" href="../"><span class="brand-mark">API</span><span>AI 中转站推荐</span></a><p>公开资料用于初筛；先小额测试，后决定长期使用。</p></div><a href="#main">返回顶部 ↑</a></div></footer><script src="../assets/site.js" defer></script></body></html>`;
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
  const urls = [...Array.from({ length: totalPages }, (_, index) => `${ORIGIN}${pagePath(index + 1)}`), ...TOPICS.map((topic) => `${ORIGIN}/${topic.slug}/`)];
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
  const sites = prepareSites(payload.sites, built.day);
  const totalPages = Math.ceil(sites.length / PAGE_SIZE);
  await cleanOldPages(totalPages);
  await atomicWrite(MINIFIED_STYLES_PATH, minifyCss(await readFile(STYLES_PATH, "utf8")));
  for (let page = 1; page <= totalPages; page += 1) {
    const pageSites = sites.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const target = page === 1 ? path.join(ROOT, "index.html") : path.join(PAGE_ROOT, String(page), "index.html");
    await atomicWrite(target, minifyHtml(renderPage({ page, totalPages, sites: pageSites, allSites: sites, built })));
  }
  for (const topic of TOPICS) {
    const matches = sites.filter((site) => topicMatches(site, topic));
    await atomicWrite(path.join(ROOT, topic.slug, "index.html"), minifyHtml(renderTopicPage({ topic, matches, allSites: sites, built })));
  }
  await atomicWrite(path.join(ROOT, "sitemap.xml"), renderSitemap(totalPages, built));
  process.stdout.write(`已生成 ${totalPages} 个静态分页、${TOPICS.length} 个模型专题，共 ${sites.length} 家；页面时间 ${built.visible}\n`);
}

await build();
