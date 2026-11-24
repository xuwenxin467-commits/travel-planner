# Travel Planner - Weather Smart Alerts

## 天气功能
- 使用 Open-Meteo Geocoding API 和 Forecast API。
- 无需 API Key、无需配置 OPENAI_API_KEY，也不需要单独部署天气后端。
- 在生成行程后，按旅行开始日期展示每天的天气预报。
- 对降雨、高温、低温和大风给出提示。
- 天气面板跟随网站当前中文、韩语或英语语言。
- 预报最多展示服务可提供的未来约 16 天；更远日期不做天气推测。

## 部署网站
1. 解压 ZIP。
2. 将 `travel_planner_early_finish_options` 文件夹内的项目内容上传到 GitHub 仓库根目录，覆盖同名文件。
3. 确保 `index.html`、`main.js`、`script.js`、`style.css`、`data.js`、`package.json`、`vite.config.js` 和 `www` 构建配置文件在仓库根目录。
4. Vercel 自动部署完成后，打开网站，填写目的地、旅行天数和开始日期，再点击生成行程。
5. 在行程结果中查看“每日天气与智能提醒”。

## 说明
- 天气功能不依赖 OpenAI API，因此不会产生 OpenAI API 调用费用。
- Open-Meteo 服务的使用条款、可用性和限额以其官方说明为准。
- 天气预报不是实时雷达或分钟级降雨预警；出行前仍应查看当地官方天气预警。
- 这次修改仅针对网站源码。Android 安装包不会因 Vercel 网站部署而自动更新，Android 需另行构建同步。


## 天气面板显示兜底修复
- 天气查询改为在路线地图初始化后执行。
- 地图初始化完成后再次确认天气面板存在，并强制放在地图之前。
- Service Worker 缓存版本更新为 v7，促使浏览器更新缓存。
- 已通过 `node --check script.js` 语法检查；当前打包环境没有安装 npm 依赖，因此尚未完成 Vite 构建和线上验证。
