# 代码审查检查清单

> 适用于 H0 (hzero) 平台 Java 微服务项目。前五章为 H0 平台专属检查项，后续为通用质量检查。

---

## H0 DDD 分层合规性

### 分层调用规则

- [ ] 调用方向正确：Controller → Service → Repository → Mapper
- [ ] Controller 不包含业务逻辑，仅做参数接收、校验、返回
- [ ] Service 编排业务逻辑，处理事务，不直接注入 Mapper
- [ ] Repository 接口定义在 domain 层，实现在 infra 层
- [ ] Mapper 仅做纯粹的数据访问，与 XML 映射文件配合

### 文件归属

- [ ] Controller 位于 `api/controller/v1/` 包下
- [ ] Service 接口位于 `app/service/` 包下
- [ ] Service 实现位于 `app/service/impl/` 包下
- [ ] Entity 位于 `domain/entity/` 包下
- [ ] Repository 接口位于 `domain/repository/` 包下
- [ ] Repository 实现位于 `infra/repository/impl/` 包下
- [ ] Mapper 接口位于 `infra/mapper/` 包下
- [ ] DTO 按用途放在对应层：API 层 DTO 放 `api/dto/`，领域 DTO 放 `domain/dto/`

---

## H0 Entity 约定

### 注解检查

- [ ] 使用 `@Getter` / `@Setter`（禁止使用 `@Data`）
- [ ] 继承 `AuditDomain`（提供审计字段）
- [ ] 有 `@ApiModel` 标注类描述
- [ ] 有 `@VersionAudit` + `@ModifyAudit`
- [ ] 有 `@JsonInclude(NON_NULL)` 过滤空值
- [ ] 有 `@Table(name = "xxx")` 表名映射
- [ ] 主键有 `@Id` + `@GeneratedValue`

### 字段检查

- [ ] 每个字段有对应的 `FIELD_XXX` 常量（大写下划线）
- [ ] 每个字段有 `@ApiModelProperty` 注释
- [ ] `tenantId` 字段存在且有 `@NotNull`
- [ ] 非持久化字段使用 `@Transient` 标注
- [ ] 有 `serialVersionUID` 字段

---

## H0 Controller 约定

### 类级别

- [ ] 继承 `BaseController`
- [ ] `@RestController("xxxController.v1")` bean 名使用小驼峰 + 版本后缀
- [ ] `@RequestMapping("/v1/{organizationId}/xxx")` 路径包含 organizationId

### 方法级别

- [ ] 所有接口有 `@ApiOperation` 文档注解
- [ ] 所有接口有 `@Permission(level = ResourceLevel.ORGANIZATION)` 权限注解
- [ ] 返回值使用 `Results.success()` 或 `Results.success(data)`
- [ ] 分页接口使用 `@SortDefault` + `PageRequest`
- [ ] 隐藏参数使用 `@ApiIgnore`

### CRUD 四件套

- [ ] `list` — 列表查询，调用 Service
- [ ] `detail` — 明细查询，可调用 Repository
- [ ] `save` — 新增/更新，包含 `validObject()`、`SecurityTokenHelper.validTokenIgnoreInsert()`、`setTenantId()`
- [ ] `remove` — 删除，包含 `SecurityTokenHelper.validToken()`

---

## H0 Service & Repository 约定

### Service

- [ ] 使用 `@Service` 注解
- [ ] 分页使用 `PageHelper.doPageAndSort()` 包裹 Repository 查询
- [ ] 新增/更新通过 `id == null` 拆分为 insertList / updateList
- [ ] 使用 `batchInsertSelective` / `batchUpdateByPrimaryKeySelective` 批量操作
- [ ] 异常使用 `CommonException` + i18n code：`throw new CommonException("error.xxx.module_name")`
- [ ] 日志使用 SLF4J：`private static final Logger log = LoggerFactory.getLogger(XxxServiceImpl.class)`

### Repository

- [ ] 接口继承 `BaseRepository<T>`
- [ ] 实现类继承 `BaseRepositoryImpl<T>`，使用 `@Component` 注解
- [ ] 注入 Mapper 使用 `@Resource`（不是 `@Autowired`）
- [ ] 单表 CRUD 优先使用 BaseRepository 内置方法
- [ ] 仅为多表 JOIN、聚合查询编写自定义 Mapper SQL

---

## H0 MyBatis XML 规范

- [ ] XML 文件放在 `resources/mapper/` 目录下，命名与 Mapper 接口一致
- [ ] namespace 指向正确的 Mapper 接口全限定名
- [ ] 使用 `<sql id="BaseSql">` 提取公共字段
- [ ] 参数使用 `#{xxx}` 占位符（不是 `${xxx}`，防止 SQL 注入）
- [ ] 使用 `<if test="xxx != null">` 判断查询条件

---

## 代码功能与逻辑

### 核心功能验证
- [ ] 代码是否实现了预期的功能？
- [ ] 是否满足用户故事/需求文档的所有要求？
- [ ] 逻辑流程是否正确？
- [ ] 边界条件是否都已处理？
- [ ] 异常情况是否有适当的处理？

### 算法与数据结构
- [ ] 使用的算法是否适合当前场景？
- [ ] 数据结构选择是否合理？
- [ ] 是否存在更高效的实现方式？

### 业务逻辑
- [ ] 业务规则是否正确实现？
- [ ] 是否存在业务逻辑漏洞？
- [ ] 数据验证是否充分？

---

## 代码质量

### 可读性
- [ ] 变量、函数、类命名是否清晰且有意义？
- [ ] 代码结构是否清晰易懂？
- [ ] 是否有适当的注释（但不过度注释）？
- [ ] 代码复杂度是否合理（避免过长的函数）？
- [ ] 缩进和格式是否一致？

### DRY原则（Don't Repeat Yourself）
- [ ] 是否存在重复代码？
- [ ] 重复逻辑是否已抽取为可复用函数？
- [ ] 是否过度工程化（在简单性和复用性之间保持平衡）？

### SOLID原则
- [ ] **单一职责原则**：每个类/函数是否只做一件事？
- [ ] **开闭原则**：代码是否易于扩展但不需修改？
- [ ] **里氏替换原则**：子类是否可以替换父类？
- [ ] **接口隔离原则**：接口是否精简且专注？
- [ ] **依赖倒置原则**：是否依赖抽象而非具体实现？

### 编码标准
- [ ] 是否遵循项目的编码规范？
- [ ] 命名约定是否一致（camelCase、PascalCase、snake_case等）？
- [ ] 是否使用了项目推荐的设计模式？

---

## 安全性

### H0 多租户

- [ ] API 路径包含 `{organizationId}` 路径变量
- [ ] Entity 有 `tenantId` 字段
- [ ] 保存操作在 Controller 层设置租户（不是 Service 层硬编码）
- [ ] 查询条件包含租户过滤
- [ ] 保存时调用 `SecurityTokenHelper.validTokenIgnoreInsert()`
- [ ] 删除时调用 `SecurityTokenHelper.validToken()`
- [ ] 使用 `validObject()` 校验请求体

### 认证与授权
- [ ] 是否正确验证用户身份？
- [ ] 权限检查是否完整？
- [ ] 敏感操作是否需要额外验证？
- [ ] 会话管理是否安全？

### 输入验证
- [ ] 所有用户输入是否经过验证？
- [ ] 是否防范SQL注入攻击？
- [ ] 是否防范XSS（跨站脚本）攻击？
- [ ] 是否防范CSRF（跨站请求伪造）攻击？
- [ ] 文件上传是否有安全验证？

### 数据保护
- [ ] 敏感数据是否加密存储？
- [ ] 密码是否使用强加密算法（如bcrypt、Argon2）？
- [ ] API密钥、密码等敏感信息是否硬编码在代码中？
- [ ] 是否使用HTTPS传输敏感数据？
- [ ] 日志中是否泄露敏感信息？

### 依赖安全
- [ ] 使用的第三方库是否有已知漏洞？
- [ ] 依赖版本是否为最新稳定版？
- [ ] 是否定期更新依赖以修复安全漏洞？

---

## 性能

### 算法效率

- [ ] **禁止循环内数据库查询**（for/while 内调用 Repository/Mapper 查询）
- [ ] 批量操作使用 `batchXxx` 方法（不是循环逐条操作）
- [ ] 时间复杂度是否可接受？
- [ ] 空间复杂度是否合理？
- [ ] 是否存在不必要的循环或递归？

### 数据库查询
- [ ] 是否存在N+1查询问题？
- [ ] 查询是否使用了适当的索引？
- [ ] 是否避免了SELECT *？
- [ ] 大数据集操作是否使用了分页？
- [ ] 是否考虑了查询缓存？

### 资源使用
- [ ] 是否正确关闭文件、数据库连接等资源？
- [ ] 内存使用是否合理（是否有内存泄漏风险）？
- [ ] 是否有不必要的对象创建？

### 并发处理
- [ ] 并发操作是否线程安全？
- [ ] 是否存在竞态条件？
- [ ] 锁的使用是否合理（避免死锁）？
- [ ] 异步操作是否正确处理？

### 缓存
- [ ] 是否使用了适当的缓存策略？
- [ ] 缓存失效机制是否正确？
- [ ] 是否考虑了缓存击穿、穿透、雪崩等问题？

---

## 测试覆盖

### 单元测试
- [ ] 是否为新功能编写了单元测试？
- [ ] 测试覆盖率是否达标（通常>80%）？
- [ ] 测试用例是否覆盖了边界条件？
- [ ] 测试用例是否覆盖了异常情况？
- [ ] 测试是否独立且可重复？

### 集成测试
- [ ] 是否测试了与其他模块的集成？
- [ ] API端点是否都有测试？
- [ ] 数据库交互是否测试？

### 测试质量
- [ ] 测试命名是否清晰描述测试目的？
- [ ] 测试是否遵循AAA模式（Arrange-Act-Assert）？
- [ ] 是否避免了脆弱的测试（过度依赖实现细节）？
- [ ] Mock和Stub使用是否合理？

---

## 文档

### 代码注释
- [ ] 复杂逻辑是否有解释性注释？
- [ ] 公共API是否有文档注释？
- [ ] 是否避免了明显的、冗余的注释？
- [ ] TODO/FIXME注释是否有相应的issue追踪？

### API文档
- [ ] 接口是否有清晰的文档说明？
- [ ] 参数和返回值是否文档化？
- [ ] 错误码和异常是否说明？
- [ ] 是否有使用示例？

### README和变更说明
- [ ] 是否更新了相关的README？
- [ ] PR描述是否清晰说明了改动内容和原因？
- [ ] 是否更新了CHANGELOG？
- [ ] 破坏性变更是否有明确说明？

---

## 架构与设计

### 设计模式
- [ ] 是否使用了适当的设计模式？
- [ ] 设计模式的使用是否恰当（不过度设计）？
- [ ] 是否符合项目的整体架构？

### 模块化
- [ ] 代码是否适当模块化？
- [ ] 模块之间的依赖关系是否清晰？
- [ ] 是否存在循环依赖？
- [ ] 高内聚低耦合原则是否遵循？

### 扩展性
- [ ] 代码是否易于扩展新功能？
- [ ] 是否考虑了未来的需求变化？
- [ ] 配置是否灵活可调？

### API设计
- [ ] API接口是否清晰一致？
- [ ] 是否遵循RESTful规范（如适用）？
- [ ] 版本控制策略是否合理？
- [ ] 错误处理是否统一？

---

## 可维护性

### 代码复杂度
- [ ] 圈复杂度是否在合理范围内（通常<10）？
- [ ] 函数长度是否适中（通常<50行）？
- [ ] 嵌套层级是否过深（通常<4层）？

### 错误处理
- [ ] 异常是否被适当捕获和处理？
- [ ] 错误信息是否清晰有用？
- [ ] 是否避免了空catch块？
- [ ] 是否使用了合适的异常类型？

### 日志记录
- [ ] 关键操作是否有日志记录？
- [ ] 日志级别使用是否合理（DEBUG、INFO、WARN、ERROR）？
- [ ] 日志信息是否足够定位问题？
- [ ] 是否避免了过度日志？

### 配置管理
- [ ] 配置是否从代码中分离？
- [ ] 敏感配置是否使用环境变量或密钥管理服务？
- [ ] 不同环境的配置是否清晰？

### 向后兼容性
- [ ] 改动是否会破坏现有功能？
- [ ] 数据库迁移是否可回滚？
- [ ] API变更是否向后兼容？

---

## PR规模管理

### PR大小
- [ ] PR是否足够小（建议<400行代码变更）？
- [ ] 是否专注于单一任务或功能？
- [ ] 是否可以进一步拆分？
- [ ] 提交是否符合逻辑和原子性？

### PR描述
- [ ] PR标题是否清晰描述改动？
- [ ] 是否说明了改动的原因和背景？
- [ ] 是否包含测试计划？
- [ ] 是否标注了相关的issue或ticket？
