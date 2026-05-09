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

#### 代理（Agents）

| 代理 | 说明 |
|------|------|
| **h0-module-analyzer** | 分析 H0 微服务项目，识别业务模块边界，为每个模块生成专属的子代理 |

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
        │   └── h0-js-api.md
        ├── skills/
        │   ├── hzero-claudemd-generator/       # CLAUDE.md 生成器
        │   │   ├── SKILL.md
        │   │   └── references/
        │   │       └── hzero-platform-reference.md
        │   └── h0-complex-pattern-miner/       # 复杂模式挖掘器
        │       ├── SKILL.md
        │       └── references/
        │           ├── functional-patterns.md
        │           ├── business-patterns.md
        │           └── output-templates.md
        └── agents/
            ├── h0-module-analyzer.md           # 模块分析代理
            └── references/
                ├── module-agent-template.md
                └── module-discovery-rules.md
```

---

## 安装

将此仓库克隆到本地后，在 Claude Code 中配置插件路径即可使用：

```bash
git clone https://github.com/DukeLewis333/allen-dev-plugins.git
```

具体配置方式请参考各插件目录下的说明文档。

## 作者

**Allen Huang** — [jialong.huang01@hand-china.com](mailto:jialong.huang01@hand-china.com)

## 许可证

请参阅仓库中的 LICENSE 文件。