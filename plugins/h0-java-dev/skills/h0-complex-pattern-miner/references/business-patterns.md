# Business (Domain) Complexity Patterns in H0 Projects

> Reference file for h0-complex-pattern-miner. Describes complex business logic patterns commonly found in H0 microservice projects.

## Table of Contents

1. [Multi-Criteria Entity Matching](#1-multi-criteria-entity-matching)
2. [Automated Document Processing Pipeline](#2-automated-document-processing-pipeline)
3. [Financial Posting to General Ledger](#3-financial-posting-to-general-ledger)
4. [Data Aggregation and Consolidation](#4-data-aggregation-and-consolidation)
5. [Cross-System Data Reconciliation](#5-cross-system-data-reconciliation)
6. [Automated Classification and Routing Workflow](#6-automated-classification-and-routing-workflow)
7. [Batch Import with Multi-Source Formats](#7-batch-import-with-multi-source-formats)
8. [File Parsing with Format Variations](#8-file-parsing-with-format-variations)

---

## 1. Multi-Criteria Entity Matching

**Business Complexity**: 5 | **Files**: 3-5 services + supporting entities

### Business Problem

Match incoming records (payments, orders, etc.) against outstanding items. A single incoming record may cover multiple targets, and a single target may be partially matched. Matching must handle amount tolerance, date windows, and fuzzy field matching.

### Matching Dimensions

| Dimension | Logic | Tolerance |
|-----------|-------|-----------|
| Amount | Exact or within tolerance range | Configurable % |
| Date | Within configurable date window | ±N days |
| Reference Number | Exact match or custom pattern | Regex patterns |
| Name/Code | Fuzzy match against master data | String similarity |
| Category | Must match exactly | None |

### Dual Strategy Pattern

```text
matchWithReference():
  1. Filter targets by reference number
  2. Match by amount within tolerance
  3. Handle special cases (charges, adjustments)

matchWithoutReference():
  1. Filter by primary key + category
  2. Try exact amount match
  3. Try partial amount match (record covers multiple targets)
  4. Handle special cases as separate line
```

### Extraction Checklist

- [ ] Document matching dimensions and tolerance rules
- [ ] Show the multi-strategy dispatch logic
- [ ] Document special case handling (adjustments, charges)
- [ ] Show how unmatched items are reported
- [ ] Document concurrent processing controls (distributed locking)

---

## 2. Automated Document Processing Pipeline

**Business Complexity**: 5 | **Files**: 10+ (abstract template + multiple format-specific strategies + DTOs)

### Business Problem

Automatically process incoming documents (emails, files, messages) to create business records. Each source sends different formats. The system must parse attachments, extract structured data, match to master data, and generate business documents.

### Processing Pipeline

```text
1. Retrieve incoming document (via API, file system, or message queue)
2. Classify document type
3. Download and decompress attachments if needed
4. Parse file format (CSV → reader, Excel → reader, ZIP → extract → parse)
5. For each data row:
   a. Extract key fields (amount, date, reference, etc.)
   b. Resolve to master data (fuzzy matching + lookup)
   c. Generate document number (code rule: prefix + sequence)
   d. Determine transaction type
6. Batch create business records
7. Send processing report
```

### Format-Specific Variations

| Source | Format | Special Handling |
|--------|--------|-----------------|
| Format A | CSV | Multi-line records, multi-currency |
| Format B | CSV | Custom date format, special reference pattern |
| Format C | Excel | Merged cells, multi-sheet |
| Format D | CSV | Different field ordering |
| Format E | CSV/XML | Region-specific format |

### Extraction Checklist

- [ ] Document the abstract template's hook methods
- [ ] List all format-specific implementations and their quirks
- [ ] Show document number generation algorithm
- [ ] Document master data resolution (fuzzy match + lookup)
- [ ] Show the classification logic

---

## 3. Financial Posting to General Ledger

**Business Complexity**: 4 | **Files**: 4-8 (posting implementations + journal services)

### Business Problem

Post business transactions to the General Ledger system. Must handle debit/credit balancing, exchange rate conversion, tax calculation, and multi-entity posting.

### Posting Flow

```text
1. Select unposted records
2. Validate posting eligibility (complete data, approved status)
3. Calculate posting amounts:
   a. Base amount in original currency
   b. Exchange rate conversion to functional currency
   c. Tax amount separation
4. Build GL journal entry lines (debit/credit pairs)
5. Validate balance (total debits = total credits)
6. Submit to GL system
7. Update posting status and reference
```

### Extraction Checklist

- [ ] Document debit/credit pair construction logic
- [ ] Show exchange rate handling
- [ ] Document validation rules (what blocks posting)
- [ ] Show the GL submission interface
- [ ] Document error handling and retry for GL failures

---

## 4. Data Aggregation and Consolidation

**Business Complexity**: 4 | **Files**: 3-4 (service + repositories)

### Business Problem

Consolidate multiple data lines into a single merged record. Must handle mathematical aggregation of numeric fields. Cancellation must reverse consolidation effects accurately.

### Consolidation Algorithm

```text
processConsolidation(createList, cancelList):

  For CREATE operations:
    1. Sum numeric fields across lines
    2. Generate merged record number (code rule)
    3. Update source line status → CONSOLIDATED
    4. Create consolidated header + lines

  For CANCEL operations:
    1. Subtract previously consolidated values
    2. Check if effect is effectively zero (floating-point tolerance)
    3. If zero → mark consolidated record as CANCELLED
    4. If not zero → update consolidated line quantities
    5. Restore source line status → UNCONSOLIDATED

  isEffectivelyZero(value):
    return |value| < 0.0001   # Floating-point tolerance
```

### Key Business Rules

- Zero-effect detection uses tolerance threshold (0.0001) to handle floating-point arithmetic
- Consolidation and cancellation can happen in the same batch
- Merged record number follows a specific code rule (prefix + sequence)

### Extraction Checklist

- [ ] Document the aggregation formula (sum vs weighted average)
- [ ] Show zero-effect detection logic with tolerance
- [ ] Document the dual operation (create + cancel) handling
- [ ] Show code generation for merged record numbers

---

## 5. Cross-System Data Reconciliation

**Business Complexity**: 4 | **Files**: 8+ (processor per source system + shared framework)

### Business Problem

Import and reconcile data from multiple external systems (ERPs, third-party APIs, file feeds). Each system sends data in different formats with different field mappings. Records must be matched to existing data and updated or created.

### Per-System Variations

| System | Import Method | Key Fields | Special Handling |
|--------|--------------|------------|------------------|
| ERP A | Excel import (multi-header rows) | Business key fields | Column merge, dynamic mapping |
| ERP B | API call (scheduled) | Business key + external ref | Real-time sync, error retry |
| API Partner | API call + file import | External reference number | Related data in separate entity |
| Manual | File upload | Business key fields | Standard single-header format |

### Reconciliation Flow

```text
1. Receive data from source system
2. Map to unified entity (system-specific field mapping)
3. Generate unique key for deduplication
4. Match against existing records:
   a. Exact match → update existing
   b. No match → create new
5. Run rule matching engine for assignment
6. Batch save (split insert/update lists)
7. Log reconciliation results
```

### Extraction Checklist

- [ ] Document per-system field mapping tables
- [ ] Show the unique key generation algorithm
- [ ] Document the reconciliation matching criteria
- [ ] Show how the rule matching engine integrates

---

## 6. Automated Classification and Routing Workflow

**Business Complexity**: 4 | **Files**: 15+ (handlers + services + classifiers)

### Business Problem

Automatically receive messages from external sources, classify them by type, and trigger appropriate downstream workflows.

### Workflow Pipeline

```text
1. Scheduled job triggers retrieval
2. Authenticate with external API (OAuth2 client credentials)
3. Retrieve unread messages from monitored sources
4. For each message:
   a. Parse subject and body
   b. Classify by rules:
      - Sender domain → type A
      - Attachment type → type B
      - Subject keywords → type C
   c. Download attachments
   d. Route to handler:
      - Type A → handler A
      - Type B → handler B
      - Type C → handler C
   e. Move message to processed folder
   f. Send notification if classification uncertain
```

### Extraction Checklist

- [ ] Document classification rules and keyword patterns
- [ ] Show the handler routing mechanism
- [ ] Document external API authentication flow
- [ ] Show error handling for uncertain classifications

---

## 7. Batch Import with Multi-Source Formats

**Business Complexity**: 4 | **Files**: 5-10 (framework + per-source handlers)

### Business Problem

Import data from multiple external sources where each source provides data in a different Excel/CSV format. The system must handle varying header structures, field mappings, and validation rules.

### Import Pipeline

```text
1. Receive import file
2. Detect source system from filename or content
3. Select appropriate handler
4. Parse headers (handle multi-row headers, merged cells)
5. Map columns to entity fields
6. Validate data per business rules
7. Batch process rows with progress tracking
8. Generate import result report
```

### Per-Source Variations

| Source | Header Rows | Format | Mapping |
|--------|-------------|--------|---------|
| Source A | 3 (merged) | Excel | Dynamic column detection |
| Source B | 1 | CSV | Fixed position |
| Source C | 2 | Excel | Key-value pairs |
| Source D | 1 | XML/JSON | Hierarchical to flat |

### Extraction Checklist

- [ ] Document header parsing logic (merge, dynamic columns)
- [ ] Show the handler interface contract
- [ ] Document batch progress tracking
- [ ] List all source-specific handlers
- [ ] Show validation chain

---

## 8. File Parsing with Format Variations

**Business Complexity**: 4 | **Files**: 5-10 (one parser per format variation)

### Business Problem

Parse documents (PDF, Excel, CSV) to extract structured business data. Each source provides files in different layouts, requiring source-specific parsing logic.

### Parsing Approach

```text
1. Receive file (from email, upload, or API)
2. Identify source from filename or header content
3. Select appropriate parser
4. Extract text/data from file
5. Parse structured data:
   a. Locate key data regions (position-based or regex)
   b. Extract fields
   c. Handle multi-page documents
   d. Handle merged/disconnected regions
6. Validate extracted data (totals match header)
7. Return structured data
```

### Extraction Checklist

- [ ] Document the parser selection mechanism
- [ ] Show text extraction and region parsing
- [ ] Document per-source format variations
- [ ] Show validation logic (total reconciliation)
