# Business (Domain) Complexity Patterns in H0 Projects

> Reference file for h0-complex-pattern-miner. Describes complex business logic patterns found in H0 microservice projects.

## Table of Contents

1. [Multi-Criteria Payment Matching](#1-multi-criteria-payment-matching)
2. [AR Ticket Bank Mail Processing](#2-ar-ticket-bank-mail-processing)
3. [RB/UR Financial Posting to GL](#3-rbur-financial-posting-to-gl)
4. [Booking Plan Consolidation](#4-booking-plan-consolidation)
5. [Vendor Payment Preview and Matching](#5-vendor-payment-preview-and-matching)
6. [Automated Mail Classification Workflow](#6-automated-mail-classification-workflow)
7. [Multi-System Order Data Reconciliation](#7-multi-system-order-data-reconciliation)
8. [Payment Advice PDF Parsing](#8-payment-advice-pdf-parsing)

---

## 1. Multi-Criteria Payment Matching

**Business Complexity**: 5 | **Files**: 3-5 services + supporting entities

### Business Problem

Match incoming payments against outstanding AR tickets. A single payment may cover multiple tickets, and a single ticket may be partially paid. Matching must handle amount tolerance, date windows, and fuzzy payor name matching.

### Matching Dimensions

| Dimension | Logic | Tolerance |
|-----------|-------|-----------|
| Amount | Exact or within tolerance range | Configurable % |
| Date | Payment date within ticket date window | ±7 days |
| Reference Number | Exact match or customer reference pattern | Regex patterns |
| Payor Name | Fuzzy match against customer database | String similarity |
| Currency | Must match exactly | None |

### Dual Strategy

```
matchHasReferenceNo():
  1. Filter tickets by reference number
  2. Match by amount within tolerance
  3. Auto-handle bank charges (BC)

matchNoHasReferenceNo():
  1. Filter by customer code + currency
  2. Try exact amount match
  3. Try partial amount match (payment covers multiple tickets)
  4. Handle BC (bank charge) as separate line
```

### Extraction Checklist

- [ ] Document matching dimensions and tolerance rules
- [ ] Show the dual-strategy dispatch logic
- [ ] Document bank charge (BC) handling algorithm
- [ ] Show how unmatched items are reported
- [ ] Document concurrent processing controls (distributed locking)

---

## 2. AR Ticket Bank Mail Processing

**Business Complexity**: 5 | **Files**: 10+ (abstract template + 8 bank-specific strategies + DTOs)

### Business Problem

Automatically process bank notification emails to create AR tickets. Each bank (HSBC, SCB, BNP, CITI, MUFG, etc.) sends different formats (CSV, Excel, ZIP). The system must parse attachments, extract transaction details, match to customers, and generate ticket numbers.

### Processing Pipeline

```
1. Retrieve mail via Microsoft Graph API
2. Classify mail type (bank notification, payment advice, etc.)
3. Download and decompress attachments
4. Parse file format (CSV → reader, Excel → reader, ZIP → extract → parse)
5. For each transaction row:
   a. Extract amount, currency, date, reference
   b. Resolve payor → customer code (fuzzy matching + address book lookup)
   c. Generate ticket number (code rule: prefix + sequence)
   d. Set assignment and location (bank account mapping)
   e. Determine transaction type (receipt, refund, charge)
6. Batch create tickets
7. Send processing report
```

### Bank-Specific Variations

| Bank | Format | Special Handling |
|------|--------|-----------------|
| HSBC | CSV | Multi-line transactions, CNY/USD dual currency |
| SCB | CSV | Custom date format, special reference pattern |
| BNP | Excel | Merged cells, multi-sheet |
| CITI | CSV | Different field ordering, CNY specific |
| MUFG | CSV | Japanese date format, yen handling |

### Extraction Checklist

- [ ] Document the abstract template's hook methods
- [ ] List all bank-specific implementations and their quirks
- [ ] Show ticket number generation algorithm
- [ ] Document customer resolution (fuzzy match + address book)
- [ ] Show the mail classification logic

---

## 3. RB/UR Financial Posting to GL

**Business Complexity**: 4 | **Files**: 4-8 (RB + UR implementations + posting services)

### Business Problem

Post AR receipts (RB - Receipt Book) and unapplied receipts (UR) to the General Ledger system. Must handle debit/credit balancing, exchange rate conversion, tax calculation, and multi-entity posting.

### Posting Flow

```
1. Select unposted RB/UR records
2. Validate posting eligibility (complete data, approved status)
3. Calculate posting amounts:
   a. Base amount in original currency
   b. Exchange rate conversion to functional currency
   c. Tax amount separation
4. Build GL journal entry lines (debit/credit pairs)
5. Validate balance (total debits = total credits)
6. Submit to GL system
7. Update RB/UR posting status and reference
```

### Extraction Checklist

- [ ] Document debit/credit pair construction logic
- [ ] Show exchange rate handling
- [ ] Document validation rules (what blocks posting)
- [ ] Show the GL submission interface
- [ ] Document error handling and retry for GL failures

---

## 4. Booking Plan Consolidation

**Business Complexity**: 4 | **Files**: 3-4 (service + repositories)

### Business Problem

Consolidate multiple booking plan lines into a single merged plan. Must handle mathematical aggregation of carton numbers, quantities, weights, and volumes. Cancellation must reverse consolidation effects accurately.

### Consolidation Algorithm

```
processConsolidation(createList, cancelList):

  For CREATE operations:
    1. Sum carton count, quantity, weight, volume across lines
    2. Generate merged plan number (code rule)
    3. Update source line status → CONSOLIDATED
    4. Create consolidated header + lines

  For CANCEL operations:
    1. Subtract previously consolidated values
    2. Check if effect is effectively zero (floating-point tolerance)
    3. If zero → mark consolidated plan as CANCELLED
    4. If not zero → update consolidated line quantities
    5. Restore source line status → UNCONSOLIDATED

  isEffectivelyZero(value):
    return |value| < 0.0001   # Floating-point tolerance
```

### Key Business Rules

- Zero-effect detection uses tolerance threshold (0.0001) to handle floating-point arithmetic
- Consolidation and cancellation can happen in the same batch
- Merged plan number follows a specific code rule (prefix + sequence)

### Extraction Checklist

- [ ] Document the aggregation formula (sum vs weighted average)
- [ ] Show zero-effect detection logic with tolerance
- [ ] Document the dual operation (create + cancel) handling
- [ ] Show code generation for merged plan numbers

---

## 5. Vendor Payment Preview and Matching

**Business Complexity**: 4 | **Files**: 3-5 (service + vendor preview entity + matching)

### Business Problem

Preview upcoming vendor payments and match them against outstanding AR items. Vendor payments arrive with date windows and amount ranges, requiring fuzzy matching against expected receipts.

### Matching Logic

```
doMatching(vendorPreviewList):
  For each vendor preview:
    1. Filter tickets by vendor code + currency
    2. Apply date window:
       - ticket date >= vendor date - 7 days
       - ticket date <= vendor date + 3 days
    3. Apply amount matching:
       - Check within tolerance range
    4. If multiple matches → prefer exact amount match
    5. If still tied → prefer earliest ticket date
    6. Update match status on both vendor preview and ticket
```

### Extraction Checklist

- [ ] Document the date window logic (asymmetric: 7 before, 3 after)
- [ ] Show amount tolerance calculation
- [ ] Document tie-breaking rules
- [ ] Show concurrent access handling (distributed locking)

---

## 6. Automated Mail Classification Workflow

**Business Complexity**: 4 | **Files**: 15+ (handlers + services + classifiers)

### Business Problem

Automatically receive emails from Microsoft Graph API, classify them by type (bank notification, payment advice, shipping document, etc.), and trigger appropriate downstream workflows.

### Workflow Pipeline

```
1. Scheduled job triggers mail retrieval
2. Authenticate with Microsoft Graph API (OAuth2 client credentials)
3. Retrieve unread mails from monitored folders
4. For each mail:
   a. Parse subject and body
   b. Classify by rules:
      - Bank name in sender → bank notification
      - Attachment type (.pdf) → payment advice
      - Subject keywords → shipping document
   c. Download attachments
   d. Route to handler:
      - Bank notification → AR ticket creation
      - Payment advice → payment matching
      - Shipping document → packing list
   e. Move mail to processed folder
   f. Send notification if classification uncertain
```

### Extraction Checklist

- [ ] Document classification rules and keyword patterns
- [ ] Show the handler routing mechanism
- [ ] Document Graph API authentication flow
- [ ] Show error handling for uncertain classifications

---

## 7. Multi-System Order Data Reconciliation

**Business Complexity**: 4 | **Files**: 8+ (processor per system + shared framework)

### Business Problem

Import and reconcile order data from multiple external systems (D365, E1, XTS, Oracle). Each system sends data in different formats with different field mappings. Orders must be matched to existing records and updated or created.

### Per-System Variations

| System | Import Method | Key Fields | Special Handling |
|--------|--------------|------------|------------------|
| D365 | Excel import (3 header rows) | OrderNo, CustomerCode | Column merge, dynamic mapping |
| E1 | API call (scheduled) | OrderNo, E1Reference | Real-time sync, error retry |
| XTS | API call + file import | TSFPLI number | Invoice info separate entity |
| Oracle | Manual import | OrderNo, CustomerCode | Standard single-header format |

### Reconciliation Flow

```
1. Receive data from source system
2. Map to unified order entity (system-specific field mapping)
3. Generate unique key for deduplication
4. Match against existing orders:
   a. Exact match → update existing
   b. No match → create new
5. Run rule matching engine for customer/staff/supplier assignment
6. Batch save (split insert/update lists)
7. Log reconciliation results
```

### Extraction Checklist

- [ ] Document per-system field mapping tables
- [ ] Show the unique key generation algorithm
- [ ] Document the reconciliation matching criteria
- [ ] Show how the rule matching engine integrates

---

## 8. Payment Advice PDF Parsing

**Business Complexity**: 4 | **Files**: 10+ (one parser per customer/bank format)

### Business Problem

Parse payment advice PDF documents to extract invoice-level payment details. Each customer sends PDFs in different layouts, requiring customer-specific parsing logic.

### Parsing Approach

```
1. Receive PDF file (from email attachment or upload)
2. Identify customer/bank from filename or header content
3. Select appropriate parser
4. Extract text from PDF (PDFBox)
5. Parse structured data:
   a. Locate invoice number region (position-based or regex)
   b. Extract amount, currency, discount
   c. Handle multi-page documents
   d. Handle merged/disconnected text regions
6. Validate extracted data (amount totals match header)
7. Return structured payment advice data
```

### Extraction Checklist

- [ ] Document the parser selection mechanism
- [ ] Show PDF text extraction and region parsing
- [ ] Document per-customer format variations
- [ ] Show validation logic (total reconciliation)
