# Module Discovery Rules

> Reference file for h0-module-analyzer. Rules for detecting business module boundaries in H0 projects.

## Primary Detection: Entity Prefix Grouping

H0 projects follow a naming convention where entities in the same business module share a common prefix. This is the strongest signal for module boundaries.

### Prefix Extraction Algorithm

```text
For each entity file in domain/entity/:
  1. Remove ".java" suffix
  2. Extract prefix: strip trailing PascalCase segments
  3. Common patterns:
     - [Domain]*         → Primary business domain (e.g., Order*, Payment*, Inventory*)
     - [System][Domain]* → Integration-specific entities (e.g., ErpOrder*, ApiPayment*)
     - [Action]*         → Workflow entities (e.g., Import*, Report*, Mail*)
     - *Mapping          → Data mapping/configuration entities
```

### Prefix Merging Rules

Some prefixes belong to the same logical module:

| Detected Prefixes | Merged Module | Reason |
|-------------------|---------------|--------|
| `[Domain]*`, `[Domain]Detail*` | [Domain] | Detail is sub-entity of main domain |
| `[Domain]*`, `[Domain]History*` | [Domain] | History is part of entity lifecycle |
| `[SystemA][Domain]*`, `[SystemB][Domain]*` | Integration | External system integration layer |
| `[Domain]*Line*`, `[Domain]*Header*` | [Domain] | Line/Header are domain sub-entities |

## Secondary Detection: DTO Directory Grouping

The `api/dto/` directory often has subdirectories per module. Each subdirectory is a module signal:

```text
api/dto/
├── [moduleA]/           → Module A
├── [moduleB]/           → Module B
├── [moduleC]Detail/     → Module C sub-feature
└── [integrationName]/   → External integration
```

## Tertiary Detection: Service Cluster Analysis

Services that share dependencies form a cluster. If ServiceA and ServiceB both inject the same 3+ repositories, they likely belong to the same module.

```text
For each service:
  Collect injected repositories
  Group services by shared repository overlap (>50% shared repos → same module)
```

## Module Boundary Validation

After detection, validate each module boundary:

### Must-Have (module is valid if ALL are true)

- At least 2 entities sharing the same prefix
- At least 1 service implementation
- At least 1 mapper interface

### Nice-to-Have (strengthens the module signal)

- A dedicated DTO subdirectory
- At least 1 controller
- At least 1 scheduled job
- A dedicated config class

### Merge Triggers (merge into parent module)

- Fewer than 2 entities → merge into parent
- No service layer → merge into parent (data-only)
- Entity is clearly a sub-entity of another module

## Special Module Categories

### Cross-Cutting Modules

These modules serve multiple business modules and should be detected separately:

| Category | Indicators | Treatment |
|----------|-----------|-----------|
| Auth/Security | Custom annotations, interceptors | Separate agent: `auth-agent` |
| Import Framework | `infra/importservice/` | Separate agent: `import-agent` |
| Report Parsing | `infra/report/` | Separate agent: `report-agent` |
| Scheduled Jobs | `job/` directory | Distributed to owning module |

### Integration Modules

Modules that primarily sync data with external systems:

| Integration | Key Indicator | Decision Rule |
|------------|---------------|--------------|
| ERP/External A | `[SystemA]*` prefix, `api/dto/[systemA]/` | If 4+ entities → separate agent |
| ERP/External B | `[SystemB]*` prefix | If 4+ entities → separate agent |
| API Partner | Feign client, config-driven | Merge into consuming module if < 4 entities |
| File Feed | File import handler | Merge into consuming module if < 4 entities |

Decision: If an integration has 4+ entities, generate a separate agent. If fewer, merge into the consuming module.

## Dependency Graph Construction

After identifying modules, build a dependency graph:

```text
For each module:
  Scan service impl imports
  For each import of another module's entity/service:
    Add edge: this_module → other_module
```

### Common Dependency Patterns

- **Module A → Module B**: Module A reads or references Module B's data
- **Module A → Integration**: Module A syncs data with external systems
- **Module A → Notification**: Module A triggers notifications
- **Cross-cutting → All**: Auth, config, or utility modules used by everyone

### Circular Dependency Handling

If Module A depends on Module B and Module B depends on Module A:
1. Check if the dependency is bidirectional or one-directional at the entity level
2. If truly bidirectional, merge into a single module
3. If only at the service level (not entity), keep separate but document the coupling

## Output Format

The module discovery phase produces a JSON-like structure for each module:

```json
{
  "moduleId": "[prefix-lowercase]",
  "moduleName": "[Human Readable Module Name]",
  "entities": ["[EntityA]", "[EntityB]"],
  "services": ["[EntityA]ServiceImpl", "[EntityB]ServiceImpl"],
  "repositories": ["[EntityA]Repository"],
  "mappers": ["[EntityA]Mapper"],
  "controllers": ["[EntityA]Controller"],
  "dtos": ["[EntityA]QueryDTO"],
  "jobs": ["[JobHandlerName]"],
  "dependencies": ["[other-module-id]"],
  "fileCount": 0,
  "complexity": "medium"
}
```
