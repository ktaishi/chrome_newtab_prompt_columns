/**
 * サブジャンル別の出力セクション最適化定義
 * - compact: 導入要約・まとめを省き箇条書き/表中心
 * - sections: 完全置換（指定時のみ）
 */

/** @type {Record<string, { compact?: boolean, sections?: Array<[string, string]> }>} */
export const SUBGENRE_SECTION_OVERRIDES = {
  // --- 生活 ---
  "daily-routine": {
    compact: true,
    sections: [
      ["時間割・ルーティン", "Markdown表 | 時間帯/曜日 | 行動 | メモ |、4〜8行。セルは短く"],
      ["習慣のポイント", "箇条書き3〜5項目。各1行。続ける理由・障壁対策は括弧内"],
      ["必要な準備・道具", "箇条書き。名称・数量のみ"],
      ["次にやること", "Markdown表 | タスク | 期限/頻度 | 優先度 |、3〜6行"]
    ]
  },
  household: {
    compact: true,
    sections: [
      ["作業一覧", "Markdown表 | 作業 | 手順 | 頻度/所要時間 |、4〜8行"],
      ["手順・コツ", "番号付き箇条書き。各工程1行。（失敗しやすい点）括弧内"],
      ["必要な用品", "箇条書き。品名・代替案・数量"],
      ["次回の改善点", "箇条書き。各1行"]
    ]
  },
  "personal-finance": {
    compact: true,
    sections: [
      ["収支・項目", "Markdown表 | 項目 | 金額/割合 | 備考 |、4〜8行"],
      ["判断の根拠", "箇条書き3〜5項目。各1行"],
      ["リスク・注意", "箇条書き2〜4項目。各1行"],
      ["次のアクション", "Markdown表 | 行動 | 期限 | 期待効果 |、3〜5行"]
    ]
  },
  shopping: {
    compact: true,
    sections: [
      ["比較表", "Markdown表 | 候補 | 価格 | 特徴 | 評価 |、3〜6行"],
      ["選定理由", "箇条書き。各1行"],
      ["注意点・デメリット", "箇条書き2〜4項目。各1行"],
      ["購入判断", "1行。買う/待つ/代替＋理由は括弧内"]
    ]
  },
  "cooking-meals": {
    compact: true,
    sections: [
      ["レシピ名", "1行。料理名のみ。説明不要"],
      ["材料", "箇条書き。見出し直下に◯人分を明記。材料名と分量のみ"],
      ["下準備", "番号付き箇条書き。各工程1行。（注意点）があれば括弧内"],
      ["作り方", "番号付き箇条書き。各工程1行。火加減・時間・注意点は括弧内"],
      ["アレンジ・代用", "箇条書き。情報があればのみ。各1行"]
    ]
  },
  parenting: {
    compact: true,
    sections: [
      ["出来事・観察", "Markdown表 | 日時/場面 | 内容 | 気づき |、3〜6行"],
      ["対応・方針", "箇条書き3〜5項目。各1行。理由は括弧内"],
      ["参考情報", "箇条書き。出典・書籍名のみ"],
      ["次に試すこと", "箇条書き。各1行"]
    ]
  },
  pets: {
    compact: true,
    sections: [
      ["ケア・スケジュール", "Markdown表 | 項目 | 頻度 | 内容 |、4〜8行"],
      ["注意・症状", "箇条書き2〜5項目。各1行"],
      ["次のアクション", "箇条書き。各1行"]
    ]
  },
  "travel-planning": {
    compact: true,
    sections: [
      ["行程", "Markdown表 | 日/時間 | 場所 | 活動 | 備考 |、4〜10行"],
      ["予算・予約", "Markdown表 | 項目 | 費用/状況 | メモ |、3〜8行"],
      ["持ち物・準備", "箇条書き5〜10項目。各1行"],
      ["リスク・代替案", "箇条書き。各1行"]
    ]
  },
  "local-community": {
    compact: true,
    sections: [
      ["関係者・場所", "Markdown表 | 名称 | 役割/場所 | 連絡/アクセス |、3〜6行"],
      ["ルール・慣習", "箇条書き3〜5項目。各1行"],
      ["次に確認すること", "箇条書き。各1行"]
    ]
  },
  "home-improvement": {
    compact: true,
    sections: [
      ["材料・工具", "Markdown表 | 品目 | 数量 | 備考 |、3〜8行"],
      ["作業ステップ", "番号付き箇条書き。工具・材料・注意点は括弧内"],
      ["安全・注意", "箇条書き。各1行"]
    ]
  },
  "declutter-organize": {
    compact: true,
    sections: [
      ["カテゴリ分け", "Markdown表 | カテゴリ | 基準 | 処分/保管 |、4〜8行"],
      ["手順", "番号付き箇条書き。各1行"],
      ["維持のコツ", "箇条書き。各1行"]
    ]
  },
  "events-celebrations": {
    compact: true,
    sections: [
      ["準備リスト", "Markdown表 | 項目 | 担当/期限 | 状態 |、4〜8行"],
      ["進行・プログラム", "番号付き箇条書き。各1行"],
      ["当日の注意", "箇条書き。各1行"]
    ]
  },
  "errands-admin": {
    compact: true,
    sections: [
      ["必要書類", "Markdown表 | 書類 | 取得先 | 期限 |、3〜8行"],
      ["手順", "番号付き箇条書き。各ステップ1行"],
      ["注意・よくあるミス", "箇条書き。各1行"]
    ]
  },
  "weather-seasonal": {
    compact: true,
    sections: [
      ["対策一覧", "Markdown表 | 状況 | 対策 | 備考 |、4〜8行"],
      ["チェックリスト", "箇条書き5〜8項目。各1行"]
    ]
  },
  "safety-emergency": {
    compact: true,
    sections: [
      ["備え・装備", "Markdown表 | 項目 | 数量/場所 | 更新頻度 |、4〜8行"],
      ["手順", "番号付き箇条書き。避難・連絡・初期対応。各1行"],
      ["訓練・見直し", "箇条書き。各1行"]
    ]
  },
  "life-hacks": {
    compact: true,
    sections: [
      ["Tips一覧", "Markdown表 | 困りごと | 解決法 | 条件 |、4〜8行"],
      ["詳細", "箇条書き3〜6項目。各1行"],
      ["試すときの注意", "箇条書き。各1行"]
    ]
  },

  // --- 仕事 ---
  meetings: {
    compact: true,
    sections: [
      ["参加者・前提", "Markdown表 | 項目 | 内容 |、2〜4行"],
      ["決定事項", "箇条書き3〜6項目。各1行。根拠は括弧内"],
      ["アクション", "Markdown表 | 担当 | タスク | 期限 |、3〜8行"],
      ["未決・論点", "箇条書き。各1行"]
    ]
  },
  "project-mgmt": {
    compact: true,
    sections: [
      ["スコープ・成果物", "Markdown表 | 項目 | 状態 | 期限 |、4〜8行"],
      ["進捗・ブロッカー", "箇条書き3〜5項目。各1行"],
      ["リスク", "Markdown表 | リスク | 影響 | 対策 |、3〜6行"],
      ["次のマイルストーン", "箇条書き。各1行"]
    ]
  },
  career: {
    compact: true,
    sections: [
      ["強み・ギャップ", "Markdown表 | 領域 | 現状 | 目標 |、4〜6行"],
      ["行動計画", "番号付き箇条書き。各1行"],
      ["判断基準", "箇条書き。各1行"]
    ]
  },
  "business-strategy": {
    sections: [
      ["論点・仮説", "Markdown表 | 論点 | 内容 | 根拠 |、4〜8行"],
      ["要点", "箇条書き3〜5項目。各1〜2文"],
      ["重要", "番号付き小見出し3〜6項目。各2〜3文"],
      ["ポイント", "原文3〜5件。blockquote"],
      ["応用・示唆", "Markdown表 | 示唆 | アクション |、3〜5行"],
      ["未来予想", "### 1. … で3〜5項目。各3〜5文。どのような発展・変化が見込めるか具体的に掘り下げる。事実/推測を区別"]
    ]
  },
  sales: {
    compact: true,
    sections: [
      ["顧客・ニーズ", "Markdown表 | 項目 | 内容 |、3〜6行"],
      ["提案・価値", "箇条書き3〜5項目。各1行"],
      ["異論・対策", "箇条書き。各1行"],
      ["次のステップ", "Markdown表 | 行動 | 期限 |、3〜5行"]
    ]
  },
  marketing: {
    compact: true,
    sections: [
      ["ターゲット・メッセージ", "Markdown表 | 要素 | 内容 |、4〜6行"],
      ["施策", "箇条書き3〜6項目。各1行"],
      ["KPI・測定", "Markdown表 | 指標 | 目標 | 手段 |、3〜5行"]
    ]
  },
  "hr-people": {
    compact: true,
    sections: [
      ["関係者・状況", "Markdown表 | 項目 | 内容 |、3〜5行"],
      ["論点・フィードバック", "箇条書き3〜5項目。各1行"],
      ["合意・フォロー", "箇条書き。各1行"]
    ]
  },
  "finance-biz": {
    compact: true,
    sections: [
      ["数値・内訳", "Markdown表 | 項目 | 金額/比率 | 備考 |、4〜8行"],
      ["分析・所見", "箇条書き。各1行"],
      ["アクション", "箇条書き3〜5項目。各1行"]
    ]
  },
  "legal-compliance": {
    sections: [
      ["条項・要件", "Markdown表 | 項目 | 内容 | リスク |、4〜8行"],
      ["解釈・注意", "箇条書き3〜5項目。各1〜2文"],
      ["ポイント", "条文・公式文言3〜5件。blockquote"],
      ["対応方針", "箇条書き。各1行"]
    ]
  },
  "it-operations": {
    compact: true,
    sections: [
      ["構成・フロー", "Markdown表 | 要素 | 説明 |、4〜8行"],
      ["手順・運用", "番号付き箇条書き。各1行"],
      ["障害・制約", "箇条書き。各1行"]
    ]
  },
  "remote-collab": {
    compact: true,
    sections: [
      ["ルール・チャネル", "Markdown表 | 用途 | ツール/ルール |、3〜6行"],
      ["ベストプラクティス", "箇条書き3〜5項目。各1行"],
      ["改善案", "箇条書き。各1行"]
    ]
  },
  presentations: {
    compact: true,
    sections: [
      ["構成", "Markdown表 | セクション | 要点 | 時間 |、4〜8行"],
      ["核心メッセージ", "箇条書き3〜5項目。各1行"],
      ["Q&A想定", "箇条書き3〜5項目。各1行"]
    ]
  },
  negotiation: {
    compact: true,
    sections: [
      ["論点・立場", "Markdown表 | 論点 | 自社 | 相手 | 落とし所 |、3〜6行"],
      ["戦略・BATNA", "箇条書き。各1行"],
      ["合意案", "箇条書き。各1行"]
    ]
  },
  "customer-support": {
    compact: true,
    sections: [
      ["症状・再現", "Markdown表 | 項目 | 内容 |、3〜6行"],
      ["対応手順", "番号付き箇条書き。各1行"],
      ["エスカレーション・予防", "箇条書き。各1行"]
    ]
  },
  "product-dev": {
    compact: true,
    sections: [
      ["要件・ユーザーストーリー", "Markdown表 | 要件 | 優先度 | 受入条件 |、4〜8行"],
      ["技術・制約", "箇条書き3〜5項目。各1行"],
      ["次のイテレーション", "箇条書き。各1行"]
    ]
  },
  "industry-news": {
    sections: [
      ["トピック", "Markdown表 | テーマ | 内容 | 影響 |、4〜8行"],
      ["要点", "箇条書き3〜5項目。各1〜2文"],
      ["ポイント", "原文3〜5件。blockquote"],
      ["自社への示唆", "箇条書き。各1行"],
      ["未来予想", "### 1. … で3〜5項目。各3〜5文。どのような発展・変化が見込めるか具体的に掘り下げる"]
    ]
  },

  // --- 趣味 ---
  music: {
    sections: [
      ["トラック・ハイライト", "Markdown表 | 曲/パート | 印象 | キーワード |、4〜8行"],
      ["中心的な魅力", "箇条書き3〜5項目。各1行"],
      ["ポイント", "歌詞・レビュー原文3〜5件。blockquote"],
      ["関連・次に聴く", "箇条書き。各1行"]
    ]
  },
  "sports-watch": {
    compact: true,
    sections: [
      ["試合・局面", "Markdown表 | 時間/局面 | 出来事 | 意味 |、4〜8行"],
      ["重要プレー・選手", "箇条書き3〜5項目。各1行"],
      ["統計・文脈", "箇条書き。各1行"]
    ]
  },
  games: {
    compact: true,
    sections: [
      ["進捗・要素", "Markdown表 | 要素 | 状態/評価 | メモ |、4〜8行"],
      ["攻略・Tips", "箇条書き3〜6項目。各1行"],
      ["次にやること", "箇条書き。各1行"]
    ]
  },
  reading: {
    sections: [
      ["章・論点", "Markdown表 | 章/テーマ | 要点 |、4〜8行"],
      ["要点", "箇条書き3〜5項目。各1〜2文"],
      ["ポイント", "原文3〜5件。blockquote"],
      ["自分への応用", "箇条書き。各1行"]
    ]
  },
  "movies-tv": {
    sections: [
      ["登場人物・関係", "Markdown表 | 人物 | 役割 | 特徴 |、4〜8行"],
      ["見どころ・テーマ", "箇条書き3〜5項目。各1行"],
      ["ポイント", "セリフ・レビュー3〜5件。blockquote"],
      ["感想・評価", "箇条書き3〜5項目。各1行"]
    ]
  },
  photography: {
    compact: true,
    sections: [
      ["設定・機材", "Markdown表 | 項目 | 値/機材 | 用途 |、4〜6行"],
      ["撮影のポイント", "箇条書き3〜5項目。各1行"],
      ["次の撮影案", "箇条書き。各1行"]
    ]
  },
  crafts: {
    compact: true,
    sections: [
      ["作品名", "1行"],
      ["材料・工具", "箇条書き。品目・数量のみ"],
      ["下準備", "番号付き箇条書き。各1行。（注意点）括弧内"],
      ["作り方", "番号付き箇条書き。各1行。（注意点）括弧内"],
      ["アレンジ", "箇条書き。情報があればのみ"]
    ]
  },
  gardening: {
    compact: true,
    sections: [
      ["植物・環境", "Markdown表 | 項目 | 内容 |、4〜6行"],
      ["ケアカレンダー", "箇条書き。月/季節ごと。各1行"]
    ]
  },
  outdoor: {
    compact: true,
    sections: [
      ["ルート・装備", "Markdown表 | 項目 | 内容 |、4〜8行"],
      ["安全・注意", "箇条書き3〜5項目。各1行"],
      ["次回の改善", "箇条書き。各1行"]
    ]
  },
  collecting: {
    compact: true,
    sections: [
      ["アイテム一覧", "Markdown表 | 名称 | 状態/価値 | メモ |、4〜8行"],
      ["鑑定・真贋ポイント", "箇条書き3〜5項目。各1行"],
      ["保管・次の取得", "箇条書き。各1行"]
    ]
  },
  "fitness-hobby": {
    compact: true,
    sections: [
      ["メニュー", "Markdown表 | 種目 | セット/重量 | メモ |、4〜8行"],
      ["フォーム・コツ", "箇条書き3〜5項目。各1行"],
      ["次回目標", "箇条書き。各1行"]
    ]
  },
  "art-appreciation": {
    sections: [
      ["作品・作家", "Markdown表 | 作品/作家 | 特徴 | 印象 |、4〜8行"],
      ["中心的なテーマ", "箇条書き3〜5項目。各1行"],
      ["ポイント", "解説原文3〜5件。blockquote"],
      ["関連展示・読む", "箇条書き。各1行"]
    ]
  },
  "board-table": {
    compact: true,
    sections: [
      ["ルール要点", "Markdown表 | 要素 | ルール |、4〜6行"],
      ["戦略・Tips", "箇条書き3〜5項目。各1行"]
    ]
  },
  "cosplay-fandom": {
    compact: true,
    sections: [
      ["制作・準備", "Markdown表 | 項目 | 内容 | 進捗 |、4〜8行"],
      ["イベント情報", "箇条書き3〜5項目。各1行"]
    ]
  },
  "travel-hobby": {
    compact: true,
    sections: [
      ["スポット・体験", "Markdown表 | 場所 | 体験 | 評価 |、4〜8行"],
      ["おすすめ・注意", "箇条書き3〜5項目。各1行"],
      ["再訪メモ", "箇条書き。各1行"]
    ]
  },
  "cooking-hobby": {
    compact: true,
    sections: [
      ["テーマ", "1行。店名・食材・技法など"],
      ["食材・技法", "Markdown表 | 要素 | 内容 |、4〜8行。セルは短く"],
      ["学び・発見", "箇条書き3〜5項目。各1行"],
      ["次に試す", "箇条書き。各1行"]
    ]
  },

  // --- 学習 ---
  "academic-paper": {
    sections: [
      ["研究概要", "箇条書き4項目。問題・手法・結果・結論を各1行"],
      ["何を扱っているか", "Markdown表 | テーマ | 内容 |、4〜8行"],
      ["要点", "箇条書き3〜6項目。各1〜2文"],
      ["重要", "番号付き小見出し3〜6項目。各2〜3文"],
      ["ポイント", "原文3〜5件。blockquote"],
      ["応用例", "Markdown表 | 応用先 | 使い方 |、3〜6行"],
      ["未来予想", "### 1. … で3〜5項目。各3〜5文。どのような発展・変化が見込めるか具体的に掘り下げる。事実/推測を区別"]
    ]
  },
  "online-course": {
    compact: true,
    sections: [
      ["カリキュラム", "Markdown表 | レッスン | 要点 | 演習 |、4〜8行"],
      ["学んだ概念", "箇条書き3〜6項目。各1行"],
      ["演習・課題", "箇条書き。各1行"]
    ]
  },
  language: {
    compact: true,
    sections: [
      ["語彙・表現", "Markdown表 | 表現 | 意味 | 例文 |、6〜12行"],
      ["文法・ルール", "箇条書き。ルール1行＋例は括弧内"],
      ["練習方法", "箇条書き。各1行"]
    ]
  },
  "exam-prep": {
    compact: true,
    sections: [
      ["出題範囲", "Markdown表 | 分野 | 重要度 | 対策 |、4〜8行"],
      ["弱点・対策", "箇条書き3〜6項目。各1行"],
      ["学習スケジュール", "Markdown表 | 週 | 内容 |、3〜6行"]
    ]
  },
  "tutorial-howto": {
    compact: true,
    sections: [
      ["ゴール", "1行"],
      ["前提・環境", "Markdown表 | 項目 | 内容 |、3〜6行"],
      ["手順", "番号付き箇条書き。各ステップ1行。（注意点）括弧内"],
      ["つまずき・解決", "箇条書き。問題→解決を各1行"]
    ]
  },
  "book-study": {
    sections: [
      ["章構成", "Markdown表 | 章 | 要点 | 重要度 |、4〜8行"],
      ["要点", "箇条書き3〜5項目。各1行"],
      ["ポイント", "原文3〜5件。blockquote"],
      ["復習・問題", "箇条書き3〜5項目。各1行"]
    ]
  },
  "research-notes": {
    sections: [
      ["調査目的", "1〜2行"],
      ["情報源", "Markdown表 | ソース | 内容 | 信頼度 |、4〜8行"],
      ["発見・結論", "箇条書き3〜6項目。各1〜2文"],
      ["ポイント", "原文3〜5件。blockquote"],
      ["未解決・次の調査", "箇条書き。各1行"]
    ]
  },
  "skill-dev": {
    compact: true,
    sections: [
      ["スキル分解", "Markdown表 | スキル | 現状 | 目標 |、4〜6行"],
      ["練習法", "箇条書き3〜5項目。各1行"],
      ["次の練習", "箇条書き。各1行"]
    ]
  },
  "lecture-seminar": {
    sections: [
      ["トピック", "Markdown表 | トピック | 要点 |、4〜8行"],
      ["重要", "箇条書き3〜6項目。各1行"],
      ["ポイント", "原文3〜5件。blockquote"],
      ["質問・フォロー", "箇条書き。各1行"]
    ]
  },
  "workshop-lab": {
    compact: true,
    sections: [
      ["演習内容", "Markdown表 | 演習 | 結果 | 学び |、4〜8行"],
      ["手順・再現", "番号付き箇条書き。各1行"],
      ["持ち帰り", "箇条書き。各1行"]
    ]
  },
  certification: {
    compact: true,
    sections: [
      ["要件", "Markdown表 | 項目 | 内容 |、4〜6行"],
      ["学習計画", "箇条書き3〜5項目。各1行"]
    ]
  },
  "study-method": {
    compact: true,
    sections: [
      ["手法", "Markdown表 | 手法 | 手順 | 効果 |、4〜6行"],
      ["実践Tips", "箇条書き3〜5項目。各1行"],
      ["自分への適用", "箇条書き。各1行"]
    ]
  },
  textbook: {
    sections: [
      ["単元", "Markdown表 | 単元 | 内容 | 公式/定義 |、4〜10行"],
      ["重要", "箇条書き3〜6項目。各1行"],
      ["ポイント", "定義原文3〜5件。blockquote"],
      ["演習問題", "箇条書き3〜5項目。各1行"]
    ]
  },
  mooc: {
    compact: true,
    sections: [
      ["動画セクション", "Markdown表 | 時間/章 | 要点 |、4〜8行"],
      ["重要", "箇条書き3〜6項目。各1行"],
      ["復習", "箇条書き。各1行"]
    ]
  },
  "knowledge-mgmt": {
    sections: [
      ["概念リンク", "Markdown表 | 概念 | 関連 | 用途 |、4〜8行"],
      ["要点", "箇条書き3〜5項目。各1行"],
      ["ポイント", "原文3〜5件。blockquote"],
      ["タグ・接続提案", "箇条書き。各1行"]
    ]
  },
  teaching: {
    compact: true,
    sections: [
      ["学習目標", "Markdown表 | 目標 | 評価 | 活動 |、4〜6行"],
      ["授業 flow", "番号付き箇条書き。各1行"],
      ["改善点", "箇条書き。各1行"]
    ]
  },

  // --- 健康 ---
  medical: {
    sections: [
      ["免責", "1行。医療判断は専門家へ"],
      ["症状・所見", "Markdown表 | 項目 | 内容 | 時期 |、3〜6行"],
      ["説明・論点", "箇条書き3〜5項目。各1行"],
      ["ポイント", "原文3〜5件。blockquote"],
      ["確認すべきこと", "箇条書き。各1行"]
    ]
  },
  "mental-health": {
    compact: true,
    sections: [
      ["状況・トリガー", "Markdown表 | 要素 | 内容 |、3〜6行"],
      ["対処・リソース", "箇条書き3〜5項目。各1行"],
      ["専門家相談の目安", "箇条書き。各1行"]
    ]
  },
  nutrition: {
    compact: true,
    sections: [
      ["条件・目的", "箇条書き2〜4行。対象・制約のみ"],
      ["栄養・食品", "Markdown表 | 項目 | 量/効果 | 備考 |、4〜8行"],
      ["献立・メニュー", "箇条書き。食事ごとに1行"],
      ["注意・禁忌", "箇条書き。各1行"]
    ]
  },
  "exercise-health": {
    compact: true,
    sections: [
      ["プログラム", "Markdown表 | 種目 | 量 | 頻度 |、4〜8行"],
      ["フォーム・安全", "箇条書き3〜5項目。各1行"],
      ["進捗指標", "箇条書き。各1行"]
    ]
  },
  sleep: {
    compact: true,
    sections: [
      ["パターン", "Markdown表 | 項目 | 内容 |、4〜6行"],
      ["改善策", "箇条書き3〜5項目。各1行"]
    ]
  },
  mindfulness: {
    compact: true,
    sections: [
      ["実践", "Markdown表 | 技法 | 手順 | 時間 |、3〜6行"],
      ["効果・注意", "箇条書き。各1行"]
    ]
  },
  therapy: {
    compact: true,
    sections: [
      ["テーマ・気づき", "Markdown表 | テーマ | 内容 |、3〜6行"],
      ["宿題・実践", "箇条書き3〜5項目。各1行"],
      ["次回の焦点", "箇条書き。各1行"]
    ]
  },
  "health-records": {
    compact: true,
    sections: [
      ["数値・記録", "Markdown表 | 日付/項目 | 値 | 備考 |、4〜10行"],
      ["傾向・所見", "箇条書き。各1行"]
    ]
  },
  "wellness-trends": {
    sections: [
      ["主張と根拠", "Markdown表 | 主張 | 根拠 | 信頼度 |、4〜6行"],
      ["重要", "箇条書き3〜5項目。各1行"],
      ["ポイント", "原文3〜5件。blockquote"],
      ["未来予想", "### 1. … で3〜5項目。各3〜5文。今後の発展・変化を具体的に。エビデンスに基づく推測と憶測を区別"]
    ]
  },
  supplements: {
    compact: true,
    sections: [
      ["成分", "Markdown表 | 成分 | 目的 | 用量 | 注意 |、3〜8行"],
      ["医師相談の目安", "箇条書き。各1行"]
    ]
  },
  "yoga-stretch": {
    compact: true,
    sections: [
      ["ポーズ", "Markdown表 | ポーズ | 効果 | 注意 |、4〜8行"],
      ["シーケンス", "番号付き箇条書き。各1行"]
    ]
  },
  rehab: {
    compact: true,
    sections: [
      ["プログラム", "Markdown表 | 段階 | 内容 | 頻度 |、4〜8行"],
      ["注意", "箇条書き3〜5項目。各1行"]
    ]
  },
  "chronic-care": {
    compact: true,
    sections: [
      ["管理項目", "Markdown表 | 項目 | 方法 | 頻度 |、4〜8行"],
      ["重要", "箇条書き3〜5項目。各1行"]
    ]
  },
  preventive: {
    compact: true,
    sections: [
      ["スケジュール", "Markdown表 | 項目 | 時期 | 状態 |、4〜6行"]
    ]
  },
  "first-aid": {
    compact: true,
    sections: [
      ["症状", "1〜2行"],
      ["手順", "番号付き箇条書き。各1行"],
      ["受診目安", "箇条書き。各1行"]
    ]
  },
  "fitness-tracking": {
    compact: true,
    sections: [
      ["指標", "Markdown表 | 指標 | 値/傾向 | 解釈 |、4〜8行"],
      ["次のアクション", "箇条書き。各1行"]
    ]
  },

  // --- テクノロジー ---
  "software-dev": {
    sections: [
      ["結論", "核心を2〜4文。複数概念の関係があれば一言で整理"],
      ["何を扱っているか", "Markdown表 | テーマ | 内容 |、4〜8行。各セル1〜2文"],
      ["重要", "### 1. … ### 2. … で4〜8項目。各2〜5文+具体例。技術系はコード例"],
      ["良い例・悪い例", "対比。技術系はコードブロック可。該当なければ省略"],
      ["処理の流れ", "ステップまたは依存関係を箇条書き/表で。該当なければ省略"],
      ["ポイント", "コード/仕様原文3〜5件。blockquote"],
      ["実務での判断", "Markdown表 | ケース | 理由 |。使うべき/やりすぎ注意"],
      ["応用例", "Markdown表 | 応用 | 方法 |、3〜6行"],
      ["まとめ", "Markdown表 | 概念 | 一言 |、主要語彙"],
      ["未来予想", "### 1. … で3〜5項目。各3〜5文。どのような発展・変化が見込めるか具体的に掘り下げる。事実と推測を区別"]
    ]
  },
  "ai-ml": {
    sections: [
      ["結論", "核心を2〜4文"],
      ["概念・手法", "Markdown表 | 概念 | 説明 |、4〜8行。各セル1〜2文"],
      ["重要", "### 1. … ### 2. … で4〜6項目。各2〜4文+具体例"],
      ["ポイント", "原文3〜5件。blockquote"],
      ["応用例", "Markdown表 | 用途 | 方法 |、3〜6行"],
      ["実務での判断", "Markdown表 | ケース | 理由 |"],
      ["まとめ", "Markdown表 | 概念 | 一言 |"],
      ["未来予想", "LLM/RAG/AI等の文脈で ### 1. … で3〜5項目。各3〜5文。技術的発展・社会への影響を具体的に。事実/推測を区別"]
    ]
  },
  hardware: {
    compact: true,
    sections: [
      ["スペック", "Markdown表 | 項目 | 値 | 備考 |、4〜8行"],
      ["比較・選定", "箇条書き3〜5項目。各1行"]
    ]
  },
  security: {
    sections: [
      ["脅威・対策", "Markdown表 | 脅威 | 対策 | 優先度 |、4〜8行"],
      ["重要", "箇条書き3〜5項目。各1行"],
      ["ポイント", "原文3〜5件。blockquote"]
    ]
  },
  "open-source": {
    compact: true,
    sections: [
      ["プロジェクト", "Markdown表 | 項目 | 内容 |、4〜6行"],
      ["使い方・API", "箇条書き3〜5項目。各1行"]
    ]
  },
  "cloud-infra": {
    compact: true,
    sections: [
      ["構成", "Markdown表 | コンポーネント | 役割 | 設定 |、4〜8行"],
      ["運用・コスト", "箇条書き3〜5項目。各1行"]
    ]
  },
  "data-analytics": {
    compact: true,
    sections: [
      ["データ・指標", "Markdown表 | 項目 | 定義/値 |、4〜8行"],
      ["分析・洞察", "箇条書き3〜5項目。各1行"]
    ]
  },
  programming: {
    sections: [
      ["結論", "核心を2〜4文"],
      ["構文・概念", "Markdown表 | 要素 | 説明 | 例 |、4〜8行"],
      ["重要", "### 1. … ### 2. … で4〜6項目。各2〜4文+コード例"],
      ["良い例・悪い例", "コードの対比。該当なければ省略"],
      ["ポイント", "コード原文3〜5件。blockquote"],
      ["まとめ", "Markdown表 | 概念 | 一言 |"]
    ]
  },
  frameworks: {
    compact: true,
    sections: [
      ["構成・API", "Markdown表 | API/概念 | 用途 |、4〜8行"],
      ["パターン", "箇条書き3〜5項目。各1行"]
    ]
  },
  "tech-news": {
    sections: [
      ["トピック", "Markdown表 | ニュース | 影響 |、4〜6行"],
      ["ポイント", "原文3〜5件。blockquote"],
      ["未来予想", "### 1. … で3〜5項目。各3〜5文。どのような発展・変化が見込めるか具体的に掘り下げる"]
    ]
  },
  troubleshooting: {
    compact: true,
    sections: [
      ["症状", "1〜2行"],
      ["原因候補", "Markdown表 | 原因 | 対策 |、3〜6行"],
      ["手順", "番号付き箇条書き。各1行"],
      ["参考ログ", "エラー/ログ原文3〜5件。blockquote"]
    ]
  },
  architecture: {
    sections: [
      ["結論", "核心を2〜4文。複数概念の関係があれば一言で整理"],
      ["観点比較", "Markdown表 | 観点 | 列A | 列B |。2概念以上の比較がある場合のみ"],
      ["重要", "### 1. … ### 2. … で4〜8項目。各2〜5文+具体例。技術系はコード例"],
      ["依存関係・流れ", "処理/依存の流れを箇条書きまたは表で"],
      ["良い例・悪い例", "対比。技術系はコードブロック可"],
      ["実務での判断", "Markdown表 | ケース | 理由 |。使うべき/やりすぎ注意"],
      ["ポイント", "原文3〜5件。blockquote"],
      ["まとめ", "Markdown表 | 概念 | 一言 |"],
      ["トレードオフ", "2〜4文。設計上のトレードオフを具体的に"]
    ]
  },
  devops: {
    compact: true,
    sections: [
      ["パイプライン", "Markdown表 | 段階 | 内容 | ツール |、4〜8行"],
      ["重要", "箇条書き3〜5項目。各1行"]
    ]
  },
  automation: {
    compact: true,
    sections: [
      ["フロー", "Markdown表 | ステップ | 自動化 | ツール |、4〜6行"],
      ["実装要点", "箇条書き3〜5項目。各1行"]
    ]
  },
  "api-integration": {
    compact: true,
    sections: [
      ["エンドポイント", "Markdown表 | API | 用途 | 認証 |、4〜8行"],
      ["重要", "箇条書き3〜5項目。各1行"]
    ]
  },
  "product-review": {
    compact: true,
    sections: [
      ["比較", "Markdown表 | 製品 | 強み | 弱み |、3〜6行"],
      ["選定", "1行＋理由は箇条書き"]
    ]
  },

  // --- 人間関係 ---
  family: {
    compact: true,
    sections: [
      ["関係・状況", "Markdown表 | 人物 | 役割 | 近況 |、3〜6行"],
      ["方針・約束", "箇条書き3〜5項目。各1行"],
      ["次に話すこと", "箇条書き。各1行"]
    ]
  },
  friends: {
    compact: true,
    sections: [
      ["出来事", "Markdown表 | 日時 | 内容 | 印象 |、3〜6行"],
      ["次の予定", "箇条書き。各1行"]
    ]
  },
  networking: {
    compact: true,
    sections: [
      ["人物・接点", "Markdown表 | 名前 | 背景 | 共通点 | フォロー |、4〜8行"],
      ["次のアクション", "箇条書き。各1行"]
    ]
  },
  "social-events": {
    compact: true,
    sections: [
      ["参加者・話題", "Markdown表 | 項目 | 内容 |、4〜6行"],
      ["フォロー", "箇条書き。各1行"]
    ]
  },
  dating: {
    compact: true,
    sections: [
      ["観察・価値観", "Markdown表 | テーマ | 内容 |、3〜5行"],
      ["自分の境界・希望", "箇条書き。各1行"]
    ]
  },
  "parenting-social": {
    compact: true,
    sections: [
      ["関係・情報", "Markdown表 | 相手/場 | 内容 |、3〜6行"],
      ["次の連絡", "箇条書き。各1行"]
    ]
  },
  "community-group": {
    compact: true,
    sections: [
      ["メンバー・活動", "Markdown表 | 項目 | 内容 |、4〜6行"],
      ["ルール・文化", "箇条書き3〜5項目。各1行"]
    ]
  },
  mentorship: {
    compact: true,
    sections: [
      ["目標・フィードバック", "Markdown表 | 項目 | 内容 |、4〜6行"],
      ["次回", "箇条書き。各1行"]
    ]
  },
  "feedback-comm": {
    compact: true,
    sections: [
      ["要点", "Markdown表 | 観点 | 内容 |、3〜5行"],
      ["言い換え案", "箇条書き3〜5項目。各1行"]
    ]
  },
  conflict: {
    compact: true,
    sections: [
      ["論点", "Markdown表 | 論点 | 立場 | 共通 ground |、3〜6行"],
      ["対話の提案", "箇条書き3〜5項目。各1行"]
    ]
  },
  "communication-skills": {
    compact: true,
    sections: [
      ["技法", "Markdown表 | 技法 | 手順 | 例 |、4〜6行"],
      ["実践", "箇条書き。各1行"]
    ]
  },
  volunteering: {
    compact: true,
    sections: [
      ["活動", "Markdown表 | 日時 | 内容 | 役割 |、4〜6行"]
    ]
  },
  cultural: {
    compact: true,
    sections: [
      ["ポイント", "Markdown表 | テーマ | 内容 |、4〜6行"],
      ["気をつけること", "箇条書き。各1行"]
    ]
  },
  "team-building": {
    compact: true,
    sections: [
      ["活動・学び", "Markdown表 | 活動 | 目的 | 結果 |、3〜6行"]
    ]
  },
  "social-media": {
    compact: true,
    sections: [
      ["投稿・反応", "Markdown表 | 内容 | 反応 | 学び |、3〜6行"],
      ["次の投稿方針", "箇条書き。各1行"]
    ]
  },
  etiquette: {
    compact: true,
    sections: [
      ["ルール", "Markdown表 | 場面 | 作法 | 理由 |、4〜8行"]
    ]
  },

  // --- 創作 ---
  writing: {
    sections: [
      ["構成・章", "Markdown表 | 章/段落 | 要点 |、4〜8行"],
      ["文体・トーン", "箇条書き。各1行"],
      ["ポイント", "原文3〜5件。blockquote"],
      ["推敲メモ", "箇条書き3〜5項目。各1行"]
    ]
  },
  design: {
    compact: true,
    sections: [
      ["要素", "Markdown表 | 要素 | 意図 | 仕様 |、4〜8行"],
      ["重要", "箇条書き3〜5項目。各1行"],
      ["次のイテレーション", "箇条書き。各1行"]
    ]
  },
  "music-creation": {
    compact: true,
    sections: [
      ["構成・音源", "Markdown表 | パート | 内容 | ツール |、4〜8行"],
      ["次の作業", "箇条書き3〜5項目。各1行"]
    ]
  },
  "video-production": {
    compact: true,
    sections: [
      ["シーン", "Markdown表 | シーン | 内容 | 尺 |、4〜8行"],
      ["制作ノート", "箇条書き3〜5項目。各1行"]
    ]
  },
  blogging: {
    compact: true,
    sections: [
      ["構成", "Markdown表 | 見出し | 要点 |、4〜8行"],
      ["公開チェック", "箇条書き3〜5項目。各1行"]
    ]
  },
  "visual-art": {
    compact: true,
    sections: [
      ["技法・素材", "Markdown表 | 項目 | 内容 |、4〜6行"],
      ["次の作品", "箇条書き。各1行"]
    ]
  },
  storytelling: {
    sections: [
      ["プロット", "Markdown表 | 幕/段 | 出来事 | 動機 |、4〜8行"],
      ["キャラ", "箇条書き3〜5項目。各1行"],
      ["ポイント", "原文3〜5件。blockquote"]
    ]
  },
  branding: {
    compact: true,
    sections: [
      ["要素", "Markdown表 | 要素 | 定義 | 例 |、4〜6行"],
      ["ガイドライン", "箇条書き。各1行"]
    ]
  },
  "content-creation": {
    compact: true,
    sections: [
      ["コンテンツ", "Markdown表 | 媒体 | 内容 | スケジュール |、4〜6行"]
    ]
  },
  "ux-ui": {
    compact: true,
    sections: [
      ["ユーザーフロー", "Markdown表 | ステップ | 画面 | 課題 |、4〜8行"],
      ["重要", "箇条書き3〜5項目。各1行"]
    ]
  },
  "photo-creative": {
    compact: true,
    sections: [
      ["シリーズ", "Markdown表 | 作品 | 意図 | 技法 |、4〜6行"]
    ]
  },
  podcast: {
    compact: true,
    sections: [
      ["エピソード", "Markdown表 | パート | 内容 | 時間 |、4〜8行"]
    ]
  },
  "poetry-lyrics": {
    sections: [
      ["構造", "Markdown表 | 部分 | 内容 | 技法 |、4〜6行"],
      ["ポイント", "原文3〜5件。blockquote"],
      ["推敲", "箇条書き。各1行"]
    ]
  },
  scripting: {
    sections: [
      ["シーン", "Markdown表 | シーン | 概要 | 台詞要点 |、4〜8行"],
      ["ポイント", "台詞原文3〜5件。blockquote"],
      ["演出メモ", "箇条書き。各1行"]
    ]
  },
  portfolio: {
    compact: true,
    sections: [
      ["作品", "Markdown表 | 作品 | 役割 | 成果 |、4〜8行"]
    ]
  },
  inspiration: {
    sections: [
      ["参考", "Markdown表 | ソース | 要素 | 使い方 |、4〜8行"],
      ["ポイント", "原文3〜5件。blockquote"],
      ["創作への接続", "箇条書き。各1行"]
    ]
  }
};

/** compact 時に除去する冗長セクション */
export const COMPACT_DROP_TITLES = new Set(["要約", "一言でいうと"]);

/** compact 時のデフォルト instruction 変換 */
export function tightenInstruction(title, instruction) {
  let inst = String(instruction || "");
  inst = inst
    .replace(/各2〜[0-9]文[^。]*。?/g, "各1行。")
    .replace(/各2〜[0-9]文/g, "各1行")
    .replace(/2〜[0-9]文 \+ /g, "")
    .replace(/2〜[0-9]文\+/g, "")
    .replace(/[0-9]+〜[0-9]+文[^。]*。?/g, "")
    .replace(/### 1\. … で/g, "箇条書き。")
    .replace(/根拠付き/g, "根拠は括弧内")
    .replace(/理由付き/g, "理由は括弧内");
  return inst.trim();
}

/** 標準モード向け instruction 強化（compact 圧縮の逆） */
export function enrichInstruction(instruction) {
  let inst = String(instruction || "");
  inst = inst
    .replace(/各1行/g, "各2〜4文")
    .replace(/各1〜2文/g, "各2〜4文")
    .replace(/セルは短く/g, "各セル1〜2文")
    .replace(/各工程1行/g, "各工程1〜2文")
    .replace(/各ステップ1行/g, "各ステップ1〜2文")
    .replace(/説明不要/g, "必要最小限の説明")
    .replace(/1行。料理名のみ/g, "料理名＋1〜2文の概要")
    .replace(/1行＋理由は箇条書き/g, "2〜4文＋理由を箇条書き")
    .replace(/1行。買う/g, "2〜4文。買う")
    .replace(/1〜2行/g, "2〜4文")
    .replace(/2〜3文/g, "3〜5文")
    .replace(/3〜5文/g, "4〜6文");
  return inst.trim();
}

export function applySubgenreOptimization(subgenreId, sections, meta = {}) {
  const override = SUBGENRE_SECTION_OVERRIDES[subgenreId];
  const enrichedSections = sections.map(([title, inst]) => [title, enrichInstruction(inst)]);

  // 標準モードは GENRES 本体の厚い構成を使う。compactSections は simple-list 専用。
  const compactSections = override?.sections
    ? override.sections.map(([title, inst]) => [title, tightenInstruction(title, inst)])
    : null;

  return {
    sections: enrichedSections,
    compact: !!override?.compact,
    compactSections
  };
}
