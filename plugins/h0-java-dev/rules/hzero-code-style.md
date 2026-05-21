---
paths:
  - "src/**/*.java"
---

# H0 平台微服务代码风格规范

> 本文件适用于所有基于 H0 平台（hzero）开发的微服务项目，采用 DDD（领域驱动设计）分层架构。

## 1. 项目架构概览

### 技术栈

- **平台**: H0 (hzero-apaas-parent)
- **框架**: Spring Boot + Spring Cloud (Eureka)
- **ORM**: MyBatis (hzero-starter-mybatis-mapper)
- **依赖注入**: Spring `@Autowired` 字段注入
- **API 文档**: Swagger 2 (springfox)
- **构建工具**: Maven

### DDD 四层架构

```
org.hzero.{service}
├── api/                          # 接口层（API Layer）
│   ├── controller/v1/            # REST 控制器（按版本分包）
│   └── dto/                      # 接口层数据传输对象
├── app/                          # 应用层（Application Layer）
│   └── service/                  # 服务接口
│       └── impl/                 # 服务实现
├── domain/                       # 领域层（Domain Layer）
│   ├── entity/                   # 实体类
│   ├── repository/               # 仓储接口（只有接口定义）
│   ├── enums/                    # 枚举
│   ├── dto/                      # 领域 DTO
│   └── vo/                       # 值对象
└── infra/                        # 基础设施层（Infrastructure Layer）
    ├── mapper/                   # MyBatis Mapper 接口
    ├── repository/impl/          # 仓储接口的实现类
    ├── feign/                    # Feign 远程调用客户端
    ├── utils/                    # 工具类
    └── constant/                 # 常量定义
```

### 分层调用规则

```
Controller → Service → Repository → Mapper
                            ↑
                  RepositoryImpl（实现层在 infra）
```

- **Controller** 只做参数接收、校验、返回，不包含业务逻辑
- **Service** 编排业务逻辑，处理事务
- **Repository（接口）** 定义在 domain 层，**RepositoryImpl（实现）** 定义在 infra 层
- **Mapper** 纯粹的数据访问，与 XML 映射文件配合

## 2. 命名规范

### 各层类命名

| 层级 | 类名模式 | 示例 |
|------|---------|------|
| Entity | 业务名 | `Order`, `OrderHistory`, `BookingPlanHeader` |
| Controller | 实体名 + `Controller` | `OrderController` |
| Service 接口 | 实体名 + `Service` | `OrderService` |
| Service 实现 | 实体名 + `ServiceImpl` | `OrderServiceImpl` |
| Repository 接口 | 实体名 + `Repository` | `OrderRepository` |
| Repository 实现 | 实体名 + `RepositoryImpl` | `OrderRepositoryImpl` |
| Mapper | 实体名 + `Mapper` | `OrderMapper` |

### 数据库表命名

使用服务前缀 + 小写下划线实体名：`bpm_order`

### URL 命名

API 路径使用 kebab-case：`/v1/{organizationId}/orders`

### Bean 命名

Controller Bean 名使用小驼峰 + 版本后缀：`"orderController.v1"`

### 字段常量

实体中使用 `FIELD_` + 大写下划线定义字段名常量：

```java
public static final String FIELD_ID = "id";
public static final String FIELD_ORDER_NO = "orderNo";
```

## 3. Controller 编写规范

### 标准 CRUD 模板（以 Order 为例）

```java
@RestController("orderController.v1")
@RequestMapping("/v1/{organizationId}/orders")
public class OrderController extends BaseController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderService orderService;

    // 列表查询
    @ApiOperation(value = "订单表列表")
    @Permission(level = ResourceLevel.ORGANIZATION)
    @GetMapping
    public ResponseEntity<Page<Order>> list(
            Order order,
            @PathVariable Long organizationId,
            @ApiIgnore @SortDefault(value = Order.FIELD_ID,
                    direction = Sort.Direction.DESC) PageRequest pageRequest) {
        Page<Order> list = orderService.selectList(pageRequest, order);
        return Results.success(list);
    }

    // 明细查询
    @ApiOperation(value = "订单表明细")
    @Permission(level = ResourceLevel.ORGANIZATION)
    @GetMapping("/{id}/detail")
    public ResponseEntity<Order> detail(@PathVariable Long id) {
        Order order = orderRepository.selectByPrimary(id);
        return Results.success(order);
    }

    // 新增/更新
    @ApiOperation(value = "创建或更新订单表")
    @Permission(level = ResourceLevel.ORGANIZATION)
    @PostMapping
    public ResponseEntity<List<Order>> save(
            @PathVariable Long organizationId,
            @RequestBody List<Order> orders) {
        validObject(orders);
        SecurityTokenHelper.validTokenIgnoreInsert(orders);
        orders.forEach(item -> item.setTenantId(organizationId));
        orderService.saveData(orders);
        return Results.success(orders);
    }

    // 删除
    @ApiOperation(value = "删除订单表")
    @Permission(level = ResourceLevel.ORGANIZATION)
    @DeleteMapping
    public ResponseEntity<?> remove(@RequestBody List<Order> orders) {
        SecurityTokenHelper.validToken(orders);
        orderRepository.batchDeleteByPrimaryKey(orders);
        return Results.success();
    }
}
```

### 扩展业务接口模板

除标准 CRUD 外，业务操作接口遵循以下模式：

```java
@ApiOperation(value = "变更确认")
@Permission(level = ResourceLevel.ORGANIZATION)
@PostMapping("/change-confirmation")
public ResponseEntity<?> changeConfirmation(@RequestBody OrderChangeConfirmDTO dto) {
    List<Long> ids = dto.getOrders().stream().map(Order::getId).collect(Collectors.toList());
    if (ids.isEmpty()) {
        return Results.success();
    }
    orderService.changeConfirmation(ids, dto.getSourceType());
    return Results.success();
}
```

### 关键约定

- **继承**: `extends BaseController`
- **返回值**: 统一使用 `Results.success()` / `Results.success(data)`
- **权限**: 所有接口必须加 `@Permission(level = ResourceLevel.ORGANIZATION)`
- **文档**: 所有接口必须加 `@ApiOperation`
- **分页**: 使用 `@SortDefault` 设置默认排序，`PageRequest` 接收分页参数
- **Token 校验**: 保存时用 `SecurityTokenHelper.validTokenIgnoreInsert()`，删除时用 `SecurityTokenHelper.validToken()`
- **租户设置**: 保存时通过 `item.setTenantId(organizationId)` 设置租户
- **参数校验**: 使用 `validObject()` 校验请求体
- **CRUD 四件套**: `list`、`detail`、`save`、`remove` 为标准接口方法
- **批量操作**: Controller 注入 Repository（用于简单 CRUD）和 Service（用于业务逻辑）

## 4. Service 编写规范

### 接口定义

```java
public interface OrderService {
    /**
     * 查询数据
     *
     * @param pageRequest 分页参数
     * @param order       查询条件
     * @return 返回值
     */
    Page<Order> selectList(PageRequest pageRequest, Order order);

    /**
     * 保存数据
     *
     * @param orders 数据
     */
    void saveData(List<Order> orders);

    /**
     * 更新确认状态
     *
     * @param ids        订单ID列表
     * @param sourceType 来源系统
     */
    void changeConfirmation(List<Long> ids, String sourceType);
}
```

### 实现类

```java
@Service
public class OrderServiceImpl implements OrderService {
    @Autowired
    private OrderRepository orderRepository;

    @Override
    public Page<Order> selectList(PageRequest pageRequest, Order order) {
        return PageHelper.doPageAndSort(pageRequest, () -> orderRepository.selectList(order));
    }

    @Override
    public void saveData(List<Order> orders) {
        List<Order> insertList = orders.stream()
            .filter(line -> line.getId() == null).collect(Collectors.toList());
        List<Order> updateList = orders.stream()
            .filter(line -> line.getId() != null).collect(Collectors.toList());
        orderRepository.batchInsertSelective(insertList);
        orderRepository.batchUpdateByPrimaryKeySelective(updateList);
    }

    @Override
    public void changeConfirmation(List<Long> ids, String sourceType) {
        // 业务逻辑实现
    }
}
```

### 关键约定

- 分页使用 `PageHelper.doPageAndSort()` 包裹 Repository 查询
- 新增/更新通过 `id == null` 判断，拆分为 insertList / updateList
- 使用 `batchInsertSelective` / `batchUpdateByPrimaryKeySelective` 批量操作

## 5. Entity 编写规范

### 标准模板

```java
@Getter
@Setter
@ApiModel("订单表")
@VersionAudit
@ModifyAudit
@JsonInclude(value = JsonInclude.Include.NON_NULL)
@Table(name = "bpm_order")
public class Order extends AuditDomain {
    public static final String FIELD_ID = "id";
    public static final String FIELD_ORDER_NO = "orderNo";
    public static final String FIELD_CUSTOMER_CODE = "customerCode";
    public static final String FIELD_CUSTOMER_NAME = "customerName";
    // ... 其他字段常量

    private static final long serialVersionUID = 1L;

    @ApiModelProperty("主键")
    @Id
    @GeneratedValue
    private Long id;

    @ApiModelProperty(value = "订单号")
    private String orderNo;

    @ApiModelProperty(value = "客户代码")
    private String customerCode;

    @ApiModelProperty(value = "客户名称")
    private String customerName;

    @ApiModelProperty(value = "租户ID", required = true)
    @NotNull
    private Long tenantId;

    // 非持久化字段
    @Transient
    private String matchErrMsg;
}
```

### 关键约定

- **Lombok**: 使用 `@Getter` `@Setter`，不使用 `@Data`（避免 equals/hashCode 问题）
- **基类**: 继承 `AuditDomain`（提供审计字段：creationDate, createdBy, lastUpdateDate, lastUpdatedBy）
- **审计注解**: `@VersionAudit` + `@ModifyAudit`
- **JSON 序列化**: `@JsonInclude(NON_NULL)` 过滤空值
- **Swagger**: `@ApiModel` 标注类，`@ApiModelProperty` 标注字段
- **字段常量**: 每个字段对应一个 `FIELD_XXX` 常量，用于排序和查询引用
- **表名**: `@Table(name = "xxx")`
- **主键**: `@Id` + `@GeneratedValue`
- **非持久化字段**: 使用 `@Transient` 标注

## 6. Repository 编写规范

### 接口（domain 层）

```java
public interface OrderRepository extends BaseRepository<Order> {
    List<Order> selectList(Order order);
    Order selectByPrimary(Long id);
}
```

### 实现类（infra 层）

```java
@Component
public class OrderRepositoryImpl extends BaseRepositoryImpl<Order> implements OrderRepository {
    @Resource
    private OrderMapper orderMapper;

    @Override
    public List<Order> selectList(Order order) {
        return orderMapper.selectList(order);
    }

    @Override
    public Order selectByPrimary(Long id) {
        Order order = new Order();
        order.setId(id);
        List<Order> list = orderMapper.selectList(order);
        if (list.size() == 0) {
            return null;
        }
        return list.get(0);
    }
}
```

### Mapper 接口（infra 层）

```java
public interface OrderMapper extends BaseMapper<Order> {
    List<Order> selectList(Order order);
}
```

### 关键约定

- Repository 接口继承 `BaseRepository<T>`（`org.hzero.mybatis.base`）
- RepositoryImpl 继承 `BaseRepositoryImpl<T>`（`org.hzero.mybatis.base.impl`）并实现对应接口
- RepositoryImpl 使用 `@Component` 注解
- Mapper 继承 `BaseMapper<T>`（`io.choerodon.mybatis.common`）
- RepositoryImpl 注入 Mapper 使用 `@Resource`
- BaseRepository 已提供 `batchInsertSelective`、`batchUpdateByPrimaryKeySelective`、`batchDeleteByPrimaryKey` 等批量方法

## 7. DTO 编写规范

### API 层 DTO（api/dto/）

用于 Controller 接口的请求/响应参数，可继承实体类扩展字段：

```java
@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderChangeConfirmDTO {
    private List<Order> orders;
    private String sourceType;
}
```

### 领域层 DTO（domain/dto/）

用于 Service 层间的数据传输或查询条件封装。

## 8. 注解速查表

### Controller 常用注解

| 注解 | 来源 | 用途 |
|------|------|------|
| `@RestController` | Spring | REST 控制器 |
| `@RequestMapping` | Spring | URL 映射 |
| `@Permission` | choerodon-swagger | 权限控制 |
| `@ApiOperation` | Swagger | 接口文档 |
| `@SortDefault` | choerodon-mybatis | 默认排序 |
| `@ApiIgnore` | Swagger | 隐藏参数 |

### Entity 常用注解

| 注解 | 来源 | 用途 |
|------|------|------|
| `@Getter` / `@Setter` | Lombok | 生成 getter/setter |
| `@ApiModel` | Swagger | 模型文档 |
| `@ApiModelProperty` | Swagger | 字段文档 |
| `@Table` | Javax Persistence | 表映射 |
| `@Id` / `@GeneratedValue` | Javax Persistence | 主键 |
| `@Transient` | Javax Persistence | 非持久化字段 |
| `@VersionAudit` | choerodon-mybatis | 版本审计 |
| `@ModifyAudit` | choerodon-mybatis | 修改审计 |
| `@JsonInclude` | Jackson | JSON 序列化控制 |
| `@NotNull` / `@NotBlank` | Validation | 非空校验 |

### Service 常用注解

| 注解 | 来源 | 用途 |
|------|------|------|
| `@Service` | Spring | 服务组件 |
| `@Autowired` | Spring | 依赖注入（Service/Repository 用） |
| `@Resource` | javax | 依赖注入（Mapper 用） |
| `@Component` | Spring | 组件注册（RepositoryImpl 用） |

## 9. 多租户规范

- 所有 API 路径必须包含 `{organizationId}` 路径变量
- 实体必须有 `tenantId` 字段
- 保存操作时在 Controller 层设置租户：`item.setTenantId(organizationId)`
- 框架自动处理数据隔离的租户过滤

## 10. 分页查询规范

```
Controller: 接收 PageRequest + @SortDefault
    ↓
Service: PageHelper.doPageAndSort(pageRequest, () -> repository.selectList(condition))
    ↓
Repository: 直接调用 Mapper
    ↓
Mapper: XML 中编写查询 SQL
```

## 11. 新增业务模块清单

为某个业务实体（如 `Order`）新增完整 CRUD 功能时，需创建以下文件：

1. `domain/entity/Order.java` — 实体类
2. `domain/repository/OrderRepository.java` — 仓储接口
3. `infra/repository/impl/OrderRepositoryImpl.java` — 仓储实现
4. `infra/mapper/OrderMapper.java` — Mapper 接口
5. `resources/mapper/OrderMapper.xml` — MyBatis XML
6. `app/service/OrderService.java` — 服务接口
7. `app/service/impl/OrderServiceImpl.java` — 服务实现
8. `api/controller/v1/OrderController.java` — 控制器

## 12. 异常处理

- 使用 `CommonException` 抛出业务异常
- 异常消息使用 i18n code：`throw new CommonException("error.xxx.module_name")`
- Controller 层不做 try-catch，由全局异常处理器统一处理
- 日志使用 SLF4J：`private static final Logger log = LoggerFactory.getLogger(XxxServiceImpl.class)`

## 13. MyBatis XML 规范

- Mapper XML 文件放在 `resources/mapper/` 目录下
- 命名与 Mapper 接口一致：`OrderMapper.xml`
- 查询方法使用实体作为条件对象，通过 `<if>` 标签判断字段是否为空
- 数据库字段使用下划线命名，MyBatis 配置 `mapUnderscoreToCamelCase: true` 自动映射

## 14. 禁止循环内数据库查询

**除非万不得已（业务场景确实需要逐条处理），否则禁止在循环体内执行数据库查询。** 循环内的数据库查询会导致严重的 N+1 问题，随数据量增长性能急剧下降。

### 反面示例

```java
// BAD: 循环内逐条查询，N+1 问题
for (Order order : orders) {
    Customer customer = customerRepository.selectByPrimary(order.getCustomerId());
    order.setCustomerName(customer.getCustomerName());
}
```

### 正面示例

```java
// GOOD: 先批量收集ID，一次查询，再在内存中映射
Set<Long> customerIds = orders.stream()
    .map(Order::getCustomerId)
    .filter(Objects::nonNull)
    .collect(Collectors.toSet());
Map<Long, Customer> customerMap = customerRepository.selectByCondition(
    Condition.builder(Customer.class)
        .where(Sqls.custom().andIn(Customer.FIELD_ID, customerIds))
        .build()
).stream().collect(Collectors.toMap(Customer::getId, Function.identity()));

for (Order order : orders) {
    Customer customer = customerMap.get(order.getCustomerId());
    if (customer != null) {
        order.setCustomerName(customer.getCustomerName());
    }
}
```

### 替代方案优先级

1. **批量查询 + 内存映射**（首选）：收集所有查询条件，一次 `selectByCondition` + `andIn` 查出，用 `Collectors.toMap` 或 `Collectors.groupingBy` 建立映射
2. **JOIN 查询**：在 Mapper XML 中编写多表 JOIN SQL，一次查出所有数据
3. **循环内查询**（仅当业务确实需要逐条差异化处理，且无法通过上述方式替代时）
