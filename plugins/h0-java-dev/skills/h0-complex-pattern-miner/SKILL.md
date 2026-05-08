---
name: h0-complex-pattern-miner
description: >
  Analyze H0 (hzero) platform Java microservice projects to identify complex, innovative functional
  requirements (technically sophisticated implementations) and business requirements (intricate business
  logic patterns). Extracts these implementations as reusable skill or agent definitions that can be
  applied to other H0 platform projects. Use this skill when the user asks to "find complex patterns",
  "identify reusable implementations", "extract skills from project", "mine patterns", "analyze project
  complexity", "create agents from codebase", or wants to document sophisticated implementations in any
  H0/Hzero-based microservice for cross-project reuse. Also trigger when the user mentions "complex
  business logic", "innovative patterns", "reusable components", or "pattern extraction" in the context
  of H0 platform development.
---

# H0 Complex Pattern Miner

Analyze an H0 platform microservice project, identify complex and innovative implementations, and produce reusable skill/agent definitions.

## Why This Skill Exists

H0 microservice projects accumulate sophisticated implementations over time — template method pipelines, scoring engines, custom security interceptors, external system integrations. These patterns are valuable across projects but often remain buried in code. This skill surfaces them, documents them, and packages them so other H0 projects can adopt them without reinventing the wheel.

## Workflow

1. **Scan project structure** — Identify key directories and file counts
2. **Classify complexity** — Find implementations that are functionally complex (technical) or business complex (domain logic)
3. **Deep-read candidates** — Read the most complex files in detail
4. **Generate skill/agent definitions** — Produce SKILL.md or agent definition files for each identified pattern
5. **Output results** — Write definitions to the specified output directory

---

## Step 1: Scan Project Structure

Run these scans in parallel:

```bash
# Count files per package
find src/main/java -type f -name "*.java" | sed 's|.*/java/||' | cut -d'/' -f1-5 | sort | uniq -c | sort -rn | head -30

# Find abstract/template classes
grep -rl "abstract class\|Abstract.*Template\|Abstract.*Processor\|Abstract.*Handler" src/main/java/ --include="*.java"

# Find strategy/implementations
grep -rl "implements.*Strategy\|implements.*Handler\|extends Abstract" src/main/java/ --include="*.java"

# Find ThreadLocal contexts
grep -rl "ThreadLocal\|ContextHolder" src/main/java/ --include="*.java"

# Find complex services (>300 lines)
find src/main/java -path "*/service/impl/*" -name "*.java" -exec wc -l {} + | sort -rn | head -20

# Find interceptors and custom annotations
grep -rl "@interface\|HandlerInterceptor\|MethodInterceptor" src/main/java/ --include="*.java"

# Find external integrations
grep -rl "FeignClient\|RestTemplate\|GraphServiceClient\|WebClient" src/main/java/ --include="*.java"
```

Also check for existing CLAUDE.md or project documentation that describes the project structure.

## Step 2: Classify Complexity

Evaluate each candidate against two axes:

### Functional Complexity Indicators (Technical)

| Indicator | What to Look For |
|-----------|-----------------|
| Template Method | Abstract class with `final` algorithm method + abstract hooks |
| Strategy with Registry | Map of strategy beans, auto-discovered via Spring DI |
| Scoring Engine | Numeric scoring with tie-breaking, wildcard handling |
| Pipeline/Chain | Sequential processing stages with context passing |
| Custom Interceptor | Spring interceptor with annotations for fine-grained control |
| Import/Parse Framework | Pluggable parsers with format detection and validation chains |
| ThreadLocal Context | Context objects for cross-method state in batch processing |
| Self-Injection | `@Autowired XxxService self` for `@Transactional` proxy calls |

### Business Complexity Indicators (Domain Logic)

| Indicator | What to Look For |
|-----------|-----------------|
| Multi-criteria Matching | Payment matching with amount tolerance, date windows, fuzzy name |
| State Machine | Status transitions with validation rules |
| Consolidation Logic | Aggregation with zero-effect detection, cancellation handling |
| External Sync | Multi-system data reconciliation (E1, D365, XTS) |
| Financial Posting | GL posting with debit/credit, exchange rates, tax handling |
| Mail Workflow | Automated classification, parsing, and downstream triggering |

**Threshold**: Only document patterns that score 3+ on either axis, or are genuinely innovative (not standard CRUD).

## Step 3: Deep-Read Candidates

For each candidate identified in Step 2:

1. Read the primary file completely
2. Read all subclasses/implementations
3. Read the interface or abstract base
4. Read related DTOs, contexts, and configuration

Focus on extracting:
- **Core algorithm**: What is the step-by-step logic?
- **Extension points**: Where can subclasses customize behavior?
- **Dependencies**: What services/external systems are required?
- **Design patterns**: Which patterns are combined?
- **Reusability signals**: Is this specific to one domain, or generalizable?

## Step 4: Generate Skill/Agent Definitions

For each pattern that passes the threshold, generate ONE of:

### Option A: Skill Definition (for knowledge/pattern documentation)

When the implementation is primarily a reusable pattern that Claude should understand and apply:

```markdown
---
name: [pattern-name]
description: [When to use this pattern and what it solves]
---

# [Pattern Name]

## Problem
[What business/technical problem does this solve]

## Solution Architecture
[High-level architecture diagram or description]

## Implementation Steps
1. [Step with code reference]
2. ...

## Key Classes
| Class | Role |
|-------|------|
| ... | ... |

## Code Examples
[Extracted from the project with annotations]
```

### Option B: Agent Definition (for automatable workflows)

When the implementation can be automated as a multi-step agent process:

```markdown
---
name: [agent-name]
description: [When to use this agent and what it automates]
---

# [Agent Name]

## Purpose
[What this agent does]

## Input
- [Required inputs]

## Steps
1. [Detailed step]
2. ...

## Output
- [Expected deliverables]

## Validation
- [How to verify correctness]
```

**Decision heuristic**: Use Skill for design patterns and reference knowledge. Use Agent for repeatable workflows with clear inputs/outputs.

## Step 5: Output Results

1. Create a summary file `pattern-catalog.md` listing all identified patterns with one-line descriptions
2. Write each skill/agent definition as a separate file in the output directory
3. For patterns too large for a single file, create a `references/` subdirectory

Output structure:
```
[output-dir]/
├── pattern-catalog.md           # Summary index
├── skills/
│   ├── template-method-pipeline.md
│   ├── scoring-rule-engine.md
│   └── ...
└── agents/
    ├── order-import-agent.md
    ├── payment-matching-agent.md
    └── ...
```

---

## Complexity Scoring Guide

Score each implementation on a 1-5 scale for both axes:

### Functional (Technical) Score
- **1**: Standard CRUD, simple queries
- **2**: Basic joins, simple validation
- **3**: Multi-step processing, pattern usage (Template Method, Strategy)
- **4**: Complex algorithms (scoring, matching), custom frameworks
- **5**: Novel combination of patterns, framework-level abstractions

### Business (Domain) Score
- **1**: Single-entity operations
- **2**: Multi-entity with simple relationships
- **3**: Multi-system integration, state management
- **4**: Financial calculations, complex matching rules
- **5**: Cross-domain orchestration, regulatory compliance logic

**Document threshold**: Score >= 3 on either axis.

## Pattern Categories Reference

For detailed examples of each pattern type found in H0 projects, read:

- [references/functional-patterns.md](references/functional-patterns.md) — Technical complexity patterns
- [references/business-patterns.md](references/business-patterns.md) — Business logic patterns
- [references/output-templates.md](references/output-templates.md) — Templates for skill/agent output files
