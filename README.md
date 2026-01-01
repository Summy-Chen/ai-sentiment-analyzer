# AI产品舆情分析工具

一个用于分析AI产品在社交媒体上用户评价和舆论趋势的网页应用。

## 功能特点

- **多平台搜索**：自动搜索Twitter、Reddit等主流社交媒体平台上的用户评价
- **情感分析**：AI智能分析评价情感倾向，展示正面、负面、中立评价比例
- **代表性评语**：精选具有代表性的用户评语，快速了解主流观点
- **趋势洞察**：识别关键讨论主题，把握舆论趋势和热点话题
- **历史记录**：保存所有分析记录，随时回顾和对比不同时期的舆情变化
- **定期监控**：设置自动监控任务，当舆情发生重大变化时及时通知
- **报告导出**：支持导出分析报告为文本格式

## 技术栈

- **前端**：React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui
- **后端**：Express + tRPC
- **数据库**：MySQL (TiDB)
- **AI**：LLM API 用于情感分析和总结

## 项目结构

```
├── client/                 # 前端代码
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   ├── components/    # 可复用组件
│   │   └── lib/           # 工具库
├── server/                 # 后端代码
│   ├── services/          # 业务服务
│   │   ├── searchService.ts    # 搜索服务
│   │   ├── analysisService.ts  # 分析服务
│   │   └── monitorService.ts   # 监控服务
│   ├── routers.ts         # tRPC 路由
│   └── db.ts              # 数据库操作
├── drizzle/               # 数据库 schema
└── shared/                # 共享类型和常量
```

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 运行测试
pnpm test

# 数据库迁移
pnpm db:push

# 构建生产版本
pnpm build
```

## 环境变量

项目使用以下环境变量（由平台自动注入）：

- `DATABASE_URL` - 数据库连接字符串
- `JWT_SECRET` - JWT 签名密钥
- `BUILT_IN_FORGE_API_URL` - Forge API URL
- `BUILT_IN_FORGE_API_KEY` - Forge API 密钥

## 使用说明

1. 在首页输入想要分析的AI产品名称
2. 点击"开始分析"按钮
3. 等待系统搜索和分析完成
4. 查看分析报告，包括：
   - 整体评价趋势
   - 正面/负面/中立评价比例
   - 关键讨论主题
   - 代表性用户评语
5. 可选择导出报告或设置定期监控

## 许可证

MIT
