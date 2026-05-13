---
name: hzero-claudemd-generator
description: >
  Generate or update CLAUDE.md project instruction files for H0 (hzero) platform
  microservices. Covers DDD four-layer architecture, MyBatis patterns, Spring Boot
  conventions, and HZERO platform specifics.
when_to_use: >
  Trigger when user asks to create, write, or update a CLAUDE.md file in any
  hzero-based Java microservice project, or when setting up Claude Code for a
  new H0 project. Also matches "generate claudemd", "init project instructions",
  or "bootstrap H0 project config".
arguments: [output_path]
argument-hint: [output-path]
allowed-tools: Read Glob Grep Bash(find *) Bash(cat *) Bash(ls *) Bash(wc *) Bash(head *)
---

# H0 Platform CLAUDE.md Generator

Generate comprehensive CLAUDE.md files for H0 (hzero) platform microservice projects.

## Current Project Context

```!
echo "=== POM (first 40 lines) ==="
head -40 pom.xml 2>/dev/null || echo "No pom.xml found"
echo ""
echo "=== Package structure (depth 3) ==="
find src/main/java -maxdepth 3 -type d 2>/dev/null | sort || echo "No src/main/java"
echo ""
echo "=== Java file count ==="
find src/main/java -name "*.java" 2>/dev/null | wc -l
echo ""
echo "=== Resources ==="
find src/main/resources -type f 2>/dev/null | sort || echo "No resources"
echo ""
echo "=== Bootstrap config ==="
cat src/main/resources/bootstrap.yml 2>/dev/null || cat src/main/resources/application.yml 2>/dev/null || echo "No bootstrap.yml"
```

## Workflow

### Step 1: Analyze the Project

From the project context above, extract these facts:

- **Artifact name** from pom.xml → derive service description
- **Parent version** → platform version (e.g., hzero-apaas-parent 2.10.0)
- **Port** from bootstrap.yml
- **Package name** from directory structure
- **Module list** from controller/entity/service names
- **Job handlers** from job/ directory (if exists)
- **Integration points** from feign/, config/, himp/ directories

If the context above is empty or incomplete, run additional scans manually:

```bash
ls src/main/java/.../api/controller/v1/          # Controllers
ls src/main/java/.../domain/entity/               # Entities
ls src/main/java/.../app/service/                 # Services
ls src/main/java/.../job/ 2>/dev/null             # Scheduled jobs
```

### Step 2: Generate CLAUDE.md

Write the CLAUDE.md file to the path specified by `$ARGUMENTS`, or to the project root if no path given.

Use the template below, filling in `[placeholders]` with discovered facts. Target 150-200 lines.

#### Required Sections

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

#### H0 Platform Constants (always include)

These apply to ALL H0 projects — always embed them in Coding Conventions:

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
- **LSP**: When jdtls (Java LSP) is available, use it as the primary tool for go-to-definition, find-references, hover, rename, and code navigation. Prefer LSP operations over Grep/Glob for Java symbol lookups

For detailed code templates (Entity, Controller, Service, Repository, MyBatis XML), see [references/hzero-platform-reference.md](${CLAUDE_SKILL_DIR}/references/hzero-platform-reference.md).

### Step 3: Split if Needed

If CLAUDE.md exceeds 200 lines, extract content into `.claude/docs/` sub-files.

**Main CLAUDE.md**: Keep under 200 lines. Must contain Overview, Behavioral Guidelines, Package Structure, Business Modules table, Coding Conventions (core), and `@import` references.

**docs/ files**: Each focuses on one domain. Use `@.claude/docs/filename.md` import syntax in main file.

| Has this... | Extract to... |
| ----------- | ------------- |
| Scheduled jobs (job/ dir) | `docs/job-handler-patterns.md` |
| Mail/API integration (feign/, config/) | `docs/integration-patterns.md` |
| Complex MyBatis XML (batch ops, CASE updates) | `docs/data-layer-patterns.md` |
| Import framework (importservice/) | `docs/import-framework.md` |
| Report parsing (report/) | `docs/report-patterns.md` |
| Auth/custom annotations (auth/) | `docs/auth-patterns.md` |

Add a `## Additional References` section at the end of CLAUDE.md:

```markdown
## Additional References

- Job handler patterns: @.claude/docs/job-handler-patterns.md
- Mail & integration: @.claude/docs/integration-patterns.md
- Data layer & processing: @.claude/docs/data-layer-patterns.md
```

### Step 4: Validate

- Count lines: main CLAUDE.md must be 150-200
- Verify all `@import` paths reference existing files
- Check no critical section is missing
- Ensure module table matches actual controller/entity names
