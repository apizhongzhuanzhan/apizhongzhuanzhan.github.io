import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(await readFile(path.join(root, "data.json"), "utf8"));
const maxSites = 400;
const pageSize = 50;
const siteCount = Math.min(data.sites.length, maxSites);
const expectedPages = Math.ceil(siteCount / pageSize);
const origin = "https://apizhongzhuanzhan.github.io";
const topics = ["gpt-zhongzhuanzhan", "claude-zhongzhuanzhan", "codex-zhongzhuanzhan", "gemini-zhongzhuanzhan", "glm-zhongzhuanzhan", "qwen-zhongzhuanzhan", "kimi-zhongzhuanzhan"];

async function pageHtml(page) {
  return readFile(page === 1 ? path.join(root, "index.html") : path.join(root, "page", String(page), "index.html"), "utf8");
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

test("homepage uses the exact requested title and complete SEO metadata", async () => {
  const html = await pageHtml(1);
  assert.ok(html.includes("<title>AI 中转站推荐</title>"));
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
  assert.equal(itemList.numberOfItems, siteCount);
  assert.equal(itemList.itemListElement.length, Math.min(pageSize, siteCount));
});

test("visible update time is a build-time Shanghai timestamp", async () => {
  const html = await pageHtml(1);
  const generated = html.match(/<body data-generated-at="([^"]+)"/)?.[1];
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
    assert.equal(canonical, page === 1 ? `${origin}/` : `${origin}/page/${page}/`);
    assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
    if (page > 1) assert.ok(html.includes(`<link rel="prev" href="${page === 2 ? `${origin}/` : `${origin}/page/${page - 1}/`}"`));
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
    assert.match(html, /<script src="(?:\.\.\/\.\.\/|\.\/)assets\/site\.js" defer><\/script>/);
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
  assert.equal((sitemap.match(/<url>/g) || []).length, expectedPages + topics.length);
  assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
  assert.ok(minifiedCss.length < sourceCss.length);
  assert.ok(minifiedCss.includes("@media (max-width:680px)"));
  assert.doesNotMatch(minifiedCss, /\/\*/);
  await access(path.join(root, ".nojekyll"));
});
