# Module Agent Generation Template

> Reference file for h0-module-analyzer. Template for generating a business-module-specific agent.

## Template

Replace all `[placeholders]` with values discovered during module analysis.

```markdown
---
name: [module-id]-agent
description: >
  Specialized agent for the [Module Name] module in H0 microservice projects.
  Handles all development tasks related to [brief module scope].
  Trigger when the user mentions [module keywords], [entity names],
  [API paths], or any task touching [module-specific terms].
  This agent understands the full module architecture: entities, services,
  repositories, mappers, controllers, DTOs, and business logic patterns.
---

# [Module Name] Module Agent

## Module Overview

[One paragraph describing what this module does and its role in the broader system.]

**Business Domain**: [e.g., Accounts Receivable, Order Management, Mail Integration]
**Package Root**: `org.hzero.{service}.[module-path]`

## Architecture Map

```
[Module Name] Module
├── Entities:      [count] (domain/entity/)
├── Services:      [count] (app/service/impl/)
├── Repositories:  [count] (domain/repository/ + infra/repository/impl/)
├── Mappers:       [count] (infra/mapper/)
├── Controllers:   [count] (api/controller/v1/)
├── DTOs:          [count] (api/dto/[module]/, domain/dto/)
├── Jobs:          [count] (job/)
└── Config:        [count] (config/)
```

## Entity Catalog

| Entity | Table | Description | Key Fields |
|--------|-------|-------------|------------|
| [EntityName] | [table_name] | [one-line description] | [id, field1, field2] |

## Service Inventory

### [ServiceName]Service

- **[methodName1]**([params]) — [what it does]
- **[methodName2]**([params]) — [what it does]

## Controller Endpoints

| Method | Path | Operation | Controller |
|--------|------|-----------|------------|
| GET | `/v1/{orgId}/[path]` | [description] | [ControllerName] |
| POST | `/v1/{orgId}/[path]` | [description] | [ControllerName] |

## Business Logic Patterns

### [Pattern Name]
[Description of a key business logic pattern in this module.]

**Flow**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Key Classes**: [Class1], [Class2]

## Cross-Module Dependencies

| Depends On | For What |
|-----------|----------|
| [ModuleA] | [Why this module needs ModuleA] |

## Common Tasks This Agent Handles

1. **Add new entity/CRUD** — Generate full DDD stack for a new entity in this module
2. **Add service method** — Add business logic following existing patterns
3. **Add controller endpoint** — New REST API following module conventions
4. **Debug business logic** — Trace through service methods to find issues
5. **Write mapper XML** — Complex queries for module entities
6. **Add scheduled job** — New batch processing for module data

## Coding Conventions (Module-Specific)

[Any module-specific conventions that differ from the project standard.]

## File Locations

| Type | Path Pattern |
|------|-------------|
| Entity | `src/main/java/**/domain/entity/[Prefix]*.java` |
| Service | `src/main/java/**/app/service/impl/[Prefix]*ServiceImpl.java` |
| Repository | `src/main/java/**/domain/repository/[Prefix]*Repository.java` |
| Repository Impl | `src/main/java/**/infra/repository/impl/[Prefix]*RepositoryImpl.java` |
| Mapper | `src/main/java/**/infra/mapper/[Prefix]*Mapper.java` |
| Mapper XML | `src/main/resources/mapper/[Prefix]*Mapper.xml` |
| Controller | `src/main/java/**/api/controller/v1/[Prefix]*Controller.java` |
| DTO | `src/main/java/**/api/dto/[module]/*DTO.java` |
```

## Generation Instructions

When generating a module agent from this template:

1. **Entity Catalog**: Read each entity file to extract `@Table(name=)`, `@ApiModelProperty` descriptions, and key fields (those with `@Id`, `@NotNull`, or business-meaningful names).

2. **Service Inventory**: Read each service impl file. Extract public method signatures and their Javadoc or inline logic descriptions. Group by service class.

3. **Controller Endpoints**: Read each controller file. Extract `@RequestMapping`, `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping` annotations with their paths and `@ApiOperation` descriptions.

4. **Business Logic Patterns**: Identify the top 3-5 most complex methods in the module's services. Summarize the algorithm/pattern used. This is the most valuable part — it gives the agent deep module knowledge.

5. **Cross-Module Dependencies**: Search for imports of entities/services from other modules. List which external modules are referenced and why.

6. **Common Tasks**: Based on the module's complexity and size, list 5-8 common development tasks someone might ask an agent to do within this module.

7. **Module-Specific Conventions**: Look for patterns unique to this module that aren't covered by the project-wide CLAUDE.md. For example, if a module uses self-injection for transactional methods, or uses a custom abstract processor, document that here.
