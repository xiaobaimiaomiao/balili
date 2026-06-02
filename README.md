# Balili

> 一个轻量的视频点播平台 — Go + SQLite 后端,Next.js 14 前端,内置数据导入工具和管理后台。

## ✨ 功能

- 🎬 **视频点播** — 列表 / 详情 / 分类 / 标签 / 搜索 / 热门 / 随机 / 趋势榜
- 👤 **用户系统** — 注册 / 登录 (JWT) / 个人主页 / 个人上传列表
- 💬 **互动** — 评分 (赞踩) / 收藏 (like) / 评论 / 浏览量统计
- 📤 **用户上传** — 上传后自动调用 ffmpeg 抽取 **1 张封面** + **5 张预览图**,无需用户准备
- 🛠 **管理后台** — Dashboard / 视频 CRUD / 分类 / 标签 / 评论审核 / **用户管理**
- 📥 **批量数据导入** — 把 JSON 文件扔进 `parsed-json/` 目录,一行命令写库
- 🔒 **安全** — 上传文件名净化 (防 `../` 穿越) / 路径白名单 / JWT 鉴权 / 角色权限

## 🧱 技术栈

| 端 | 栈 |
| --- | --- |
| API | Go 1.26 · [Gin](https://github.com/gin-gonic/gin) · [GORM](https://gorm.io) · SQLite (WAL) |
| 前端 | Next.js 14 (App Router) · React 18 · TypeScript · TailwindCSS · lucide-react · recharts |
| 工具 | ffmpeg (封面 / 预览图生成) · build.cmd / Makefile |

## 🚀 快速开始

```bash
# 1) 准备数据 (把 JSON 文件放进 parsed-json/)
mkdir -p parsed-json
# 把示例 JSON 存成 parsed-json/anime-001.json ...

# 2) 导入数据
go run cmd/import/main.go --dir ./parsed-json --db ./data/balili.db
# 或用 Makefile
make import

# 3) 启动服务
go run cmd/server/main.go --port 8080
# 或
make server
```

打开 <http://localhost:8080> 查看 API,前端另起一个进程:

```bash
cd web
npm install
npm run dev    # http://localhost:3000
```

### Windows 一键构建

```cmd
build.cmd
```

会同时产出 `bin\server.exe`、`bin\import.exe` 和 `web\.next\`,生产环境直接跑 `bin\server.exe` 即可。

## 📥 数据导入

`cmd/import` 是个独立的 Go 二进制,扫描 `--dir` 目录下所有 `*.json`,按 `video_id` 去重,批量写入 SQLite。期间会自动:
- upsert **Category** / **Tag** 并按名称生成 slug
- 维护 `video_count` 关联计数
- 把 `ratingPercent` / `ratingVotes` 拆成 `upvotes` / `downvotes`

```bash
go run cmd/import/main.go \
  --dir ./parsed-json \
  --db  ./data/balili.db \
  --batch 500

# 重置库 (危险: 会 DROP 视频相关表)
go run cmd/import/main.go --reset
```

### JSON 格式

每个 `.json` 文件 = 一条视频:

```json
{
  "title": "异世界悠闲农家S2-01",
  "videoId": "1",
  "url": "https://demo.com",
  "posterImage": "https://demo.com/preview.jpg",
  "releaseDate": "2026-06-1",
  "durationSeconds": 423553,
  "views": 114514,
  "submittedAgo": "1 years ago",
  "ratingPercent": 100,
  "ratingVotes": 9,
  "categories": ["Anime", "异世界悠闲农家"],
  "tags": ["异世界", "日常", "轻小说改", "种田", "日本"],
  "qualities": [
    { "label": "720P",  "url": "https://demo.com/720p/index.m3u8?" },
    { "label": "1080P", "url": "https://demo.com/1080p/index.m3u8?" }
  ],
  "screenshotUrls": [
    "https://demo.com/screenshots/1.jpg",
    "https://demo.com/screenshots/2.jpg",
    "https://demo.com/screenshots/3.jpg",
    "https://demo.com/screenshots/4.jpg",
    "https://demo.com/screenshots/5.jpg"
  ]
}
```

字段说明:

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `videoId` | string | **必填**,全局唯一,作为去重键 |
| `title` | string | 标题 |
| `posterImage` | string | 封面 URL |
| `releaseDate` | string | `YYYY-MM-DD`,解析失败置空 |
| `durationSeconds` | int | 时长 (秒) |
| `views` | int | 浏览量 |
| `submittedAgo` | string | 自由文本 ("1 years ago" 等) |
| `ratingPercent` | int | 好评率 0-100,配合 `ratingVotes` 拆成 up/down |
| `ratingVotes` | int | 总评分人数 |
| `categories` | string[] | 自动 upsert |
| `tags` | string[] | 自动 upsert |
| `qualities` | {label,url}[] | 多清晰度播放源 |
| `screenshotUrls` | string[] | 预览图,按顺序写入 `sort_order` |

## 🛠 管理后台

启动 server 后访问 <http://localhost:8080/api/v1/admin/auth/login> 用默认账号登录:

```
username: admin
password: admin123
```

(首次启动会自动创建,生产环境请改 `EnsureAdmin` 或直接改库。)

后台包含:

- **Dashboard** — 总视频 / 浏览 / 分类 / 标签 / 平均评分 / 最近 30 天图表
- **Videos** — 增删改查、批量改分类和标签
- **Users** — 用户列表 + 详情 (活动统计 / 最近视频 / 最近评论)
- **Categories / Tags** — CRUD
- **Comments** — 审核删除

前端:Next.js 端对应 `/admin/*` 路由,默认账号密码同上,登录后 JWT 存在 `localStorage.admin_token`。

## 📤 用户上传 + ffmpeg 自动出图

`POST /api/v1/videos/upload` (需要 user JWT):

- 用户只传 `video` 文件 (mp4 / mkv / webm …)
- 服务器把视频存到 `uploads/videos/`,然后:
  1. 找 ffmpeg — Windows 优先 `<server.exe 同目录>/ffmpeg.exe`,再回退 PATH;Linux/macOS 直接走 PATH
  2. 探针视频时长
  3. 在 `max(1s, 5%)` 时分位抽 1 张封面 → `uploads/posters/<videoID>.jpg`
  4. 在 5 个等分时位 (10/28/46/64/82%) 抽 5 张预览 → `uploads/screenshots/<videoID>_{0..4}.jpg`
- 前端播放页拿到这些 URL 直接渲染,跟管理后台手动加的视频完全一致
- ffmpeg 不可用 / 视频无法探针时不会让上传失败,只是没有封面 / 预览 (走 fallback)

> ⚠️ **重要:** Windows 用户请把 `ffmpeg.exe` 放到 `server.exe` 同目录下;Linux 用户确保 `ffmpeg` 在 `PATH` 中。

## 🔌 主要 API 路由

```
公开:
  GET    /api/v1/videos                       列表 (分页/排序/分类/标签/搜索)
  GET    /api/v1/videos/:id                   详情
  GET    /api/v1/videos/random                随机
  GET    /api/v1/videos/popular               热门
  GET    /api/v1/videos/trending              趋势 (按 like)
  GET    /api/v1/search                       全文搜索
  GET    /api/v1/categories                   分类
  GET    /api/v1/tags                         标签
  GET    /api/v1/stats/overview               概览
  GET    /api/v1/videos/:id/comments          评论列表
  POST   /api/v1/videos/:id/view              +1 view

用户 (user JWT):
  POST   /api/v1/auth/register                注册
  POST   /api/v1/auth/login                   登录
  GET    /api/v1/auth/profile                 我的资料
  GET    /api/v1/users/:username/videos       TA 的视频
  POST   /api/v1/videos/upload                上传视频 (ffmpeg 自动出图)
  POST   /api/v1/videos/:id/like              toggle 喜欢
  POST   /api/v1/videos/:id/vote              评分 (true=赞 false=踩)
  POST   /api/v1/videos/:id/comments          发评论

管理 (admin JWT):
  POST   /api/v1/admin/auth/login             管理员登录
  GET    /api/v1/admin/dashboard              仪表盘
  GET    /api/v1/admin/stats/charts           图表
  *      /api/v1/admin/videos[/:id]           视频 CRUD
  *      /api/v1/admin/categories[/:id]       分类 CRUD
  *      /api/v1/admin/tags[/:id]             标签 CRUD
  *      /api/v1/admin/users[/:id]            用户管理
  DELETE /api/v1/admin/comments/:commentId    删评论
```

## 🗂 目录结构

```
balili/
├── cmd/
│   ├── server/        # Gin API 服务
│   └── import/        # 批量 JSON 导入工具
├── internal/
│   ├── admin/         # 管理后台专用逻辑 (留作扩展)
│   ├── database/      # GORM 初始化 + AutoMigrate
│   ├── dto/           # 请求/响应 DTO
│   ├── ffmpeg/        # 封面 / 预览图生成 (含测试)
│   ├── handler/       # HTTP handlers
│   ├── middleware/    # CORS / AuthRequired / AdminAuthRequired
│   ├── model/         # GORM models
│   ├── repository/    # 数据访问层
│   └── service/       # 业务层
├── web/               # Next.js 14 前端 (App Router)
│   └── src/app/
│       ├── (user)/    # 公开页面 (首页 / 视频详情 / 个人主页 / 上传)
│       ├── admin/     # 管理后台
│       ├── login/  register/  globals.css  layout.tsx
├── data/              # SQLite 数据库 (gitignored)
├── parsed-json/       # 待导入的 JSON (gitignored)
├── uploads/           # 运行时上传 (gitignored)
├── Makefile
├── build.cmd          # Windows 一键构建
└── .gitignore
```

## 🛡 安全要点

- **路径穿越** — 所有 `SaveUploadedFile` 前都过 `safeFilename` + `secureUploadPath` (`filepath.Abs` + `Rel` 校验),`../../etc/passwd` 这类会被 400 拒绝
- **JWT** — HS256 签名,默认 72 小时过期,user / admin 两套 role 校验
- **静态文件** — `r.Static("/uploads", "./uploads")` 走 Go `http.Dir`,URL 里塞 `..` 也读不到 uploads 之外的东西
- **SQL 注入** — 全程 GORM 参数化,无字符串拼接 SQL

## 🧪 测试

```bash
go test ./...
```

`internal/ffmpeg/ffmpeg_test.go` 包含端到端集成测试 (用 `FFMPEG_TEST_BIN` 指定 ffmpeg 路径,没有就 skip)。

## 🛠 开发常用命令

```bash
make import   # 批量导入 JSON
make server   # 启动 API
make web-dev  # 启动前端 dev server
make dev      # 同启两者
make build    # 编译所有二进制
```

## 📝 License

MIT
