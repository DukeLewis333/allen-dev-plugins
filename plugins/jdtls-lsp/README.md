# jdtls-lsp

为 Claude Code 提供的 Java 语言服务器（Eclipse JDT.LS），支持代码智能提示和重构功能。

## 支持的文件扩展名

`.java`

## 安装

### 通过 Homebrew（macOS）

```bash
brew install jdtls
```

### 通过包管理器（Linux）

```bash
# Arch Linux (AUR)
yay -S jdtls

# 其他发行版：需要手动安装
```

### 手动安装

1. 从 [Eclipse JDT.LS 发布页](https://download.eclipse.org/jdtls/snapshots/) 下载
2. 解压到某个目录（例如 `~/.local/share/jdtls`）
3. 在 PATH 中创建名为 `jdtls` 的包装脚本

> **注意：** 对于手动安装的 jdtls，需要将其 `bin` 目录添加到系统的环境变量 `PATH` 中，以确保 Claude Code 能够正确找到并调用 `jdtls` 命令。

## 系统要求

- Java 17 或更高版本（需要 JDK，仅 JRE 不够）

## 更多信息

- [Eclipse JDT.LS GitHub](https://github.com/eclipse-jdtls/eclipse.jdt.ls)
- [VSCode Java 扩展](https://github.com/redhat-developer/vscode-java)（使用 JDT.LS）
