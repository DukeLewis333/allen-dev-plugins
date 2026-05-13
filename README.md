# allen-dev-plugins

Claude Code 开发插件集合，为 H0（Hzero）平台 Java 微服务开发提供代码智能、项目规范生成和复杂模式提取等能力。

## 插件一览

| 插件 | 说明 |
|------|------|
| [jdtls-lsp](plugins/jdtls-lsp/) | 基于 Eclipse JDT.LS 的 Java 语言服务器，提供代码智能提示与重构 |
| [h0-java-dev](plugins/h0-java-dev/) | H0 平台微服务开发工具集，包含 CLAUDE.md 生成器、复杂模式挖掘器和模块分析代理 |

---

## 插件详情

### jdtls-lsp

为 Claude Code 集成 Eclipse JDT.LS，使 Claude Code 能够理解 Java 代码结构、提供智能补全和重构建议。

- **支持文件类型**：`.java`
- **系统要求**：Java 17+（JDK）
- **安装方式**：Homebrew（macOS）、包管理器（Linux）或手动安装

详见 [plugins/jdtls-lsp/README.md](plugins/jdtls-lsp/README.md)。

### h0-java-dev

H0 平台微服务开发工具集，包含以下技能（Skills）和代理（Agents）：

#### 技能（Skills）

| 技能 | 说明 |
|------|------|
| **hzero-claudemd-generator** | 为 H0 平台微服务项目生成或更新 CLAUDE.md。自动扫描项目结构，内联实时数据，输出 150-200 行的规范指令文件。支持参数指定输出路径 |
| **h0-complex-pattern-miner** | 分析 H0 平台微服务项目，识别复杂的功能实现和业务逻辑模式，并提取为可复用的 Skill 或 Agent 定义 |
| **h0-code-flow-analyzer** | 分析 H0 平台微服务代码，追踪执行路径和调用链，生成详尽的自包含 HTML 报告（含流程图、逐步说明、分支逻辑、数据流转） |
| **h0-api-tester** | 测试 H0 平台 API 接口，自动从 `.claude/h0-auth.yaml` 读取认证配置获取 OAuth2 Token，然后带 Token 请求目标接口并报告结果 |

#### 代理（Agents）

| 代理 | 说明 |
|------|------|
| **h0-module-analyzer** | 分析 H0 微服务项目，识别业务模块边界，为每个模块生成专属的子代理 |

#### 规则（Rules）

| 规则 | 说明 | 使用方式 |
|------|------|---------|
| **hzero-code-style** | H0 平台微服务 DDD 分层代码风格规范，涵盖 Controller/Service/Entity/Repository/Mapper 各层编写模板、命名规范、注解速查和多租户/分页约定 | 对 `src/**/*.java` 路径自动加载 |
| **repository-crud-priority** | 单表 CRUD 操作必须优先使用 `BaseRepository` 内置方法，禁止在 Mapper XML 中编写重复 SQL；列出所有内置方法清单和条件查询示例 | 对 `**/*.java` 路径自动加载 |
| **h0-js-api** | H0 飞搭平台 JS 内置函数参考，涵盖 `H0.ModelerHelper`（增删改查）、`H0.SqlHelper`（SQL 查询）、`H0.ExceptionHelper`（异常抛出）等 API | 见下方说明 |

**h0-js-api 使用方式**：该规则文件需要在飞搭 JS 脚本项目的根目录下创建 `.claude/rules/` 目录并放入此文件，使 Claude Code 在编辑 `.js` 文件时自动加载 H0 内置函数的上下文：

```bash
# 在飞搭 JS 脚本项目根目录下执行
mkdir -p .claude/rules
cp /path/to/allen-dev-plugins/plugins/h0-java-dev/rules/h0-js-api.md .claude/rules/
```

该规则通过 `paths` 前缀配置仅对 `src/*.js` 文件生效，不会影响其他类型文件的编辑。

**hzero-code-style 与 repository-crud-priority 使用方式**：这两条规则通过 `paths` 前缀配置自动生效。将 `hzero-code-style.md` 和 `repository-crud-priority.md` 复制到项目根目录的 `.claude/rules/` 下即可：

```bash
# 在 H0 微服务项目根目录下执行
mkdir -p .claude/rules
cp /path/to/allen-dev-plugins/plugins/h0-java-dev/rules/hzero-code-style.md .claude/rules/
cp /path/to/allen-dev-plugins/plugins/h0-java-dev/rules/repository-crud-priority.md .claude/rules/
```

- `hzero-code-style.md` 通过 `paths: src/**/*.java` 仅在编辑源码目录下的 Java 文件时加载
- `repository-crud-priority.md` 通过 `paths: **/*.java` 对所有 Java 文件生效

#### Hooks

| Hook | 事件 | 说明 |
|------|------|------|
| **context-gate** | PreToolUse | Fact-Forcing Gate：首次编辑/创建文件时阻止操作，强制 AI 先调查文件上下文（导入者、公共 API、数据结构），调查后重试放行 |

**context-gate 工作机制**：当 AI 尝试 Edit/Write/MultiEdit 时，hook 检查该文件是否已被"事实调查"过。首次操作会被阻止并要求列出：1) 导入该文件的模块，2) 受影响的公共 API，3) 数据结构。AI 完成调查后重试即可放行。状态按 session 隔离，30 分钟超时自动清理。

---

## 项目结构

```text
allen-dev-plugins/
├── README.md
└── plugins/
    ├── jdtls-lsp/                       # Java LSP 插件
    │   ├── .claude-plugin/plugin.json   # 插件元数据
    │   ├── .lsp.json                    # LSP 服务器配置
    │   └── README.md                    # 安装与使用说明
    └── h0-java-dev/                     # H0 开发工具集
        ├── .claude-plugin/plugin.json   # 插件元数据
        ├── rules/                       # 项目规则
        │   ├── h0-js-api.md             # 飞搭平台 JS API 参考
        │   ├── hzero-code-style.md      # DDD 分层代码风格规范
        │   └── repository-crud-priority.md  # Repository CRUD 优先规则
        ├── hooks/                       # PreToolUse hooks
        │   ├── hooks.json               # Hook 配置
        │   └── context-gate.js          # Fact-Forcing Gate 脚本
        ├── skills/
        │   ├── hzero-claudemd-generator/       # CLAUDE.md 生成器
        │   │   ├── SKILL.md
        │   │   └── references/
        │   │       └── hzero-platform-reference.md
        │   ├── h0-complex-pattern-miner/       # 复杂模式挖掘器
        │   │   ├── SKILL.md
        │   │   └── references/
        │   │       ├── functional-patterns.md
        │   │       ├── business-patterns.md
        │   │       └── output-templates.md
        │   ├── h0-code-flow-analyzer/          # 代码流程分析器
        │   │   ├── SKILL.md
        │   │   └── references/
        │   │       └── html-template.md
        │   └── h0-api-tester/                  # 接口测试器
        │       ├── SKILL.md
        │       └── references/
        │           └── auth-config-template.md
        └── agents/
            ├── h0-module-analyzer.md           # 模块分析代理
            └── references/
                ├── module-agent-template.md
                └── module-discovery-rules.md
```

---

## 安装

打开claude-code命令行窗口，执行/plugin，然后切换到Marketplaces栏，然后选择Add Marketplace，输入https://github.com/DukeLewis333/allen-dev-plugins.git 然后确认即可。对于需要使用的插件，在Marketplaces栏选择allen-dev-plugins，然后安装所需插件即可。

具体配置方式请参考各插件目录下的说明文档。

## 作者

**Allen Huang** — [jialong.huang01@hand-china.com](mailto:jialong.huang01@hand-china.com)

## 许可证

请参阅仓库中的 LICENSE 文件。
