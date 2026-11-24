# AI 旅行助手部署说明

本项目的网站与 Android App 共用同一套 AI 助手界面。Android App 通过已部署的网站 API 地址调用服务端，不会在 APK 中保存 API 密钥。

## 1. Vercel 部署

1. 将本项目源码提交到 GitHub 仓库。
2. 在 Vercel 项目 Settings → Environment Variables 添加：
   - Name: `OPENAI_API_KEY`
   - Value: 你在 OpenAI API 平台创建的 API Key
   - Environment: Production（建议同时勾选 Preview）
3. 可选添加 `OPENAI_MODEL`，默认使用 `gpt-4.1-mini`。
4. 保存环境变量后，在 Vercel 重新 Deploy。项目会执行 `npm run build`，静态网页输出到 `www`，`api/chat.js` 作为 Vercel Serverless Function 部署。
5. 不要把 API Key 写进 `script.js`、`main.js`、`.env` 前端变量或 APK，也不要提交到 GitHub。

## 2. Android App

Android App 使用 Capacitor。网站 API 部署完成后，App 内助手会请求：
`https://travel-planner-mauve-six.vercel.app/api/chat`

在项目根目录运行：

```bash
npm install
npm run android:sync
npx cap open android
```

然后在 Android Studio 中重新 Build APK。若网站域名改变，需要同步修改 `script.js` 中的 `AI_CHAT_ENDPOINT`。

## 3. 功能与边界

- 支持中文、韩语、英语，跟随当前语言设置。
- 自动附带用户填写的目的地、日期、天数、人数、预算、偏好和当前已生成行程（截取后的上下文）。
- 不会假称已经替用户更改或保存行程；目前提供建议和调整方案。
- 未接入实时天气、地图路况、实时营业时间或票价查询，AI 会提示用户核实这些动态信息。
- API 路由对每个转发 IP 做简单内存频率限制；正式商业运营还应增加身份验证、持久化限流、用量上限与监控。
- AI API 调用会产生 OpenAI API 费用，费用由 API 平台账户承担。
