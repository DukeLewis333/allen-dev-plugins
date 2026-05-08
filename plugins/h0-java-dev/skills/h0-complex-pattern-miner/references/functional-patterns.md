# Functional (Technical) Complexity Patterns in H0 Projects

> Reference file for h0-complex-pattern-miner. Describes each technical pattern with real examples from H0 microservice projects.

## Table of Contents

1. [Template Method Pipeline](#1-template-method-pipeline)
2. [Strategy Pattern with Scoring Engine](#2-strategy-pattern-with-scoring-engine)
3. [Pluggable Import Framework](#3-pluggable-import-framework)
4. [Custom Security Interceptor](#4-custom-security-interceptor)
5. [ThreadLocal Batch Context Management](#5-threadlocal-batch-context-management)
6. [Self-Injection for Transaction Proxy](#6-self-injection-for-transaction-proxy)
7. [Report Parsing Pipeline](#7-report-parsing-pipeline)
8. [External System Integration Adapter](#8-external-system-integration-adapter)

---

## 1. Template Method Pipeline

**Complexity Score**: 3-4 | **Found In**: Order processing, mail parsing, report generation

### Pattern Structure

```
AbstractProcessor (abstract class)
├── final process()           # Template method - fixed algorithm
├── beforeProcess()           # Hook - default no-op
├── abstract mapData()        # Required step - subclass implements
├── abstract matchData()      # Required step - subclass implements
├── abstract saveData()       # Required step - subclass implements
└── afterProcess()            # Hook - default no-op

ConcreteProcessorA extends AbstractProcessor
ConcreteProcessorB extends AbstractProcessor
```

### When to Extract as Skill

- When 3+ concrete implementations exist sharing the same pipeline structure
- When the pipeline has customizable hooks (before/after processing)
- When transaction management wraps the entire pipeline

### Real Example: AbstractOrderDataProcessor

```
processOrder():
  1. beforeConvertValue()     → hook for field preprocessing
  2. mappingDataProcess()     → LinkedHashMap-based field mapping
  3. matchData()              → delegate to RuleMatchDispatcher
  4. saveData()               → abstract, subclass provides persistence

finishOrder():
  1. mappingDataProcess()     → same mapping
  2. saveFinishOrderData()    → abstract, for completed order flow
```

Key innovation: Separate "process" and "finish" flows sharing mapping logic but diverging on match/save.

### Extraction Checklist

- [ ] Identify the fixed algorithm steps (template method body)
- [ ] Identify hook methods (optional overrides)
- [ ] Identify abstract methods (required overrides)
- [ ] Document transaction boundaries
- [ ] List all concrete implementations and their customization points

---

## 2. Strategy Pattern with Scoring Engine

**Complexity Score**: 4-5 | **Found In**: Rule matching, payment matching, vendor matching

### Pattern Structure

```
RuleMatchDispatcher (registry + executor)
├── Map<String, List<AbstractRuleMatch>> strategyMap
├── init()                     # Auto-discovers strategies via Spring DI
└── executeBySystem(system)    # Executes all strategies for a system

AbstractRuleMatch (abstract scoring base)
├── final doRuleMatch()        # Template: group → match → score → compare
├── abstract doMatch()         # Subclass provides matching fields
├── buildOthersExclusionMap()  # Wildcard "others" exclusion logic
├── buildRuleKey()             # Composite key from multiple fields
└── compareScoredRule()        # Tie-breaking by match count

ConcreteRuleMatchA extends AbstractRuleMatch
ConcreteRuleMatchB extends AbstractRuleMatch
```

### Scoring Algorithm

```
For each rule set:
  exact field match  → +2 points
  wildcard "others"  → +1 point
  no match           → 0 points

Tie-breaking:
  1. Higher total score wins
  2. If tied, more exact matches (fewer wildcards) wins
  3. If still tied, first match wins (deterministic ordering)
```

### When to Extract as Skill

- When matching involves scoring, not just equality
- When wildcard semantics (catch-all "others" rules) are needed
- When multiple strategies execute for the same input

### Extraction Checklist

- [ ] Document the scoring algorithm with point values
- [ ] Document wildcard semantics and exclusion logic
- [ ] List all strategy implementations and their matching criteria
- [ ] Show how the dispatcher discovers and registers strategies

---

## 3. Pluggable Import Framework

**Complexity Score**: 3-4 | **Found In**: Order import, report parsing, data migration

### Pattern Structure

```
CommonProcessDataService (framework)
├── processExcelData()         # Main entry
│   ├── Read Excel headers
│   ├── columnMerge()          # Multi-header row merging
│   ├── Iterate data rows
│   ├── BatchImportHandler.convertValue()    # Delegate to specific handler
│   └── Track progress via DataSizeContextHolder
└── clearContext()             # Cleanup

BatchImportHandler (interface)
├── convertValue()             # Row → Entity mapping
├── getTemplateCode()          # Which import template
└── getDataSource()            # Which source system

DataSizeContextHolder (ThreadLocal)
├── Total rows, processed rows, error rows
└── Thread-safe counters
```

### When to Extract as Skill

- When importing from multiple source systems with different Excel formats
- When header rows vary (D365 has 3 header rows, others have 1)
- When batch processing needs progress tracking across threads

### Extraction Checklist

- [ ] Document header row handling (merge logic, dynamic columns)
- [ ] Document the BatchImportHandler interface contract
- [ ] Show ThreadLocal context setup and cleanup
- [ ] List all concrete import handlers

---

## 4. Custom Security Interceptor

**Complexity Score**: 4 | **Found In**: External API access, partner integrations

### Pattern Structure

```
@ExternalAccess annotation
├── scene  (String)           # Which business scene
└── action (String)           # What action (READ, WRITE, etc.)

ExternalAccessInterceptor implements HandlerInterceptor
├── preHandle()               # Authentication + authorization
│   ├── extractToken()        # From header or query param
│   ├── validateGrant()       # Token → Grant → Organization
│   ├── checkScene()          # Scene matches annotation
│   ├── checkAction()         # Action permitted
│   └── buildContext()        # Set ThreadLocal context
├── afterCompletion()         # Cleanup ThreadLocal
└── updateAccessInfo()        # Audit trail

CurrentExternalAccess (ThreadLocal context)
├── grantId, organizationId
├── scene, action
└── accessToken
```

### When to Extract as Skill

- When exposing APIs to external partners with fine-grained access control
- When token-based auth needs scene/action granularity beyond role-based access
- When audit trails are required for external access

### Extraction Checklist

- [ ] Document annotation parameters and semantics
- [ ] Document the validation chain (token → grant → scene → action)
- [ ] Show how to register new scenes and actions
- [ ] Document ThreadLocal context lifecycle

---

## 5. ThreadLocal Batch Context Management

**Complexity Score**: 3 | **Found In**: Import processing, batch jobs, order processing

### Pattern Structure

```
XxxContextHolder (one per context type)
├── private static final ThreadLocal<XxxContext> CONTEXT
├── getContext()               # Get or create
├── setContext(context)        # Set
├── clear()                    # Remove (critical for thread pool reuse)
└── getXxx() / setXxx()        # Convenience accessors

Common context types:
- DataSizeContextHolder  → row counts, batch progress
- ErrMsgContext          → accumulated error messages
- MatchResultContext     → matching outcomes
```

### When to Extract as Skill

- When batch processing spans multiple methods and needs shared state
- When thread pools are used and context must be isolated per task
- When error messages accumulate across processing steps

### Key Danger: Memory Leaks

Every `setContext()` MUST have a corresponding `clear()` in a finally block. Document this explicitly.

### Extraction Checklist

- [ ] List all context holders and their fields
- [ ] Document the lifecycle (create → use → clear)
- [ ] Show the finally-block cleanup pattern
- [ ] Identify thread pool configurations that affect context isolation

---

## 6. Self-Injection for Transaction Proxy

**Complexity Score**: 3 | **Found In**: Services with internal @Transactional calls

### Pattern Structure

```java
@Service
public class FooServiceImpl implements FooService {

    @Autowired
    private FooService self;  // Self-injection for proxy access

    public void publicMethod() {
        // Non-transactional work
        self.transactionalMethod();  // Goes through Spring proxy
    }

    @Transactional(rollbackFor = Exception.class)
    public void transactionalMethod() {
        // Transactional work
    }
}
```

### When to Extract as Skill

- When a service has mixed transactional/non-transactional requirements
- When internal method calls need @Transactional to take effect
- When transaction propagation is complex (REQUIRES_NEW, NESTED)

### Extraction Checklist

- [ ] Document why self-injection is needed (Spring proxy limitation)
- [ ] List all self-call sites
- [ ] Document transaction propagation settings
- [ ] Identify potential pitfalls (circular dependency, proxy breakage)

---

## 7. Report Parsing Pipeline

**Complexity Score**: 4 | **Found In**: Shipping reports, financial reports, custom document parsing

### Pattern Structure

```
ReportParser (interface)
├── supports(format)           # Can this parser handle the format?
└── parse(input)               # Parse and return structured data

AbstractReportParser (base)
├── final parse()              # Template: validate → extract → transform
├── abstract validateInput()   # Format-specific validation
├── abstract extractData()     # Core extraction logic
├── abstract transformData()   # Normalize to domain model
└── handleSharedValues()       # Shared value allocation across rows

ConcreteParserA (Ocean1)
ConcreteParserB (Ocean2)
ConcreteParserC (Air)
ConcreteParserD (GC)
```

### When to Extract as Skill

- When multiple report formats need parsing with shared transformation logic
- When shared values (e.g., total charges) need allocation across line items
- When region merging is needed (Excel merged cells → flat rows)

### Extraction Checklist

- [ ] Document all supported formats and their quirks
- [ ] Show the shared value allocation algorithm
- [ ] Document region merging logic
- [ ] List parser implementations and their format-specific logic

---

## 8. External System Integration Adapter

**Complexity Score**: 3-4 | **Found In**: E1, D365, XTS, Microsoft Graph API, YQ Cloud

### Pattern Structure

```
Feign Client (declarative API)
├── @FeignClient(name = "xxx", url = "${xxx.url}")
├── Interface methods matching external API
└── Fallback factory for resilience

Configuration
├── OAuth2 credentials + token management
├── Request/response interceptors
├── Retry and timeout policies
└── Circuit breaker configuration

Adapter Service
├── translateToExternalFormat()   # Domain → External
├── callExternalSystem()          # Feign call
├── translateFromExternalFormat() # External → Domain
└── handleError()                 # External error → CommonException
```

### When to Extract as Skill

- When integrating with external systems via REST/SOAP APIs
- When OAuth2 authentication is needed
- When request/response translation is non-trivial

### Extraction Checklist

- [ ] Document the external API contract
- [ ] Show authentication flow (OAuth2, API keys, etc.)
- [ ] Document data transformation logic (domain ↔ external format)
- [ ] Show error handling and retry strategy
