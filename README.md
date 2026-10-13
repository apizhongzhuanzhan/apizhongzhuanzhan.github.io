# API 中转站评测与推荐

面向 GitHub Pages 的原生静态 HTML 中转站指南。首页直接展示前 20 家候选、第三方聚合榜单、上游类型、费用与充值、选站与避坑、模型用途及 FAQ。内容构建时写入 HTML，无需等待客户端加载数据。

- 首页 `/`：按 `data.json` 的 `sourceRank` 取前 20 家，不打乱顺序；主要内容与 FAQ 直接展开。
- 完整目录 `/directory/`：第 1–50 名，后续分页沿用 `/page/2/` 等路径，保留最多 400 家。
- 模型专题：GPT、Claude、Codex、Gemini、GLM、Qwen、Kimi 的候选与选择要点。
- 首页文案、关键词与 FAQ：`scripts/homepage.mjs`；数据处理与页面生成：`scripts/build.mjs`。

## 本地命令

```bash
npm run sync   # 拉取公开数据，最多保留 400 条，并生成页面
npm run build  # 使用本地 data.json 重新生成页面
npm test       # 验证前 20 名、关键词正文、完整目录分页、SEO、结构化数据、更新时间和本地链接
```

本地已有数据快照时，也可用 `DATA_SOURCE_PATH=/绝对路径/data.json npm run sync` 验证构建；线上定时任务不会设置此变量，仍使用公开 URL。

## 数据与排名

- 默认数据源：`https://raw.githubusercontent.com/hvoyai/awesome-ai-api/main/data.json`
- 最多展示 400 条；按来源原始排名排序和截取，首页、完整目录和模型专题保持一致。
- 页面显示的更新时间始终为构建时的北京时间，不使用 `data.json` 自带日期。
- 排名和公开资料只用于初筛，不构成安全、稳定性或商业背书。

## GitHub Pages

仓库 Pages 设置为从 `main` 分支根目录部署。`.github/workflows/update-site.yml` 每天北京时间约 10:17、22:17（UTC 02:17、14:17）同步并提交两次。
