---
name: h0-code-flow-analyzer
description: >
  Analyze H0 (hzero) platform Java microservice code to trace execution flows, map call chains,
  and explain complex code paths. Generates a detailed, self-contained HTML report with flow diagrams,
  step-by-step walkthroughs, code snippets, and data transformation descriptions. Use this skill when
  the user asks to "analyze code flow", "trace execution path", "understand how X works", "梳理流程",
  "分析代码执行路径", "代码调用链分析", "explain the flow of", "walk me through the code",
  "how does this feature work end to end", or wants to visualize/document any code execution path
  in an H0/Hzero-based microservice. Also trigger on "generate flow diagram", "code path analysis",
  "call chain visualization", or when the user opens a complex service and wants to understand it.
arguments: [entry_point]
argument-hint: "[Controller method, Service method, URL path, or class name to start tracing from]"
allowed-tools: Read Glob Grep Bash(find *) Bash(cat *) Bash(head *) Bash(wc *) Bash(ls *) LSP(goToDefinition) LSP(findReferences) LSP(hover) LSP(prepareCallHierarchy) LSP(incomingCalls) LSP(outgoingCalls)
---

# H0 Code Flow Analyzer

Trace and document code execution paths in H0 platform microservices, producing an HTML report that makes complex flows easy to understand.

## Why This Skill Exists

H0 microservice projects follow DDD four-layer architecture (Controller → Service → Repository → Mapper), but real business flows often branch across multiple services, external integrations, conditional logic, and batch operations. Understanding "what happens when this API is called" requires reading dozens of files. This skill traces the complete path and produces a visual, self-contained HTML document that anyone can read.

## Workflow

1. **Resolve entry point** — From the user's argument, identify the starting method/class
2. **Trace the call chain** — Follow method calls through all DDD layers and across services
3. **Analyze branching and conditions** — Map decision points, loops, error handling
4. **Document data flow** — Track what data enters, how it transforms, what exits
5. **Generate HTML report** — Produce a self-contained HTML file with diagrams and walkthrough

---

## Step 1: Resolve Entry Point

The user provides an entry point via `$ARGUMENTS`. Interpret it as follows:

| Input Format | Resolution Strategy |
|-------------|-------------------|
| URL path like `/v1/{organizationId}/orders` | Grep for `@RequestMapping` or `@GetMapping`/`@PostMapping` matching this path |
| Method name like `saveData` | Grep for method definition in Service/Controller files |
| Class name like `OrderController` | Glob for the file, start from class-level analysis |
| Chinese description like "订单保存流程" | Infer from domain keywords (see mapping below), then resolve as above |

If no argument is given, ask the user to specify an entry point.

**Domain keyword hints** for H0 projects:

```bash
# Find all controllers to help user pick an entry point
grep -rn "@RequestMapping\|@GetMapping\|@PostMapping\|@PutMapping\|@DeleteMapping" src/main/java --include="*.java" | head -50
```

### Using LSP (preferred when jdtls is available)

When jdtls is running, prefer LSP tools for symbol resolution:

1. `LSP(goToDefinition)` — Jump from a call site to the implementation
2. `LSP(findReferences)` — Find all callers of a method
3. `LSP(incomingCalls)` — Build the call hierarchy bottom-up
4. `LSP(outgoingCalls)` — Trace what a method calls
5. `LSP(hover)` — Get type info and Javadoc

If jdtls is not available, fall back to Grep/Glob for all symbol lookups.

---

## Step 2: Trace the Call Chain

Starting from the entry point, systematically follow every method call.

### Tracing Rules

1. **Follow into** — Every method call on injected dependencies (`@Autowired`, `@Resource`)
2. **Follow into** — Every static method call that performs meaningful logic (not `Collections.xxx`, `String.xxx`)
3. **Follow into** — `orderRepository.xxx()` calls → go to the RepositoryImpl, then to Mapper
4. **Follow into** — `xxxClient.xxx()` Feign calls → find the Feign interface, note it as an external call boundary
5. **Skip** — Getters, setters, simple constructors, `Results.success()`, logger calls
6. **Note** — `PageHelper.doPageAndSort()` as a pagination wrapper (don't trace into it)

### What to Capture at Each Node

For each method in the chain, record:

| Field | Description |
|-------|-------------|
| **Class** | Fully qualified class name |
| **Layer** | DDD layer (Controller / Service / Repository / Mapper / Feign) |
| **Method** | Method signature |
| **Purpose** | One sentence: what this method does |
| **Calls** | List of downstream methods it invokes |
| **Conditions** | Branching logic (if/switch that changes the flow) |
| **Data In** | Key parameters and their types |
| **Data Out** | Return value and side effects (DB writes, external calls) |
| **Error Handling** | Exceptions thrown, catch blocks, fallback logic |

### Depth Control

- **Maximum depth**: 8 levels from entry point
- **Maximum breadth**: 15 sibling calls per level
- If a branch exceeds these limits, summarize it with "[complex sub-flow — see class X]"
- Always complete the happy path fully before exploring error branches

---

## Step 3: Analyze Branching and Conditions

For each branching point, document:

```
Condition: order.getStatus() == OrderStatus.PENDING
├── TRUE:  → proceedToConfirmation()
└── FALSE: → rejectWithReason()
```

Identify these patterns:

| Pattern | What to Look For |
|---------|-----------------|
| Status check | `getStatus()`, `order.getStatus() == X` |
| Null guard | `if (xxx != null)`, `Optional.ofNullable()` |
| Collection loop | `for`, `stream().forEach()`, `stream().map()` |
| Exception flow | `throw new CommonException(...)`, try-catch blocks |
| Batch split | `stream().filter(id == null)` separating insert vs update |
| External check | Feign call results that determine branching |
| Permission check | `@Permission`, `SecurityTokenHelper.validToken()` |

---

## Step 4: Document Data Flow

Track the primary data object through the flow:

1. **Input shape** — What the API receives (request body, path variables)
2. **Validation** — `validObject()`, `@NotNull` checks
3. **Transformation** — DTO → Entity conversion, field enrichment
4. **Persistence** — What gets written to which tables
5. **Output shape** — What the API returns

For each transformation, note:

```
OrderDTO (input)
  → Order entity (field mapping: dto.name → entity.orderName)
    → bpm_order table (column: order_name)
```

---

## Step 5: Generate HTML Report

Write the report to `code-flow-report.html` in the project root (or a path specified by the user).

### Report Structure

The HTML file must be **completely self-contained** — no external CSS/JS dependencies. Use inline styles and embedded JavaScript.

Required sections:

1. **Header** — Title with entry point name, generation date, project name
2. **Overview** — One-paragraph summary of the entire flow
3. **Flow Diagram** — Visual diagram rendered with CSS (see HTML template)
4. **Step-by-Step Walkthrough** — Each node in the chain as a card with code snippets
5. **Branching Logic** — Decision trees with conditions and outcomes
6. **Data Flow** — Input → transformation → output visualization
7. **Error Paths** — Exception handling and fallback flows
8. **External Dependencies** — Feign calls, external systems touched
9. **File Index** — Table of all files referenced with their DDD layer

### HTML Template

Read [references/html-template.md](references/html-template.md) for the complete HTML template. It provides:

- A CSS-based flow diagram renderer (no external dependencies)
- Styled cards for each step in the walkthrough
- Collapsible code blocks with syntax coloring via `<pre><code>`
- Decision tree visualization for branching logic
- A responsive layout that works in any browser

### Writing Guidelines

- Use **Chinese** for all descriptive text (section headers, explanations, step descriptions)
- Keep **code snippets** in their original language (Java)
- Add **line numbers** to code snippets referencing the source file
- Use **color coding** for DDD layers:
  - Controller → `#4A90D9` (blue)
  - Service → `#7B68EE` (purple)
  - Repository → `#2E8B57` (green)
  - Mapper → `#DAA520` (gold)
  - Feign/External → `#DC143C` (red)
- Each step card should answer: **What happens here? Why? What data changes?**

---

## Edge Cases

### Recursive or Circular Calls

If the trace encounters a method already visited in the current path, mark it as:

```
[Recursive call → see step N]
```

Do not re-trace. Note the recursion in the report.

### Multiple Entry Points

If the user asks for a broad analysis ("how does the order module work"), trace the main CRUD flows separately:

1. List (GET)
2. Detail (GET /{id})
3. Create/Update (POST)
4. Delete (DELETE)
5. Any custom business operations

Each flow gets its own section in the HTML report.

### Very Long Flows

If a single flow exceeds 15 steps, split the HTML report into:

1. **Summary diagram** — High-level flow with collapsed sub-flows
2. **Detail sections** — One section per sub-flow, linked from the summary

---

## Quality Checklist

Before delivering the HTML report, verify:

- [ ] Every method call in the chain is accounted for
- [ ] Code snippets include the surrounding context (not just one line)
- [ ] Branching conditions are shown with their outcomes
- [ ] Data transformations are documented at each boundary
- [ ] Error handling paths are included, not just the happy path
- [ ] All file paths reference real, existing files
- [ ] The HTML file opens correctly in a browser with no external dependencies
- [ ] Descriptions are in Chinese, code stays in original language
- [ ] Color coding is consistent across all diagrams and cards
