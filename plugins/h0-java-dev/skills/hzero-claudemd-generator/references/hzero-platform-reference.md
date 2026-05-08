# H0 Platform Reference

Detailed patterns and conventions for H0 (hzero) platform microservices. Load this when generating CLAUDE.md for deep convention details.

## DDD Four-Layer Architecture

```text
org.hzero.{service}
├── api/                          # API Layer
│   ├── controller/v1/            # REST controllers (versioned)
│   └── dto/                      # API-level DTOs
├── app/                          # Application Layer
│   └── service/impl/             # Service interfaces + implementations
├── domain/                       # Domain Layer
│   ├── entity/                   # Entity classes
│   ├── repository/               # Repository interfaces (only interfaces)
│   ├── dto/                      # Domain DTOs
│   ├── enums/                    # Enumerations
│   └── vo/                       # Value objects
└── infra/                        # Infrastructure Layer
    ├── mapper/                   # MyBatis Mapper interfaces
    ├── repository/impl/          # Repository implementations
    ├── feign/                    # Feign remote call clients
    ├── constant/                 # Constants
    └── utils/                    # Utilities
```

Call rule: `Controller → Service → Repository → Mapper`. Repository interfaces in domain, implementations in infra.

## Entity Template

```java
@Getter
@Setter
@ApiModel("描述")
@VersionAudit
@ModifyAudit
@JsonInclude(value = JsonInclude.Include.NON_NULL)
@Table(name = "prefix_entity")
public class Entity extends AuditDomain {
    public static final String FIELD_ID = "id";
    public static final String FIELD_NAME = "name";

    private static final long serialVersionUID = 1L;

    @ApiModelProperty("主键")
    @Id
    @GeneratedValue
    private Long id;

    @ApiModelProperty(value = "名称")
    private String name;

    @ApiModelProperty(value = "租户ID", required = true)
    @NotNull
    private Long tenantId;

    @Transient
    private String transientField;
}
```

Key rules: `@Getter`/`@Setter` only (never `@Data`), extends `AuditDomain`, `FIELD_XXX` constants for every field.

## Controller Template

```java
@RestController("entityController.v1")
@RequestMapping("/v1/{organizationId}/entities")
public class EntityController extends BaseController {

    @Autowired
    private EntityRepository entityRepository;

    @Autowired
    private EntityService entityService;

    @ApiOperation(value = "列表查询")
    @Permission(level = ResourceLevel.ORGANIZATION)
    @GetMapping
    public ResponseEntity<Page<Entity>> list(
            Entity entity,
            @PathVariable Long organizationId,
            @ApiIgnore @SortDefault(value = Entity.FIELD_ID,
                    direction = Sort.Direction.DESC) PageRequest pageRequest) {
        Page<Entity> list = entityService.selectList(pageRequest, entity);
        return Results.success(list);
    }

    @ApiOperation(value = "明细")
    @Permission(level = ResourceLevel.ORGANIZATION)
    @GetMapping("/{id}/detail")
    public ResponseEntity<Entity> detail(@PathVariable Long id) {
        return Results.success(entityRepository.selectByPrimary(id));
    }

    @ApiOperation(value = "创建或更新")
    @Permission(level = ResourceLevel.ORGANIZATION)
    @PostMapping
    public ResponseEntity<List<Entity>> save(
            @PathVariable Long organizationId,
            @RequestBody List<Entity> entities) {
        validObject(entities);
        SecurityTokenHelper.validTokenIgnoreInsert(entities);
        entities.forEach(item -> item.setTenantId(organizationId));
        entityService.saveData(entities);
        return Results.success(entities);
    }

    @ApiOperation(value = "删除")
    @Permission(level = ResourceLevel.ORGANIZATION)
    @DeleteMapping
    public ResponseEntity<?> remove(@RequestBody List<Entity> entities) {
        SecurityTokenHelper.validToken(entities);
        entityRepository.batchDeleteByPrimaryKey(entities);
        return Results.success();
    }
}
```

## Service Template

```java
@Service
public class EntityServiceImpl implements EntityService {
    @Autowired
    private EntityRepository entityRepository;

    @Override
    public Page<Entity> selectList(PageRequest pageRequest, Entity entity) {
        return PageHelper.doPageAndSort(pageRequest, () -> entityRepository.selectList(entity));
    }

    @Override
    public void saveData(List<Entity> entities) {
        List<Entity> insertList = entities.stream()
            .filter(line -> line.getId() == null).collect(Collectors.toList());
        List<Entity> updateList = entities.stream()
            .filter(line -> line.getId() != null).collect(Collectors.toList());
        entityRepository.batchInsertSelective(insertList);
        entityRepository.batchUpdateByPrimaryKeySelective(updateList);
    }
}
```

## Repository Template

Interface (domain layer):
```java
public interface EntityRepository extends BaseRepository<Entity> {
    List<Entity> selectList(Entity entity);
    Entity selectByPrimary(Long id);
}
```

Implementation (infra layer):
```java
@Component
public class EntityRepositoryImpl extends BaseRepositoryImpl<Entity> implements EntityRepository {
    @Resource
    private EntityMapper entityMapper;

    @Override
    public List<Entity> selectList(Entity entity) {
        return entityMapper.selectList(entity);
    }

    @Override
    public Entity selectByPrimary(Long id) {
        Entity entity = new Entity();
        entity.setId(id);
        List<Entity> list = entityMapper.selectList(entity);
        return list.isEmpty() ? null : list.get(0);
    }
}
```

## MyBatis XML Template

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.hzero.{service}.infra.mapper.EntityMapper">

    <sql id="BaseSql">
        be.id, be.name, be.tenant_id,
        be.creation_date, be.created_by, be.last_update_date, be.last_updated_by
    </sql>

    <sql id="BaseQuerySql">
        <if test="name != null">
            AND be.name LIKE CONCAT('%', #{name}, '%')
        </if>
        <if test="tenantId != null">
            AND be.tenant_id = #{tenantId}
        </if>
    </sql>

    <select id="selectList" resultMap="BaseResultMap">
        SELECT <include refid="BaseSql"/>
        FROM prefix_entity be
        WHERE 1=1 <include refid="BaseQuerySql"/>
    </select>

</mapper>
```

## New Module File Checklist

For a new CRUD entity `Foo`, create these 8 files:

1. `domain/entity/Foo.java` — Entity class
2. `domain/repository/FooRepository.java` — Repository interface
3. `infra/repository/impl/FooRepositoryImpl.java` — Repository implementation
4. `infra/mapper/FooMapper.java` — Mapper interface
5. `resources/mapper/FooMapper.xml` — MyBatis XML
6. `app/service/FooService.java` — Service interface
7. `app/service/impl/FooServiceImpl.java` — Service implementation
8. `api/controller/v1/FooController.java` — Controller

## Key Base Classes

| Class | Package | Used By |
| ----- | ------- | ------- |
| `BaseController` | choerodon | Controllers |
| `AuditDomain` | choerodon-mybatis | Entities |
| `BaseRepository<T>` | org.hzero.mybatis.base | Repository interfaces |
| `BaseRepositoryImpl<T>` | org.hzero.mybatis.base.impl | Repository implementations |
| `BaseMapper<T>` | io.choerodon.mybatis.common | Mapper interfaces |

## Annotation Quick Reference

| Annotation | Layer | Purpose |
| ---------- | ----- | ------- |
| `@RestController` | Controller | REST controller |
| `@Permission` | Controller | RBAC permission |
| `@ApiOperation` | Controller | Swagger docs |
| `@SortDefault` | Controller | Default sort |
| `@Getter` / `@Setter` | Entity | Lombok (never `@Data`) |
| `@Table` | Entity | DB table mapping |
| `@VersionAudit` | Entity | Version audit |
| `@ModifyAudit` | Entity | Modification audit |
| `@JsonInclude(NON_NULL)` | Entity | Filter nulls in JSON |
| `@Service` | Service | Spring service bean |
| `@Component` | RepositoryImpl | Spring component |
| `@Autowired` | All | DI for Service/Repository |
| `@Resource` | RepositoryImpl | DI for Mapper |
