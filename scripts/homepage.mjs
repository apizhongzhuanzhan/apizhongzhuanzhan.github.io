// The homepage is a complete, readable guide; the full directory has its own URL.
export const HOME_KEYWORDS = [
  "ai中转站", "api中转站", "中转站推荐", "gpt中转站", "api中转站推荐", "中转站api",
  "gemini中转站", "ai中转站推荐", "glm中转站", "中转站", "ai中转", "gpt api中转站",
  "gpt6中转站", "api站", "api中转站怎么选？", "api推荐", "国内api中转站推荐", "api ranking",
  "中转站api推荐", "api中转平台", "api中转平台推荐", "kiro逆向", "api平台推荐", "api中转",
];

export const HOME_FAQ = [
  ["API站、API中转平台和AI中转有什么区别？", "API站是泛称，可能提供模型、搜索、语音等接口。AI中转通常指第三方代转模型请求；API中转平台往往还提供多模型路由、统一计费和用量管理。名称不能说明上游来源，选之前要看具体协议、模型、服务条款和账单。"],
  ["国内API中转站推荐，是否意味着国内部署？", "不一定。支持国内网络访问或人民币付款，并不说明网关、上游模型或数据都在国内。若项目要求数据驻留，应核对实际处理位置、运营主体和合同条款。个人使用也应在自己的网络和常用时段测试。"],
  ["中转站API推荐能只看在线率吗？", "在线率适合初筛，但测的模型、网络和时间段可能与你不同。还要测试首字延迟、完整响应、工具调用、长上下文和缓存，并查看样本量。公开榜单不是本站对每条线路的长期实测结论。"],
  ["API中转平台推荐要看哪些服务条款？", "至少看余额有效期、退款条件、充值到账单位、限流与并发、日志保留、故障通知和联系渠道。需要发票或对公付款时，确认开票主体与服务主体；口头承诺应在充值前核对。"],
  ["GPT API中转站和GPT6中转站应该测什么？", "先确认完整模型 ID、具体版本和上游映射，再按客户端需求测试 Responses 或 Chat Completions、流式输出、工具调用、图片输入与上下文。支持 OpenAI 厂商不等于支持它的每个模型；能聊一句也不能证明编程长任务稳定。"],
  ["Gemini中转站、GLM中转站有必要一起接吗？", "按任务决定。Gemini 常用于多模态与长文档，GLM 可用于中文应用和工具调用。比较时要核对具体型号及原生或兼容协议，用同一组任务看质量和实际扣费。模型家数多，不代表每条线路都能满足你的需求。"],
  ["低倍率就是便宜吗？注册赠额值得用吗？", "先区分官方价折扣、面板模型倍率和分组倍率，再算充值换算、输出与缓存费用。赠额适合测试线路，但要查单位、有效期、模型限制、计费方式以及赠额和充值余额的扣款顺序；本站没有把未核实的赠额列入推荐理由。"],
  ["API推荐和API ranking榜单怎样交叉核对？", "用站点清单确定候选，再在禾维 AI 查看具体模型的近期实测，在 AI API Rank 比较在线率、延迟、支付与服务政策。两处可能使用相同或相关的数据源，排名一致不等于两份独立验证。最后仍用自己的真实任务测试。"],
  ["中转站能看到我的请求吗？", "中转网关在技术上可以接触转发的请求与响应。HTTPS 保护传输过程，不能证明站点不留日志。发送未公开代码、客户资料或密钥前，应核对数据政策；需要明确保密责任的业务应使用可签约、可审计的服务。"],
  ["突然出现401、404、429，怎么排查？", "401 先检查 API Key、鉴权格式及客户端变量；404 检查 Base URL、是否需要 /v1 和模型 ID；429 查看余额、速率、并发限制及上游公告。网页可访问而请求失败时，分别检查 API 连通性和客户端配置。不要把含完整 Key 的日志发到公开群。"],
];

const escape = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const number = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 1 });
const policy = (value) => value === true ? "支持" : value === false ? "不支持" : "待确认";
const modelNames = { OpenAI: "GPT / OpenAI", Anthropic: "Claude", Google: "Gemini", 智谱: "GLM", 阿里云: "Qwen", 月之暗面: "Kimi" };

function renderRow(site) {
  const models = site.models.map((model) => modelNames[model] || model);
  return `<tr data-station-card id="rank-${site.rank}">
    <td class="pick-rank"><span>${site.rank.toString().padStart(2, "0")}</span></td>
    <th scope="row" class="pick-name"><a href="${escape(site.url)}" target="_blank" rel="nofollow noopener" referrerpolicy="origin">${escape(site.name)}</a><p>${escape(models.join(" · ") || "模型信息待确认")}</p><small>${site.modelCount} 个模型${site.establishedDate ? ` · 创建于 ${escape(site.establishedDate)}` : ""}</small></th>
    <td class="pick-quality"><span class="cell-label">公开指标</span><strong>${site.uptime === null ? "暂无在线率" : `${number.format(site.uptime)}% 在线率`}</strong><span>${site.latencyMs === null ? "延迟待确认" : `${number.format(site.latencyMs / 1000)} 秒平均延迟`}</span></td>
    <td class="pick-policy"><span class="cell-label">支付与政策</span><span>退款 ${policy(site.supportsRefund)}<br />发票 ${policy(site.supportsInvoice)}</span><small>${escape(site.paymentMethods.join(" / ") || "支付方式待确认")}</small></td>
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
    { "@type": "ItemList", "@id": `${origin}/#ranking`, name: "值得长期用的 AI API 中转站候选前20名", numberOfItems: sites.length, itemListOrder: "https://schema.org/ItemListOrderAscending", itemListElement: sites.map((site) => ({ "@type": "ListItem", position: site.rank, item: { "@type": "Service", name: site.name, url: site.url, serviceType: "AI API 中转服务" } })) },
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
      <section class="guide-hero" aria-labelledby="home-title"><p class="eyebrow">2026 / AI API RELAY GUIDE</p><h1 id="home-title">API中转站推荐，<br /><span>选站之前把账算明白。</span></h1><p class="hero-copy">先看值得长期用的 API中转站候选与聚合榜单，再了解上游来源、倍率、充值和缓存。把候选名单变成一次有依据的选择。</p><div class="hero-bottom"><p>本次更新 <time datetime="${built.iso}">${built.visible}</time><br />精选 ${sites.length} 家 · 完整目录 ${allSites.length} 家 · 每天自动更新两次</p><a class="guide-button" href="#ranking">查看站点清单 <span aria-hidden="true">↓</span></a></div></section>
      <div class="reading-layout"><aside class="reading-sidebar"><nav aria-label="本页目录"><p>本页内容</p>${toc.map(([id, label], index) => `<a href="#${id}"><span>${String(index + 1).padStart(2, "0")}</span>${label}</a>`).join("")}<a class="toc-directory" href="/directory/">浏览 ${allSites.length} 家目录 ↗</a></nav><p class="sidebar-note">先小额测试。<br />用自己的任务，<br />确认适合自己的线路。</p></aside>
      <div class="reading-content">
        <section class="guide-section" id="ranking" aria-labelledby="ranking-title">
          <div class="guide-heading"><p class="section-kicker">01 / 站点清单</p><h2 id="ranking-title">先找到候选，再决定长期用。</h2><p>清单分两部分：前20家的 AI API中转站推荐列表，以及用来核对模型与服务信息的中转站聚合榜单。</p></div>
          <div class="list-heading"><div><h3>一 · 值得长期用的</h3><p>按公开目录的原始排名选前20名，顺序随数据同步更新。</p></div><span class="list-badge">TOP ${sites.length}</span></div>
          <p class="guide-callout">这里是长期使用的候选清单。排名和指标来自公开资料，本站未逐家长期使用验证。先核对你需要的模型、价格与政策，再用真实任务小额测试。</p>
          <div class="pick-toolbar"><p>在线率和延迟为公开数据；未提供的信息标为待确认。</p><div class="search-box"><label for="station-search">筛选清单 · <span data-visible-count>${sites.length}</span> 家</label><input id="station-search" type="search" data-station-search placeholder="站点名、模型、支付方式" autocomplete="off" /></div></div>
          <table class="pick-table"><caption class="sr-only">值得长期用的中转站候选前20名</caption><thead><tr><th scope="col">排名</th><th scope="col">站点 / 模型</th><th scope="col">公开指标</th><th scope="col">支付与政策</th><th scope="col">资料</th></tr></thead><tbody>${sites.map(renderRow).join("")}</tbody></table>
          <p class="search-empty" data-search-empty role="status">没有匹配的站点，试试更短的关键词或清空搜索。</p>
          <div class="list-footnote"><p>数据来源：公开目录快照。创建时间、支付与政策均以站方最新说明为准。</p><a href="/directory/">查看完整 ${allSites.length} 家目录 →</a></div>
          <div class="list-heading" id="aggregators"><div><h3>二 · 中转站聚合榜单</h3><p>用具体模型的实测和站点资料，补充综合排名看不到的信息。</p></div></div>
          <div class="aggregator-grid"><article class="aggregator-card"><div class="aggregator-top"><span>模型实测与站点档案</span><span aria-hidden="true">↗</span></div><h4><a href="https://hvoyai.com/" target="_blank" rel="noopener">禾维 AI</a></h4><p>查看 Claude、GPT、Gemini、GLM 等模型的公开实测，对比在线率、延迟、价格与站点资料。适合确认某个具体模型的近期表现。</p><div class="aggregator-links"><a href="https://hvoyai.com/leaderboard/" target="_blank" rel="noopener">查看实测榜单 ↗</a><a href="https://hvoyai.com/sites/" target="_blank" rel="noopener">站点目录 ↗</a></div><small>hvoyai.com</small></article>
          <article class="aggregator-card"><div class="aggregator-top"><span>综合排名与条件筛选</span><span aria-hidden="true">↗</span></div><h4><a href="https://aiapirank.github.io/" target="_blank" rel="noopener">AI API Rank</a></h4><p>集中比较中转站在线率、延迟、模型覆盖、用户评价、支付方式以及退款与发票信息。适合按服务条件缩小候选范围。</p><div class="aggregator-links"><a href="https://aiapirank.github.io/" target="_blank" rel="noopener">查看综合排行榜 ↗</a></div><small>aiapirank.github.io</small></article></div>
          <p class="source-note">两处榜单及本站清单可能共享或引用相关数据。相同排名不等于多次独立验证；看清测量时间、模型、样本和计费口径，再做自己的测试。</p>
        </section>
        <section class="guide-section prose" id="what">${heading("02 / 先理解机制", "中转站是什么？", "你买到的是上游模型的调用额度，以及一条转发请求的服务链路。")}
          <p>模型客户端通常允许修改请求地址，也就是 Base URL。把官方地址换成第三方网关后，请求会先到中转站，由它用自己的上游凭证调用模型，再把响应返回给你。网关还可以提供统一密钥、限流、模型路由和计费。</p>
          <div class="request-flow" aria-label="API中转请求流程"><span>你的客户端<small>应用 / SDK / 编程工具</small></span><b aria-hidden="true">→</b><span>中转网关<small>鉴权 / 路由 / 计费</small></span><b aria-hidden="true">→</b><span>上游模型<small>API / 云渠道 / 账号池</small></span></div>
          <p>因此，中转站API能否稳定使用，要看两件事：<strong>上游额度来自哪里，以及网关怎样处理你的请求。</strong>前者影响价格、可用性和断供方式；后者影响协议兼容、缓存、工具调用和数据处理。</p><p>一个 Key 接多个厂商、支持人民币充值，确实方便。但网站打开很快、模型名字很多，只能说明入口方便，不能证明你需要的那条模型线路可用。</p>
        </section>
        <section class="guide-section prose" id="types">${heading("03 / 上游来源", "三种服务类型，先问清买的是哪一种。", "同一家API中转平台可能混用多个渠道，需要逐个模型、逐个分组核对。")}
          <article class="type-row"><span class="type-number">A</span><div><h3>API转售：转发官方或云渠道额度</h3><p>上游使用官方 API、企业额度或云厂商渠道，通常按 token 计费。协议能力更接近上游 API，但仍要确认版本、缓存、上下文和工具调用是否透传，以及是否发生协议转换。</p><p class="type-check"><strong>要问：</strong>具体上游、输入输出单价、缓存账单、故障时是否切换渠道。</p></div></article>
          <article class="type-row"><span class="type-number">B</span><div><h3>订阅池与逆向适配：把产品额度转换成接口</h3><p>将订阅账号或产品内的调用额度包装为 API。低价可能来自这种计费差异，但也可能出现并发排队、固定时段限额、功能缺失或账号风控。是否违反条款要核对对应产品的授权范围；上游限制会直接影响你的使用。</p><h4>Kiro逆向是什么？</h4><p>通常指适配 Kiro 客户端的调用链路，向外提供模型接口。它的额度与授权边界取决于产品账号和上游规则。不要仅凭“兼容 Claude”推断它等同官方 API；缓存、工具调用、上下文和高峰期表现都要单独测试。</p><p class="type-check"><strong>要问：</strong>每次或每天限额、客户端限制、实际模型映射、账号失效后的处理。</p></div></article>
          <article class="type-row"><span class="type-number">C</span><div><h3>聚合网关：统一接入多个供应商</h3><p>在一套接口内选择多家模型服务，常提供统一账单和路由。聚合本身不是品质保证；应查看供应商信息、数据政策和实际单价。OpenRouter 等服务也可以作为比价入口，是否适合项目要按具体供应商判断。</p><p class="type-check"><strong>要问：</strong>模型由谁提供、自动路由到哪里、费用是否包含额外手续费。</p></div></article>
        </section>
        <section class="guide-section prose" id="price">${heading("04 / 费用怎么算", "倍率好看，账单也要算得清。", "比较API中转站的价格，把人民币实付、站内额度和真实请求消耗放在同一张账上。")}
          <h3>1. 先分清三种“倍率”</h3><p><strong>官方价折扣</strong>指相对于官方单价的比例；<strong>模型倍率</strong>是面板相对某个计费基准的系数；<strong>分组倍率</strong>是你所在分组叠加的系数。广告里的“0.3倍”可能指其中任意一种，充值前先确认口径。</p>
          <p>常见 new-api 的 token 计费口径使用 500,000 额度单位对应 1 个系统美元；输入模型倍率为 1 时，对应每百万输入 token 2 个系统美元。配置可调整，固定价格、按次计费或不同版本不能直接套用这一口径。</p>
          <div class="formula-box"><span>常见按token计费示意 · 未计入缓存、图片、音频等费用</span><p>消耗额度 = 分组倍率 × 模型倍率<br />×（输入token + 输出token × 补全倍率）÷ 500,000</p></div>
          <h3>2. 充值换算和余额显示是两回事</h3><p>“1元到账1美元”可能是站内额度单位，不等于真实美元，也不等于所有模型按官方价计费。查清<strong>实际付了多少人民币、到账多少额度、使用哪个分组</strong>。显示为 ¥、$ 或积分，只是余额的展示方式。</p>
          <div class="worked-example"><p class="example-label">一笔账算完 · 以下均为假设数字</p><h4>付70元，到账10个系统美元额度</h4><p>假设分组倍率0.5、模型倍率1、补全倍率5；一次请求输入100,000 token、输出10,000 token，不涉及缓存。</p><dl><div><dt>请求消耗</dt><dd>0.5 × 1 × (100,000 + 10,000 × 5) ÷ 500,000 = <strong>0.15额度</strong></dd></div><div><dt>额度成本</dt><dd>70元 ÷ 10额度 = <strong>7元 / 额度</strong></dd></div><div><dt>人民币成本</dt><dd>0.15额度 × 7元 = <strong>1.05元</strong></dd></div></dl><p>比较另一家时，也算到人民币实付这一步；它标的倍率低，不代表这次任务花的钱少。</p></div>
          <h3>3. 缓存费用可能改变长任务的成本</h3><p>编程工具常在后续请求里重复发送上下文。若上游支持缓存，命中的部分可能有单独价格；缓存写入也可能另行计费。中转站是否透传缓存、是否按实际命中计费，要从请求级明细确认。</p><p>举个假设：一段输入按常规价每百万2元、缓存命中价0.2元计费。另一条线路即使常规价降到1元，若所有输入都按常规价扣，同样的缓存命中内容也会贵5倍。<strong>对长会话，缓存是否生效比一个低倍率数字更有解释力。</strong></p>
          <h3>4. 按量、按次与套餐，分别算</h3><ul><li><strong>按量：</strong>按输入、输出与缓存等用量扣费，适合查每次请求明细。</li><li><strong>按次：</strong>一次调用固定扣费，短问答和长请求未必有相同的性价比。还要看失败、重试和工具调用是否计次。</li><li><strong>套餐：</strong>日卡、月卡或订阅常有额度、模型、并发和有效期限制。用实际能完成的任务数比较。</li></ul>
          <h3>5. 用三步核对真实费用</h3><ol><li>先看后台是否列出输入、输出、缓存读写、使用分组和扣费。</li><li>在两家用相同任务和上下文测试，保存请求用量及最终扣费；模型输出长度不同也要算进去。</li><li>首充后检查赠额和充值余额的扣款顺序、有效期，以及失败重试是否收费。</li></ol>
          <p class="source-note">计费机制参考 <a href="https://github.com/QuantumNous/new-api" target="_blank" rel="noopener">new-api 项目 ↗</a>。具体版本、配置和上游价格会变，实际费用以你使用的分组价格与请求账单为准。</p>
        </section>
        <section class="guide-section prose" id="guide">${heading("05 / 选择方法", "API中转站怎么选？", "先把硬性需求写下来，再让候选站点跑同一组真实任务。")}
          <ol class="selection-steps"><li><h3>确定模型与客户端</h3><p>写下完整模型 ID、所需协议、上下文、工具调用和并发。GPT API中转站是否支持客户端所需的接口，Claude 线路是否透传缓存，比“支持几十种模型”更值得先问。</p></li><li><h3>核对站点与条款</h3><p>查看运营主体、公告、服务条款、退款规则和近期社区反馈。关注问题发生后的处理；创建时间长也不能单独证明当前稳定。</p></li><li><h3>算实际成本</h3><p>拿你会用的模型和分组算输入、输出、缓存与充值换算。做API平台推荐比较时，用任务最终扣费和任务完成情况作为尺度。</p></li><li><h3>先用最小金额测试</h3><p>把常见任务、长上下文、结构化输出、工具调用与流式输出都跑一遍。白天和晚高峰各测试，记录首字时间、完整响应、失败与重试。</p></li><li><h3>验证后，再决定长期用</h3><p>按近期需求充值，给 Key 设置额度上限。保留一条测试过的备用线路，定期检查模型映射、分组和账单是否变化。</p></li></ol>
        </section>
        <section class="guide-section prose" id="risk">${heading("06 / 使用与避坑", "接得上，还要用得明白。", "模型能力、账户余额与数据处理，是三件需要分别确认的事。")}
          <h3>模型真实性：看能力与映射，别问它“你是谁”</h3><p>模型的自我介绍不能证明身份。保存固定测试集，测试上下文、结构化输出、工具调用、图片输入等所需能力。异常时核对完整模型名、路由与公告，并与可信渠道比较；单次回答质量也不能单独证明模型替换。</p>
          <h3>余额：按近期用量充，留意退款条件</h3><p>预付额度存在服务商系统里。活动折扣再大，也先核对有效期、最低充值额、退款手续费和赠额限制。线路变化、上游限制和运营问题都可能影响能否继续消耗余额。</p>
          <h3>数据：网关可以接触请求内容</h3><p>把隐私政策里的日志保留、训练用途和删除机制看清楚。涉及客户资料、未公开代码或商业保密时，选择责任和处理范围明确的服务。密钥、密码与私钥不应作为普通提示词发送。</p>
          <h3>接入：按客户端逐项核对</h3><ul><li><strong>Base URL：</strong>确认地址是否包含 /v1，原生接口与兼容接口是否使用同一入口。</li><li><strong>API Key：</strong>为每个项目单独建 Key，设限额，避免提交到仓库或放进公开排错日志。</li><li><strong>模型 ID：</strong>按站点目录填写，确认别名实际映射到哪个版本。</li><li><strong>客户端配置：</strong>检查旧地址、代理设置和鉴权变量是否冲突，再跑一次最小请求与一次真实任务。</li><li><strong>备用线路：</strong>提前验证切换方法，服务异常时先看公告和用量，避免盲目重试造成重复扣费。</li></ul>
        </section>
        ${topicsHtml}
        <section class="guide-section" id="faq" aria-labelledby="faq-title"><div class="guide-heading"><p class="section-kicker">08 / FAQ</p><h2 id="faq-title">选站和使用时，常问的十件事。</h2><p>AI中转站推荐最终要落到你需要的模型、真实任务和账单上。</p></div><div class="home-faq">${HOME_FAQ.map(([question, answer]) => `<article class="home-faq-item"><h3>${escape(question)}</h3><p>${escape(answer)}</p></article>`).join("")}</div></section>
        <div class="guide-end"><p>候选清单有了，下一步是验证。</p><span>选两家，拿同一组真实任务测试，再决定在哪家充值。</span><a href="#ranking">回到站点清单 ↑</a></div>
      </div></div>
    </main><footer class="site-footer"><div class="footer-inner"><div><a class="brand" href="/">中转站指南</a><p>API中转站推荐与使用方法 · 公开资料用于初筛，具体服务以最新说明为准。</p><p>内容组织参考 <a href="https://relay-guide.pages.dev/" target="_blank" rel="noopener">中转站指南 ↗</a> · 目录数据来自 <a href="https://github.com/hvoyai/awesome-ai-api" target="_blank" rel="noopener">awesome-ai-api ↗</a></p></div><a href="#main">返回顶部 ↑</a></div></footer>
    <script src="./assets/site.js" defer></script>
  </body></html>`;
}
