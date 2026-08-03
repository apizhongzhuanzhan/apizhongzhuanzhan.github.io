# AI 中转站推荐

面向 GitHub Pages 的原生静态 HTML 排行站。数据构建时写入 HTML，不依赖前端框架或客户端请求，因此排行榜、指南、FAQ 和模型专题均可直接被搜索引擎抓取。

## 本地命令

```bash
npm run sync   # 拉取公开数据，最多保留 400 条，并生成页面
npm run build  # 使用本地 data.json 重新生成页面
npm test       # 验证分页、SEO、结构化数据和更新时间
```

本地已有数据快照时，也可用 `DATA_SOURCE_PATH=/绝对路径/data.json npm run sync` 验证构建；线上定时任务不会设置此变量，仍使用公开 URL。

## 数据与排名

- 默认数据源：`https://raw.githubusercontent.com/hvoyai/awesome-ai-api/main/data.json`
- 最多展示 400 条；先按来源排名截取，再在每 5 条的小分组内按当天种子做轻微、可复现的顺序扰动。
- 页面显示的更新时间始终为构建时的北京时间，不使用 `data.json` 自带日期。
- 排名和公开资料只用于初筛，不构成安全、稳定性或商业背书。

## GitHub Pages

仓库 Pages 设置为从 `main` 分支根目录部署。`.github/workflows/update-site.yml` 每天北京时间约 10:17、22:17（UTC 02:17、14:17）同步并提交两次。
