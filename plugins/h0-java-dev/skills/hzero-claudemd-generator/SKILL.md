---
name: hzero-claudemd-generator
description: Generate or update CLAUDE.md project instruction files for H0 (hzero) platform microservices. Use when the user asks to create, write, or update a CLAUDE.md file in any hzero-based Java microservice project, or when setting up Claude Code for a new H0 project. Covers DDD four-layer architecture, MyBatis patterns, Spring Boot conventions, and HZERO platform specifics.
---

# H0 Platform CLAUDE.md Generator

Generate comprehensive CLAUDE.md files for H0 (hzero) platform microservice projects.

## Workflow

1. **Analyze project** — Scan the project to gather facts
2. **Generate CLAUDE.md** — Write the main file (150-200 lines)
3. **Split if needed** — Create `docs/` sub-files with `@import` syntax when content exceeds 200 lines
4. **Validate** — Review line counts and cross-references

## Step 1: Analyze the Project

Run these scans (in parallel where possible):

```bash
# Project coordinates
Read pom.xml (first 40 lines for GAV, parent, key dependencies)

# Package structure
find src/main/java -maxdepth 3 -type d | sort

# Scale metrics
find src/main/java -name "*.java" | wc -l       # Java file count
ls src/main/java/.../api/controller/v1/          # Controllers
ls src/main/java/.../domain/entity/              # Entities
ls src/main/java/.../app/service/                # Services
ls src/main/java/.../job/                        # Scheduled jobs (if exists)

# Resources
find src/main/resources -type f | sort           # All resources
cat src/main/resources/bootstrap.yml              # Service name, port, config
```

From the scans, extract:

- **Artifact name** from pom.xml → derive service description
- **Parent version** → platform version (e.g., hzero-apaas-parent 2.10.0)
- **Port** from bootstrap.yml
- **Package name** from directory structure
- **Module list** from controller/entity/service names
- **Job handlers** from job/ directory (if exists)
- **Integration points** from feign/, config/, himp/ directories

## Step 2: Generate CLAUDE.md

Use the template below, filling in `[placeholders]` with discovered facts. Target 150-200 lines.

### Required Sections

```markdown
# CLAUDE.md — [service-name]

## Project Overview
[1-2 sentences + tech stack bullet list + scale metrics]

## Behavioral Guidelines
[Think Before Coding, Simplicity First, Surgical Changes, Goal-Driven, Code Navigation]

## Package Structure
[ASCII tree with line comments]

## Key Business Modules
[Table: Module | Prefix | Description]

## Coding Conventions
[DDD Layer Rules, Naming, Entity Style, Controller Pattern, Service Patterns, DI, Exceptions]

## New Module Checklist
[8 files to create for a new CRUD entity]
```

### H0 Platform Constants (always include)

These apply to ALL H0 projects:

- **Architecture**: DDD four-layer (api/app/domain/infra)
- **Entity base class**: `AuditDomain` with `@VersionAudit` + `@ModifyAudit`
- **Lombok**: `@Getter` `@Setter` only, never `@Data`
- **Controller**: extends `BaseController`, returns `Results.success()`
- **Pagination**: `PageHelper.doPageAndSort(pageRequest, () -> repo.selectList(condition))`
- **Save pattern**: split by `id == null` → `batchInsertSelective` / `batchUpdateByPrimaryKeySelective`
- **Permission**: `@Permission(level = ResourceLevel.ORGANIZATION)` on all endpoints
- **Token**: `SecurityTokenHelper.validTokenIgnoreInsert()` for save, `validToken()` for delete
- **Tenant**: `item.setTenantId(organizationId)` in Controller save method
- **DI**: `@Autowired` for Service/Repository, `@Resource` for Mapper, `@Component` for RepositoryImpl
- **Exceptions**: `CommonException` with i18n code, no try-catch in Controllers
- **Tables**: `[prefix]_xxx` (snake_case with service prefix)
- **API paths**: `/v1/{organizationId}/xxx-xxx` (kebab-case)
- **Field constants**: `FIELD_XXX` in entities
- **MyBatis**: `mapUnderscoreToCamelCase: true`, dynamic `<if>` queries

See [references/hzero-platform-reference.md](references/hzero-platform-reference.md) for detailed patterns.

## Step 3: Split if Needed

If CLAUDE.md exceeds 200 lines, extract content into `.claude/docs/` sub-files:

### Split Rules

- **Main CLAUDE.md**: Keep under 200 lines. Must contain Overview, Behavioral Guidelines, Package Structure, Business Modules table, Coding Conventions (core), and @import references.
- **docs/** files: Each focuses on one domain. Use `@.claude/docs/filename.md` syntax in main file.

### Recommended Split Topics

When the project has these features, extract them:

| Has this... | Extract to... |
| ----------- | ------------- |
| Scheduled jobs (job/ dir) | `docs/job-handler-patterns.md` |
| Mail/API integration (feign/, config/) | `docs/integration-patterns.md` |
| Complex MyBatis XML (batch ops, CASE updates) | `docs/data-layer-patterns.md` |
| Import framework (importservice/) | `docs/import-framework.md` |
| Report parsing (report/) | `docs/report-patterns.md` |
| Auth/custom annotations (auth/) | `docs/auth-patterns.md` |

### Import Syntax

Add a `## Additional References` section at the end of CLAUDE.md:

```markdown
## Additional References

- Job handler patterns: @.claude/docs/job-handler-patterns.md
- Mail & integration: @.claude/docs/integration-patterns.md
- Data layer & processing: @.claude/docs/data-layer-patterns.md
```

## Step 4: Validate

- Count lines: main CLAUDE.md must be 150-200
- Verify all @import paths reference existing files
- Check no critical section is missing
- Ensure module table matches actual controller/entity names
