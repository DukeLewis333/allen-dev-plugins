# Module Discovery Rules

> Reference file for h0-module-analyzer. Rules for detecting business module boundaries in H0 projects.

## Primary Detection: Entity Prefix Grouping

H0 projects follow a naming convention where entities in the same business module share a common prefix. This is the strongest signal for module boundaries.

### Prefix Extraction Algorithm

```
For each entity file in domain/entity/:
  1. Remove ".java" suffix
  2. Extract prefix: strip trailing PascalCase segments
  3. Common prefixes in H0 projects:
     - Ar*      → AR (Accounts Receivable)
     - Order*   → Order Management
     - Booking* → Booking Plans
     - Mail*    → Mail Integration
     - Xts*     → XTS Integration
     - D365*    → D365 Integration
     - E1*      → E1 Integration
     - Packing* → Packing Lists
     - Po*      → PO Mapping
     - *Mapping → Data Mapping
     - Gc*      → GC Module
```

### Prefix Merging Rules

Some prefixes belong to the same logical module:

| Detected Prefixes | Merged Module | Reason |
|-------------------|---------------|--------|
| `Ar*`, `ArBank*` | AR | Bank is part of AR domain |
| `ArRb*`, `ArUr*` | AR | RB/UR posting is AR sub-domain |
| `ArVendor*`, `ArVendorPk*`, `ArVendorVg*` | AR - Vendor | Vendor preview is AR sub-domain |
| `Order*`, `OrderHistory*` | Order | History is part of Order lifecycle |
| `D365Order*`, `E1Order*`, `Xts*` | Integration | External system integration layer |
| `BookingPlan*`, `LFMU*` | Booking | LFMU reports serve booking |
| `Mail*`, `MailReceive*`, `MailSend*`, `GcMail*` | Mail | All mail-related |
| `CustomerMapping*`, `ForwarderMapping*`, `StaffMapping*`, `SupplierMapping*` | Mapping | All code mapping services |
| `PackingList*`, `PackingMail*` | Packing | Packing list management |
| `PoMapping*` | PO Mapping | Purchase order mapping |

## Secondary Detection: DTO Directory Grouping

The `api/dto/` directory often has subdirectories per module. Each subdirectory is a module signal:

```
api/dto/
├── arPaymentDetail/    → AR - Payments
├── arTicket/           → AR - Tickets
├── bank/               → AR - Bank
├── e1/                 → E1 Integration
├── graph/              → Mail (Graph API)
├── vendorpreview/      → AR - Vendor
├── xts/                → XTS Integration
└── yqcloud/            → External Integration
```

## Tertiary Detection: Service Cluster Analysis

Services that share dependencies form a cluster. If ServiceA and ServiceB both inject the same 3+ repositories, they likely belong to the same module.

```
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
- Entity is clearly a sub-entity of another module (e.g., `ArVendorPreviewLineSource` is clearly AR)

## Special Module Categories

### Cross-Cutting Modules

These modules serve multiple business modules and should be detected separately:

| Category | Indicators | Treatment |
|----------|-----------|-----------|
| Auth/Security | Custom annotations, interceptors | Separate agent: `auth-agent` |
| Import Framework | `infra/importservice/` | Separate agent: `import-agent` |
| Report Parsing | `infra/report/` | Separate agent: `report-agent` |
| Payment Advice | `infra/paymentadvice/` | Part of AR or separate |
| Scheduled Jobs | `job/` directory | Distributed to owning module |

### Integration Modules

Modules that primarily sync data with external systems:

| Integration | Key Indicator | Entity Count |
|------------|---------------|--------------|
| E1 | `E1*` prefix, `api/dto/e1/` | 2-4 entities |
| D365 | `D365*` prefix | 1-2 entities |
| XTS | `Xts*` prefix, `api/dto/xts/` | 2 entities |
| Graph API | `GraphServiceClient`, `api/dto/graph/` | Config-driven |

Decision: If an integration has 4+ entities, generate a separate agent. If fewer, merge into the consuming module.

## Dependency Graph Construction

After identifying modules, build a dependency graph:

```
For each module:
  Scan service impl imports
  For each import of another module's entity/service:
    Add edge: this_module → other_module
```

### Dependency Patterns

- **AR → Order**: AR payment matching reads order data
- **AR → Mail**: AR ticket creation triggered by bank mails
- **AR → E1**: AR address book syncs with E1
- **Order → Integration**: Order imports from D365/E1/XTS
- **Booking → Order**: Booking references order data
- **Mail → AR**: Mail processing creates AR tickets

### Circular Dependency Handling

If Module A depends on Module B and Module B depends on Module A:
1. Check if the dependency is bidirectional or one-directional at the entity level
2. If truly bidirectional, merge into a single module
3. If only at the service level (not entity), keep separate but document the coupling

## Output Format

The module discovery phase produces a JSON-like structure for each module:

```json
{
  "moduleId": "ar",
  "moduleName": "AR (Accounts Receivable)",
  "entities": ["ArTicket", "ArPaymentDetail"],
  "services": ["ArTicketServiceImpl", "ArPaymentDetailServiceImpl"],
  "repositories": ["ArTicketRepository"],
  "mappers": ["ArTicketMapper"],
  "controllers": ["ArTicketController"],
  "dtos": ["ArTicketQueryDTO"],
  "jobs": ["MatchTicketsWithPaymentHandler"],
  "dependencies": ["order", "mail", "e1"],
  "fileCount": 145,
  "complexity": "high"
}
```
