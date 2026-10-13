import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { HOME_FAQ } from "../scripts/homepage.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(await readFile(path.join(root, "data.json"), "utf8"));
const maxSites = 400;
const pageSize = 50;
const siteCount = Math.min(data.sites.length, maxSites);
const expectedPages = Math.ceil(siteCount / pageSize);
const origin = "https://apizhongzhuanzhan.github.io";
const topics = ["gpt-zhongzhuanzhan", "claude-zhongzhuanzhan", "codex-zhongzhuanzhan", "gemini-zhongzhuanzhan", "glm-zhongzhuanzhan", "qwen-zhongzhuanzhan", "kimi-zhongzhuanzhan"];

async function pageHtml(page) {
  return readFile(page === 1 ? path.join(root, "directory", "index.html") : path.join(root, "page", String(page), "index.html"), "utf8");
}

function extractJsonLd(html) {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(match, "页面必须包含 JSON-LD");
  return JSON.parse(match[1]);
}

test("data snapshot and generated pagination never exceed 400 stations", async () => {
  assert.ok(data.sites.length > 0 && data.sites.length <= maxSites);
  const directories = (await readdir(path.join(root, "page"), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && /^\d+$/.test(entry.name));
  assert.equal(directories.length, Math.max(0, expectedPages - 1));
  if (expectedPages > 1) await access(path.join(root, "page", String(expectedPages), "index.html"));

  const ranks = [];
  for (let page = 1; page <= expectedPages; page += 1) {
    const html = await pageHtml(page);
    const pageRanks = [...html.matchAll(/<article class="station-card" id="rank-(\d+)"/g)].map((match) => Number(match[1]));
    assert.ok(pageRanks.length > 0 && pageRanks.length <= pageSize);
    ranks.push(...pageRanks);
  }
  assert.equal(ranks.length, siteCount);
  assert.equal(new Set(ranks).size, siteCount);
  assert.deepEqual(ranks, Array.from({ length: siteCount }, (_, index) => index + 1));
});

test("homepage has complete SEO metadata describing the guide and top 20", async () => {
  const html = await readFile(path.join(root, "index.html"), "utf8");
  assert.match(html, /<title>API中转站推荐与使用指南[^<]*前20名[^<]*<\/title>/);
  assert.ok(html.includes('<meta name="description"'));
  assert.ok(html.includes('<meta name="keywords"'));
  assert.ok(html.includes('<meta name="robots" content="index, follow'));
  assert.ok(html.includes('<link rel="canonical" href="https://apizhongzhuanzhan.github.io/"'));
  assert.ok(html.includes('property="og:image"'));
  assert.ok(html.includes('name="twitter:card"'));
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
  const json = extractJsonLd(html);
  for (const type of ["WebSite", "CollectionPage", "BreadcrumbList", "ItemList", "FAQPage"]) {
    assert.ok(json["@graph"].some((entry) => entry["@type"] === type), `缺少 ${type}`);
  }
  const itemList = json["@graph"].find((entry) => entry["@type"] === "ItemList");
  assert.equal(itemList.numberOfItems, Math.min(20, siteCount));
  assert.equal(itemList.itemListElement.length, Math.min(20, siteCount));
});

test("visible update time is a build-time Shanghai timestamp", async () => {
  const html = await readFile(path.join(root, "index.html"), "utf8");
  const generated = html.match(/<body[^>]*data-generated-at="([^"]+)"/)?.[1];
  const visible = html.match(/<time datetime="([^"]+)">([^<]+)<\/time>/);
  assert.match(generated || "", /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+08:00$/);
  assert.equal(visible?.[1], generated);
  assert.match(visible?.[2] || "", /北京时间/);
  assert.notEqual(generated, data.sourceUpdatedDate);
  const collection = extractJsonLd(html)["@graph"].find((entry) => entry["@type"] === "CollectionPage");
  assert.equal(collection.dateModified, generated);
});

test("each pagination page has unique canonical metadata and relationships", async () => {
  const titles = new Set();
  const descriptions = new Set();
  const canonicals = new Set();
  for (let page = 1; page <= expectedPages; page += 1) {
    const html = await pageHtml(page);
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    assert.ok(title && description && canonical);
    assert.equal(canonical, page === 1 ? `${origin}/directory/` : `${origin}/page/${page}/`);
    assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
    if (page > 1) assert.ok(html.includes(`<link rel="prev" href="${page === 2 ? `${origin}/directory/` : `${origin}/page/${page - 1}/`}"`));
    if (page < expectedPages) assert.ok(html.includes(`<link rel="next" href="${origin}/page/${page + 1}/"`));
    titles.add(title); descriptions.add(description); canonicals.add(canonical);
  }
  assert.equal(titles.size, expectedPages);
  assert.equal(descriptions.size, expectedPages);
  assert.equal(canonicals.size, expectedPages);
});

test("all ranking content is static HTML and outbound links are marked", async () => {
  for (let page = 1; page <= expectedPages; page += 1) {
    const html = await pageHtml(page);
    assert.ok(html.includes("AI API 中转站推荐列表"));
    assert.ok(html.includes('data-station-card'));
    assert.doesNotMatch(html, /fetch\(/);
    assert.match(html, /<script src="(?:\.\.\/\.\.\/|\.\.\/|\.\/)assets\/site\.js" defer><\/script>/);
    for (const match of html.matchAll(/class="detail-link" href="([^"]+)"[^>]*rel="([^"]+)"[^>]*referrerpolicy="([^"]+)"/g)) {
      assert.match(match[1], /^https?:\/\//);
      assert.equal(match[2], "nofollow noopener");
      assert.equal(match[3], "origin");
    }
    assert.doesNotThrow(() => extractJsonLd(html));
  }
});

test("model topic pages are indexable, unique, and statically populated", async () => {
  const titles = new Set();
  for (const slug of topics) {
    const file = path.join(root, slug, "index.html");
    await access(file);
    const html = await readFile(file, "utf8");
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    assert.ok(title);
    assert.ok(html.includes(`<link rel="canonical" href="${origin}/${slug}/"`));
    assert.ok(html.includes('<meta name="robots" content="index, follow'));
    assert.ok((html.match(/<article class="station-card"/g) || []).length <= pageSize);
    assert.doesNotThrow(() => extractJsonLd(html));
    titles.add(title);
  }
  assert.equal(titles.size, topics.length);
});

test("sitemap, robots and minified assets are valid for GitHub Pages", async () => {
  const sitemap = await readFile(path.join(root, "sitemap.xml"), "utf8");
  const robots = await readFile(path.join(root, "robots.txt"), "utf8");
  const sourceCss = await readFile(path.join(root, "assets", "styles.css"), "utf8");
  const minifiedCss = await readFile(path.join(root, "assets", "styles.min.css"), "utf8");
  assert.ok(sitemap.includes(`<loc>${origin}/</loc>`));
  assert.equal((sitemap.match(/<url>/g) || []).length, 1 + expectedPages + topics.length);
  assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
  assert.ok(minifiedCss.length < sourceCss.length);
  assert.ok(minifiedCss.includes("@media (max-width:680px)"));
  assert.doesNotMatch(minifiedCss, /\/\*/);
  await access(path.join(root, ".nojekyll"));
});


test("homepage selects precisely the first 20 source ranks, with matching structured data", async () => {
  const html = await readFile(path.join(root, "index.html"), "utf8");
  const expected = [...data.sites].sort((a, b) => a.sourceRank - b.sourceRank).slice(0, 20);
  const rows = [...html.matchAll(/<tr data-station-card id="rank-(\d+)">([\s\S]*?)<\/tr>/g)];
  assert.equal(rows.length, expected.length);
  for (const [index, row] of rows.entries()) {
    assert.equal(Number(row[1]), index + 1);
    assert.ok(row[2].includes(expected[index].name), `名次 ${index + 1} 名称与数据不符`);
    assert.ok(row[2].includes(expected[index].url));
    assert.ok(row[2].includes("退款"));
    assert.ok(row[2].includes("发票"));
  }
  const list = extractJsonLd(html)["@graph"].find((item) => item["@type"] === "ItemList");
  assert.deepEqual(list.itemListElement.map((item) => item.item.name), expected.map((site) => site.name));
  assert.deepEqual(list.itemListElement.map((item) => item.position), expected.map((_, i) => i + 1));
});

test("complete guide, both aggregator entries, and every search phrase appear in visible homepage content", async () => {
  const html = await readFile(path.join(root, "index.html"), "utf8");
  const body = html.split(/<body[^>]*>/)[1].replace(/<script[\s\S]*?<\/script>/g, "");
  const text = body.replace(/<[^>]+>/g, " ").toLowerCase();
  for (const keyword of ["ai中转站", "api中转站", "中转站推荐", "gpt中转站", "api中转站推荐", "中转站api", "gemini中转站", "ai中转站推荐", "glm中转站", "中转站", "ai中转", "gpt api中转站", "gpt6中转站", "api站", "api中转站怎么选？", "api推荐", "国内api中转站推荐", "api ranking", "中转站api推荐", "api中转平台", "api中转平台推荐", "kiro逆向", "api平台推荐", "api中转"]) assert.ok(text.includes(keyword), `正文缺少 ${keyword}`);
  for (const id of ["ranking", "aggregators", "what", "types", "price", "guide", "risk", "topics", "faq"]) {
    assert.ok(body.includes(`id="${id}"`), `缺少 ${id} 内容`);
  }
  for (const url of ["https://hvoyai.com/", "https://aiapirank.github.io/"]) assert.ok(body.includes(`href="${url}"`));
  assert.doesNotMatch(body, /<details/);
  assert.doesNotMatch(body, /fetch\(/);
  for (const [question, answer] of HOME_FAQ) {
    assert.ok(text.includes(question.toLowerCase()));
    assert.ok(text.includes(answer.toLowerCase()));
  }
  const faq = extractJsonLd(html)["@graph"].find((item) => item["@type"] === "FAQPage");
  assert.deepEqual(faq.mainEntity.map((item) => item.acceptedAnswer.text), HOME_FAQ.map(([, answer]) => answer));
});

test("all local navigation links and fragment targets resolve in generated pages", async () => {
  const files = ["index.html", "directory/index.html", ...Array.from({ length: expectedPages - 1 }, (_, i) => `page/${i + 2}/index.html`), ...topics.map((slug) => `${slug}/index.html`)];
  const pages = new Map(await Promise.all(files.map(async (file) => [file, await readFile(path.join(root, file), "utf8")])));
  for (const [file, html] of pages) {
    for (const match of html.matchAll(/(?:href|src)="([^"<>]+)"/g)) {
      const href = match[1];
      if (/^(https?:|data:|mailto:)/.test(href)) continue;
      const url = new URL(href, `${origin}/${file}`);
      const relative = decodeURIComponent(url.pathname).replace(/^\//, "");
      const target = relative.endsWith("/") || !relative ? `${relative}index.html` : relative;
      await access(path.join(root, target));
      if (url.hash && pages.has(target)) {
        assert.ok(pages.get(target).includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `${file}: ${href} 锚点不存在`);
      }
    }
  }
});
