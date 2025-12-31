# Tauri CLI Scheduler

<img src="app.png" alt="Tauri CLI Scheduler" width="128" height="128">

macOS上でiTermを通じて、指定した時刻にClaude CodeまたはCodex CLIコマンドを実行するTauri 2.0デスクトップアプリケーション。

## 機能

- 🕐 **スケジュール実行**: 指定した時刻にCLIコマンドを実行
- 🔀 **マルチツール対応**: Claude Code / Codex / Gemini CLIをタブで切り替え
- 🔄 **Rate Limit自動リトライ**: Rate Limitを検出したら自動的に再実行
- 📊 **リアルタイム監視**: 実行状況とターミナル出力を追跡
- 💾 **設定の永続化**: 各ツールの設定を保存して次回も利用可能
- 🖥️ **iTerm統合**: iTermとのシームレスな統合
- 🎯 **ウィンドウ管理**: 新規ウィンドウまたは既存セッションでの実行を選択可能
- 📐 **セクションベースUI**: カード形式で設定と実行を視覚的に分離
- 🎨 **2列レイアウト**: 設定パネル（左）と実行パネル（右）で直感的に操作
- 🌓 **ダークモード対応**: 完全なダークモードサポート
- 📱 **レスポンシブ設計**: モバイル～デスクトップで最適な表示
- 🔧 **拡張可能な設計**: 将来の新しいCLIツール追加に対応

![Tauri CLI Scheduler](https://storage.googleapis.com/zenn-user-upload/84e3d8897c85-20250623.png)

## 必要な環境

- macOS（iTerm統合のため必須）
- [iTerm](https://iterm2.com/)がインストールされていること
- 以下のいずれか（または両方）がインストール・設定済みであること：
  - [Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview)
  - [Codex CLI](https://github.com/openai/codex)
  - [Gemini CLI](https://google-gemini.github.io/gemini-cli/)
- Node.js 20以上とnpm/pnpm（ビルド用）
- Rustツールチェーン（ビルド用）

## インストール

### リリース版をダウンロード（推奨）

[Releases](https://github.com/yourusername/tauri-claude-code-runner/releases)ページから最新版のDMGファイルをダウンロードしてください。

**重要: macOSのセキュリティ警告について**

GitHub Actionsでビルドされたアプリケーションは開発者署名がないため、初回起動時に「壊れているため開けません」または「開発元を検証できません」というエラーが表示される場合があります。以下のいずれかの方法で解決できます：

### 方法1: ターミナルでquarantine属性を削除（推奨）
```bash
# アプリケーションから属性を削除
xattr -cr "/Applications/Tauri CLI Scheduler.app"

# またはDMGファイルから属性を削除してからインストール
xattr -cr ~/Downloads/Tauri.CLI.Scheduler_*.dmg
```

### 方法2: システム設定から許可
1. アプリをダブルクリックして警告を表示
2. 「システム設定」→「プライバシーとセキュリティ」を開く
3. セキュリティセクションで「"Tauri CLI Scheduler"は開発元を確認できないため...」の横の「このまま開く」をクリック
4. パスワードを入力して許可

一度これらの手順で開いた後は、通常通りダブルクリックで起動できるようになります。

### ソースからビルド

1. リポジトリをクローン:
```bash
git clone https://github.com/yourusername/tauri-claude-code-runner.git
cd tauri-claude-code-runner
```

2. 依存関係をインストール:
```bash
npm install
```

3. アプリケーションをビルド:
```bash
npm run tauri:build
```

4. ビルドされたアプリケーションは `src-tauri/target/release/bundle/` にあります

### アクセシビリティ権限の設定

インストール後、アクセシビリティ権限を付与する必要があります：

1. **システム設定** > **プライバシーとセキュリティ** > **アクセシビリティ** を開く
2. **Tauri CLI Scheduler** をリストに追加
3. アプリの横にあるスイッチを有効にする

## 使い方

### UI レイアウト

アプリケーションは2列レイアウトで構成：
- **左列（設定パネル）**: 各種設定をカード形式で表示
  - 基本設定（実行時刻、ディレクトリ、オプション）
  - スケジュール管理（Launchd登録/削除）
  - ツール固有設定（モデル選択、承認モード等）
- **右列（実行パネル）**: 実行制御と監視
  - 開始/停止ボタン
  - カウントダウンタイマー
  - ステータスメッセージ
  - ターミナル出力表示

### 基本的な使用方法

1. **アプリケーションを起動**
2. **ツールを選択**: タブで「Claude Code」「Codex」「Gemini CLI」を選択
3. **基本設定を行う**（左列）:
   - 実行時刻を設定
   - コマンドを実行するディレクトリを選択
   - 自動リトライ等のオプションを設定
4. **スケジュール管理**（左列）:
   - Launchdに登録して、Macがスリープ状態でも定期実行
   - または、一度だけ手動実行
5. **ツール固有の設定**（左列）: 各ツールのオプションを設定
6. **コマンドを入力**: 実行させたいコマンドを入力
7. **「開始」をクリック**（右列）: アプリは指定時刻まで待機して実行

### ツール別設定

#### Claude Code
- **モデル**: 使用するモデルを選択
- **権限確認をスキップ**: `--dangerously-skip-permissions` を付与（危険）
- **コマンド**: Claudeに実行させたい命令

#### Codex
- **モデル**: 使用するモデルを選択（gpt-5.2-codex, gpt-5.2）
- **承認モード**:
  - `Suggest`: workspace内の編集は許可、重要操作は承認を要求
  - `Auto`: 未信頼の操作のみ承認を要求
  - `Full Auto`: 失敗時のみ承認を要求（注意して使用）
- **Web検索**: インターネット検索を使用してコンテキストを収集
- **コマンド**: Codexに実行させたい命令

#### Gemini CLI
- **モデル**: 使用するモデルを選択（例: gemini-2.5-pro）
- **承認モード**:
  - `Default`: 重要操作は都度確認
  - `Auto Edit`: ファイル編集を自動承認
  - `YOLO`: すべて自動承認（注意して使用）
- **コンテキスト**: 全ファイルの追加や追加ディレクトリ指定
- **出力形式**: text / json
- **コマンド**: Geminiに実行させたい命令

### 実行モード

#### 新規ウィンドウモード（デフォルト）
- 新しいiTermウィンドウを作成
- 指定されたディレクトリに移動
- 完全なClaudeコマンドを実行

#### 既存ウィンドウモード
- 現在のiTermセッションにコマンドのみを送信
- セッションでClaude Codeが既に実行されている必要があります
- 会話を継続する場合に便利

### Rate Limit処理

アプリはRate Limit処理のための2つのモードを提供：

1. **自動リトライモード**: 
   - Rate Limitメッセージを監視
   - 制限がリセットされるまで待機
   - 自動的に実行を継続

2. **終了モード**:
   - Rate Limitが検出されたら実行を停止
   - 検出を通知

### モニタリング

実行中、アプリは以下を表示：
- 実行時刻までのカウントダウンタイマー

## ビルド（DMG）

見た目を整えたDMGは、以下のコマンドで作成できます。

```bash
npm run tauri:build
```

または、バージョンを自動更新してビルド:

```bash
npm run pretauri:build
```

生成物:
- `src-tauri/target/release/bundle/dmg/Tauri CLI Scheduler_25.12.31_aarch64.dmg`

**注**: バージョンはYY.M.D形式で自動更新されます（例：2025年12月31日 → 25.12.31）

補足:
- DMGは既存ファイルがあっても上書きされます。
- リアルタイムのターミナル出力（最後の20行）
- 処理ステータスと完了時間
- Rate Limit検出と待機時間

## 開発

### 開発環境のセットアップ

1. 依存関係をインストール:
```bash
npm install
```

2. 開発サーバーを起動:
```bash
npm run tauri dev
```

### 利用可能なスクリプト

- `npm run dev` - Vite開発サーバーのみ起動
- `npm run tauri dev` - Tauriを開発モードで起動
- `npm run build` - フロントエンドアセットをビルド
- `npm run tauri build` - アプリケーション全体をビルド
- `npm run fmt` - TypeScript/CSSファイルをフォーマット
- `npm run tauri:fmt` - Rustコードをフォーマット

### プロジェクト構成

```
├── src/                    # フロントエンド（React + TypeScript）
│   ├── App.tsx            # メインアプリケーション（2列グリッドレイアウト）
│   ├── components/        # UIコンポーネント
│   │   ├── ui/            # Atomic UIコンポーネント（再利用可能、セマンティック設計）
│   │   │   ├── Button.tsx     # 4 variants × 3 sizes、hover shadow対応
│   │   │   ├── Card.tsx       # カード基本、ホバー効果搭載
│   │   │   ├── Badge.tsx      # ステータス表示（6 variants）
│   │   │   ├── Input.tsx      # テキスト入力、focus shadow対応
│   │   │   ├── Select.tsx     # ドロップダウン、focus shadow対応
│   │   │   └── index.ts       # エクスポート統合
│   │   ├── Header.tsx             # ヘッダー（バージョン表示）
│   │   ├── TabSelector.tsx        # ツール切り替えタブ
│   │   ├── SettingsPanel.tsx      # 統合設定パネル（左列コンテナ）
│   │   ├── CommonSettingsSection.tsx # 基本設定をカード化
│   │   ├── ToolSettingsSection.tsx   # ツール設定ラッパー
│   │   ├── SchedulePanel.tsx         # スケジュール管理UI
│   │   ├── ConditionalSettingsIndicator.tsx # 条件付き設定インジケータ
│   │   ├── CommonSettings.tsx     # 共通設定（時刻、ディレクトリ等）
│   │   ├── ExecutionPanel.tsx     # 実行パネル（右列、ボタン、出力表示）
│   │   ├── ScheduleManager.tsx    # Launchd登録/削除ロジック
│   │   ├── ClaudeSettings.tsx     # Claude Code固有設定
│   │   ├── CodexSettings.tsx      # Codex固有設定
│   │   └── GeminiSettings.tsx     # Gemini CLI固有設定
│   ├── types/             # 型定義
│   │   ├── tools.ts       # ツール関連の型
│   │   └── schedule.ts    # スケジュール関連の型
│   └── assets/            # 静的アセット
├── src-tauri/             # バックエンド（Rust）
│   ├── src/
│   │   ├── lib.rs         # Tauriのコアロジック（CLI実行、スケジュール）
│   │   └── plist_manager.rs # Launchd plist管理
│   ├── scripts/           # シェルスクリプト
│   │   ├── run-claude.sh
│   │   ├── run-codex.sh
│   │   └── run-gemini.sh
│   └── tauri.conf.json    # Tauri設定
├── tailwind.config.js     # セマンティックデザイントークン定義（色、間隔、shadow等）
├── CLAUDE.md              # AIアシスタント用の指示
└── update-version.js      # バージョン自動更新スクリプト
```

## 設定

### デフォルト設定

#### Claude Code
- **モデル**: `opus-4.5`
- **権限確認をスキップ**: 無効
- **実行モード**: 新規iTermウィンドウ
- **自動リトライ**: 無効

#### Codex
- **モデル**: `gpt-5.2-codex`
- **承認モード**: `Suggest`
- **Web検索**: 無効
- **実行モード**: 新規iTermウィンドウ
- **自動リトライ**: 無効

#### Gemini CLI
- **モデル**: `gemini-2.5-pro`
- **承認モード**: `Default`
- **コンテキスト**: 無効
- **実行モード**: 新規iTermウィンドウ
- **自動リトライ**: 無効

### 永続化される設定

以下の設定はlocalStorageに保存されます（ツールごとに独立）：
- 選択中のツール（Claude Code / Codex / Gemini CLI）
- ターゲットディレクトリ
- ツール固有設定
- 最後のコマンド
- 自動リトライの設定
- ウィンドウモードの設定

## 技術詳細

### UI/UXアーキテクチャ

**2列グリッドレイアウト**:
- 左列（col-span-2）: SettingsPanel - セクションベースの設定
  - CommonSettingsSection: 基本設定（時刻、ディレクトリ、iTerm設定）
  - SchedulePanel: Launchd スケジュール管理
  - ToolSettingsSection: ツール固有設定（アクティブタブのみ表示）
- 右列（col-span-1）: ExecutionPanel - 実行制御
  - 開始/停止ボタン
  - カウントダウン表示
  - ステータスメッセージ
  - ターミナル出力

**レスポンシブ対応**:
- sm: 1列レイアウト（モバイル）
- md/lg: 3列グリッド（2:1比率）

### デザインシステム（セマンティックトークン）

**カラートークン**:
- `primary`: メインアクション色（#3b82f6 / ブルー系）
- `surface`: 背景・カード色（white ↔ dark: #111827）
- `text`: テキスト色（#111827 / dark: #f9fafb）
- `status`: ステータス色
  - `success`: #10b981 （成功）
  - `error`: #ef4444 （エラー）
  - `warning`: #f59e0b （警告）
  - `info`: #3b82f6 （情報）

**UI コンポーネント**:
| コンポーネント | 機能 | 特徴 |
|------------|------|------|
| Button | 4 variants × 3 sizes | ホバー時 shadow-lg、focus ring-2 |
| Card | レイアウト基本 | ホバー可能、shadow transition搭載 |
| Badge | ステータス表示 | 6 variants で色分け表示 |
| Input | テキスト入力 | フォーカス時 shadow-lg、error表示対応 |
| Select | ドロップダウン | カスタムアロー、フォーカス shadow対応 |

**ビジュアルエフェクト**:
- `transition-all duration-200`: すべての UI 要素に滑らかなトランジション（200ms）
- `hover:shadow-lg/md`: ホバー時に影で奥行き表現
- `focus:shadow-lg`: フォーカス状態を shadow で強調
- `dark:*` 変種: 完全なダークモード対応（53+ トークン参照）

**ダークモード実装**:
- Tailwind の `darkMode: 'class'` で自動適用
- `<html class="dark">` で切り替え
- すべてのセマンティックトークンに dark: 対応版を用意
- 例: `bg-surface-subtle dark:bg-surface-dark-muted`

### スケジュール管理（Launchd統合）

Launchdを使用してMacネイティブなスケジュール実行を実装：
- plist生成・管理
- `~/Library/LaunchAgents/` への登録
- Mac起動時やスリープ解除時の自動実行
- Launchd restart による日次スケジュール管理

**UI統合**:
- SchedulePanel: 登録/削除の状態表示
- ConditionalSettingsIndicator: 条件付き設定の表示制御

### Rate Limit検出

アプリは以下の方法でRate Limitを検出：
1. 60秒ごとにターミナル出力を監視
2. 「esc to interrupt」の存在を確認（実行中を示す）
3. 「reset at」メッセージを検出（3回連続で出現）
4. リセット時刻を解析して待機時間を計算

### iTerm統合

AppleScriptを使用してiTermを制御：
- ウィンドウとタブの管理
- コマンドの実行
- 出力の取得
- セッション制御

### バージョン管理

バージョン形式: `YY.M.D`（例: 2025年6月23日の場合 `25.6.23`）
- ビルド時に自動更新
- package.json、Cargo.toml、tauri.conf.json間で同期

## トラブルシューティング

### iTermが検出されない

- [iterm2.com](https://iterm2.com/)からiTermがインストールされているか確認
- iTermのプロセス名が「iTerm2」であることを確認
- 更新ボタンをクリックしてステータスを更新

### アクセシビリティ権限

コマンドが実行されない場合：
1. システム設定 > プライバシーとセキュリティ > アクセシビリティを確認
2. Tauri CLI Schedulerを削除して再追加
3. アプリケーションを再起動

### Rate Limitの問題

- システム時刻が正しいか確認
- Claude Codeが適切に認証されているか確認
- 特定のエラーメッセージのターミナル出力を監視

## 貢献

1. リポジトリをフォーク
2. フィーチャーブランチを作成（`git checkout -b feature/amazing-feature`）
3. 変更をコミット（`git commit -m 'Add some amazing feature'`）
4. ブランチにプッシュ（`git push origin feature/amazing-feature`）
5. プルリクエストを作成

## ライセンス

このプロジェクトはMITライセンスのもとで公開されています - 詳細はLICENSEファイルを参照してください。

## 謝辞

- [Tauri](https://tauri.app/)で構築
- UIは[React](https://react.dev/)と[Tailwind CSS](https://tailwindcss.com/)を使用
- Anthropic社の[Claude Code](https://docs.anthropic.com/claude/docs/claude-cli)と統合
