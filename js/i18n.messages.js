/* UI message dictionaries (ja / en + locales in i18n.messages.locales.js) */
const I18N_LOCALE_DATA = {
  ja: {
    columnTitles: ["Inbox", "Memo", "Clipping"],
    promptTemplates: [
      {
        title: "要件整理",
        color: "blue",
        description: "曖昧な依頼を仕様に落とす",
        text: `# 要件整理してください

## 背景
- 

## 実現したいこと
- 

## 制約
- 

## 出力してほしいもの
- 機能一覧
- 非機能要件
- 画面 / API / DB の観点
- 未決事項`
      },
      {
        title: "コードレビュー",
        color: "green",
        description: "設計・バグ・保守性の観点でレビュー",
        text: `以下のコードをレビューしてください。

## 観点
- バグの可能性
- 責務分離
- 命名
- テストしやすさ
- セキュリティ
- パフォーマンス

## 出力形式
- 重大度
- 指摘内容
- 修正案
- 修正コード`
      },
      {
        title: "実装計画",
        color: "yellow",
        description: "AI駆動開発向けの作業分解",
        text: `次の機能の実装計画を作ってください。

## 機能
- 

## 技術スタック
- 

## 欲しい出力
1. 実装方針
2. ファイル構成
3. 作業手順
4. テスト観点
5. リスク`
      },
      {
        title: "障害調査",
        color: "pink",
        description: "ログや症状から原因を切り分け",
        text: `以下の障害について原因調査してください。

## 症状
- 

## 発生条件
- 

## ログ
\`\`\`

\`\`\`

## 確認してほしいこと
- 原因候補
- 追加で見るべきログ
- 暫定対応
- 恒久対応`
      },
      {
        title: "文章整理",
        color: "purple",
        description: "SNS・ドキュメント向けに整える",
        text: `以下の文章を整理してください。

## 方針
- 自然な日本語
- 強すぎる表現は少し丸める
- 結論を先に
- 箇条書きを活用

## 原文
`
      },
      {
        title: "ADR",
        color: "gray",
        description: "Architecture Decision Recordを書く",
        text: `# ADR: タイトル

## Status
Proposed

## Context
- 背景
- 制約
- 解決したい問題

## Decision
- 採用する方針

## Consequences
- 良い影響
- 悪い影響
- 将来の見直し条件

## Alternatives Considered
- 案A
- 案B

## Notes
- 補足`
      }
    ]
  },
  en: {
    columnTitles: ["Memo", "Memo", "Clipping"],
    promptTemplates: [
      {
        title: "Requirements",
        color: "blue",
        description: "Turn vague requests into specs",
        text: `# Organize the requirements

## Background
- 

## Goals
- 

## Constraints
- 

## Expected output
- Feature list
- Non-functional requirements
- UI / API / DB perspectives
- Open questions`
      },
      {
        title: "Code review",
        color: "green",
        description: "Review design, bugs, and maintainability",
        text: `Review the following code.

## Focus
- Possible bugs
- Separation of concerns
- Naming
- Testability
- Security
- Performance

## Output format
- Severity
- Finding
- Suggested fix
- Fixed code`
      },
      {
        title: "Implementation plan",
        color: "yellow",
        description: "Break work down for AI-assisted development",
        text: `Create an implementation plan for the following feature.

## Feature
- 

## Stack
- 

## Expected output
1. Approach
2. File layout
3. Steps
4. Test plan
5. Risks`
      },
      {
        title: "Incident triage",
        color: "pink",
        description: "Narrow down root cause from logs and symptoms",
        text: `Investigate the following incident.

## Symptoms
- 

## Conditions
- 

## Logs
\`\`\`

\`\`\`

## Please check
- Likely causes
- Additional logs to inspect
- Temporary mitigation
- Permanent fix`
      },
      {
        title: "Rewrite text",
        color: "purple",
        description: "Polish for SNS or docs",
        text: `Rewrite the following text.

## Guidelines
- Clear, natural language
- Soften overly strong wording
- Lead with the conclusion
- Use bullet points

## Source
`
      },
      {
        title: "ADR",
        color: "gray",
        description: "Write an Architecture Decision Record",
        text: `# ADR: Title

## Status
Proposed

## Context
- Background
- Constraints
- Problem to solve

## Decision
- Chosen approach

## Consequences
- Positive impact
- Negative impact
- When to revisit

## Alternatives Considered
- Option A
- Option B

## Notes
- Additional notes`
      }
    ]
  }
};

const I18N_MESSAGES = {
  ja: {
    "app.title": "New Tab Memo Board",
    "app.columnsAria": "プロンプトカラム",
    "sidebar.collapse": "サイドバーを折りたたむ",
    "sidebar.expand": "サイドバーを開く",
    "sidebar.filterByTag": "タグで絞り込み",
    "sidebar.filterByTagAria": "タグで絞り込み",
    "sidebar.clear": "クリア",
    "sidebar.obsidianSync": "Obsidian同期",
    "sidebar.settings": "設定",
    "sidebar.filterActive": "表示中: #{tag}",
    "sidebar.noTilesForTag": "#{tag} のタイルはありません。",
    "sidebar.noFilledTiles": "入力済みタイルはまだありません。",
    "settings.title": "設定",
    "settings.language.label": "言語",
    "settings.language.auto": "自動（ブラウザに合わせる）",
    "settings.obsidianFolder": "Obsidian保存先フォルダ",
    "settings.obsidianEndpoint": "Obsidian Local REST API URL",
    "settings.obsidianToken": "Obsidian API Key / Token",
    "settings.obsidianTokenHelpAria": "API Keyの設定方法",
    "settings.obsidianTokenPlaceholder": "Local REST APIのAPI Key",
    "settings.autoPasteClipboard": "空タイルを開いたときクリップボードを自動貼り付け",
    "settings.autoPasteClipboardNote": "ON のとき、空のタイルを開くと直近60秒以内にコピーしたテキストを自動で挿入します。",
    "settings.autoBackup": "自動バックアップ",
    "settings.autoBackupNote": "自動バックアップは1日1回、新規タブを開いたタイミングでJSONをダウンロードします。",
    "settings.obsidianNote": "Obsidian同期には Local REST API プラグインのAPI Keyが必要です。",
    "settings.openaiHeading": "OpenAI",
    "settings.openaiKey": "OpenAI API Key",
    "settings.openaiGenerationModel": "AI 生成モデル",
    "settings.openaiGenerationModelNote": "サマリー本文の生成に使うモデルです。ChatGPT に近い応答は「GPT-5.3 chat latest」、最高品質は「GPT-5.5」、コスト重視は「GPT-5.4 mini（既定）」を選んでください。ジャンル分類は別途軽量モデルを使用します。",
    "settings.openaiNote": "API Key を設定すると、タイル編集モーダルに AI ボタンが表示されます。実行前に URL 取得と OpenAI 送信の確認が表示されます。ローカル/プライベートネットワークの URL は取得しません。キーは JSON バックアップから除外されます。",
    "openai.model.gpt54mini": "GPT-5.4 mini（既定・バランス）",
    "openai.model.gpt54miniDesc": "速度と品質のバランスが良い。通常はこれを推奨。",
    "openai.model.gpt53chat": "GPT-5.3 chat latest（ChatGPT Instant 相当）",
    "openai.model.gpt53chatDesc": "ChatGPT の Instant 系に近い応答。自然な解説向け。",
    "openai.model.gpt54": "GPT-5.4（高性能）",
    "openai.model.gpt54Desc": "長文・指示追従・専門的な整理向け。",
    "openai.model.gpt55": "GPT-5.5（最高性能）",
    "openai.model.gpt55Desc": "最も厚い解説が必要なとき。API コストは高め。",
    "openai.model.o3mini": "o3-mini（推論強化）",
    "openai.model.o3miniDesc": "論点整理・比較・深掘り向け。応答はやや遅い場合あり。",
    "openai.model.gpt4o": "GPT-4o（互換・旧世代）",
    "openai.model.gpt4oDesc": "アカウントで新モデルが使えない場合のフォールバック。",
    "settings.openaiPromptHeading": "AI プロンプト（詳細）",
    "settings.openaiSystemPrompt": "System プロンプト",
    "settings.openaiUserPromptMemo": "User プロンプト（メモのみ）",
    "settings.openaiUserPromptUrl": "User プロンプト（URL あり）",
    "settings.openaiPromptNote": "プレースホルダ: 共通 {{OUTPUT_LANGUAGE}} {{UI_LOCALE}}。System — {{URL_TILE_RULE}} {{SECTION_LIMIT_RULE}} {{YOUTUBE_SYSTEM_RULE}}。User（メモ）— {{MEMO_BODY}}。User（URL）— {{MEMO_BODY}} {{URL_CONTEXTS}} {{YOUTUBE_EXTRA_RULES}}。組み込みデフォルトは js/services/openai-prompt-defaults.js。デフォルトと同じ内容を保存すると storage は空になり、次回更新で新デフォルトが反映されます。",
    "settings.openaiPromptReset": "デフォルトに戻す",
    "settings.dataHeading": "データ管理",
    "settings.jsonBackup": "JSON Backup",
    "settings.jsonImport": "JSON Import",
    "settings.supportHeading": "開発支援",
    "settings.openSupportPayment": "Stripe で支援する（任意）",
    "settings.supportNote": "基本機能は無料です。開発の継続を応援したい方は、Stripe の安全な決済ページで任意の金額をお支払いいただけます。支払いは必須ではありません。",
    "support.notConfigured": "支援用の Stripe Payment Link が未設定です。",
    "settings.extensionHeading": "拡張機能",
    "settings.openExtensionDetails": "拡張機能の詳細を開く",
    "settings.extensionNote": "新タブ下部の「Chromeをカスタマイズ」フッターは Chrome が表示するものです。非表示にするには、フッター右のメニューから「新タブページのフッターを非表示」を選ぶか、Customize Chrome の Footer 設定を OFF にしてください。",
    "settings.save": "保存",
    "settings.saved": "設定を保存しました。",
    "settings.obsidianHelpTitle": "Obsidian API Key の設定方法",
    "settings.obsidianHelpHtml": "<ol><li>Obsidian を開き、<strong>設定 → コミュニティプラグイン</strong> から <strong>Local REST API</strong> をインストールして有効化します。</li><li>プラグイン設定を開き、<strong>Enable Non-encrypted (HTTP) Server</strong> を ON にします（通常はポート <code>27123</code>）。</li><li><strong>API Key</strong> 欄の <strong>Generate</strong>（または再生成）でキーを発行し、表示された文字列をコピーします。</li><li>この画面の <strong>Obsidian Local REST API URL</strong> に <code>http://127.0.0.1:27123</code> を入力します（HTTPS を使う場合は <code>https://127.0.0.1:27124</code>）。</li><li>上の <strong>Obsidian API Key / Token</strong> 欄にコピーしたキーを貼り付け、<strong>保存</strong> を押します。</li><li><strong>Obsidian同期</strong> で動作確認します。Obsidian は起動したままにしてください。</li></ol><p class=\"settings-help-note\">セキュリティのため、API URL は <code>localhost</code> / <code>127.0.0.1</code> のみ、ポートは <code>27123</code> / <code>27124</code> のみ利用できます。</p><p class=\"settings-help-note\">プラグイン詳細: <a href=\"https://github.com/coddingtonbear/obsidian-local-rest-api\" target=\"_blank\" rel=\"noopener noreferrer\">Obsidian Local REST API</a></p>",
    "template.title": "テンプレート追加",
    "template.add": "追加",
    "delete.title": "タイルを削除",
    "delete.message": "「{title}」を削除します。よろしいですか？",
    "delete.cancel": "キャンセル",
    "delete.confirm": "削除",
    "modal.copy": "コピー",
    "modal.markdownPreview": "Markdownプレビュー",
    "modal.editView": "編集表示",
    "modal.templateAdd": "テンプレート追加",
    "modal.aiSummary": "AIサマリー",
    "modal.obsidianSave": "Obsidian保存",
    "modal.title": "タイトル",
    "modal.titlePlaceholder": "# タイトル",
    "modal.bodyPlaceholder": "本文を入力",
    "modal.tileColor": "タイル色",
    "modal.color.white": "白",
    "modal.color.blue": "青",
    "modal.color.green": "緑",
    "modal.color.yellow": "黄",
    "modal.color.pink": "桃",
    "modal.color.purple": "紫",
    "modal.color.gray": "灰",
    "modal.tags": "タグ",
    "modal.tagAddLink": "+タグ追加",
    "modal.tagAddTitle": "タグを追加",
    "modal.tagExisting": "既存のタグから選ぶ",
    "modal.tagsInputPlaceholder": "todo idea 仕事（スペースまたはカンマ区切り、#不要）",
    "modal.tagAddConfirm": "追加",
    "modal.tagAddEmpty": "追加できる既存タグはありません",
    "modal.tagAdd": "{tag} を追加",
    "modal.tagRemove": "{tag} を削除",
    "modal.tagEmpty": "追加できるタグがありません",
    "modal.aiSupplementLabel": "AIへの追加指示",
    "modal.aiSupplementPlaceholder": "AIへの追加指示（例: 初心者向けにもう少し詳しく / 箇条書きを増やして）",
    "modal.aiSupplementSend": "送信",
    "modal.updated": "Updated: {datetime}",
    "modal.enterBodyFirst": "本文を入力してください",
    "modal.aiBusy": "AI処理中...",
    "modal.aiLoading": "AI解析中...",
    "modal.aiStarting": "解析を開始しています...",
    "modal.aiFetchingUrls": "URLを解析中...",
    "modal.urlClipFetchFailed": "（ページ取得失敗: {error}）",
    "modal.aiClassifyingGenre": "ジャンルを判定中...",
    "modal.aiGenerating": "OpenAIに問い合わせ中...",
    "modal.aiSpeechPolishing": "音声入力を整理しています...",
    "modal.aiSpeechPolishGenerating": "文章を整えています...",
    "modal.aiActionGroupAria": "AIアクション",
    "modal.aiActionSelect": "どう整理しますか？",
    "modal.aiAction.summary": "整理する",
    "modal.aiAction.deepDive": "深掘り",
    "modal.aiAction.simpleList": "要点だけ",
    "openai.action.summary": "ChatGPTで丁寧に解説してもらうときと同等以上の厚みで作成してください。要約だけで終わらせず、背景・理由・具体例・比較・実務判断まで踏み込み、各節は段落中心で2〜5文以上を基本としてください。導入段落・要約・トピック表・要点・重要・引用・応用・一言・未来予想の構成を守ってください。",
    "openai.action.deepDive": "深掘り調査モード：背景・前提・争点・複数の視点・根拠の強弱・未解決の疑問まで厚く書いてください。全体を短く要約して薄めるのは禁止です。各節の指示どおり詳細・具体例・原文引用を厚く展開し、推測と事実を明確に区別してください。",
    "openai.action.simpleList": "詳細な長文セクションは使わず、要点だけを簡潔な箇条書きリストにしてください。各項目は1〜2行以内。表や長い引用は最小限にし、読みやすさを最優先してください。",
    "openai.action.tryIt": "内容を踏まえ、読者が試せる具体的なアクション・実践ステップ・ミニプロジェクト案・チェックリストを中心に提案してください。抽象的な感想より実行可能な案を優先してください。",
    "modal.speechInput": "音声入力",
    "modal.speechInputStop": "音声入力を停止",
    "modal.speechListening": "録音中",
    "modal.speechTranscribing": "音声を文字起こし中...",
    "modal.speechErrorNotAllowed": "マイクの使用が許可されていません。ブラウザのサイト設定でマイクを許可してください。",
    "modal.speechErrorNoSpeech": "音声が検出されませんでした。",
    "modal.speechErrorNetwork": "ネットワークエラーです。インターネット接続を確認してください。",
    "modal.speechErrorGeneric": "音声入力に失敗しました。",
    "modal.speechErrorHallucination": "音声を認識できませんでした。もう少し長く、はっきり話してから再度お試しください。",
    "modal.speechErrorSilentRecording": "マイクから音声が拾えていません。入力デバイス（システム設定 → サウンド → 入力）と、Chrome のマイク許可を確認してください。",
    "modal.speechErrorVirtualDevice": "仮想オーディオデバイス（Background Music 等）がマイクとして選ばれています。Chrome のマイク設定（chrome://settings/content/microphone）で実際のマイクを選ぶか、仮想デバイスアプリを終了してください。",
    "modal.speechErrorTooShort": "録音が短すぎます。🎤を押してから話し、もう一度🎤で停止してください。",
    "openai.supplementSection": "追加指示",
    "tile.drag": "ドラッグして移動",
    "tile.titleAria": "タイルタイトル",
    "tile.delete": "このタイルを削除",
    "tile.add": "タイルを追加",
    "tile.star": "タイルを列の先頭に固定",
    "tile.unstar": "固定を解除",
    "column.add": "列を追加",
    "column.title": "列タイトル",
    "tile.untitled": "無題",
    "common.close": "閉じる",
    "common.copy": "コピー",
    "common.on": "ON",
    "common.off": "OFF",
    "clipboard.nothingToCopy": "コピーする内容がありません",
    "clipboard.copied": "コピーしました",
    "obsidian.notConfigured": "Obsidian設定（API URL・Token）を設定画面で保存してください",
    "obsidian.notConfiguredAlert": "Obsidian設定が未設定です。設定画面でAPI URLとTokenを保存してください。",
    "obsidian.noContent": "保存する本文がありません。",
    "obsidian.saved": "Obsidianに保存しました: {path}",
    "obsidian.saveFailed": "Obsidian保存に失敗しました: {detail}\n設定画面でAPI URLとTokenを確認してください。",
    "obsidian.noFilledTiles": "保存する入力済みタイルがありません。",
    "obsidian.batchConfirm": "入力済みタイル {count}件をObsidianへ保存します。よろしいですか？",
    "obsidian.batchDone": "Obsidian保存完了: {success}/{total}件",
    "obsidian.batchDoneWithError": "Obsidian保存完了: {success}/{total}件\n失敗理由: {error}",
    "obsidian.networkError": "通信エラー",
    "openai.notConfigured": "OpenAI API Keyが未設定です。設定画面で保存してください。",
    "openai.noContent": "サマリー対象の本文がありません。",
    "openai.fetchConfirm": "AIサマリーでは本文中の URL（最大 {max} 件）を取得し、内容を OpenAI API に送信します。\n\n{preview}{suffix}\n\n続行しますか？",
    "openai.fetchConfirmMore": "\n…他 {count} 件",
    "openai.failed": "AIサマリーに失敗しました: {error}",
    "openai.unknownError": "不明なエラー",
    "backup.fileTooLarge": "JSONファイルが大きすぎます（上限 {max}MB）。",
    "backup.readFailed": "JSONの読み込みに失敗しました。",
    "backup.exportFailed": "JSONバックアップの作成に失敗しました。",
    "backup.exportDone": "JSONバックアップを保存しました。",
    "backup.foreignAppConfirm": "{message}\nこのファイルでインポートを続行しますか？",
    "backup.invalidFormat": "対応していないJSON形式です。",
    "backup.replaceConfirm": "現在のタイル内容をJSONの内容で置き換えます。よろしいですか？",
    "backup.importDone": "JSON Importが完了しました。",
    "storage.saveFailed": "保存に失敗しました。しばらくしてから再度お試しください。",
    "extension.openFailed": "拡張機能の詳細を開けませんでした。",
    "validation.obsidian.invalidUrl": "Obsidian API URLが不正です。",
    "validation.obsidian.protocol": "Obsidian API URLは http または https のみ対応です。",
    "validation.obsidian.host": "安全のため、Obsidian API URLは localhost または 127.0.0.1 のみに制限しています。",
    "validation.obsidian.port": "Obsidian API URLのポートは 27123 または 27124 のみに制限しています。",
    "validation.url.invalid": "不正なURL",
    "validation.url.protocol": "http/https のみ取得可能",
    "validation.url.privateNetwork": "ローカル/プライベートネットワークのURLは取得できません",
    "validation.import.noColumns": "columns 配列がありません。",
    "validation.import.tooManyTiles": "タイル数が上限 ({max}) を超えています。",
    "validation.import.textTooLong": "タイル本文が上限 ({max} 文字) を超えています。",
    "validation.backup.notObject": "JSONオブジェクトではありません。",
    "validation.backup.foreignApp": "別アプリのバックアップです (app: {app})。",
    "validation.storage.conflict": "ストレージの更新競合が解消できませんでした。",
    "fetch.timeout": "タイムアウト",
    "fetch.notHtml": "非HTML",
    "fetch.failed": "取得失敗"
  },
  en: {
    "app.title": "New Tab Memo Board",
    "app.columnsAria": "Prompt columns",
    "sidebar.collapse": "Collapse sidebar",
    "sidebar.expand": "Expand sidebar",
    "sidebar.filterByTag": "Filter by tag",
    "sidebar.filterByTagAria": "Filter by tag",
    "sidebar.clear": "Clear",
    "sidebar.obsidianSync": "Sync to Obsidian",
    "sidebar.settings": "Settings",
    "sidebar.filterActive": "Showing: #{tag}",
    "sidebar.noTilesForTag": "No tiles for #{tag}.",
    "sidebar.noFilledTiles": "No filled tiles yet.",
    "settings.title": "Settings",
    "settings.language.label": "Language",
    "settings.language.auto": "Auto (match browser)",
    "settings.obsidianFolder": "Obsidian folder",
    "settings.obsidianEndpoint": "Obsidian Local REST API URL",
    "settings.obsidianToken": "Obsidian API Key / Token",
    "settings.obsidianTokenHelpAria": "How to set API Key",
    "settings.obsidianTokenPlaceholder": "Local REST API API Key",
    "settings.autoPasteClipboard": "Auto-paste clipboard when opening empty tile",
    "settings.autoPasteClipboardNote": "When ON, text copied within the last 60 seconds is inserted when you open an empty tile.",
    "settings.autoBackup": "Auto backup",
    "settings.autoBackupNote": "When enabled, a JSON backup is downloaded once per day when you open a new tab.",
    "settings.obsidianNote": "Obsidian sync requires the Local REST API plugin API Key.",
    "settings.openaiHeading": "OpenAI",
    "settings.openaiKey": "OpenAI API Key",
    "settings.openaiGenerationModel": "AI generation model",
    "settings.openaiGenerationModelNote": "Model used for summary body generation. For ChatGPT-like replies choose GPT-5.3 chat latest; for highest quality choose GPT-5.5; for cost balance use GPT-5.4 mini (default). Genre classification uses a separate lightweight model.",
    "settings.openaiNote": "When set, an AI button appears in the tile editor. You will be asked before fetching URLs and sending data to OpenAI. Local/private network URLs are not fetched. Keys are excluded from JSON backups.",
    "openai.model.gpt54mini": "GPT-5.4 mini (default, balanced)",
    "openai.model.gpt54miniDesc": "Good speed/quality balance. Recommended for most cases.",
    "openai.model.gpt53chat": "GPT-5.3 chat latest (ChatGPT Instant-like)",
    "openai.model.gpt53chatDesc": "Closest to ChatGPT Instant-style explanations.",
    "openai.model.gpt54": "GPT-5.4 (high quality)",
    "openai.model.gpt54Desc": "Better for long-form, instruction-following notes.",
    "openai.model.gpt55": "GPT-5.5 (best quality)",
    "openai.model.gpt55Desc": "Thickest explanations; higher API cost.",
    "openai.model.o3mini": "o3-mini (reasoning)",
    "openai.model.o3miniDesc": "Stronger reasoning for debates, comparisons, deep dives.",
    "openai.model.gpt4o": "GPT-4o (legacy fallback)",
    "openai.model.gpt4oDesc": "Use if newer models are unavailable on your account.",
    "settings.openaiPromptHeading": "AI prompts (advanced)",
    "settings.openaiSystemPrompt": "System prompt",
    "settings.openaiUserPromptMemo": "User prompt (memo only)",
    "settings.openaiUserPromptUrl": "User prompt (with URLs)",
    "settings.openaiPromptNote": "Placeholders: shared {{OUTPUT_LANGUAGE}} {{UI_LOCALE}}. System — {{URL_TILE_RULE}} {{SECTION_LIMIT_RULE}} {{YOUTUBE_SYSTEM_RULE}}. Memo user — {{MEMO_BODY}}. URL user — {{MEMO_BODY}} {{URL_CONTEXTS}} {{YOUTUBE_EXTRA_RULES}}. Bundled defaults live in js/services/openai-prompt-defaults.js. Saving the built-in default clears storage so future updates pick up new defaults.",
    "settings.openaiPromptReset": "Reset to defaults",
    "settings.dataHeading": "Data",
    "settings.jsonBackup": "JSON Backup",
    "settings.jsonImport": "JSON Import",
    "settings.supportHeading": "Support development",
    "settings.openSupportPayment": "Tip via Stripe (optional)",
    "settings.supportNote": "Core features are free. If you would like to support ongoing development, you can pay any amount on Stripe's secure checkout page. Payment is never required.",
    "support.notConfigured": "Stripe Payment Link is not configured.",
    "settings.extensionHeading": "Extension",
    "settings.openExtensionDetails": "Open extension details",
    "settings.extensionNote": "The Customize Chrome footer on the new tab page is shown by Chrome. To hide it, use the footer menu or turn off Footer in Customize Chrome.",
    "settings.save": "Save",
    "settings.saved": "Settings saved.",
    "settings.obsidianHelpTitle": "How to set Obsidian API Key",
    "settings.obsidianHelpHtml": "<ol><li>Open Obsidian, install and enable <strong>Local REST API</strong> from <strong>Settings → Community plugins</strong>.</li><li>Open plugin settings and turn on <strong>Enable Non-encrypted (HTTP) Server</strong> (port <code>27123</code> by default).</li><li>Click <strong>Generate</strong> in the <strong>API Key</strong> field and copy the value.</li><li>Enter <code>http://127.0.0.1:27123</code> as <strong>Obsidian Local REST API URL</strong> (or <code>https://127.0.0.1:27124</code> for HTTPS).</li><li>Paste the key into <strong>Obsidian API Key / Token</strong> and click <strong>Save</strong>.</li><li>Test with <strong>Sync to Obsidian</strong>. Keep Obsidian running.</li></ol><p class=\"settings-help-note\">For security, only <code>localhost</code> / <code>127.0.0.1</code> and ports <code>27123</code> / <code>27124</code> are allowed.</p><p class=\"settings-help-note\">Plugin: <a href=\"https://github.com/coddingtonbear/obsidian-local-rest-api\" target=\"_blank\" rel=\"noopener noreferrer\">Obsidian Local REST API</a></p>",
    "template.title": "Add template",
    "template.add": "Add",
    "delete.title": "Delete tile",
    "delete.message": "Delete \"{title}\"?",
    "delete.cancel": "Cancel",
    "delete.confirm": "Delete",
    "modal.copy": "Copy",
    "modal.markdownPreview": "Markdown preview",
    "modal.editView": "Edit view",
    "modal.templateAdd": "Add template",
    "modal.aiSummary": "AI summary",
    "modal.obsidianSave": "Save to Obsidian",
    "modal.title": "Title",
    "modal.titlePlaceholder": "# Title",
    "modal.bodyPlaceholder": "Enter body text",
    "modal.tileColor": "Tile color",
    "modal.color.white": "White",
    "modal.color.blue": "Blue",
    "modal.color.green": "Green",
    "modal.color.yellow": "Yellow",
    "modal.color.pink": "Pink",
    "modal.color.purple": "Purple",
    "modal.color.gray": "Gray",
    "modal.tags": "Tags",
    "modal.tagAddLink": "+ Add tag",
    "modal.tagAddTitle": "Add tags",
    "modal.tagExisting": "Choose from existing tags",
    "modal.tagsInputPlaceholder": "todo idea work (space or comma separated, no # needed)",
    "modal.tagAddConfirm": "Add",
    "modal.tagAddEmpty": "No existing tags available to add",
    "modal.tagAdd": "Add {tag}",
    "modal.tagRemove": "Remove {tag}",
    "modal.tagEmpty": "No tags available to add",
    "modal.aiSupplementLabel": "Additional AI instruction",
    "modal.aiSupplementPlaceholder": "Additional AI instruction (e.g. Explain more for beginners / Add more bullet points)",
    "modal.aiSupplementSend": "Send",
    "modal.updated": "Updated: {datetime}",
    "modal.enterBodyFirst": "Enter body text first",
    "modal.aiBusy": "AI processing...",
    "modal.aiLoading": "Analyzing with AI...",
    "modal.aiStarting": "Starting analysis...",
    "modal.aiFetchingUrls": "Fetching URLs...",
    "modal.urlClipFetchFailed": "(Failed to fetch page: {error})",
    "modal.aiClassifyingGenre": "Classifying genre...",
    "modal.aiGenerating": "Generating AI summary...",
    "modal.aiSpeechPolishing": "Polishing voice input...",
    "modal.aiSpeechPolishGenerating": "Cleaning up the text...",
    "modal.aiActionGroupAria": "AI actions",
    "modal.aiActionSelect": "How should I organize this?",
    "modal.aiAction.summary": "Organize",
    "modal.aiAction.deepDive": "Deep dive",
    "modal.aiAction.simpleList": "Key points",
    "openai.action.summary": "Create a comprehensive organized note in the standard format. Keep the intro paragraph, summary, topics table, key takeaways, important details, quotes, applications, one-liner, and future outlook sections.",
    "openai.action.deepDive": "Deep-dive mode: write thickly on background, assumptions, debates, multiple viewpoints, strength of evidence, and open questions. Do not compress the whole topic into a short summary. Expand each section with detail, examples, and verbatim quotes as instructed. Clearly separate facts from speculation.",
    "openai.action.simpleList": "Do not use long detailed sections. Output only a concise bullet list of key points (1-2 lines each). Minimize tables and long quotes; prioritize readability.",
    "openai.action.tryIt": "Based on the content, propose concrete actions, practice steps, mini-project ideas, and checklists the reader can try. Prefer executable ideas over abstract commentary.",
    "modal.speechInput": "Voice input",
    "modal.speechInputStop": "Stop voice input",
    "modal.speechListening": "Listening",
    "modal.speechTranscribing": "Transcribing audio...",
    "modal.speechErrorNotAllowed": "Microphone access was denied. Allow the microphone in your browser site settings.",
    "modal.speechErrorNoSpeech": "No speech was detected.",
    "modal.speechErrorNetwork": "Network error. Check your internet connection.",
    "modal.speechErrorGeneric": "Voice input failed.",
    "modal.speechErrorHallucination": "Could not recognize speech. Speak longer and more clearly, then try again.",
    "modal.speechErrorSilentRecording": "No audio was captured from the microphone. Check your input device (System Settings → Sound → Input) and Chrome microphone permission.",
    "modal.speechErrorVirtualDevice": "A virtual audio device (e.g. Background Music) is selected as the microphone. Choose a real mic in Chrome (chrome://settings/content/microphone) or quit the virtual audio app.",
    "modal.speechErrorTooShort": "Recording too short. Press 🎤, speak, then press 🎤 again to stop.",
    "openai.supplementSection": "Additional instruction",
    "tile.drag": "Drag to move",
    "tile.titleAria": "Tile title",
    "tile.delete": "Delete this tile",
    "tile.add": "Add tile",
    "tile.star": "Pin tile to top of column",
    "tile.unstar": "Unpin tile",
    "column.add": "Add column",
    "column.title": "Column title",
    "tile.untitled": "Untitled",
    "common.close": "Close",
    "common.copy": "Copy",
    "common.on": "ON",
    "common.off": "OFF",
    "clipboard.nothingToCopy": "Nothing to copy",
    "clipboard.copied": "Copied",
    "obsidian.notConfigured": "Save Obsidian settings (API URL and Token) in Settings",
    "obsidian.notConfiguredAlert": "Obsidian is not configured. Save API URL and Token in Settings.",
    "obsidian.noContent": "Nothing to save.",
    "obsidian.saved": "Saved to Obsidian: {path}",
    "obsidian.saveFailed": "Failed to save to Obsidian: {detail}\nCheck API URL and Token in Settings.",
    "obsidian.noFilledTiles": "No filled tiles to save.",
    "obsidian.batchConfirm": "Save {count} filled tile(s) to Obsidian?",
    "obsidian.batchDone": "Obsidian save complete: {success}/{total}",
    "obsidian.batchDoneWithError": "Obsidian save complete: {success}/{total}\nLast error: {error}",
    "obsidian.networkError": "Network error",
    "openai.notConfigured": "OpenAI API Key is not set. Save it in Settings.",
    "openai.noContent": "No content to summarize.",
    "openai.fetchConfirm": "AI summary will fetch URLs in the body (up to {max}) and send them to OpenAI.\n\n{preview}{suffix}\n\nContinue?",
    "openai.fetchConfirmMore": "\n…and {count} more",
    "openai.failed": "AI summary failed: {error}",
    "openai.unknownError": "Unknown error",
    "backup.fileTooLarge": "JSON file is too large (limit {max}MB).",
    "backup.readFailed": "Failed to read JSON.",
    "backup.exportFailed": "Failed to create JSON backup.",
    "backup.exportDone": "JSON backup saved.",
    "backup.foreignAppConfirm": "{message}\nContinue import with this file?",
    "backup.invalidFormat": "Unsupported JSON format.",
    "backup.replaceConfirm": "Replace current tiles with JSON contents?",
    "backup.importDone": "JSON import completed.",
    "storage.saveFailed": "Save failed. Please try again later.",
    "extension.openFailed": "Could not open extension details.",
    "validation.obsidian.invalidUrl": "Invalid Obsidian API URL.",
    "validation.obsidian.protocol": "Obsidian API URL must use http or https.",
    "validation.obsidian.host": "For security, Obsidian API URL must be localhost or 127.0.0.1.",
    "validation.obsidian.port": "Obsidian API URL port must be 27123 or 27124.",
    "validation.url.invalid": "Invalid URL",
    "validation.url.protocol": "Only http/https URLs can be fetched",
    "validation.url.privateNetwork": "Local/private network URLs cannot be fetched",
    "validation.import.noColumns": "Missing columns array.",
    "validation.import.tooManyTiles": "Tile count exceeds limit ({max}).",
    "validation.import.textTooLong": "Tile text exceeds limit ({max} characters).",
    "validation.backup.notObject": "Not a JSON object.",
    "validation.backup.foreignApp": "Backup from another app (app: {app}).",
    "validation.storage.conflict": "Could not resolve storage update conflict.",
    "fetch.timeout": "Timeout",
    "fetch.notHtml": "Not HTML",
    "fetch.failed": "Fetch failed"
  }
};
