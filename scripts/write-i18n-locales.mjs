#!/usr/bin/env node
/**
 * Generates js/i18n.messages.locales.js (zh / ko / es / bn).
 * Run: node scripts/write-i18n-locales.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const localeData = {
  zh: {
    columnTitles: ["备忘录", "备忘录", "Clipping"],
    promptTemplates: [
      {
        title: "需求整理",
        color: "blue",
        description: "将模糊需求整理为规格",
        text: `# 请整理需求

## 背景
- 

## 目标
- 

## 约束
- 

## 期望输出
- 功能列表
- 非功能需求
- UI / API / DB 视角
- 待定事项`
      },
      {
        title: "代码审查",
        color: "green",
        description: "从设计、缺陷、可维护性角度审查",
        text: `请审查以下代码。

## 关注点
- 潜在缺陷
- 职责分离
- 命名
- 可测试性
- 安全
- 性能

## 输出格式
- 严重程度
- 问题说明
- 修改建议
- 修改后代码`
      },
      {
        title: "实施计划",
        color: "yellow",
        description: "面向 AI 辅助开发的任务分解",
        text: `请为以下功能制定实施计划。

## 功能
- 

## 技术栈
- 

## 期望输出
1. 实施思路
2. 文件结构
3. 步骤
4. 测试要点
5. 风险`
      },
      {
        title: "故障调查",
        color: "pink",
        description: "根据日志和症状定位原因",
        text: `请调查以下故障。

## 症状
- 

## 发生条件
- 

## 日志
\`\`\`

\`\`\`

## 请确认
- 可能原因
- 需补充查看的日志
- 临时对策
- 永久对策`
      },
      {
        title: "文章整理",
        color: "purple",
        description: "适合 SNS 或文档的润色",
        text: `请整理以下文章。

## 原则
- 自然流畅的中文
- 语气过强时适当缓和
- 结论先行
- 善用列表

## 原文
`
      },
      {
        title: "ADR",
        color: "gray",
        description: "撰写架构决策记录",
        text: `# ADR: 标题

## Status
Proposed

## Context
- 背景
- 约束
- 待解决问题

## Decision
- 采用方案

## Consequences
- 正面影响
- 负面影响
- 复审条件

## Alternatives Considered
- 方案 A
- 方案 B

## Notes
- 补充说明`
      }
    ]
  },
  ko: {
    columnTitles: ["메모", "메모", "Clipping"],
    promptTemplates: [
      {
        title: "요구사항 정리",
        color: "blue",
        description: "모호한 요청을 사양으로 정리",
        text: `# 요구사항을 정리해 주세요

## 배경
- 

## 목표
- 

## 제약
- 

## 기대 출력
- 기능 목록
- 비기능 요구사항
- UI / API / DB 관점
- 미결 사항`
      },
      {
        title: "코드 리뷰",
        color: "green",
        description: "설계·버그·유지보수성 관점",
        text: `다음 코드를 리뷰해 주세요.

## 관점
- 버그 가능성
- 책임 분리
- 네이밍
- 테스트 용이성
- 보안
- 성능

## 출력 형식
- 심각도
- 지적 내용
- 수정안
- 수정 코드`
      },
      {
        title: "구현 계획",
        color: "yellow",
        description: "AI 개발용 작업 분해",
        text: `다음 기능의 구현 계획을 작성해 주세요.

## 기능
- 

## 기술 스택
- 

## 기대 출력
1. 구현 방침
2. 파일 구성
3. 작업 순서
4. 테스트 관점
5. 리스크`
      },
      {
        title: "장애 조사",
        color: "pink",
        description: "로그·증상으로 원인 좁히기",
        text: `다음 장애를 조사해 주세요.

## 증상
- 

## 발생 조건
- 

## 로그
\`\`\`

\`\`\`

## 확인 사항
- 원인 후보
- 추가로 볼 로그
- 임시 대응
- 근본 대응`
      },
      {
        title: "문장 정리",
        color: "purple",
        description: "SNS·문서용 다듬기",
        text: `다음 문장을 정리해 주세요.

## 방침
- 자연스러운 한국어
- 과한 표현은 완화
- 결론을 먼저
- 목록 활용

## 원문
`
      },
      {
        title: "ADR",
        color: "gray",
        description: "Architecture Decision Record 작성",
        text: `# ADR: 제목

## Status
Proposed

## Context
- 배경
- 제약
- 해결할 문제

## Decision
- 채택 방침

## Consequences
- 긍정적 영향
- 부정적 영향
- 재검토 조건

## Alternatives Considered
- 안 A
- 안 B

## Notes
- 보충`
      }
    ]
  },
  es: {
    columnTitles: ["Nota", "Nota", "Clipping"],
    promptTemplates: [
      {
        title: "Requisitos",
        color: "blue",
        description: "Convertir peticiones vagas en especificaciones",
        text: `# Organiza los requisitos

## Contexto
- 

## Objetivos
- 

## Restricciones
- 

## Salida esperada
- Lista de funciones
- Requisitos no funcionales
- Perspectivas UI / API / DB
- Preguntas abiertas`
      },
      {
        title: "Revisión de código",
        color: "green",
        description: "Revisar diseño, errores y mantenibilidad",
        text: `Revisa el siguiente código.

## Enfoque
- Posibles errores
- Separación de responsabilidades
- Nombres
- Testabilidad
- Seguridad
- Rendimiento

## Formato de salida
- Severidad
- Hallazgo
- Corrección sugerida
- Código corregido`
      },
      {
        title: "Plan de implementación",
        color: "yellow",
        description: "Desglose para desarrollo asistido por IA",
        text: `Crea un plan de implementación para la siguiente función.

## Función
- 

## Stack
- 

## Salida esperada
1. Enfoque
2. Estructura de archivos
3. Pasos
4. Plan de pruebas
5. Riesgos`
      },
      {
        title: "Investigación de incidentes",
        color: "pink",
        description: "Acotar causa raíz con logs y síntomas",
        text: `Investiga el siguiente incidente.

## Síntomas
- 

## Condiciones
- 

## Logs
\`\`\`

\`\`\`

## Comprobar
- Causas probables
- Logs adicionales
- Mitigación temporal
- Solución permanente`
      },
      {
        title: "Reescribir texto",
        color: "purple",
        description: "Pulir para redes o documentación",
        text: `Reescribe el siguiente texto.

## Directrices
- Lenguaje claro y natural
- Suavizar expresiones demasiado fuertes
- Conclusión primero
- Usar viñetas

## Fuente
`
      },
      {
        title: "ADR",
        color: "gray",
        description: "Escribir un Architecture Decision Record",
        text: `# ADR: Título

## Status
Proposed

## Context
- Contexto
- Restricciones
- Problema a resolver

## Decision
- Enfoque elegido

## Consequences
- Impacto positivo
- Impacto negativo
- Cuándo revisar

## Alternatives Considered
- Opción A
- Opción B

## Notes
- Notas adicionales`
      }
    ]
  },
  bn: {
    columnTitles: ["মেমো", "মেমো", "Clipping"],
    promptTemplates: [
      {
        title: "প্রয়োজনীয়তা",
        color: "blue",
        description: "অস্পষ্ট অনুরোধকে স্পেসে রূপান্তর",
        text: `# প্রয়োজনীয়তা সাজান

## প্রেক্ষাপট
- 

## লক্ষ্য
- 

## সীমাবদ্ধতা
- 

## প্রত্যাশিত আউটপুট
- ফিচার তালিকা
- নন-ফাংশনাল প্রয়োজনীয়তা
- UI / API / DB দৃষ্টিকোণ
- খোলা প্রশ্ন`
      },
      {
        title: "কোড রিভিউ",
        color: "green",
        description: "ডিজাইন, বাগ, রক্ষণাবেক্ষণ",
        text: `নিচের কোড রিভিউ করুন।

## ফোকাস
- সম্ভাব্য বাগ
- দায়িত্ব বিভাজন
- নামকরণ
- টেস্টযোগ্যতা
- নিরাপত্তা
- পারফরম্যান্স

## আউটপুট ফরম্যাট
- গুরুত্ব
- সমস্যা
- সংশোধন পরামর্শ
- সংশোধিত কোড`
      },
      {
        title: "ইমপ্লিমেন্টেশন পরিকল্পনা",
        color: "yellow",
        description: "AI-সহায়তায় কাজ ভাগ",
        text: `নিচের ফিচারের জন্য ইমপ্লিমেন্টেশন পরিকল্পনা তৈরি করুন।

## ফিচার
- 

## স্ট্যাক
- 

## প্রত্যাশিত আউটপুট
1. পদ্ধতি
2. ফাইল বিন্যাস
3. ধাপ
4. টেস্ট পরিকল্পনা
5. ঝুঁকি`
      },
      {
        title: "ইনসিডেন্ট তদন্ত",
        color: "pink",
        description: "লগ ও লক্ষণ থেকে কারণ",
        text: `নিচের ইনসিডেন্ট তদন্ত করুন।

## লক্ষণ
- 

## শর্ত
- 

## লগ
\`\`\`

\`\`\`

## যাচাই করুন
- সম্ভাব্য কারণ
- অতিরিক্ত লগ
- অস্থায়ী সমাধান
- স্থায়ী সমাধান`
      },
      {
        title: "টেক্সট সম্পাদনা",
        color: "purple",
        description: "SNS বা ডক্সের জন্য",
        text: `নিচের টেক্সট সম্পাদনা করুন।

## নির্দেশিকা
- স্পষ্ট, প্রাকৃতিক ভাষা
- অতিরিক্ত শক্ত ভাষা নরম করুন
- সিদ্ধান্ত আগে
- বুলেট ব্যবহার

## উৎস
`
      },
      {
        title: "ADR",
        color: "gray",
        description: "Architecture Decision Record লিখুন",
        text: `# ADR: শিরোনাম

## Status
Proposed

## Context
- প্রেক্ষাপট
- সীমাবদ্ধতা
- সমস্যা

## Decision
- গৃহীত পদ্ধতি

## Consequences
- ইতিবাচক প্রভাব
- নেতিবাচক প্রভাব
- পুনর্বিবেচনা

## Alternatives Considered
- বিকল্প A
- বিকল্প B

## Notes
- অতিরিক্ত নোট`
      }
    ]
  }
};

const messages = {
  zh: {
    "app.title": "New Tab Memo Board",
    "app.columnsAria": "提示词列",
    "sidebar.collapse": "折叠侧边栏",
    "sidebar.expand": "展开侧边栏",
    "sidebar.filterByTag": "按标签筛选",
    "sidebar.filterByTagAria": "按标签筛选",
    "sidebar.clear": "清除",
    "sidebar.obsidianSync": "同步到 Obsidian",
    "sidebar.settings": "设置",
    "sidebar.filterActive": "显示中: #{tag}",
    "sidebar.noTilesForTag": "没有 #{tag} 的磁贴。",
    "sidebar.noFilledTiles": "尚无已填写的磁贴。",
    "settings.title": "设置",
    "settings.language.label": "语言",
    "settings.language.auto": "自动（跟随浏览器）",
    "settings.obsidianFolder": "Obsidian 保存文件夹",
    "settings.obsidianEndpoint": "Obsidian Local REST API URL",
    "settings.obsidianToken": "Obsidian API Key / Token",
    "settings.obsidianTokenHelpAria": "如何设置 API Key",
    "settings.obsidianTokenPlaceholder": "Local REST API API Key",
    "settings.autoPasteClipboard": "打开空磁贴时自动粘贴剪贴板",
    "settings.autoPasteClipboardNote": "开启后，打开空磁贴时会插入最近 60 秒内复制的文本。",
    "settings.autoBackup": "自动备份",
    "settings.autoBackupNote": "开启后，每天首次打开新标签页时会下载 JSON 备份。",
    "settings.obsidianNote": "Obsidian 同步需要 Local REST API 插件的 API Key。",
    "settings.openaiHeading": "OpenAI",
    "settings.openaiKey": "OpenAI API Key",
    "settings.openaiNote":
      "设置后，磁贴编辑模态框会显示 AI 按钮。获取 URL 并发送到 OpenAI 前会确认。不会获取本地/私有网络 URL。密钥不会包含在 JSON 备份中。",
    "settings.openaiPromptHeading": "AI 提示词（高级）",
    "settings.openaiSystemPrompt": "System 提示词",
    "settings.openaiUserPromptMemo": "User 提示词（仅备忘录）",
    "settings.openaiUserPromptUrl": "User 提示词（含 URL）",
    "settings.openaiPromptNote":
      "占位符：System — {{URL_TILE_RULE}} {{SECTION_LIMIT_RULE}} {{YOUTUBE_SYSTEM_RULE}}。备忘录 User — {{MEMO_BODY}}。URL User — {{MEMO_BODY}} {{URL_CONTEXTS}} {{YOUTUBE_EXTRA_RULES}}。保存与内置默认相同的内容时，将使用捆绑默认。",
    "settings.openaiPromptReset": "恢复默认",
    "settings.dataHeading": "数据",
    "settings.jsonBackup": "JSON 备份",
    "settings.jsonImport": "JSON 导入",
    "settings.extensionHeading": "扩展程序",
    "settings.openExtensionDetails": "打开扩展程序详情",
    "settings.extensionNote":
      "新标签页底部的 Customize Chrome 页脚由 Chrome 显示。可在页脚菜单或 Customize Chrome 中关闭 Footer。",
    "settings.save": "保存",
    "settings.saved": "设置已保存。",
    "settings.obsidianHelpTitle": "如何设置 Obsidian API Key",
    "settings.obsidianHelpHtml":
      '<ol><li>打开 Obsidian，在<strong>设置 → 社区插件</strong>中安装并启用 <strong>Local REST API</strong>。</li><li>打开插件设置，启用 <strong>Enable Non-encrypted (HTTP) Server</strong>（默认端口 <code>27123</code>）。</li><li>在 <strong>API Key</strong> 字段点击 <strong>Generate</strong> 并复制。</li><li>在 <strong>Obsidian Local REST API URL</strong> 输入 <code>http://127.0.0.1:27123</code>（HTTPS 使用 <code>https://127.0.0.1:27124</code>）。</li><li>将密钥粘贴到 <strong>Obsidian API Key / Token</strong> 并<strong>保存</strong>。</li><li>用 <strong>同步到 Obsidian</strong> 测试。请保持 Obsidian 运行。</li></ol><p class="settings-help-note">出于安全，仅允许 <code>localhost</code> / <code>127.0.0.1</code> 及端口 <code>27123</code> / <code>27124</code>。</p><p class="settings-help-note">插件：<a href="https://github.com/coddingtonbear/obsidian-local-rest-api" target="_blank" rel="noopener noreferrer">Obsidian Local REST API</a></p>',
    "template.title": "添加模板",
    "template.add": "添加",
    "delete.title": "删除磁贴",
    "delete.message": "确定删除「{title}」吗？",
    "delete.cancel": "取消",
    "delete.confirm": "删除",
    "modal.copy": "复制",
    "modal.markdownPreview": "Markdown 预览",
    "modal.editView": "编辑视图",
    "modal.templateAdd": "添加模板",
    "modal.aiSummary": "AI 摘要",
    "modal.obsidianSave": "保存到 Obsidian",
    "modal.title": "标题",
    "modal.titlePlaceholder": "# 标题",
    "modal.bodyPlaceholder": "输入正文",
    "modal.tileColor": "磁贴颜色",
    "modal.color.white": "白",
    "modal.color.blue": "蓝",
    "modal.color.green": "绿",
    "modal.color.yellow": "黄",
    "modal.color.pink": "粉",
    "modal.color.purple": "紫",
    "modal.color.gray": "灰",
    "modal.tagsPlaceholder": "todo idea 工作 备忘（空格或逗号分隔，无需 #）",
    "modal.tags": "标签",
    "modal.tagAdd": "添加 {tag}",
    "modal.updated": "更新: {datetime}",
    "modal.enterBodyFirst": "请先输入正文",
    "modal.aiBusy": "AI 处理中...",
    "modal.aiLoading": "AI 分析中...",
    "modal.aiStarting": "正在开始分析...",
    "modal.aiFetchingUrls": "正在获取 URL...",
    "modal.aiGenerating": "正在生成 AI 摘要...",
    "modal.speechInput": "语音输入",
    "modal.speechInputStop": "停止语音输入",
    "modal.speechErrorNotAllowed": "未允许使用麦克风。请在浏览器站点设置中允许麦克风。",
    "modal.speechErrorNoSpeech": "未检测到语音。",
    "modal.speechErrorNetwork": "网络错误。请检查互联网连接。",
    "modal.speechErrorGeneric": "语音输入失败。",
    "tile.drag": "拖动以移动",
    "tile.titleAria": "磁贴标题",
    "tile.delete": "删除此磁贴",
    "tile.add": "添加磁贴",
    "tile.untitled": "无标题",
    "common.close": "关闭",
    "common.copy": "复制",
    "common.on": "ON",
    "common.off": "OFF",
    "clipboard.nothingToCopy": "没有可复制的内容",
    "clipboard.copied": "已复制",
    "obsidian.notConfigured": "请在设置中保存 Obsidian（API URL 与 Token）",
    "obsidian.notConfiguredAlert": "Obsidian 未配置。请在设置中保存 API URL 和 Token。",
    "obsidian.noContent": "没有可保存的内容。",
    "obsidian.saved": "已保存到 Obsidian: {path}",
    "obsidian.saveFailed":
      "保存到 Obsidian 失败: {detail}\n请在设置中检查 API URL 和 Token。",
    "obsidian.noFilledTiles": "没有已填写的磁贴可保存。",
    "obsidian.batchConfirm": "将 {count} 个已填写磁贴保存到 Obsidian？",
    "obsidian.batchDone": "Obsidian 保存完成: {success}/{total}",
    "obsidian.batchDoneWithError":
      "Obsidian 保存完成: {success}/{total}\n最后错误: {error}",
    "obsidian.networkError": "网络错误",
    "openai.notConfigured": "未设置 OpenAI API Key。请在设置中保存。",
    "openai.noContent": "没有可摘要的内容。",
    "openai.fetchConfirm":
      "AI 摘要将获取正文中的 URL（最多 {max} 个）并发送到 OpenAI。\n\n{preview}{suffix}\n\n继续吗？",
    "openai.fetchConfirmMore": "\n…另有 {count} 个",
    "openai.failed": "AI 摘要失败: {error}",
    "openai.unknownError": "未知错误",
    "backup.fileTooLarge": "JSON 文件过大（上限 {max}MB）。",
    "backup.readFailed": "读取 JSON 失败。",
    "backup.foreignAppConfirm": "{message}\n是否继续导入此文件？",
    "backup.invalidFormat": "不支持的 JSON 格式。",
    "backup.replaceConfirm": "用 JSON 内容替换当前磁贴？",
    "backup.importDone": "JSON 导入完成。",
    "storage.saveFailed": "保存失败。请稍后重试。",
    "extension.openFailed": "无法打开扩展程序详情。",
    "validation.obsidian.invalidUrl": "Obsidian API URL 无效。",
    "validation.obsidian.protocol": "Obsidian API URL 须为 http 或 https。",
    "validation.obsidian.host": "出于安全，Obsidian API URL 仅限 localhost 或 127.0.0.1。",
    "validation.obsidian.port": "Obsidian API URL 端口仅限 27123 或 27124。",
    "validation.url.invalid": "无效 URL",
    "validation.url.protocol": "仅可获取 http/https URL",
    "validation.url.privateNetwork": "无法获取本地/私有网络 URL",
    "validation.import.noColumns": "缺少 columns 数组。",
    "validation.import.tooManyTiles": "磁贴数量超过上限 ({max})。",
    "validation.import.textTooLong": "磁贴正文超过上限 ({max} 字符)。",
    "validation.backup.notObject": "不是 JSON 对象。",
    "validation.backup.foreignApp": "来自其他应用的备份 (app: {app})。",
    "validation.storage.conflict": "无法解决存储更新冲突。",
    "fetch.timeout": "超时",
    "fetch.notHtml": "非 HTML",
    "fetch.failed": "获取失败"
  },
  ko: {
    "app.title": "New Tab Memo Board",
    "app.columnsAria": "프롬프트 열",
    "sidebar.collapse": "사이드바 접기",
    "sidebar.expand": "사이드바 펼치기",
    "sidebar.filterByTag": "태그로 필터",
    "sidebar.filterByTagAria": "태그로 필터",
    "sidebar.clear": "지우기",
    "sidebar.obsidianSync": "Obsidian 동기화",
    "sidebar.settings": "설정",
    "sidebar.filterActive": "표시 중: #{tag}",
    "sidebar.noTilesForTag": "#{tag} 타일이 없습니다.",
    "sidebar.noFilledTiles": "입력된 타일이 아직 없습니다.",
    "settings.title": "설정",
    "settings.language.label": "언어",
    "settings.language.auto": "자동 (브라우저에 맞춤)",
    "settings.obsidianFolder": "Obsidian 저장 폴더",
    "settings.obsidianEndpoint": "Obsidian Local REST API URL",
    "settings.obsidianToken": "Obsidian API Key / Token",
    "settings.obsidianTokenHelpAria": "API Key 설정 방법",
    "settings.obsidianTokenPlaceholder": "Local REST API API Key",
    "settings.autoPasteClipboard": "빈 타일을 열 때 클립보드 자동 붙여넣기",
    "settings.autoPasteClipboardNote":
      "ON이면 빈 타일을 열 때 최근 60초 이내에 복사한 텍스트를 자동으로 삽입합니다.",
    "settings.autoBackup": "자동 백업",
    "settings.autoBackupNote": "ON이면 새 탭을 하루에 한 번 열 때 JSON을 다운로드합니다.",
    "settings.obsidianNote": "Obsidian 동기화에는 Local REST API 플러그인 API Key가 필요합니다.",
    "settings.openaiHeading": "OpenAI",
    "settings.openaiKey": "OpenAI API Key",
    "settings.openaiNote":
      "설정하면 타일 편집 모달에 AI 버튼이 표시됩니다. URL 가져오기 및 OpenAI 전송 전에 확인합니다. 로컬/사설 네트워크 URL은 가져오지 않습니다. 키는 JSON 백업에서 제외됩니다.",
    "settings.openaiPromptHeading": "AI 프롬프트 (고급)",
    "settings.openaiSystemPrompt": "System 프롬프트",
    "settings.openaiUserPromptMemo": "User 프롬프트 (메모만)",
    "settings.openaiUserPromptUrl": "User 프롬프트 (URL 포함)",
    "settings.openaiPromptNote":
      "플레이스홀더: System — {{URL_TILE_RULE}} {{SECTION_LIMIT_RULE}} {{YOUTUBE_SYSTEM_RULE}}. 메모 User — {{MEMO_BODY}}. URL User — {{MEMO_BODY}} {{URL_CONTEXTS}} {{YOUTUBE_EXTRA_RULES}}. 내장 기본값과 동일하게 저장하면 번들 기본값을 사용합니다.",
    "settings.openaiPromptReset": "기본값으로 복원",
    "settings.dataHeading": "데이터",
    "settings.jsonBackup": "JSON Backup",
    "settings.jsonImport": "JSON Import",
    "settings.extensionHeading": "확장 프로그램",
    "settings.openExtensionDetails": "확장 프로그램 세부정보 열기",
    "settings.extensionNote":
      "새 탭 하단의 Customize Chrome 푸터는 Chrome이 표시합니다. 푸터 메뉴 또는 Customize Chrome에서 Footer를 끄세요.",
    "settings.save": "저장",
    "settings.saved": "설정을 저장했습니다.",
    "settings.obsidianHelpTitle": "Obsidian API Key 설정 방법",
    "settings.obsidianHelpHtml":
      '<ol><li>Obsidian을 열고 <strong>설정 → 커뮤니티 플러그인</strong>에서 <strong>Local REST API</strong>를 설치·활성화합니다.</li><li>플러그인 설정에서 <strong>Enable Non-encrypted (HTTP) Server</strong>를 켭니다(기본 포트 <code>27123</code>).</li><li><strong>API Key</strong>에서 <strong>Generate</strong> 후 복사합니다.</li><li><strong>Obsidian Local REST API URL</strong>에 <code>http://127.0.0.1:27123</code> 입력(HTTPS는 <code>https://127.0.0.1:27124</code>).</li><li><strong>Obsidian API Key / Token</strong>에 붙여넣고 <strong>저장</strong>합니다.</li><li><strong>Obsidian 동기화</strong>로 테스트합니다. Obsidian을 실행 상태로 유지하세요.</li></ol><p class="settings-help-note">보안상 <code>localhost</code> / <code>127.0.0.1</code> 및 포트 <code>27123</code> / <code>27124</code>만 허용됩니다.</p><p class="settings-help-note">플러그인: <a href="https://github.com/coddingtonbear/obsidian-local-rest-api" target="_blank" rel="noopener noreferrer">Obsidian Local REST API</a></p>',
    "template.title": "템플릿 추가",
    "template.add": "추가",
    "delete.title": "타일 삭제",
    "delete.message": "「{title}」을(를) 삭제할까요?",
    "delete.cancel": "취소",
    "delete.confirm": "삭제",
    "modal.copy": "복사",
    "modal.markdownPreview": "Markdown 미리보기",
    "modal.editView": "편집 보기",
    "modal.templateAdd": "템플릿 추가",
    "modal.aiSummary": "AI 요약",
    "modal.obsidianSave": "Obsidian에 저장",
    "modal.title": "제목",
    "modal.titlePlaceholder": "# 제목",
    "modal.bodyPlaceholder": "본문 입력",
    "modal.tileColor": "타일 색",
    "modal.color.white": "흰색",
    "modal.color.blue": "파랑",
    "modal.color.green": "초록",
    "modal.color.yellow": "노랑",
    "modal.color.pink": "분홍",
    "modal.color.purple": "보라",
    "modal.color.gray": "회색",
    "modal.tagsPlaceholder": "todo idea work memo (공백 또는 쉼표, # 불필요)",
    "modal.tags": "태그",
    "modal.tagAdd": "{tag} 추가",
    "modal.updated": "Updated: {datetime}",
    "modal.enterBodyFirst": "본문을 먼저 입력하세요",
    "modal.aiBusy": "AI 처리 중...",
    "modal.aiLoading": "AI 분석 중...",
    "modal.aiStarting": "분석을 시작합니다...",
    "modal.aiFetchingUrls": "URL 가져오는 중...",
    "modal.aiGenerating": "AI 요약 생성 중...",
    "modal.speechInput": "음성 입력",
    "modal.speechInputStop": "음성 입력 중지",
    "modal.speechErrorNotAllowed": "마이크 사용이 허용되지 않았습니다. 브라우저 사이트 설정에서 마이크를 허용하세요.",
    "modal.speechErrorNoSpeech": "음성이 감지되지 않았습니다.",
    "modal.speechErrorNetwork": "네트워크 오류입니다. 인터넷 연결을 확인하세요.",
    "modal.speechErrorGeneric": "음성 입력에 실패했습니다.",
    "tile.drag": "드래그하여 이동",
    "tile.titleAria": "타일 제목",
    "tile.delete": "이 타일 삭제",
    "tile.add": "타일 추가",
    "tile.untitled": "제목 없음",
    "common.close": "닫기",
    "common.copy": "복사",
    "common.on": "ON",
    "common.off": "OFF",
    "clipboard.nothingToCopy": "복사할 내용이 없습니다",
    "clipboard.copied": "복사했습니다",
    "obsidian.notConfigured": "설정에서 Obsidian(API URL·Token)을 저장하세요",
    "obsidian.notConfiguredAlert": "Obsidian이 설정되지 않았습니다. 설정에서 API URL과 Token을 저장하세요.",
    "obsidian.noContent": "저장할 내용이 없습니다.",
    "obsidian.saved": "Obsidian에 저장했습니다: {path}",
    "obsidian.saveFailed":
      "Obsidian 저장 실패: {detail}\n설정에서 API URL과 Token을 확인하세요.",
    "obsidian.noFilledTiles": "저장할 입력된 타일이 없습니다.",
    "obsidian.batchConfirm": "입력된 타일 {count}개를 Obsidian에 저장할까요?",
    "obsidian.batchDone": "Obsidian 저장 완료: {success}/{total}",
    "obsidian.batchDoneWithError":
      "Obsidian 저장 완료: {success}/{total}\n마지막 오류: {error}",
    "obsidian.networkError": "네트워크 오류",
    "openai.notConfigured": "OpenAI API Key가 설정되지 않았습니다. 설정에서 저장하세요.",
    "openai.noContent": "요약할 내용이 없습니다.",
    "openai.fetchConfirm":
      "AI 요약은 본문의 URL(최대 {max}개)을 가져와 OpenAI에 전송합니다.\n\n{preview}{suffix}\n\n계속할까요?",
    "openai.fetchConfirmMore": "\n…외 {count}개",
    "openai.failed": "AI 요약 실패: {error}",
    "openai.unknownError": "알 수 없는 오류",
    "backup.fileTooLarge": "JSON 파일이 너무 큽니다(상한 {max}MB).",
    "backup.readFailed": "JSON 읽기에 실패했습니다.",
    "backup.foreignAppConfirm": "{message}\n이 파일로 가져오기를 계속할까요?",
    "backup.invalidFormat": "지원하지 않는 JSON 형식입니다.",
    "backup.replaceConfirm": "현재 타일을 JSON 내용으로 바꿀까요?",
    "backup.importDone": "JSON Import가 완료되었습니다.",
    "storage.saveFailed": "저장에 실패했습니다. 나중에 다시 시도하세요.",
    "extension.openFailed": "확장 프로그램 세부정보를 열 수 없습니다.",
    "validation.obsidian.invalidUrl": "Obsidian API URL이 잘못되었습니다.",
    "validation.obsidian.protocol": "Obsidian API URL은 http 또는 https만 가능합니다.",
    "validation.obsidian.host":
      "보안상 Obsidian API URL은 localhost 또는 127.0.0.1만 허용됩니다.",
    "validation.obsidian.port": "Obsidian API URL 포트는 27123 또는 27124만 허용됩니다.",
    "validation.url.invalid": "잘못된 URL",
    "validation.url.protocol": "http/https URL만 가져올 수 있습니다",
    "validation.url.privateNetwork": "로컬/사설 네트워크 URL은 가져올 수 없습니다",
    "validation.import.noColumns": "columns 배열이 없습니다.",
    "validation.import.tooManyTiles": "타일 수가 상한({max})을 초과했습니다.",
    "validation.import.textTooLong": "타일 본문이 상한({max}자)을 초과했습니다.",
    "validation.backup.notObject": "JSON 객체가 아닙니다.",
    "validation.backup.foreignApp": "다른 앱의 백업입니다 (app: {app}).",
    "validation.storage.conflict": "스토리지 업데이트 충돌을 해결할 수 없습니다.",
    "fetch.timeout": "타임아웃",
    "fetch.notHtml": "비 HTML",
    "fetch.failed": "가져오기 실패"
  },
  es: {
    "app.title": "New Tab Memo Board",
    "app.columnsAria": "Columnas de prompts",
    "sidebar.collapse": "Contraer barra lateral",
    "sidebar.expand": "Expandir barra lateral",
    "sidebar.filterByTag": "Filtrar por etiqueta",
    "sidebar.filterByTagAria": "Filtrar por etiqueta",
    "sidebar.clear": "Borrar",
    "sidebar.obsidianSync": "Sincronizar con Obsidian",
    "sidebar.settings": "Ajustes",
    "sidebar.filterActive": "Mostrando: #{tag}",
    "sidebar.noTilesForTag": "No hay mosaicos para #{tag}.",
    "sidebar.noFilledTiles": "Aún no hay mosaicos con contenido.",
    "settings.title": "Ajustes",
    "settings.language.label": "Idioma",
    "settings.language.auto": "Automático (según el navegador)",
    "settings.obsidianFolder": "Carpeta de Obsidian",
    "settings.obsidianEndpoint": "Obsidian Local REST API URL",
    "settings.obsidianToken": "Obsidian API Key / Token",
    "settings.obsidianTokenHelpAria": "Cómo configurar la API Key",
    "settings.obsidianTokenPlaceholder": "API Key de Local REST API",
    "settings.autoPasteClipboard": "Pegar portapapeles al abrir mosaico vacío",
    "settings.autoPasteClipboardNote":
      "Si está ON, al abrir un mosaico vacío se inserta el texto copiado en los últimos 60 segundos.",
    "settings.autoBackup": "Copia de seguridad automática",
    "settings.autoBackupNote":
      "Si está activada, se descarga un JSON una vez al día al abrir una pestaña nueva.",
    "settings.obsidianNote": "La sincronización con Obsidian requiere la API Key del plugin Local REST API.",
    "settings.openaiHeading": "OpenAI",
    "settings.openaiKey": "OpenAI API Key",
    "settings.openaiNote":
      "Al configurarla, aparece el botón AI en el editor. Se pedirá confirmación antes de obtener URLs y enviar a OpenAI. No se obtienen URLs de red local/privada. La clave se excluye del backup JSON.",
    "settings.openaiPromptHeading": "Prompts de IA (avanzado)",
    "settings.openaiSystemPrompt": "Prompt del sistema",
    "settings.openaiUserPromptMemo": "Prompt de usuario (solo memo)",
    "settings.openaiUserPromptUrl": "Prompt de usuario (con URLs)",
    "settings.openaiPromptNote":
      "Marcadores: System — {{URL_TILE_RULE}} {{SECTION_LIMIT_RULE}} {{YOUTUBE_SYSTEM_RULE}}. Memo — {{MEMO_BODY}}. URL — {{MEMO_BODY}} {{URL_CONTEXTS}} {{YOUTUBE_EXTRA_RULES}}. Guardar el valor por defecto integrado usa el predeterminado del paquete.",
    "settings.openaiPromptReset": "Restaurar valores predeterminados",
    "settings.dataHeading": "Datos",
    "settings.jsonBackup": "JSON Backup",
    "settings.jsonImport": "JSON Import",
    "settings.extensionHeading": "Extensión",
    "settings.openExtensionDetails": "Abrir detalles de la extensión",
    "settings.extensionNote":
      "El pie de Customize Chrome en la nueva pestaña lo muestra Chrome. Ocúltalo desde el menú del pie o en Customize Chrome.",
    "settings.save": "Guardar",
    "settings.saved": "Ajustes guardados.",
    "settings.obsidianHelpTitle": "Cómo configurar la API Key de Obsidian",
    "settings.obsidianHelpHtml":
      '<ol><li>Abre Obsidian, instala y activa <strong>Local REST API</strong> en <strong>Ajustes → Plugins de la comunidad</strong>.</li><li>Activa <strong>Enable Non-encrypted (HTTP) Server</strong> (puerto <code>27123</code> por defecto).</li><li>Pulsa <strong>Generate</strong> en <strong>API Key</strong> y copia el valor.</li><li>Introduce <code>http://127.0.0.1:27123</code> en <strong>Obsidian Local REST API URL</strong> (o <code>https://127.0.0.1:27124</code> con HTTPS).</li><li>Pega la clave en <strong>Obsidian API Key / Token</strong> y <strong>Guardar</strong>.</li><li>Prueba con <strong>Sincronizar con Obsidian</strong>. Mantén Obsidian abierto.</li></ol><p class="settings-help-note">Por seguridad, solo <code>localhost</code> / <code>127.0.0.1</code> y puertos <code>27123</code> / <code>27124</code>.</p><p class="settings-help-note">Plugin: <a href="https://github.com/coddingtonbear/obsidian-local-rest-api" target="_blank" rel="noopener noreferrer">Obsidian Local REST API</a></p>',
    "template.title": "Añadir plantilla",
    "template.add": "Añadir",
    "delete.title": "Eliminar mosaico",
    "delete.message": "¿Eliminar «{title}»?",
    "delete.cancel": "Cancelar",
    "delete.confirm": "Eliminar",
    "modal.copy": "Copiar",
    "modal.markdownPreview": "Vista previa Markdown",
    "modal.editView": "Vista de edición",
    "modal.templateAdd": "Añadir plantilla",
    "modal.aiSummary": "Resumen con IA",
    "modal.obsidianSave": "Guardar en Obsidian",
    "modal.title": "Título",
    "modal.titlePlaceholder": "# Título",
    "modal.bodyPlaceholder": "Escribe el cuerpo",
    "modal.tileColor": "Color del mosaico",
    "modal.color.white": "Blanco",
    "modal.color.blue": "Azul",
    "modal.color.green": "Verde",
    "modal.color.yellow": "Amarillo",
    "modal.color.pink": "Rosa",
    "modal.color.purple": "Morado",
    "modal.color.gray": "Gris",
    "modal.tagsPlaceholder": "todo idea trabajo memo (espacios o comas, sin #)",
    "modal.tags": "Etiquetas",
    "modal.tagAdd": "Añadir {tag}",
    "modal.updated": "Actualizado: {datetime}",
    "modal.enterBodyFirst": "Escribe el cuerpo primero",
    "modal.aiBusy": "Procesando IA...",
    "modal.aiLoading": "Analizando con IA...",
    "modal.aiStarting": "Iniciando análisis...",
    "modal.aiFetchingUrls": "Obteniendo URLs...",
    "modal.aiGenerating": "Generando resumen con IA...",
    "modal.speechInput": "Entrada por voz",
    "modal.speechInputStop": "Detener entrada por voz",
    "modal.speechErrorNotAllowed": "Se denegó el acceso al micrófono. Permite el micrófono en la configuración del sitio.",
    "modal.speechErrorNoSpeech": "No se detectó voz.",
    "modal.speechErrorNetwork": "Error de red. Comprueba tu conexión a internet.",
    "modal.speechErrorGeneric": "Error en la entrada por voz.",
    "tile.drag": "Arrastrar para mover",
    "tile.titleAria": "Título del mosaico",
    "tile.delete": "Eliminar este mosaico",
    "tile.add": "Añadir mosaico",
    "tile.untitled": "Sin título",
    "common.close": "Cerrar",
    "common.copy": "Copiar",
    "common.on": "ON",
    "common.off": "OFF",
    "clipboard.nothingToCopy": "Nada que copiar",
    "clipboard.copied": "Copiado",
    "obsidian.notConfigured": "Guarda Obsidian (URL y Token) en Ajustes",
    "obsidian.notConfiguredAlert": "Obsidian no está configurado. Guarda URL y Token en Ajustes.",
    "obsidian.noContent": "No hay contenido que guardar.",
    "obsidian.saved": "Guardado en Obsidian: {path}",
    "obsidian.saveFailed":
      "Error al guardar en Obsidian: {detail}\nComprueba URL y Token en Ajustes.",
    "obsidian.noFilledTiles": "No hay mosaicos con contenido para guardar.",
    "obsidian.batchConfirm": "¿Guardar {count} mosaico(s) en Obsidian?",
    "obsidian.batchDone": "Guardado en Obsidian: {success}/{total}",
    "obsidian.batchDoneWithError":
      "Guardado en Obsidian: {success}/{total}\nÚltimo error: {error}",
    "obsidian.networkError": "Error de red",
    "openai.notConfigured": "OpenAI API Key no configurada. Guárdala en Ajustes.",
    "openai.noContent": "No hay contenido para resumir.",
    "openai.fetchConfirm":
      "El resumen con IA obtendrá URLs del cuerpo (máx. {max}) y las enviará a OpenAI.\n\n{preview}{suffix}\n\n¿Continuar?",
    "openai.fetchConfirmMore": "\n…y {count} más",
    "openai.failed": "Error en resumen con IA: {error}",
    "openai.unknownError": "Error desconocido",
    "backup.fileTooLarge": "El JSON es demasiado grande (límite {max}MB).",
    "backup.readFailed": "No se pudo leer el JSON.",
    "backup.foreignAppConfirm": "{message}\n¿Continuar la importación?",
    "backup.invalidFormat": "Formato JSON no compatible.",
    "backup.replaceConfirm": "¿Reemplazar los mosaicos actuales con el JSON?",
    "backup.importDone": "Importación JSON completada.",
    "storage.saveFailed": "Error al guardar. Inténtalo más tarde.",
    "extension.openFailed": "No se pudieron abrir los detalles de la extensión.",
    "validation.obsidian.invalidUrl": "URL de API de Obsidian no válida.",
    "validation.obsidian.protocol": "La URL debe ser http o https.",
    "validation.obsidian.host":
      "Por seguridad, la URL solo puede ser localhost o 127.0.0.1.",
    "validation.obsidian.port": "El puerto debe ser 27123 o 27124.",
    "validation.url.invalid": "URL no válida",
    "validation.url.protocol": "Solo se pueden obtener URLs http/https",
    "validation.url.privateNetwork": "No se pueden obtener URLs de red local/privada",
    "validation.import.noColumns": "Falta el array columns.",
    "validation.import.tooManyTiles": "El número de mosaicos supera el límite ({max}).",
    "validation.import.textTooLong": "El texto supera el límite ({max} caracteres).",
    "validation.backup.notObject": "No es un objeto JSON.",
    "validation.backup.foreignApp": "Copia de otra app (app: {app}).",
    "validation.storage.conflict": "No se pudo resolver el conflicto de almacenamiento.",
    "fetch.timeout": "Tiempo agotado",
    "fetch.notHtml": "No HTML",
    "fetch.failed": "Error al obtener"
  },
  bn: {
    "app.title": "New Tab Memo Board",
    "app.columnsAria": "প্রম্পট কলাম",
    "sidebar.collapse": "সাইডবার ভাঁজ করুন",
    "sidebar.expand": "সাইডবার খুলুন",
    "sidebar.filterByTag": "ট্যাগ দিয়ে ফিল্টার",
    "sidebar.filterByTagAria": "ট্যাগ দিয়ে ফিল্টার",
    "sidebar.clear": "মুছুন",
    "sidebar.obsidianSync": "Obsidian সিঙ্ক",
    "sidebar.settings": "সেটিংস",
    "sidebar.filterActive": "দেখানো: #{tag}",
    "sidebar.noTilesForTag": "#{tag} এর জন্য কোনো টাইল নেই।",
    "sidebar.noFilledTiles": "এখনও পূরণ করা টাইল নেই।",
    "settings.title": "সেটিংস",
    "settings.language.label": "ভাষা",
    "settings.language.auto": "স্বয়ংক্রিয় (ব্রাউজার অনুযায়ী)",
    "settings.obsidianFolder": "Obsidian ফোল্ডার",
    "settings.obsidianEndpoint": "Obsidian Local REST API URL",
    "settings.obsidianToken": "Obsidian API Key / Token",
    "settings.obsidianTokenHelpAria": "API Key সেট করার পদ্ধতি",
    "settings.obsidianTokenPlaceholder": "Local REST API API Key",
    "settings.autoPasteClipboard": "খালি টাইল খুললে ক্লিপবোর্ড স্বয়ংক্রিয় পেস্ট",
    "settings.autoPasteClipboardNote":
      "ON থাকলে খালি টাইল খুললে গত ৬০ সেকেন্ডের মধ্যে কপি করা টেক্সট যোগ হয়।",
    "settings.autoBackup": "স্বয়ংক্রিয় ব্যাকআপ",
    "settings.autoBackupNote":
      "চালু থাকলে প্রতিদিন নতুন ট্যাব খোলার সময় একবার JSON ডাউনলোড হয়।",
    "settings.obsidianNote": "Obsidian সিঙ্কের জন্য Local REST API প্লাগইন API Key দরকার।",
    "settings.openaiHeading": "OpenAI",
    "settings.openaiKey": "OpenAI API Key",
    "settings.openaiNote":
      "সেট করলে টাইল এডিটরে AI বোতাম দেখা যায়। URL নেওয়া ও OpenAI-তে পাঠানোর আগে নিশ্চিতকরণ হয়। লোকাল/প্রাইভেট নেটওয়ার্ক URL নেওয়া হয় না। কী JSON ব্যাকআপে থাকে না।",
    "settings.openaiPromptHeading": "AI প্রম্পট (উন্নত)",
    "settings.openaiSystemPrompt": "System প্রম্পট",
    "settings.openaiUserPromptMemo": "User প্রম্পট (শুধু মেমো)",
    "settings.openaiUserPromptUrl": "User প্রম্পট (URL সহ)",
    "settings.openaiPromptNote":
      "প্লেসহোল্ডার: System — {{URL_TILE_RULE}} {{SECTION_LIMIT_RULE}} {{YOUTUBE_SYSTEM_RULE}}। মেমো User — {{MEMO_BODY}}। URL User — {{MEMO_BODY}} {{URL_CONTEXTS}} {{YOUTUBE_EXTRA_RULES}}। বিল্ট-ইন ডিফল্টের মতো সেভ করলে বান্ডেল ডিফল্ট ব্যবহার হয়।",
    "settings.openaiPromptReset": "ডিফল্টে ফিরুন",
    "settings.dataHeading": "ডেটা",
    "settings.jsonBackup": "JSON Backup",
    "settings.jsonImport": "JSON Import",
    "settings.extensionHeading": "এক্সটেনশন",
    "settings.openExtensionDetails": "এক্সটেনশন বিস্তারিত খুলুন",
    "settings.extensionNote":
      "নতুন ট্যাবের নিচের Customize Chrome ফুটার Chrome দেখায়। ফুটার মেনু বা Customize Chrome থেকে Footer বন্ধ করুন।",
    "settings.save": "সংরক্ষণ",
    "settings.saved": "সেটিংস সংরক্ষিত হয়েছে।",
    "settings.obsidianHelpTitle": "Obsidian API Key সেট করার পদ্ধতি",
    "settings.obsidianHelpHtml":
      '<ol><li>Obsidian খুলে <strong>সেটিংস → কমিউনিটি প্লাগইন</strong> থেকে <strong>Local REST API</strong> ইনস্টল ও চালু করুন।</li><li>প্লাগইন সেটিংসে <strong>Enable Non-encrypted (HTTP) Server</strong> চালু করুন (ডিফল্ট পোর্ট <code>27123</code>)।</li><li><strong>API Key</strong> এ <strong>Generate</strong> চাপুন ও কপি করুন।</li><li><strong>Obsidian Local REST API URL</strong> এ <code>http://127.0.0.1:27123</code> দিন (HTTPS: <code>https://127.0.0.1:27124</code>)।</li><li><strong>Obsidian API Key / Token</strong> এ পেস্ট করে <strong>সংরক্ষণ</strong> করুন।</li><li><strong>Obsidian সিঙ্ক</strong> দিয়ে পরীক্ষা করুন। Obsidian চালু রাখুন।</li></ol><p class="settings-help-note">নিরাপত্তার জন্য শুধু <code>localhost</code> / <code>127.0.0.1</code> এবং পোর্ট <code>27123</code> / <code>27124</code>।</p><p class="settings-help-note">প্লাগইন: <a href="https://github.com/coddingtonbear/obsidian-local-rest-api" target="_blank" rel="noopener noreferrer">Obsidian Local REST API</a></p>',
    "template.title": "টেমপ্লেট যোগ",
    "template.add": "যোগ",
    "delete.title": "টাইল মুছুন",
    "delete.message": "「{title}」মুছবেন?",
    "delete.cancel": "বাতিল",
    "delete.confirm": "মুছুন",
    "modal.copy": "কপি",
    "modal.markdownPreview": "Markdown প্রিভিউ",
    "modal.editView": "সম্পাদনা দৃশ্য",
    "modal.templateAdd": "টেমপ্লেট যোগ",
    "modal.aiSummary": "AI সারাংশ",
    "modal.obsidianSave": "Obsidian-এ সংরক্ষণ",
    "modal.title": "শিরোনাম",
    "modal.titlePlaceholder": "# শিরোনাম",
    "modal.bodyPlaceholder": "বডি লিখুন",
    "modal.tileColor": "টাইল রঙ",
    "modal.color.white": "সাদা",
    "modal.color.blue": "নীল",
    "modal.color.green": "সবুজ",
    "modal.color.yellow": "হলুদ",
    "modal.color.pink": "গোলাপি",
    "modal.color.purple": "বেগুনি",
    "modal.color.gray": "ধূসর",
    "modal.tagsPlaceholder": "todo idea কাজ মেমো (স্পেস বা কমা, # লাগবে না)",
    "modal.tags": "ট্যাগ",
    "modal.tagAdd": "{tag} যোগ",
    "modal.updated": "আপডেট: {datetime}",
    "modal.enterBodyFirst": "আগে বডি লিখুন",
    "modal.aiBusy": "AI প্রক্রিয়াকরণ...",
    "modal.aiLoading": "AI বিশ্লেষণ...",
    "modal.aiStarting": "বিশ্লেষণ শুরু হচ্ছে...",
    "modal.aiFetchingUrls": "URL আনা হচ্ছে...",
    "modal.aiGenerating": "AI সারাংশ তৈরি...",
    "modal.speechInput": "ভয়েস ইনপুট",
    "modal.speechInputStop": "ভয়েস ইনপুট বন্ধ করুন",
    "modal.speechErrorNotAllowed": "মাইক্রোফোনের অনুমতি দেওয়া হয়নি। ব্রাউজারের সাইট সেটিংসে মাইক্রোফোন অনুমতি দিন।",
    "modal.speechErrorNoSpeech": "কোনো কথা শনাক্ত হয়নি।",
    "modal.speechErrorNetwork": "নেটওয়ার্ক ত্রুটি। ইন্টারনেট সংযোগ পরীক্ষা করুন।",
    "modal.speechErrorGeneric": "ভয়েস ইনপুট ব্যর্থ হয়েছে।",
    "tile.drag": "টেনে সরান",
    "tile.titleAria": "টাইল শিরোনাম",
    "tile.delete": "এই টাইল মুছুন",
    "tile.add": "টাইল যোগ",
    "tile.untitled": "শিরোনামহীন",
    "common.close": "বন্ধ",
    "common.copy": "কপি",
    "common.on": "ON",
    "common.off": "OFF",
    "clipboard.nothingToCopy": "কপির মতো কিছু নেই",
    "clipboard.copied": "কপি হয়েছে",
    "obsidian.notConfigured": "সেটিংসে Obsidian (API URL·Token) সংরক্ষণ করুন",
    "obsidian.notConfiguredAlert": "Obsidian সেট নেই। সেটিংসে API URL ও Token সংরক্ষণ করুন।",
    "obsidian.noContent": "সংরক্ষণের মতো কিছু নেই।",
    "obsidian.saved": "Obsidian-এ সংরক্ষিত: {path}",
    "obsidian.saveFailed":
      "Obsidian সংরক্ষণ ব্যর্থ: {detail}\nসেটিংসে API URL ও Token দেখুন।",
    "obsidian.noFilledTiles": "সংরক্ষণের মতো পূরণ করা টাইল নেই।",
    "obsidian.batchConfirm": "{count}টি টাইল Obsidian-এ সংরক্ষণ করবেন?",
    "obsidian.batchDone": "Obsidian সংরক্ষণ সম্পন্ন: {success}/{total}",
    "obsidian.batchDoneWithError":
      "Obsidian সংরক্ষণ সম্পন্ন: {success}/{total}\nশেষ ত্রুটি: {error}",
    "obsidian.networkError": "নেটওয়ার্ক ত্রুটি",
    "openai.notConfigured": "OpenAI API Key সেট নেই। সেটিংসে সংরক্ষণ করুন।",
    "openai.noContent": "সারাংশের মতো কিছু নেই।",
    "openai.fetchConfirm":
      "AI সারাংশ বডির URL (সর্বোচ্চ {max}) নিয়ে OpenAI-তে পাঠাবে।\n\n{preview}{suffix}\n\nচালিয়ে যাবেন?",
    "openai.fetchConfirmMore": "\n…আর {count}টি",
    "openai.failed": "AI সারাংশ ব্যর্থ: {error}",
    "openai.unknownError": "অজানা ত্রুটি",
    "backup.fileTooLarge": "JSON ফাইল অনেক বড় (সীমা {max}MB)।",
    "backup.readFailed": "JSON পড়তে ব্যর্থ।",
    "backup.foreignAppConfirm": "{message}\nএই ফাইল দিয়ে ইম্পোর্ট চালাবেন?",
    "backup.invalidFormat": "অসমর্থিত JSON ফরম্যাট।",
    "backup.replaceConfirm": "বর্তমান টাইল JSON দিয়ে প্রতিস্থাপন করবেন?",
    "backup.importDone": "JSON Import সম্পন্ন।",
    "storage.saveFailed": "সংরক্ষণ ব্যর্থ। পরে আবার চেষ্টা করুন।",
    "extension.openFailed": "এক্সটেনশন বিস্তারিত খোলা যায়নি।",
    "validation.obsidian.invalidUrl": "Obsidian API URL অবৈধ।",
    "validation.obsidian.protocol": "Obsidian API URL http বা https হতে হবে।",
    "validation.obsidian.host":
      "নিরাপত্তার জন্য Obsidian API URL শুধু localhost বা 127.0.0.1।",
    "validation.obsidian.port": "Obsidian API URL পোর্ট 27123 বা 27124 হতে হবে।",
    "validation.url.invalid": "অবৈধ URL",
    "validation.url.protocol": "শুধু http/https URL নেওয়া যায়",
    "validation.url.privateNetwork": "লোকাল/প্রাইভেট নেটওয়ার্ক URL নেওয়া যায় না",
    "validation.import.noColumns": "columns অ্যারে নেই।",
    "validation.import.tooManyTiles": "টাইল সংখ্যা সীমা ({max}) ছাড়িয়েছে।",
    "validation.import.textTooLong": "টাইল টেক্সট সীমা ({max} অক্ষর) ছাড়িয়েছে।",
    "validation.backup.notObject": "JSON অবজেক্ট নয়।",
    "validation.backup.foreignApp": "অন্য অ্যাপের ব্যাকআপ (app: {app})।",
    "validation.storage.conflict": "স্টোরেজ আপডেট সংঘর্ষ মিটানো যায়নি।",
    "fetch.timeout": "টাইমআউট",
    "fetch.notHtml": "HTML নয়",
    "fetch.failed": "আনতে ব্যর্থ"
  }
};

const enBlock = fs.readFileSync(path.join(root, "js/i18n.messages.js"), "utf8");
const messagesStart = enBlock.indexOf("const I18N_MESSAGES = {");
const enStart = enBlock.indexOf("  en: {", messagesStart);
const enEnd = enBlock.indexOf("\n  }\n};", enStart);
const enSection = enBlock.slice(enStart, enEnd);
const enKeys = [...enSection.matchAll(/"([^"]+)":/g)].map((m) => m[1]);

for (const locale of ["zh", "ko", "es", "bn"]) {
  const missing = enKeys.filter((k) => !(k in messages[locale]));
  const extra = Object.keys(messages[locale]).filter((k) => !enKeys.includes(k));
  if (missing.length || extra.length) {
    console.error(locale, { missing, extra });
    process.exit(1);
  }
}

const lines = [
  "/* Additional UI locales: zh, ko, es, bn (generated by scripts/write-i18n-locales.mjs) */",
  "Object.assign(I18N_LOCALE_DATA, " + JSON.stringify(localeData, null, 2) + ");",
  "Object.assign(I18N_MESSAGES, " + JSON.stringify(messages, null, 2) + ");",
  ""
];

fs.writeFileSync(path.join(root, "js/i18n.messages.locales.js"), lines.join("\n"));
console.log("Wrote js/i18n.messages.locales.js");
