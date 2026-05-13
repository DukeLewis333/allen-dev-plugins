---
paths:
  - "**/*.java"
---

# Repository CRUD 优先规则

## 规则

单表 CRUD 操作必须优先使用 `BaseRepository` 提供的内置方法，禁止为此在 Mapper XML 中编写重复的 SQL。

## BaseRepository 内置方法清单

| 方法 | 用途 |
|------|------|
| `selectByCondition(Condition)` | 按条件批量查询（支持 `Sqls.custom().andIn().andEqualTo()` 等） |
| `selectByPrimary(Long id)` | 按主键查询单条 |
| `selectOptional(T, Criteria)` | 按条件查询（带 Criteria） |
| `selectOneOptional(T, Criteria)` | 按条件查询单条 |
| `selectCountByCondition(Condition)` | 按条件统计数量 |
| `selectByIds(String ids)` | 按ID字符串批量查询（逗号分隔） |
| `insertSelective(T)` | 插入（仅非null字段） |
| `updateByPrimaryKeySelective(T)` | 按主键更新（仅非null字段） |
| `batchInsertSelective(List<T>)` | 批量插入 |
| `batchUpdateByPrimaryKeySelective(List<T>)` | 批量更新 |
| `batchDeleteByPrimaryKey(List<T>)` | 批量删除 |
| `deleteByPrimaryKey(T)` | 按主键删除 |

## 条件查询示例

```java
// 批量按ID查询 + 租户过滤
List<Order> orders = orderRepository.selectByCondition(
    Condition.builder(Order.class)
        .where(Sqls.custom()
            .andEqualTo(Order.FIELD_TENANT_ID, tenantId)
            .andIn(Order.FIELD_ID, orderIds))
        .build());

// 单条精确查询
Order order = orderRepository.selectByPrimary(id);
```

## 何时才需要自定义 Mapper SQL

只有以下场景才在 Mapper XML 中编写自定义 SQL：

- 多表 JOIN 查询
- 聚合查询（SUM、GROUP BY 等）
- 需要特殊 WHERE 条件（LIKE、BETWEEN、子查询等）
- 批量操作无法用 BaseRepository 方法满足时（如批量 INSERT IGNORE）
