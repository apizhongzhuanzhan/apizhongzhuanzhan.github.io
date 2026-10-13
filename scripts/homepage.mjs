// The homepage is a complete, readable guide; the full directory has its own URL.
export const HOME_KEYWORDS = [
  "ai中转站", "api中转站", "中转站推荐", "gpt中转站", "api中转站推荐", "中转站api",
  "gemini中转站", "ai中转站推荐", "glm中转站", "中转站", "ai中转", "gpt api中转站",
  "gpt6中转站", "api站", "api中转站怎么选？", "api推荐", "国内api中转站推荐", "api ranking",
  "中转站api推荐", "api中转平台", "api中转平台推荐", "kiro逆向", "api平台推荐", "api中转",
];

export const HOME_FAQ = [
  ["API站、API中转平台和AI中转有什么区别？", "API站是提供模型、搜索、语音等接口的网站。AI中转负责转发模型请求；API中转平台在此基础上提供多模型路由、统一计费和用量管理。选站时按模型、协议、计费和服务条件比较，就能找到适合项目的接入方式。"],
  ["国内API中转站推荐，重点看什么？", "重点看国内网络接入、人民币支付、中文文档和客服响应。日常使用时，在自己的网络和常用时段体验响应速度；有国内部署要求的项目，再按实际处理位置、运营主体和合同条款筛选。"],
  ["中转站API推荐重点看哪些指标？", "在线率看服务可用性，首字延迟看响应速度，完整耗时看任务效率。编程和多轮对话还要看工具调用、长上下文与缓存。把这些指标与所需模型一起比较，选站更直接。"],
  ["API中转平台推荐要看哪些服务条款？", "查看余额有效期、退款条件、充值到账单位、速率与并发、日志设置和联系渠道。需要发票或对公付款时，选择提供对应服务的站点；清楚的账单和服务条款便于长期管理用量。"],
  ["GPT API中转站和GPT6中转站怎样接入？", "在站点模型目录找到完整模型 ID，配置 Base URL 与 API Key，再选择客户端使用的 Responses 或 Chat Completions 接口。编程场景重点体验流式输出、工具调用、上下文与缓存；多模态任务再查看图片等输入能力。"],
  ["Gemini中转站、GLM中转站怎样搭配？", "按任务选择模型。Gemini 常用于多模态与长文档，GLM 可用于中文应用和工具调用。统一接口便于在项目里切换模型，再用同一组任务比较输出质量、响应速度和实际扣费。"],
  ["低倍率和注册赠额怎样比较？", "把官方价折扣、面板模型倍率和分组倍率分开计算，再加上充值换算、输出与缓存费用。注册赠额适合体验线路，使用前查看额度单位、有效期、支持模型以及扣款顺序。按任务的最终人民币成本比较最清楚。"],
  ["API推荐和API ranking榜单怎样搭配使用？", "先从站点清单选出需要的模型，再在禾维 AI 查看具体模型的近期实测，在 AI API Rank 比较综合排名、在线率、延迟、支付与服务政策。把模型表现和服务条件放在一起，能更快缩小选择范围。"],
  ["中转站怎样处理请求数据？", "中转网关接收请求、调用上游模型并返回响应。HTTPS 保护传输过程，日志保留与数据用途在站点隐私设置或服务条款中查看。团队项目可按数据处理、签约和审计要求选择服务，为每个项目配置独立密钥。"],
  ["突然出现401、404、429，怎么排查？", "401 先检查 API Key、鉴权格式及客户端变量；404 检查 Base URL、是否需要 /v1 和模型 ID；429 查看余额、速率、并发限制及上游公告。网页可访问而请求失败时，分别检查 API 连通性和客户端配置。不要把含完整 Key 的日志发到公开群。"],
];

const escape = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const number = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 1 });
const policy = (value) => value === true ? "支持" : value === false ? "不支持" : "—";
const modelNames = { OpenAI: "GPT / OpenAI", Anthropic: "Claude", Google: "Gemini", 智谱: "GLM", 阿里云: "Qwen", 月之暗面: "Kimi" };

function renderRow(site) {
  const models = site.models.map((model) => modelNames[model] || model);
  return `<tr data-station-card id="rank-${site.rank}">
    <td class="pick-rank"><span>${site.rank.toString().padStart(2, "0")}</span></td>
    <th scope="row" class="pick-name"><a href="${escape(site.url)}" target="_blank" rel="nofollow noopener" referrerpolicy="origin">${escape(site.name)}</a><p>${escape(models.join(" · ") || "模型 —")}</p><small>${site.modelCount} 个模型${site.establishedDate ? ` · 创建于 ${escape(site.establishedDate)}` : ""}</small></th>
    <td class="pick-quality"><span class="cell-label">运行指标</span><strong>${site.uptime === null ? "在线率 —" : `${number.format(site.uptime)}% 在线率`}</strong><span>${site.latencyMs === null ? "延迟 —" : `${number.format(site.latencyMs / 1000)} 秒平均延迟`}</span></td>
    <td class="pick-policy"><span class="cell-label">支付与政策</span><span>退款 ${policy(site.supportsRefund)}<br />发票 ${policy(site.supportsInvoice)}</span><small>${escape(site.paymentMethods.join(" / ") || "支付方式 —")}</small></td>
    <td class="pick-link"><a class="detail-link" href="${escape(site.url)}" target="_blank" rel="nofollow noopener" referrerpolicy="origin">查看资料</a></td>
  </tr>`;
}

function heading(index, title, text) {
  return `<div class="guide-heading"><p class="section-kicker">${index}</p><h2>${title}</h2>${text ? `<p>${text}</p>` : ""}</div>`;
}

export function renderHomepage({ allSites, built, topicsHtml, analytics }) {
  const sites = allSites.slice(0, 20);
  const origin = "https://apizhongzhuanzhan.github.io";
  const title = "API中转站推荐与使用指南｜前20名、榜单与选站方法";
  const description = "API中转站推荐与使用指南：按公开排名精选前20家AI中转站，提供禾维AI与AI API Rank榜单入口，讲清GPT、Gemini、GLM中转站怎么选、倍率充值、缓存计费、Kiro逆向与常见问题。";
  const toc = [["ranking", "站点清单"], ["what", "中转站是什么"], ["types", "三种服务类型"], ["price", "倍率与充值"], ["guide", "怎么选"], ["risk", "使用与避坑"], ["topics", "按模型选择"], ["faq", "常见问题"]];
  const jsonLd = JSON.stringify({ "@context": "https://schema.org", "@graph": [
    { "@type": "WebSite", "@id": `${origin}/#website`, url: `${origin}/`, name: "API 中转站评测与推荐", inLanguage: "zh-CN" },
    { "@type": "CollectionPage", "@id": `${origin}/#webpage`, url: `${origin}/`, name: title, description, dateModified: built.iso, inLanguage: "zh-CN", isPartOf: { "@id": `${origin}/#website` }, mainEntity: { "@id": `${origin}/#ranking` }, breadcrumb: { "@id": `${origin}/#breadcrumb` } },
    { "@type": "BreadcrumbList", "@id": `${origin}/#breadcrumb`, itemListElement: [{ "@type": "ListItem", position: 1, name: "中转站指南", item: `${origin}/` }] },
    { "@type": "ItemList", "@id": `${origin}/#ranking`, name: "值得长期用的 API中转站推荐前20名", numberOfItems: sites.length, itemListOrder: "https://schema.org/ItemListOrderAscending", itemListElement: sites.map((site) => ({ "@type": "ListItem", position: site.rank, item: { "@type": "Service", name: site.name, url: site.url, serviceType: "AI API 中转服务" } })) },
    { "@type": "FAQPage", "@id": `${origin}/#faq`, mainEntity: HOME_FAQ.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
  ] }).replaceAll("<", "\\u003c");
  return `<!doctype html><html lang="zh-CN"><head>
    <meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title><meta name="description" content="${description}" /><meta name="keywords" content="${HOME_KEYWORDS.join(",")}" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" /><meta name="author" content="API 中转站评测与推荐" /><meta name="theme-color" content="#faf9f6" />
    <meta property="og:type" content="website" /><meta property="og:locale" content="zh_CN" /><meta property="og:site_name" content="API 中转站评测与推荐" /><meta property="og:title" content="${title}" /><meta property="og:description" content="${description}" /><meta property="og:url" content="${origin}/" /><meta property="og:image" content="${origin}/assets/og-image.png" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta property="og:image:alt" content="API 中转站推荐与使用指南" />
    <meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${title}" /><meta name="twitter:description" content="${description}" /><meta name="twitter:image" content="${origin}/assets/og-image.png" />
    <link rel="canonical" href="${origin}/" /><link rel="alternate" hreflang="zh-CN" href="${origin}/" /><link rel="alternate" hreflang="x-default" href="${origin}/" />
    <link rel="icon" href="./assets/favicon.svg" type="image/svg+xml" /><link rel="stylesheet" href="./assets/styles.min.css" />
    <script type="application/ld+json">${jsonLd}</script>${analytics}
  </head><body class="homepage" data-generated-at="${built.iso}">
    <a class="skip-link" href="#main">跳到主要内容</a>
    <header class="site-header"><div class="header-inner"><a class="brand" href="/" aria-label="中转站指南首页"><span class="brand-mark">API</span><span>中转站指南</span></a><nav class="site-nav" aria-label="主要导航"><a href="#ranking">站点清单</a><a href="#price">倍率与充值</a><a href="#guide">怎么选</a><a href="#faq">常见问题</a><a href="/directory/">完整目录 ↗</a></nav></div></header>
    <main id="main">
      <section class="guide-hero" aria-labelledby="home-title"><p class="eyebrow">2026 / AI API RELAY GUIDE</p><h1 id="home-title">API中转站推荐，<br /><span>选站之前把账算明白。</span></h1><p class="hero-copy">值得长期用的API中转站、模型实测榜单和计费指南，都放在这一页。对比模型、响应速度与服务政策，选好线路，轻松接入。</p><div class="hero-bottom"><p>本次更新 <time datetime="${built.iso}">${built.visible}</time><br />精选 ${sites.length} 家 · 完整目录 ${allSites.length} 家 · 每天自动更新两次</p><a class="guide-button" href="#ranking">查看站点清单 <span aria-hidden="true">↓</span></a></div></section>
      <div class="reading-layout"><aside class="reading-sidebar"><nav aria-label="本页目录"><p>本页内容</p>${toc.map(([id, label], index) => `<a href="#${id}"><span>${String(index + 1).padStart(2, "0")}</span>${label}</a>`).join("")}<a class="toc-directory" href="/directory/">浏览 ${allSites.length} 家目录 ↗</a></nav><p class="sidebar-note">按模型选站。<br />按任务比价。<br />更快完成接入。</p></aside>
      <div class="reading-content">
        <section class="guide-section" id="ranking" aria-labelledby="ranking-title">
          <div class="guide-heading"><p class="section-kicker">01 / 站点清单</p><h2 id="ranking-title">20家API中转站，一页对比。</h2><p>清单分两部分：值得长期用的 AI API中转站推荐列表，以及方便比较模型实测与服务信息的中转站聚合榜单。</p></div>
          <div class="list-heading"><div><h3>一 · 值得长期用的</h3><p>按公开目录的原始排名选前20名，顺序随数据同步更新。</p></div><span class="list-badge">TOP ${sites.length}</span></div>
          <p class="guide-callout">这20家按公开目录排名精选，集中展示模型覆盖、在线率、响应速度和服务政策。按你使用的模型筛选，快速找到适合日常调用和开发接入的API中转站。</p>
          <div class="pick-toolbar"><p>按站点名、模型或支付方式筛选，快速找到合适的服务。</p><div class="search-box"><label for="station-search">筛选清单 · <span data-visible-count>${sites.length}</span> 家</label><input id="station-search" type="search" data-station-search placeholder="站点名、模型、支付方式" autocomplete="off" /></div></div>
          <table class="pick-table"><caption class="sr-only">值得长期用的中转站推荐前20名</caption><thead><tr><th scope="col">排名</th><th scope="col">站点 / 模型</th><th scope="col">运行指标</th><th scope="col">支付与政策</th><th scope="col">资料</th></tr></thead><tbody>${sites.map(renderRow).join("")}</tbody></table>
          <p class="search-empty" data-search-empty role="status">没有匹配的站点，试试更短的关键词或清空搜索。</p>
          <div class="list-footnote"><p>数据来源：awesome-ai-api。清单按原始排名更新，— 表示该项未提供。</p><a href="/directory/">查看完整 ${allSites.length} 家目录 →</a></div>
          <div class="list-heading" id="aggregators"><div><h3>二 · 中转站聚合榜单</h3><p>模型表现看实测，服务条件看综合榜单，两种入口一起对比。</p></div></div>
          <div class="aggregator-grid"><article class="aggregator-card"><div class="aggregator-top"><span>模型实测与站点档案</span><span aria-hidden="true">↗</span></div><h4><a href="https://hvoyai.com/" target="_blank" rel="noopener">禾维 AI</a></h4><p>查看 Claude、GPT、Gemini、GLM 等模型的公开实测，对比在线率、延迟、价格与站点资料。适合确认某个具体模型的近期表现。</p><div class="aggregator-links"><a href="https://hvoyai.com/leaderboard/" target="_blank" rel="noopener">查看实测榜单 ↗</a><a href="https://hvoyai.com/sites/" target="_blank" rel="noopener">站点目录 ↗</a></div><small>hvoyai.com</small></article>
          <article class="aggregator-card"><div class="aggregator-top"><span>综合排名与条件筛选</span><span aria-hidden="true">↗</span></div><h4><a href="https://aiapirank.github.io/" target="_blank" rel="noopener">AI API Rank</a></h4><p>集中比较中转站在线率、延迟、模型覆盖、用户评价、支付方式以及退款与发票信息。适合按服务条件快速筛选站点。</p><div class="aggregator-links"><a href="https://aiapirank.github.io/" target="_blank" rel="noopener">查看综合排行榜 ↗</a></div><small>aiapirank.github.io</small></article></div>
          <p class="source-note">禾维 AI 适合查看具体模型的响应与价格，AI API Rank 适合比较综合排名和服务条件。搭配这两个入口，选模型、比价格、看服务更方便。</p>
        </section>
        <section class="guide-section prose" id="what">${heading("02 / 先理解机制", "中转站是什么？", "你买到的是上游模型的调用额度，以及一条转发请求的服务链路。")}
          <p>模型客户端通常允许修改请求地址，也就是 Base URL。把官方地址换成第三方网关后，请求会先到中转站，由它用自己的上游凭证调用模型，再把响应返回给你。网关还可以提供统一密钥、限流、模型路由和计费。</p>
          <div class="request-flow" aria-label="API中转请求流程"><span>你的客户端<small>应用 / SDK / 编程工具</small></span><b aria-hidden="true">→</b><span>中转网关<small>鉴权 / 路由 / 计费</small></span><b aria-hidden="true">→</b><span>上游模型<small>API / 云渠道 / 账号池</small></span></div>
          <p>选择中转站API，重点了解两件事：<strong>上游额度来源，以及网关的请求处理方式。</strong>上游渠道决定模型与计费，网关负责协议兼容、缓存、工具调用和数据管理。</p><p>一个 Key 接入多个厂商，配合统一充值和用量管理，可以减少账号配置与接口适配。日常对话、编程工具和自己的应用，都可以按所需模型选择对应线路。</p>
        </section>
        <section class="guide-section prose" id="types">${heading("03 / 上游来源", "三种服务类型，先问清买的是哪一种。", "按模型、分组和上游渠道比较，就能看清服务能力与计费方式。")}
          <article class="type-row"><span class="type-number">A</span><div><h3>API转售：转发官方或云渠道额度</h3><p>上游使用官方 API、企业额度或云厂商渠道，通常按 token 计费。选择时对比模型版本、缓存、上下文和工具调用，再根据客户端选择原生或兼容接口。</p><p class="type-check"><strong>要问：</strong>具体上游、输入输出单价、缓存账单、故障时是否切换渠道。</p></div></article>
          <article class="type-row"><span class="type-number">B</span><div><h3>订阅池与逆向适配：把产品额度转换成接口</h3><p>将订阅账号或产品内的调用额度包装为 API，按对应产品的额度与计费方式提供服务。适合按预算体验模型与编程工具，选分组时重点查看请求次数、并发、额度周期和接口能力。</p><h4>Kiro逆向是什么？</h4><p>通常指适配 Kiro 客户端的调用链路，向外提供模型接口。接入时查看对应模型、额度周期和客户端支持，编程场景重点体验缓存、工具调用、上下文与响应速度。</p><p class="type-check"><strong>要问：</strong>每次或每天额度、支持的客户端、模型映射与客服响应。</p></div></article>
          <article class="type-row"><span class="type-number">C</span><div><h3>聚合网关：统一接入多个供应商</h3><p>在一套接口内选择多家模型服务，提供统一账单和路由，方便项目同时使用多个模型。通过供应商目录、数据政策和实际单价选择线路；OpenRouter 等服务也能用于比价。</p><p class="type-check"><strong>要问：</strong>模型由谁提供、自动路由到哪里、费用是否包含额外手续费。</p></div></article>
        </section>
        <section class="guide-section prose" id="price">${heading("04 / 费用怎么算", "倍率好看，账单也要算得清。", "比较API中转站的价格，把人民币实付、站内额度和真实请求消耗放在同一张账上。")}
          <h3>1. 先分清三种“倍率”</h3><p><strong>官方价折扣</strong>指相对于官方单价的比例；<strong>模型倍率</strong>是面板相对某个计费基准的系数；<strong>分组倍率</strong>是你所在分组叠加的系数。看到“0.3倍”时，先对应到它的计费口径，再换算实际单价。</p>
          <p>常见 new-api 的 token 计费口径使用 500,000 额度单位对应 1 个系统美元；输入模型倍率为 1 时，对应每百万输入 token 2 个系统美元。按token、固定价格和按次计费使用各自的计算方式，下面先算输入与输出token的费用。</p>
          <div class="formula-box"><span>按token计费示例 · 输入与输出费用</span><p>消耗额度 = 分组倍率 × 模型倍率<br />×（输入token + 输出token × 补全倍率）÷ 500,000</p></div>
          <h3>2. 充值换算和余额显示是两回事</h3><p>把站内额度按充值比例换算成人民币，就能看清实际调用成本。记录<strong>实际付了多少人民币、到账多少额度、使用哪个分组</strong>。显示为 ¥、$ 或积分，只是余额的展示方式。</p>
          <div class="worked-example"><p class="example-label">一笔账算完 · 以下均为假设数字</p><h4>付70元，到账10个系统美元额度</h4><p>假设分组倍率0.5、模型倍率1、补全倍率5；一次请求输入100,000 token、输出10,000 token，不涉及缓存。</p><dl><div><dt>请求消耗</dt><dd>0.5 × 1 × (100,000 + 10,000 × 5) ÷ 500,000 = <strong>0.15额度</strong></dd></div><div><dt>额度成本</dt><dd>70元 ÷ 10额度 = <strong>7元 / 额度</strong></dd></div><div><dt>人民币成本</dt><dd>0.15额度 × 7元 = <strong>1.05元</strong></dd></div></dl><p>比较每家时都算到人民币实付这一步，用同一任务的最终费用判断性价比。</p></div>
          <h3>3. 用缓存优化长任务成本</h3><p>编程工具常在后续请求里重复发送上下文。支持缓存的线路会按分组价格分别计算常规输入、缓存命中与缓存写入。查看请求明细里的缓存读写用量，更容易找到适合长会话的计费方案。</p><p>举个假设：一段输入按常规价每百万2元、缓存命中价0.2元计费。另一条线路即使常规价降到1元，若所有输入都按常规价扣，同样的缓存命中内容也会贵5倍。<strong>对长会话，把缓存费用一起算进去，比较价格更准确。</strong></p>
          <h3>4. 按量、按次与套餐，分别算</h3><ul><li><strong>按量：</strong>按输入、输出与缓存等用量扣费，适合查每次请求明细。</li><li><strong>按次：</strong>一次调用固定扣费，按任务的请求次数比较成本，同时查看重试和工具调用的计次规则。</li><li><strong>套餐：</strong>日卡、月卡或订阅常有额度、模型、并发和有效期限制。用实际能完成的任务数比较。</li></ul>
          <h3>5. 用三步核对真实费用</h3><ol><li>先看后台是否列出输入、输出、缓存读写、使用分组和扣费。</li><li>在两家用相同任务和上下文测试，保存请求用量及最终扣费；模型输出长度不同也要算进去。</li><li>首充后检查赠额和充值余额的扣款顺序、有效期，以及失败重试是否收费。</li></ol>
          <p class="source-note">计费机制参考 <a href="https://github.com/QuantumNous/new-api" target="_blank" rel="noopener">new-api 项目 ↗</a>。用所选分组的价格和请求账单，计算自己的调用成本。</p>
        </section>
        <section class="guide-section prose" id="guide">${heading("05 / 选择方法", "API中转站怎么选？", "从模型、接口、预算和服务四个方面选择，接入后用真实任务体验效果。")}
          <ol class="selection-steps"><li><h3>确定模型与客户端</h3><p>写下完整模型 ID、所需协议、上下文、工具调用和并发。GPT API中转站是否支持客户端所需的接口，Claude 线路是否透传缓存，比“支持几十种模型”更值得先问。</p></li><li><h3>核对站点与条款</h3><p>查看运营主体、公告、服务条款、退款规则和近期社区反馈。把客服响应、公告更新和服务政策一起比较，长期使用更好管理。</p></li><li><h3>算实际成本</h3><p>拿你会用的模型和分组算输入、输出、缓存与充值换算。做API平台推荐比较时，用任务最终扣费和任务完成情况作为尺度。</p></li><li><h3>用真实任务体验</h3><p>把常见任务、长上下文、结构化输出、工具调用与流式输出都跑一遍。白天和晚高峰各测试，记录首字时间、完整响应、失败与重试。</p></li><li><h3>配好用量与备用线路</h3><p>按近期需求充值，给 Key 设置额度上限。保留一条测试过的备用线路，定期检查模型映射、分组和账单是否变化。</p></li></ol>
        </section>
        <section class="guide-section prose" id="risk">${heading("06 / 使用与避坑", "接得上，还要用得明白。", "配好模型、计费与密钥，日常使用和项目接入更顺手。")}
          <h3>模型选择：按任务体验能力</h3><p>使用固定的一组任务，比较上下文、结构化输出、工具调用与图片输入。把模型 ID、输出质量、响应时间和扣费记录下来，后续调整模型与分组时可以直接对比。</p>
          <h3>用量管理：按任务预算充值</h3><p>根据模型单价和近期任务量安排充值，把赠额、充值余额与套餐有效期分开记录。查看退款条件和用量明细，给项目设置额度上限，方便管理长期成本。</p>
          <h3>数据管理：项目独立密钥，日志按需设置</h3><p>为每个项目配置独立 Key，按业务需求选择日志保留和数据处理方式。团队接入时一并查看隐私设置、删除机制与服务条款，让用量与访问权限便于管理。</p>
          <h3>接入：按客户端逐项核对</h3><ul><li><strong>Base URL：</strong>确认地址是否包含 /v1，原生接口与兼容接口是否使用同一入口。</li><li><strong>API Key：</strong>为每个项目单独建 Key，设限额，避免提交到仓库或放进公开排错日志。</li><li><strong>模型 ID：</strong>按站点目录填写，确认别名实际映射到哪个版本。</li><li><strong>客户端配置：</strong>检查旧地址、代理设置和鉴权变量是否冲突，再跑一次最小请求与一次真实任务。</li><li><strong>备用线路：</strong>提前验证切换方法，服务异常时先看公告和用量，避免盲目重试造成重复扣费。</li></ul>
        </section>
        ${topicsHtml}
        <section class="guide-section" id="faq" aria-labelledby="faq-title"><div class="guide-heading"><p class="section-kicker">08 / FAQ</p><h2 id="faq-title">选站和使用时，常问的十件事。</h2><p>AI中转站推荐最终要落到你需要的模型、真实任务和账单上。</p></div><div class="home-faq">${HOME_FAQ.map(([question, answer]) => `<article class="home-faq-item"><h3>${escape(question)}</h3><p>${escape(answer)}</p></article>`).join("")}</div></section>
        <div class="guide-end"><p>选好模型，开始接入。</p><span>从推荐清单找到所需模型，配置接口与密钥，用真实任务体验效果。</span><a href="#ranking">回到站点清单 ↑</a></div>
      </div></div>
    </main><footer class="site-footer"><div class="footer-inner"><div><a class="brand" href="/">中转站指南</a><p>API中转站推荐、模型对比与接入指南 · 每天自动更新两次。</p><p>内容组织参考 <a href="https://relay-guide.pages.dev/" target="_blank" rel="noopener">中转站指南 ↗</a> · 目录数据来自 <a href="https://github.com/hvoyai/awesome-ai-api" target="_blank" rel="noopener">awesome-ai-api ↗</a></p></div><a href="#main">返回顶部 ↑</a></div></footer>
    <script src="./assets/site.js" defer></script>
  </body></html>`;
}
