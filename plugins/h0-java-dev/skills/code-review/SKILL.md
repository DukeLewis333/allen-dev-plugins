---
name: code-review
description: >
  H0 (hzero) 平台 Java 微服务代码审查。基于 DDD 四层架构规范，对 Controller/Service/Repository/Mapper
  各层代码进行系统化审查，涵盖分层合规性、实体约定、多租户、安全、性能、MyBatis 规范等维度。
  当用户要求 "审查代码"、"review 代码"、"检查代码"、"代码审查"、"code review"、"review this PR"、
  "这段代码有什么问题"、"帮我看看这段代码"、"review 一下" 时触发。
arguments: [target]
argument-hint: "[要审查的文件路径、Java 类名、或 PR 描述，如 'OrderController.java' 或 '订单模块']"
allowed-tools: Read Glob Grep Bash(find *) Bash(cat *) Bash(head *) Bash(wc *) Bash(ls *) Bash(git *) LSP(goToDefinition) LSP(findReferences) LSP(hover)
---

# H0 Code Review Skill

## Overview

对 H0 (hzero) 平台 Java 微服务代码进行结构化审查，确保代码符合平台 DDD 四层架构规范和团队编码约定。当用户请求代码审查、上传代码文件寻求反馈，或询问代码改进建议时，Claude 会使用此 Skill 提供系统化的审查和建设性的反馈。

## Prerequisites

- 项目必须是基于 H0 (hzero) 平台的 Java 微服务
- 熟悉 `hzero-code-style` 规则中定义的 DDD 分层架构、命名规范和注解约定
- 熟悉 `repository-crud-priority` 规则中定义的 BaseRepository 优先使用规则

## 审查流程

### 第一步：理解上下文
在开始审查前，确保理解：

1. **代码目的**：这段代码要实现什么功能？
2. **变更范围**：修改了哪些部分？为什么修改？
3. **业务背景**：相关的需求或用户故事是什么？
4. **技术栈**：H0 平台、Spring Boot、MyBatis、Maven
5. **DDD 层级**：代码属于哪一层？是否与同层及上下层关联？

### 第二步：结构化审查
按照以下优先级进行审查：

#### 🔴 高优先级（必须检查）

1. **DDD 分层合规性**：调用方向是否正确（Controller → Service → Repository → Mapper）？
1. **功能正确性**：代码是否实现了预期功能？
1. **安全性**：是否存在安全漏洞？多租户隔离是否完整？
1. **严重 Bug**：是否有逻辑错误或可能导致崩溃的问题？
1. **性能红线**：是否存在循环内数据库查询？

#### 🟡 中优先级（强烈建议）

1. **H0 平台约定**：注解、基类、命名是否符合平台规范？
1. **性能**：是否存在性能瓶颈（N+1、无分页、逐条操作）？
1. **测试覆盖**：是否有足够的测试？
1. **错误处理**：异常情况是否妥善处理（CommonException + i18n）？
1. **架构设计**：设计是否合理、可扩展？

#### 🟢 低优先级（建议改进）

1. **代码质量**：命名、格式、注释是否清晰？
1. **文档**：是否有必要的文档说明（@ApiOperation、@ApiModelProperty）？
1. **最佳实践**：是否遵循 H0 平台和团队规范？

### 第三步：提供反馈
使用建设性的方式提供反馈：

- 标注问题严重程度（🔴 必须修复、🟡 强烈建议、🟢 建议、💡 可选）
- 标注 DDD 层级（`[Controller]`、`[Service]`、`[Repository]`、`[Entity]`、`[Mapper]`）
- 标注文件和行号（如 `OrderController.java:45`）
- 说明问题的影响和原因
- 提供具体的改进建议和示例代码
- 引用 H0 平台规范（`hzero-code-style`、`repository-crud-priority`）
- 认可好的实践

## 审查输出格式

使用以下结构化格式输出审查结果：

```markdown
# 代码审查报告

## 审查范围

[列出审查的文件及其 DDD 层级，如：OrderController.java [Controller]、OrderServiceImpl.java [Service]]

## 总体评价

[简要总结代码的整体质量和主要发现，一句定性 + 关键数字]

## 🔴 必须修复的问题

[按 DDD 分层归类，列出必须解决的关键问题]
- **[Controller] OrderController.java:45** — 缺少 @Permission 注解 → 添加 @Permission(level = ResourceLevel.ORGANIZATION)

## 🟡 强烈建议改进

[列出重要的改进建议]

## 🟢 可选建议

[列出次要的优化建议]

## 👍 优点

[认可好的实践和亮点]

## 详细审查意见

[按 DDD 层级组织的详细评论，每个问题包含文件:行号、问题描述、修复建议]

## 下一步建议

[关于如何处理反馈的指导]
```

## 常见审查场景

### 场景 1：审查新增业务模块（8 个标准文件）

对完整的 CRUD 模块进行全链路审查：

- 检查 8 个文件是否齐全（Entity、Repository 接口/实现、Mapper 接口/XML、Service 接口/实现、Controller）
- 检查 Entity 是否符合平台模板（注解、基类、字段常量）
- 检查 Controller 是否包含标准 CRUD 四件套（list、detail、save、remove）
- 检查 Service 是否正确使用 PageHelper 和批量操作
- 检查 Repository 是否优先使用 BaseRepository 内置方法
- 检查 Mapper XML 是否只为多表 JOIN 或聚合查询编写自定义 SQL

### 场景 2：审查 Service 层变更

重点检查：

- 分层调用是否正确（不直接操作 Mapper）
- 分页查询是否使用 PageHelper
- 批量操作是否使用 batchXxx 方法
- 是否存在循环内数据库查询
- 异常处理是否使用 CommonException + i18n code

### 场景 3：审查 MyBatis Mapper XML

重点检查：

- 是否存在单表 CRUD 的冗余 SQL（应使用 BaseRepository）
- SQL 是否有注入风险（字符串拼接）
- 查询是否使用了索引字段
- 大数据量查询是否有分页
- 字段映射是否正确（下划线转驼峰）

### 场景 4：审查小型PR（<200行）

- 快速浏览整体结构
- 重点检查功能正确性和安全性
- 确保有基本测试
- 提供简洁的反馈

### 场景 5：审查大型PR（>400行）

- 建议作者拆分PR
- 先审查核心逻辑和关键路径
- 可以要求作者提供设计文档或演示
- 分阶段进行审查

### 场景 6：审查初级开发者代码

- 更加耐心和详细
- 多提供示例和学习资源
- 解释"为什么"而不只是"怎么做"
- 多给予鼓励和肯定

### 场景 7：安全关键代码

- 仔细检查所有输入验证
- 检查认证和授权逻辑
- 检查敏感数据处理
- 考虑使用自动化安全扫描工具

### 场景 8：性能关键代码

- 分析算法复杂度
- 检查数据库查询效率
- 考虑并发和资源使用
- 建议性能测试和基准测试

## 反馈指导原则

### 建设性与尊重
- **专注于代码，而非编写者**：说"这个函数可以更简洁"而不是"你写得太复杂了"
- **保持专业和尊重**：即使发现严重问题，也要以建设性的方式提出
- **提供具体建议**：不要只说"这不好"，要说明为什么不好以及如何改进
- **认可好的实践**：发现优秀代码时也要给予肯定

### 清晰与具体
- **明确问题所在**：指出具体的行号和代码段
- **说明影响**：解释问题可能导致的后果（安全、性能、可维护性等）
- **提供上下文**：如果引用外部资源或标准，提供链接
- **举例说明**：必要时提供代码示例展示建议的改进方式

## 最佳实践

### 审查者
1. **保持客观**：专注于代码，而非编写者
2. **及时审查**：不要让PR长时间等待
3. **完整审查**：不要只看表面就批准
4. **建设性沟通**：提供解决方案，不只是指出问题
5. **持续学习**：从审查中学习新技术和模式

### 代码作者
1. **自审**：提交前先自己审查一遍
2. **小而专注**：保持PR小而专注于单一任务
3. **清晰描述**：写清楚PR的目的、改动和测试
4. **响应及时**：及时回应审查意见
5. **开放心态**：虚心接受建设性反馈

## 工具推荐

配合使用以下自动化工具可以提高审查效率：

- **静态分析**：SonarQube、SpotBugs、Checkstyle、PMD
- **安全扫描**：Snyk、OWASP Dependency-Check、GitGuardian
- **代码格式**：Google Java Format、Spring Java Format
- **测试覆盖**：JaCoCo
- **代码复杂度**：SonarQube

自动化工具可以处理格式、风格等基础问题，让审查者专注于逻辑、架构和设计。

## When to Apply

应用此 Skill 当用户：

- 明确请求代码审查："帮我审查这段代码"、"请检查这个PR"
- 询问代码质量："这段代码有什么问题吗"、"如何改进这段代码"
- 提到代码审查相关术语："code review"、"pull request review"
- 上传代码文件并寻求反馈或改进建议
- 询问代码是否遵循 H0 平台最佳实践
- 需要安全审查或性能评估

## Resources

此 Skill 包含以下参考资源：

### REVIEW-CHECKLIST.md

H0 平台代码审查检查清单，按 DDD 分层组织，包含：

- H0 平台规范检查（DDD 分层合规性、Entity 约定、Controller/Service/Repository 约定）
- 多租户与安全检查
- MyBatis 规范检查
- 通用质量检查（可读性、性能、测试、文档）

**使用时机**：当需要进行全面、系统的代码审查时，参考此清单确保不遗漏。

### FEEDBACK-GUIDELINES.md

建设性反馈指南，包含 H0 平台特有的反馈示例：
- 各 DDD 层级的典型问题和修复建议
- 反馈原则和措辞规范
- 常见违规的代码示例

**使用时机**：当需要撰写PR评论或提供反馈时，参考此文档以确保反馈专业、建设性且有帮助。
