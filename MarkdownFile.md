**🇮🇳 Indian Business Management ERP**

Complete Product & Process Documentation

| Version 1.0 | May 2025Technology Stack: React.js · Next.js · Node.js · MongoDB · AWSAudience: Developers · Product Managers · QA Engineers · Stakeholders |
| --- |

# Table of Contents

**PART A — PRODUCT DOCUMENTATION**

**1\. Executive Summary**

**2\. System Architecture**

2.1 High-Level Architecture Overview

2.2 Frontend Architecture (Next.js / React)

2.3 Backend Architecture (Node.js / Express)

2.4 Database Architecture (MongoDB)

2.5 Authentication & Security Architecture

**3\. Module Functional Specifications**

3.1 Business Registration & Onboarding

3.2 Dashboard Module

3.3 Sales Module

3.4 Purchase Module

3.5 Inventory Module

3.6 Customer Module

3.7 Supplier Module

3.8 Expense Module

3.9 Reports Module

3.10 Tools Module

3.11 Master (Items & Services) Module

3.12 GST & Indian Compliance Module

**4\. API Reference Documentation**

**5\. Database Schema (MongoDB Collections)**

**6\. User Roles & Permission Matrix**

**7\. UI/UX Design Guidelines**

**PART B — PROCESS DOCUMENTATION**

**8\. Technology Stack Deep Dive**

8.1 Frontend Stack

8.2 Backend Stack

8.3 Database & Cloud

8.4 DevOps & CI/CD

**9\. Project Structure & File Organization**

**10\. Development Environment Setup**

**11\. Coding Standards & Best Practices**

**12\. Testing Strategy**

**13\. Sprint & Phase Breakdown**

**14\. Deployment Guide**

**15\. Future Enhancements Roadmap**

| PART A — PRODUCT DOCUMENTATION |
| --- |

# 1\. Executive Summary

The Indian Business Management ERP is a cloud-based, web-first enterprise resource planning platform purpose-built for Indian businesses — from single-outlet kirana stores to multi-branch SMEs. Unlike generic ERP systems, this platform natively incorporates India-specific regulatory requirements: GST billing (CGST/SGST/IGST), GSTR-1 and GSTR-3B reporting, HSN/SAC code management, UPI payment integration, PAN/GSTIN validation, and the Indian financial year (April–March).

| Target Users | Retail shops, wholesalers, distributors, service businesses, medical stores, hardware shops, mobile shops, grocery stores, manufacturers, SMEs |
| --- | --- |
| Core Value | Eliminate manual paperwork, automate GST billing, manage inventory in real-time, generate financial reports instantly |
| Technology | React.js + Next.js (Frontend), Node.js + Express (Backend), MongoDB Atlas (Database) |
| Hosting | Vercel (Frontend), AWS / Render / DigitalOcean (Backend), MongoDB Atlas |
| Compliance | GST, CGST, SGST, IGST, GSTR-1, GSTR-3B, Tally Export, UPI |
| Access | Desktop, Tablet, Mobile (fully responsive) |
| Auth Model | JWT-based, Role-based (Admin, Staff, Accountant) |

# 2\. System Architecture

## 2.1 High-Level Architecture Overview

The system follows a three-tier client-server architecture with a clear separation between the presentation layer, business logic layer, and data layer. All communication between tiers happens over HTTPS using RESTful JSON APIs secured with JWT tokens.

| Architecture TiersTier 1 (Presentation): Next.js SPA/SSR served via Vercel CDN Tier 2 (Application): Node.js/Express REST API hosted on AWS/Render Tier 3 (Data): MongoDB Atlas (managed cloud database) Supporting Services: Vercel (CDN), AWS S3 (file storage), SMTP / WhatsApp API (notifications), Redis (optional caching) |
| --- |

### Request Flow

1\. User opens browser → DNS resolves to Vercel CDN → Next.js delivers HTML/JS bundle

2\. Client-side React app boots, checks for JWT in localStorage / HttpOnly cookie

3\. All API calls go to Express backend (e.g., api.yourdomain.com) with Authorization: Bearer <token>

4\. Express middleware validates JWT, resolves business context (businessId), passes to controller

5\. Controller performs CRUD on MongoDB via Mongoose ODM, returns JSON response

6\. React Query / Redux Toolkit updates UI state; Chart.js renders analytics

## 2.2 Frontend Architecture (Next.js / React)

The frontend is built as a Next.js 14 App Router application. Each ERP module maps to a Next.js route segment with its own layout, loading, and error boundaries.

| Layer | Library / File | Purpose |
| --- | --- | --- |
| Next.js App Router | app/(auth)/login | Login, Register, Onboarding pages (server components for SEO) |
|  | app/(dashboard)/layout.tsx | Persistent sidebar, topbar, notification bell |
|  | app/(dashboard)/sales/page.tsx | Sales module root — invoice list + quick actions |
|  | app/(dashboard)/reports/gstr/page.tsx | GSTR-1 / GSTR-3B report pages |
| State Management | Redux Toolkit (RTK) | Global: auth state, business context, theme, notifications |
|  | RTK Query | Server state: all API calls, cache, optimistic updates |
| UI Library | Tailwind CSS | Utility-first CSS, dark/light theme via CSS variables |
|  | shadcn/ui + Radix UI | Accessible headless components (modals, dropdowns, etc.) |
| Charts | Chart.js + react-chartjs-2 | Dashboard graphs: sales trend, profit margin, inventory |
| Forms | React Hook Form + Zod | Form validation with schema-based rules (GST number, PAN) |
| PDF | react-pdf / jsPDF | Invoice PDF generation client-side |
| Tables | TanStack Table v8 | Sortable, filterable, paginated data tables |

## 2.3 Backend Architecture (Node.js / Express)

The backend follows a layered MVC architecture. Each module has its own Router → Controller → Service → Model chain, keeping business logic isolated and testable.

| Layer | File | Responsibility |
| --- | --- | --- |
| Entry Point | server.js | Express app init, middleware chain, route mounting, error handler |
| Middleware | auth.middleware.js | JWT verification, role extraction, businessId injection |
|  | validate.middleware.js | Joi / Zod schema validation for all incoming requests |
|  | rateLimit.middleware.js | express-rate-limit: 100 req/min per IP |
|  | audit.middleware.js | Logs every mutating request to AuditLog collection |
| Routers | routes/sales.routes.js | POST /invoices, GET /invoices/:id, PUT, DELETE |
|  | routes/purchase.routes.js | CRUD for purchase bills, returns, orders |
|  | routes/gst.routes.js | GSTR-1, GSTR-3B aggregation endpoints |
| Controllers | controllers/invoice.ctrl.js | Orchestrates service calls, sends HTTP response |
| Services | services/gst.service.js | GST calculation logic: CGST/SGST/IGST split, HSN aggregation |
|  | services/inventory.service.js | Stock deduction on invoice, reorder alert triggers |
|  | services/pdf.service.js | Generates GST-compliant invoice PDF (Puppeteer / pdfkit) |
| Models | models/Invoice.model.js | Mongoose schema with validators and indexes |
| Utils | utils/gstin.validator.js | GSTIN checksum validation algorithm |
|  | utils/financialYear.js | Derives FY label and date range from current date |

## 2.4 Database Architecture (MongoDB)

MongoDB Atlas is used as the primary database. The schema is document-oriented with selective referencing (DBRef) for cross-module relationships. Indexes are defined on all query-critical fields (businessId, invoiceDate, customerId, GST number).

| Collection | Purpose |
| --- | --- |
| businesses | Business profile: GSTIN, PAN, bank details, logo, financial year, multi-location |
| users | User accounts with hashed password, role enum, businessId array |
| products | Items/services: HSN/SAC code, unit, tax rate (0/5/12/18/28%), barcode, variants |
| customers | CRM records: GSTIN (optional), credit limit, outstanding balance, contact |
| suppliers | Supplier profiles: GSTIN, payment terms, outstanding payables |
| invoices | Sales invoices: line items (productId, qty, rate, taxAmount), GST split, status |
| purchaseBills | Purchase entries: supplier, items, IGST/CGST/SGST, payment status |
| payments | Payment-in and payment-out ledger with reference (invoiceId / billId) |
| inventory | Current stock level per product per location; adjustment logs |
| expenses | Indirect and other expenses with category, GST, payment mode |
| quotations | Quote with validity date, conversion status (→ invoice), discount schemes |
| auditLogs | Immutable log: userId, action, module, before/after JSON, timestamp |
| reminders | SMS/email reminders: target date, message, linked invoice / payment |
| gstrData | Pre-aggregated GSTR-1 and GSTR-3B filing data per financial month |

## 2.5 Authentication & Security Architecture

| JWT Access Token | Expires in 15 minutes; contains userId, businessId[], role |
| --- | --- |
| Refresh Token | Expires in 7 days; stored HttpOnly cookie; rotated on each use |
| Password Storage | bcrypt with salt rounds=12; never stored in plaintext |
| RBAC | Role enum (admin / staff / accountant) checked per route in middleware |
| HTTPS | TLS 1.3 enforced on all tiers; HSTS header set |
| Rate Limiting | 100 req/min global; 5 req/min on /auth/login (brute-force protection) |
| CORS | Allowlist of frontend domains only; credentials: true |
| Input Sanitization | mongo-sanitize strips $ operators; Joi/Zod enforces strict types |
| Audit Trail | Every POST/PUT/DELETE logs actor, timestamp, changed fields |
| Cloud Backups | MongoDB Atlas: daily snapshots, 7-day PITR, cross-region replica |

# 3\. Module Functional Specifications

## 3.1 Business Registration & Onboarding

First-time users are guided through a multi-step onboarding wizard before accessing the dashboard. This wizard collects all mandatory information required for GST-compliant billing.

### Onboarding Steps

| Step 1 — Business Identity | Business name, owner name, business type (dropdown: Retail/Wholesale/Service/Medical/Manufacturing/Other) |
| --- | --- |
| Step 2 — Tax Registration | GSTIN (15-char validation + checksum), PAN (10-char validation), composition scheme flag |
| Step 3 — Contact & Address | Mobile (10-digit), email, full address, state (Indian state dropdown), pin code |
| Step 4 — Financial Settings | Financial year start (default April), currency (INR), default invoice prefix, default due days |
| Step 5 — Logo & Branding | Upload business logo (PNG/JPG, max 2MB); preview on sample invoice |
| Step 6 — Bank Details | Bank name, account number, IFSC, UPI ID (for QR code on invoices), branch |

On submission, the backend: validates GSTIN via checksum algorithm, creates the Business document, creates the Admin user record, seeds default tax slabs (0%, 5%, 12%, 18%, 28%), generates a default invoice series (INV-0001), and redirects to the dashboard.

## 3.2 Dashboard Module

The dashboard is the command center, providing a real-time snapshot of business health across six KPI tiles, two graphs, and a quick-action panel. Data is fetched on mount and auto-refreshed every 5 minutes.

### KPI Tiles

| KPI Tile | Calculation | API Endpoint |
| --- | --- | --- |
| Total Sales (Today/Month/Year) | Sum of all invoice totals for selected period | GET /api/analytics/sales-summary |
| Total Purchases (Today/Month/Year) | Sum of all purchase bills for selected period | GET /api/analytics/purchase-summary |
| Amount Received | Sum of Payment-In records, filtered by date | GET /api/analytics/payments-in |
| Amount Paid | Sum of Payment-Out records, filtered by date | GET /api/analytics/payments-out |
| Outstanding Payments | Sum of unpaid / partially paid invoice balances | GET /api/analytics/outstanding |
| Low Stock Alerts | Count of products below reorder level | GET /api/inventory/low-stock/count |

### Charts

*   Daily Sales Graph — Bar chart, last 30 days, showing daily invoice totals with 7-day moving average line overlay
*   Monthly Profit Graph — Line chart, current financial year, showing gross profit (sales minus purchases minus expenses)

## 3.3 Sales Module

The Sales Module handles all outward supply transactions: invoices (B2B and B2C), sale returns (credit notes), and quotations.

### 3.3.1 Invoice (Tax Invoice)

The invoice creator is the most-used screen. It auto-calculates GST in real time as line items are added.

| Invoice Number | Auto-generated series (e.g., INV-2025-0001); editable prefix in settings |
| --- | --- |
| Invoice Date | Date picker; defaults to today; historical dates allowed |
| Customer | Searchable dropdown (existing) or quick-add inline; GSTIN auto-filled if B2B |
| Place of Supply | State dropdown; determines CGST+SGST vs IGST split automatically |
| Line Items | Product/service search; auto-fill HSN, unit, rate, tax%; qty editable |
| Discount | Per-line percentage or flat; or invoice-level discount scheme |
| GST Calculation | CGST+SGST (intra-state) or IGST (inter-state) auto-applied per line |
| Shipping | Optional shipping charges with separate GST rate |
| Payment Mode | Cash / UPI / NEFT / RTGS / Cheque / Credit; partial payment flag |
| Notes & Terms | Free-text invoice notes; default terms from settings |
| PDF Actions | Download PDF, WhatsApp share, Email share, Print |
| Invoice Status | Draft / Sent / Paid / Partially Paid / Overdue / Cancelled |

### 3.3.2 Sale Return (Credit Note)

| Reference Invoice | Mandatory link to original invoice; pre-fills line items |
| --- | --- |
| Return Type | Full return (cancel invoice) or partial return (select items + quantities) |
| Credit Note Number | Auto-series: CN-2025-0001 |
| Reason | Dropdown + text: Damaged / Wrong item / Customer rejection / Other |
| Stock Impact | On save, inventory is incremented for returned items |
| GST Impact | Negative GST entry created; reflected in GSTR-1 as credit note |

### 3.3.3 Quotation

| Quotation Number | Auto-series: QT-2025-0001; does not affect inventory or ledger |
| --- | --- |
| Validity Date | Expiry date; auto-marks as Expired after this date |
| Convert to Invoice | One-click conversion; creates invoice pre-filled from quotation |
| Revised Quotation | Create revised version (v2, v3); original preserved for history |

## 3.4 Purchase Module

| Purchase Bill | Records inward supply from supplier; mirror of sales invoice. Captures supplier GSTIN, bill date, bill number, item-wise GST breakup for ITC (Input Tax Credit) computation |
| --- | --- |
| Purchase Return (Debit Note) | Reverse entry against a purchase bill; auto-decrements inventory; creates debit note series DN-YYYY-XXXX |
| Purchase Order (PO) | Pre-purchase document sent to supplier; does not affect accounts; converts to Purchase Bill on goods receipt |

All purchase entries feed into the GST Purchase register and are used for GSTR-3B ITC claim computation. The system flags duplicate bill numbers per supplier to prevent double-entry.

## 3.5 Inventory Module

Inventory is maintained at the product-level with automatic adjustments on invoice save, purchase bill save, sale return, and purchase return.

| Opening Stock | Set per product during master creation or via bulk import (CSV) |
| --- | --- |
| Auto Deduction | Each saved invoice deducts quantities from stock in real time |
| Auto Addition | Each saved purchase bill adds quantities to stock |
| Stock Adjustment | Manual increase/decrease with reason (damage / theft / correction) |
| Physical Reconciliation | Import physical count CSV; system generates variance report |
| Reorder Level | Per-product threshold; dashboard alert + optional SMS when breached |
| Multi-location | Stock tracked per warehouse/location for multi-branch businesses |
| Negative Stock Warning | Warning popup if invoice would cause negative stock; can be overridden by admin |
| Batch / Expiry Tracking | Optional per product (recommended for medical stores) |
| Serial Number Tracking | Optional per product (recommended for electronics/mobile shops) |

## 3.6 Customer Module

| Customer Profile | Name, mobile, email, billing address, shipping address, GSTIN (optional for B2B) |
| --- | --- |
| Credit Limit | Maximum outstanding allowed; billing blocked if limit exceeded (configurable) |
| Opening Balance | Outstanding balance migrated from previous system |
| Statement of Account | Full ledger: invoices, payments, credit notes, balance carried forward |
| Payment History | All Payment-In records linked to customer |
| SMS / WhatsApp | Send payment reminder / invoice directly from customer profile |
| Tags / Groups | Categorize customers (e.g., Retail, Wholesale, Govt) for filtered reporting |

## 3.7 Supplier Module

| Supplier Profile | Name, GSTIN (mandatory for ITC), PAN, payment terms, bank details |
| --- | --- |
| Opening Balance | Payables carried forward from previous system |
| Payables Ledger | Purchase bills, payments out, debit notes — full outstanding tracker |
| GSTIN Verification | Integration with GST portal API for supplier GSTIN validation |

## 3.8 Expense Module

| Indirect Expense | Business overheads: rent, electricity, salaries, marketing — with GST ITC if applicable |
| --- | --- |
| Other Expense | Non-recurring / miscellaneous expenses |
| Expense Category | User-defined categories for P&L classification |
| Payment Mode | Cash / Bank / UPI; linked to bank account for reconciliation |
| GST on Expense | Optional GST input (CGST/SGST/IGST) for ITC-eligible expenses |

## 3.9 Reports Module

The reports module contains 40+ pre-built reports across 8 categories. All reports support date range filtering, CSV export, and PDF download.

### Accounts Reports

| Cash Book | All cash inflows and outflows with running balance |
| --- | --- |
| Business Book | All financial transactions in chronological order |
| Payment Paid / Received | Summary and detail of all payments filtered by party or date |
| Daily Summary | Day-wise summary: total sales, purchases, expenses, net cash flow |
| Input/Output Tax | GST collected (output) vs GST paid (input) — ITC computation |
| Profit & Loss Summary | Revenue minus COGS minus expenses — per month and financial year |
| Balance Sheet | Assets, liabilities, equity — point-in-time snapshot |
| Chart of Accounts | Hierarchical account ledger (double-entry bookkeeping view) |

### Inventory Reports

| Stock Availability | Current stock level for all products with value (cost and MRP) |
| --- | --- |
| Low Level Stock | Products below reorder level with pending PO info |
| Fast/Slow Moving Items | Ranked by quantity sold in selected period |
| Stock Adjustment Report | All manual adjustments with reason and actor |
| Item Register | Complete movement history per product (in, out, adjustments) |

### GST Reports

| GSTR-1 | Outward supply details in government-prescribed format: B2B, B2C, HSN summary, credit notes — exportable as JSON for direct filing portal upload |
| --- | --- |
| GSTR-3B | Monthly summary: total outward, ITC claimed, tax payable after ITC offset — with auto-computed values from invoice and purchase data |
| GST Sales / Purchase Register | Detailed register with CGST, SGST, IGST break-up per invoice/bill |

## 3.10 Tools Module

| Reminder System | Schedule SMS / WhatsApp reminders for due invoices; trigger at D-7, D-3, D-0 |
| --- | --- |
| Send SMS | Bulk or individual SMS to customers/suppliers via configured SMS gateway (e.g., Twilio, MSG91) |
| GST Calculator | Standalone tool: enter base amount + GST slab → computes CGST/SGST/IGST |
| Barcode Generator | Generate EAN-13, Code 128, or QR barcode for any product; print labels |
| Import Items / Customers | CSV/Excel bulk import with field mapping wizard and validation report |
| Item Variant Creator | Create size/colour/unit variants of a base product with independent pricing |
| Bulk Tax Update | Change HSN code or tax rate for multiple products simultaneously |

## 3.11 Master (Items & Services) Module

| Product Fields | Name, code/SKU, HSN code, category, unit (Nos/Kg/L/Box/etc.), purchase price, selling price, MRP, tax rate, opening stock, reorder level, barcode |
| --- | --- |
| Service Fields | Name, SAC code, unit (Hours/Job/etc.), rate, tax rate |
| Price Lists | Multiple price lists per product (Retail / Wholesale / Special) |
| Discount Schemes | Slab-based discount: buy 10+ get 10% off; customer-group specific |
| Item Variants | Colour / Size / Weight variants with independent stock and pricing |

## 3.12 GST & Indian Compliance Module

This module encapsulates all India-specific tax and compliance features that differentiate this ERP from generic solutions.

| Tax Slabs | 0%, 5%, 12%, 18%, 28% — selectable per product |
| --- | --- |
| CGST / SGST Split | Applied on intra-state supplies (both parties in same state) |
| IGST | Applied on inter-state supplies (parties in different states) |
| Composition Scheme | Simplified flat-rate tax for small businesses; flags invoices as Bill of Supply |
| HSN / SAC Codes | Mandatory 4/6/8 digit HSN for goods; SAC for services; auto-lookup from master |
| Reverse Charge (RCM) | Flag invoices for Reverse Charge Mechanism; reflected in GSTR-3B Table 3 |
| E-Invoice (IRN) | Future: API integration with IRP (Invoice Registration Portal) for IRN + QR |
| E-Way Bill | Future: auto-populate e-Way Bill details for consignments > ₹50,000 |
| GSTIN Validation | Checksum algorithm validates format; API call verifies active registration |
| Financial Year | April 1 – March 31; all reports and aging calculations respect this |
| Tally Export | Export data in Tally XML format for businesses using dual systems |
| UPI QR on Invoice | Generates dynamic UPI QR code on PDF invoice for instant payment |

# 4\. API Reference Documentation

| Base URLProduction: https://api.yourdomain.com/api/v1 Development: http://localhost:5000/api/v1 All endpoints require Authorization: Bearer <access_token> unless noted. All requests and responses use Content-Type: application/json. All dates use ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ). |
| --- |

## 4.1 Authentication Endpoints

| Endpoint | Auth | Description | Key Body Fields |
| --- | --- | --- | --- |
| POST /auth/register | Public | Register new business + admin user | businessName, ownerName, gstin, email, password, mobile |
| POST /auth/login | Public | Login; returns access + refresh tokens | email, password |
| POST /auth/refresh | Public | Exchange refresh token for new access token | refreshToken (cookie) |
| POST /auth/logout | Auth | Invalidate refresh token | — |
| PUT /auth/change-password | Auth | Change current user password | oldPassword, newPassword |

## 4.2 Sales / Invoice Endpoints

| Endpoint | Role | Description | Key Params |
| --- | --- | --- | --- |
| POST /invoices | Admin/Staff | Create new invoice | customerId, lineItems[], placeOfSupply, paymentMode |
| GET /invoices | All Roles | List invoices with filters | ?from&to&status&customerId&page&limit |
| GET /invoices/:id | All Roles | Get single invoice with line items + GST breakup | — |
| PUT /invoices/:id | Admin/Staff | Update draft invoice | Partial invoice fields |
| DELETE /invoices/:id | Admin | Cancel invoice (soft delete) | — |
| GET /invoices/:id/pdf | All Roles | Stream GST invoice PDF | — |
| POST /invoices/:id/share | All Roles | WhatsApp / email invoice | channel: whatsapp|email, recipient |
| POST /sale-returns | Admin/Staff | Create credit note against invoice | invoiceId, returnItems[] |
| POST /quotations | Admin/Staff | Create quotation | customerId, lineItems[], validUntil |
| POST /quotations/:id/convert | Admin/Staff | Convert quotation to invoice | — |

## 4.3 Purchase Endpoints

| Endpoint | Role | Description | Key Params |
| --- | --- | --- | --- |
| POST /purchases | Admin/Staff | Create purchase bill | supplierId, billNumber, lineItems[], billDate |
| GET /purchases | All Roles | List purchase bills | ?from&to&supplierId&status |
| PUT /purchases/:id | Admin | Update purchase bill | Partial bill fields |
| POST /purchase-returns | Admin | Create debit note | purchaseId, returnItems[] |
| POST /purchase-orders | Admin/Staff | Create PO for supplier | supplierId, items[], deliveryDate |
| PUT /purchase-orders/:id/receive | Admin/Staff | Mark PO as received → bill | receivedItems[] |

## 4.4 Inventory Endpoints

| Endpoint | Role | Description | Key Params |
| --- | --- | --- | --- |
| GET /inventory | All Roles | Get stock levels for all products | ?lowStock=true&location |
| POST /inventory/adjust | Admin | Manual stock adjustment | productId, quantity (±), reason |
| POST /inventory/reconcile | Admin | Submit physical count CSV | file: multipart/form-data |
| GET /inventory/movements/:productId | All Roles | Full movement history for a product | ?from&to |

## 4.5 GST / Reports Endpoints

| Endpoint | Role | Description | Key Params |
| --- | --- | --- | --- |
| GET /reports/gstr1 | Accountant/Admin | Generate GSTR-1 data | ?month&year — returns structured JSON |
| GET /reports/gstr3b | Accountant/Admin | Generate GSTR-3B summary | ?month&year |
| GET /reports/profit-loss | Admin | P&L for period | ?from&to&period=monthly|yearly |
| GET /reports/balance-sheet | Admin | Balance sheet snapshot | ?asOf=YYYY-MM-DD |
| GET /reports/gst-sales | All Roles | GST sales register | ?from&to |
| GET /reports/stock-availability | All Roles | Current stock with value | ?location |

# 5\. Database Schema (MongoDB Collections)

## 5.1 Business Collection

Collection: businesses

{

\_id: ObjectId,

businessName: String (required),

ownerName: String (required),

gstin: String (15 chars, unique, validated via checksum),

pan: String (10 chars),

mobile: String (10 digits),

email: String,

address: { street, city, state, pinCode },

businessType: Enum \['Retail','Wholesale','Service','Medical','Manufacturing','Other'\],

logo: String (S3 URL),

financialYearStart: Number (1=Jan, 4=Apr default),

invoicePrefix: String (default 'INV'),

invoiceCounter: Number,

bankDetails: { bankName, accountNumber, ifsc, upiId, branch },

isCompositionScheme: Boolean,

createdAt: Date, updatedAt: Date

}

## 5.2 Invoice Collection

Collection: invoices

{

\_id: ObjectId,

businessId: ObjectId (ref: businesses, indexed),

invoiceNumber: String (e.g. 'INV-2025-0042', indexed),

invoiceDate: Date (indexed),

dueDate: Date,

customerId: ObjectId (ref: customers, indexed),

customerSnapshot: { name, gstin, address }, // denormalized

placeOfSupply: String (state code),

isInterState: Boolean,

lineItems: \[{

productId: ObjectId (ref: products),

productName: String,

hsnCode: String,

quantity: Number,

unit: String,

rate: Number,

discount: Number,

taxableAmount: Number,

gstRate: Number (0|5|12|18|28),

cgst: Number, sgst: Number, igst: Number,

totalAmount: Number

}\],

subtotal: Number, totalDiscount: Number,

totalTaxableAmount: Number,

totalCGST: Number, totalSGST: Number, totalIGST: Number,

totalGST: Number, grandTotal: Number,

amountReceived: Number, balance: Number,

paymentMode: Enum,

status: Enum \['draft','sent','paid','partial','overdue','cancelled'\],

notes: String, termsAndConditions: String,

isReverseCharge: Boolean,

createdBy: ObjectId (ref: users),

createdAt: Date, updatedAt: Date

}

## 5.3 Product / Item Collection

Collection: products

{

\_id: ObjectId,

businessId: ObjectId (indexed),

name: String (required),

sku: String,

hsnCode: String, sacCode: String,

category: String,

type: Enum \['product','service'\],

unit: String (Nos|Kg|L|Box|Pcs|etc.),

purchasePrice: Number,

sellingPrice: Number,

mrp: Number,

gstRate: Number (0|5|12|18|28),

openingStock: Number,

reorderLevel: Number,

barcode: String,

enableBatchTracking: Boolean,

enableSerialTracking: Boolean,

variants: \[{ name, sku, price, stock }\],

isActive: Boolean,

createdAt: Date, updatedAt: Date

}

# 6\. User Roles & Permission Matrix

Three built-in roles are provided. The Admin can create additional staff users and assign roles. Permissions are enforced at the API middleware layer, not just the UI.

| Permission | Admin | Staff | Accountant |
| --- | --- | --- | --- |
| Create / Edit Invoice | ✅ Full | ✅ Full | ❌ View only |
| Delete / Cancel Invoice | ✅ Yes | ❌ No | ❌ No |
| Create Purchase Bill | ✅ Full | ✅ Full | ❌ View only |
| Approve Purchase Order | ✅ Yes | ❌ No | ❌ No |
| Manage Inventory | ✅ Full | ✅ Limited* | ❌ View only |
| Stock Adjustment | ✅ Yes | ❌ No | ❌ No |
| View All Reports | ✅ Yes | ❌ No | ✅ Yes |
| GST Reports (GSTR-1/3B) | ✅ Yes | ❌ No | ✅ Yes |
| Expense Entry | ✅ Full | ✅ Own only | ✅ Full |
| Customer Management | ✅ Full | ✅ Full | ❌ View only |
| Supplier Management | ✅ Full | ✅ Full | ✅ View only |
| Manage Users / Staff | ✅ Yes | ❌ No | ❌ No |
| Business Settings | ✅ Yes | ❌ No | ❌ No |
| View Audit Logs | ✅ Yes | ❌ No | ✅ Yes |
| Data Import / Export | ✅ Yes | ❌ No | ✅ Limited |

_\* Staff can view stock and create invoices (which auto-deduct stock) but cannot perform manual adjustments._

# 7\. UI/UX Design Guidelines

| Layout | Left sidebar navigation (collapsed on mobile), fixed topbar, scrollable main content area |
| --- | --- |
| Responsive | Breakpoints: Mobile <768px (bottom nav), Tablet 768–1024px (collapsed sidebar), Desktop >1024px |
| Theme | Dark / Light mode toggle; CSS custom properties for all color tokens; persisted in localStorage |
| Typography | Inter font; base 14px; headings in weight 600; data in weight 400 |
| Primary Color | #1A3C6E (Navy) — trust, professionalism |
| Accent Color | #E8711A (Saffron) — CTAs, alerts, Indian identity |
| Success/Error | #138808 (Green) / #C0392B (Red) — matches semantic meaning |
| Icons | Lucide React icon set (consistent, MIT licensed) |
| Data Tables | Sticky header, column sort, column resize, row selection, pagination (25/50/100 per page) |
| Forms | Inline validation on blur; error messages below field; submit disabled until valid |
| Modals | Radix Dialog for side-panel and center modals; ESC to close; focus trap |
| Loading States | Skeleton loaders for tables; spinner for form submissions; optimistic updates |
| Invoice PDF Style | Indian GST invoice format: company header, logo, GSTIN, HSN table, tax summary, signature line |
| PART B — PROCESS DOCUMENTATION |
| --- |

# 8\. Technology Stack Deep Dive

## 8.1 Frontend Stack

| Library | Version | Purpose / Why Chosen |
| --- | --- | --- |
| React 18 | ^18.2.0 | Core UI library; concurrent rendering, Suspense, transitions |
| Next.js 14 | ^14.1.0 | App Router, Server Components, API Routes, Image optimization |
| TypeScript | ^5.3.0 | Type safety across components, API responses, and form schemas |
| Tailwind CSS | ^3.4.0 | Utility-first CSS; dark mode via class strategy |
| shadcn/ui | latest | Radix-based accessible components (Dialog, Select, Toast, etc.) |
| Redux Toolkit | ^2.2.0 | Global state: auth, business context, theme; RTK Query for API cache |
| React Hook Form | ^7.51.0 | Performant uncontrolled forms with minimal re-renders |
| Zod | ^3.22.0 | Schema validation shared between form and API (single source of truth) |
| Chart.js 4 | ^4.4.0 | Canvas-based charts; react-chartjs-2 wrapper |
| TanStack Table | ^8.15.0 | Headless table engine with sort, filter, pagination |
| Axios | ^1.6.0 | HTTP client with interceptors for auth header injection |
| react-pdf | ^7.7.0 | Client-side PDF rendering; used for invoice preview |
| date-fns | ^3.6.0 | Date utilities; Indian financial year calculations |
| react-hot-toast | ^2.4.1 | Non-blocking toast notifications |

## 8.2 Backend Stack

| Library | Version | Purpose / Why Chosen |
| --- | --- | --- |
| Node.js | v20 LTS | JavaScript runtime; event-loop handles high I/O concurrency |
| Express.js | ^4.18.0 | Minimal HTTP framework; middleware-first; large ecosystem |
| TypeScript | ^5.3.0 | Type-safe backend; shared types package with frontend |
| Mongoose | ^8.2.0 | MongoDB ODM; schema validation, middleware hooks, indexes |
| JSON Web Token | ^9.0.0 | Stateless auth; HS256 for access tokens |
| bcrypt | ^5.1.1 | Password hashing; salt rounds 12 |
| Joi / Zod | ^17.12 / ^3.22 | Request body validation schemas |
| express-rate-limit | ^7.2.0 | Rate limiting per IP and per user |
| helmet | ^7.1.0 | Sets security-hardening HTTP headers |
| cors | ^2.8.5 | CORS middleware with allowlist config |
| morgan | ^1.10.0 | HTTP request logger in development |
| Winston | ^3.11.0 | Structured JSON logging in production; ships to CloudWatch |
| Puppeteer | ^22.6.0 | Headless Chrome for server-side PDF generation (invoice) |
| Multer + AWS S3 SDK | ^1.4 / ^3.0 | File uploads (logo, CSV imports) to S3 |
| node-cron | ^3.0.3 | Scheduled jobs: overdue invoice detection, reminder dispatch |
| socket.io | ^4.7.0 | Real-time notifications for low stock alerts and payment receipt |

## 8.3 Database & Cloud Infrastructure

| MongoDB Atlas | Managed cloud MongoDB; M10+ cluster (3-node replica set); automatic failover; MongoDB 7.0; Vector Search (future AI features) |
| --- | --- |
| Atlas Backup | Continuous backups with 7-day PITR (point-in-time recovery); daily snapshots; cross-region replica for DR |
| AWS S3 | Object storage for invoice PDFs, business logos, CSV exports; lifecycle policy to Glacier after 90 days |
| Vercel | Frontend hosting; Edge Network CDN; automatic preview deployments on PR; environment variable management |
| AWS EC2 / Render | Backend hosting; t3.medium minimum; auto-scaling group; load balancer for multiple business tenants |
| Redis (optional) | ElastiCache Redis for session caching, rate-limit counters, and frequently-queried report aggregations |
| Cloudflare | DNS, WAF (Web Application Firewall), DDoS protection, SSL termination |

## 8.4 DevOps & CI/CD Pipeline

| Version Control | Git + GitHub; main branch protected; PR required for merges |
| --- | --- |
| Branch Strategy | GitFlow: main → production, develop → staging, feature/xxx → develop |
| CI (GitHub Actions) | On PR: lint (ESLint + Prettier), type-check (tsc), unit tests (Jest), build check |
| CD Frontend | Vercel auto-deploys develop → staging URL; manual promote to production |
| CD Backend | GitHub Actions: test → Docker build → push to ECR → ECS rolling deploy |
| Containerization | Dockerfile per service (frontend, backend); docker-compose for local dev |
| Secrets Management | AWS Secrets Manager for production; .env files for local (gitignored) |
| Monitoring | AWS CloudWatch (logs + metrics), Sentry (error tracking), Uptime Robot (ping) |
| Code Quality | ESLint (Airbnb config), Prettier, Husky pre-commit hooks, lint-staged |

# 9\. Project Structure & File Organization

## 9.1 Frontend (Next.js App Router)

erp-frontend/

├── app/

│ ├── (auth)/ # Login, Register, Onboarding (no sidebar)

│ │ ├── login/page.tsx

│ │ └── onboarding/page.tsx

│ └── (dashboard)/ # Protected routes with sidebar layout

│ ├── layout.tsx # Sidebar + topbar wrapper

│ ├── page.tsx # Dashboard home

│ ├── sales/

│ │ ├── page.tsx # Invoice list

│ │ ├── new/page.tsx # Create invoice

│ │ ├── \[id\]/page.tsx # Invoice detail

│ │ └── returns/ # Sale returns

│ ├── purchases/

│ ├── inventory/

│ ├── customers/

│ ├── suppliers/

│ ├── expenses/

│ ├── reports/

│ │ ├── gstr1/page.tsx

│ │ ├── gstr3b/page.tsx

│ │ ├── profit-loss/page.tsx

│ │ └── ... # 40+ report pages

│ ├── tools/

│ └── settings/

├── components/

│ ├── ui/ # shadcn/ui base components

│ ├── invoice/ # InvoiceForm, InvoicePDF, InvoiceTable

│ ├── charts/ # SalesChart, ProfitChart, StockChart

│ ├── layout/ # Sidebar, Topbar, Breadcrumb

│ └── shared/ # DataTable, SearchInput, DateRangePicker

├── lib/

│ ├── api/ # Axios instance + RTK Query endpoints

│ ├── store/ # Redux store, slices (auth, business, theme)

│ ├── validators/ # Zod schemas (invoice, product, customer)

│ └── utils/ # GST calc, financial year, formatCurrency

├── types/ # TypeScript interfaces (Invoice, Product, etc.)

├── hooks/ # useGstCalc, useInvoiceForm, useDebounce

└── public/ # Static assets, favicon

## 9.2 Backend (Express)

erp-backend/

├── src/

│ ├── app.ts # Express app config, middleware chain

│ ├── server.ts # HTTP server start, Socket.io init

│ ├── routes/ # Router files per module

│ │ ├── auth.routes.ts

│ │ ├── invoice.routes.ts

│ │ ├── purchase.routes.ts

│ │ ├── inventory.routes.ts

│ │ ├── gst.routes.ts

│ │ └── ... # One file per module

│ ├── controllers/ # Request handlers

│ ├── services/ # Business logic (gst.service.ts, pdf.service.ts)

│ ├── models/ # Mongoose schemas

│ │ ├── Business.model.ts

│ │ ├── Invoice.model.ts

│ │ ├── Product.model.ts

│ │ └── ... # One model per collection

│ ├── middleware/

│ │ ├── auth.ts # JWT verify + role check

│ │ ├── validate.ts # Zod schema validation

│ │ └── audit.ts # Mutation logging

│ ├── utils/

│ │ ├── gstin.validator.ts # GSTIN checksum

│ │ ├── gst.calculator.ts # CGST/SGST/IGST split logic

│ │ └── financialYear.ts # FY helpers

│ └── config/ # DB connection, env config, logger

├── tests/

│ ├── unit/ # Jest unit tests per service

│ └── integration/ # Supertest API tests

├── Dockerfile

└── package.json

# 10\. Development Environment Setup

## 10.1 Prerequisites

| Node.js | v20 LTS (use nvm: nvm install 20 && nvm use 20) |
| --- | --- |
| npm / pnpm | npm 10+ or pnpm 8+ (recommended for monorepo) |
| MongoDB | MongoDB Atlas free cluster (M0) or local mongod 7.0 |
| Git | v2.40+ |
| Docker (optional) | Docker Desktop for containerized local dev |
| VS Code (recommended) | Extensions: ESLint, Prettier, Tailwind IntelliSense, MongoDB for VS Code |

## 10.2 Step-by-Step Local Setup

\# 1. Clone repositories

git clone https://github.com/your-org/erp-frontend.git

git clone https://github.com/your-org/erp-backend.git

\# 2. Backend setup

cd erp-backend

npm install

cp .env.example .env

\# Edit .env — set MONGO\_URI, JWT\_SECRET, AWS\_S3\_BUCKET

npm run dev # Starts on http://localhost:5000

\# 3. Frontend setup

cd ../erp-frontend

npm install

cp .env.local.example .env.local

\# Edit .env.local — set NEXT\_PUBLIC\_API\_URL=http://localhost:5000/api/v1

npm run dev # Starts on http://localhost:3000

\# 4. Optional: Docker Compose (runs both + mongo locally)

docker-compose up --build

## 10.3 Environment Variables

**Backend (.env)**

NODE\_ENV=development

PORT=5000

MONGO\_URI=mongodb+srv://user:pass@cluster.mongodb.net/erp\_db

JWT\_SECRET=your-super-secret-key-min-32-chars

JWT\_REFRESH\_SECRET=another-secret-key

JWT\_EXPIRES\_IN=15m

JWT\_REFRESH\_EXPIRES\_IN=7d

AWS\_ACCESS\_KEY\_ID=AKIA...

AWS\_SECRET\_ACCESS\_KEY=...

AWS\_S3\_BUCKET=erp-uploads-bucket

AWS\_REGION=ap-south-1

SMTP\_HOST=smtp.gmail.com

SMTP\_USER=noreply@yourdomain.com

SMTP\_PASS=your-app-password

MSG91\_API\_KEY=your-msg91-key # Indian SMS gateway

REDIS\_URL=redis://localhost:6379 # optional

SENTRY\_DSN=https://...@sentry.io/...

**Frontend (.env.local)**

NEXT\_PUBLIC\_API\_URL=http://localhost:5000/api/v1

NEXT\_PUBLIC\_WS\_URL=http://localhost:5000

NEXT\_PUBLIC\_SENTRY\_DSN=https://...@sentry.io/...

# 11\. Coding Standards & Best Practices

## 11.1 TypeScript Standards

*   No any — use unknown and narrow down; configure strict: true in tsconfig
*   Shared types live in packages/shared-types (e.g., InvoiceDTO, ProductDTO)
*   API responses always typed; use generics: ApiResponse<T>
*   Enum values use UPPER\_SNAKE\_CASE; interface names in PascalCase

## 11.2 API Design Standards

*   RESTful nouns not verbs: /invoices not /createInvoice
*   HTTP status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable Entity, 500 Internal Server Error
*   Error responses: { success: false, message: 'Human-readable', errors: \[...\] }
*   Success responses: { success: true, data: {...}, meta: { page, total } }
*   All list endpoints support: ?page=1&limit=25&sort=field:asc&search=term

## 11.3 Database Standards

*   Always include businessId index on every collection (multi-tenancy isolation)
*   Denormalize sparingly: only snapshot customer/supplier name+GSTIN in invoices
*   Soft deletes: isDeleted: Boolean + deletedAt; never hard delete financial records
*   Mongoose pre-save hooks for computed fields (isInterState, GST totals)
*   Compound indexes: { businessId: 1, invoiceDate: -1 } for report queries

## 11.4 GST Calculation Logic

// Determine inter-state from state codes

const isInterState = businessStateCode !== placeOfSupply;

// Per line item

const taxableAmount = (rate \* qty) \* (1 - discount/100);

if (isInterState) {

igst = taxableAmount \* (gstRate / 100);

cgst = 0; sgst = 0;

} else {

cgst = taxableAmount \* (gstRate / 200); // half

sgst = cgst; // equal split

igst = 0;

}

lineTotal = taxableAmount + igst + cgst + sgst;

# 12\. Testing Strategy

| Unit Tests (Jest) | All service functions (gst.service, inventory.service); utility functions (GSTIN validator, financial year); target 80%+ coverage |
| --- | --- |
| Integration Tests (Supertest) | All API endpoints tested against real MongoDB test instance; auth flows, invoice CRUD, GST report generation |
| Component Tests (React Testing Library) | Dashboard KPI rendering, invoice form validation, role-based menu visibility |
| E2E Tests (Playwright) | Critical paths: register → create invoice → PDF download; GST report generation; user login with different roles |
| Manual QA Checklist | GST calculation accuracy (cross-verified with GST Portal), PDF invoice format, mobile responsiveness |
| Performance Testing (k6) | Load test: 100 concurrent users creating invoices; target P95 < 500ms API response |

\# Run backend unit tests

cd erp-backend && npm run test

\# Run integration tests (requires MongoDB test instance)

npm run test:integration

\# Run frontend component tests

cd erp-frontend && npm run test

\# Run E2E tests (requires both servers running)

npx playwright test

\# Coverage report

npm run test:coverage

# 13\. Sprint & Phase Breakdown

The project is organized into 5 phases over approximately 20–24 weeks (5 months). Each sprint is 2 weeks. The plan uses an Agile Scrum methodology with weekly reviews.

## Phase 1 — Foundation (Weeks 1–4 | Sprints 1–2)

| Sprint 1 Goals | Project scaffolding (Next.js + Express monorepo), MongoDB Atlas setup, CI/CD pipeline (GitHub Actions + Vercel), Authentication system (register, login, JWT, refresh), Business onboarding wizard (all 6 steps), Role-based middleware |
| --- | --- |
| Sprint 2 Goals | Master module (Products, Services, HSN/SAC), Customer module (CRUD, balance), Supplier module (CRUD, GSTIN validation), Base UI system (sidebar, topbar, theme toggle, responsive layout) |
| Deliverable | Working auth + onboarding + master data management; demo-able on staging URL |

## Phase 2 — Core Transactions (Weeks 5–10 | Sprints 3–5)

| Sprint 3 Goals | Invoice creation (line items, auto GST calculation, CGST/SGST/IGST split), Invoice list + search + filters, Invoice PDF generation (GST-compliant format), WhatsApp / email sharing integration |
| --- | --- |
| Sprint 4 Goals | Sale Returns (Credit Notes), Quotations, Purchase Bills (inward GST), Purchase Returns (Debit Notes), Purchase Orders |
| Sprint 5 Goals | Inventory auto-deduction on invoice save, Stock adjustment, Low stock alerts, Payment-In / Payment-Out ledger, Dashboard KPI tiles and charts |
| Deliverable | End-to-end billing cycle: create invoice → payment → stock update → dashboard refresh |

## Phase 3 — Reports & GST (Weeks 11–14 | Sprints 6–7)

| Sprint 6 Goals | GSTR-1 report (B2B, B2C, HSN summary, credit notes, JSON export), GSTR-3B summary (ITC computation, tax payable), GST Sales / Purchase Register, Input/Output Tax report |
| --- | --- |
| Sprint 7 Goals | Profit & Loss report, Balance Sheet, Cash Book, Daily Summary, Inventory reports (stock availability, fast/slow moving, item register), Customer / Supplier account statements |
| Deliverable | Complete reports suite; GSTR JSON downloadable and validated against government format |

## Phase 4 — Tools, Permissions & Polish (Weeks 15–18 | Sprints 8–9)

| Sprint 8 Goals | Barcode generator, GST calculator tool, CSV/Excel bulk import (items + customers), Reminder system (scheduled SMS/email), Bulk tax update, Item variant creator |
| --- | --- |
| Sprint 9 Goals | Full RBAC enforcement across all UI and API, Audit logs viewer, Dark/Light theme completion, Mobile responsive polish, Real-time notifications (Socket.io), Backup & restore |
| Deliverable | Production-grade feature-complete system with all modules working end-to-end |

## Phase 5 — Testing, Performance & Launch (Weeks 19–24 | Sprints 10–12)

| Sprint 10 Goals | Full unit test coverage (Jest), Integration tests for all API endpoints, E2E Playwright test scripts for critical flows |
| --- | --- |
| Sprint 11 Goals | Performance optimization (DB indexes, query profiling, API response caching), Security audit (OWASP Top 10 checklist), Penetration testing (auth, injection, IDOR) |
| Sprint 12 Goals | UAT (User Acceptance Testing) with 3–5 real Indian businesses, Bug fixes, Documentation finalization, Production deployment, DNS + SSL + monitoring setup |
| Deliverable | Live production release with monitoring, error tracking, and on-call runbook |

# 14\. Deployment Guide

## 14.1 Frontend Deployment (Vercel)

\# Connect GitHub repo to Vercel project

\# Set environment variables in Vercel Dashboard:

\# NEXT\_PUBLIC\_API\_URL = https://api.yourdomain.com/api/v1

\# Vercel auto-deploys on push to main

\# Preview deployments on every PR

\# Custom domain:

\# Add A record: @ → 76.76.21.21 (Vercel IP)

\# Add CNAME: www → cname.vercel-dns.com

## 14.2 Backend Deployment (Docker + AWS ECS / Render)

\# Build Docker image

docker build -t erp-backend:latest .

\# Push to AWS ECR

aws ecr get-login-password | docker login --username AWS --password-stdin <ecr-url>

docker tag erp-backend:latest <ecr-url>/erp-backend:latest

docker push <ecr-url>/erp-backend:latest

\# ECS Task Definition: 2 vCPU, 4 GB RAM, port 5000

\# Application Load Balancer → ECS Service (min 1, max 3 tasks)

\# OR deploy to Render (simpler):

\# Connect GitHub → Render service → set env vars → deploy

## 14.3 Production Checklist

| ✅ Environment Variables | All secrets in AWS Secrets Manager / Vercel; no .env files in production |
| --- | --- |
| ✅ HTTPS | SSL certificate on ALB (ACM) and Vercel; HSTS header set; HTTP → HTTPS redirect |
| ✅ MongoDB Atlas | M10 cluster minimum; network access restricted to backend IP; backups enabled |
| ✅ Monitoring | CloudWatch alarms: CPU > 80%, error rate > 1%, latency > 2s → PagerDuty alert |
| ✅ Error Tracking | Sentry initialized in both frontend and backend with release tags |
| ✅ CDN / Caching | Vercel edge caches static assets; API responses: Cache-Control headers |
| ✅ Rate Limiting | express-rate-limit active; Cloudflare WAF rules for bot protection |
| ✅ CORS | Only frontend domain(s) in allowlist; credentials: true; methods restricted |
| ✅ Audit Logs | auditLogs collection writing on every mutating action |
| ✅ Backup Test | Perform a test restore from Atlas backup before go-live |

# 15\. Future Enhancements Roadmap

| E-Invoice (IRN / IRP) | Phase 2 (Q3 2025): Integrate with Invoice Registration Portal API to auto-generate IRN and embed digitally-signed QR on invoices — mandatory for turnover > ₹5 Cr |
| --- | --- |
| E-Way Bill Integration | Phase 2 (Q3 2025): Auto-fill e-Way Bill portal via NIC API for consignments exceeding ₹50,000 (required for GST compliance) |
| Mobile Application | Phase 3: React Native app; offline-first invoice creation with sync; barcode scanner via camera; UPI payment confirmation push notification |
| OCR Bill Scanner | Phase 3: Upload supplier bill image → Tesseract.js / Google Vision OCR extracts vendor name, amounts, GSTIN → auto-populates purchase form |
| WhatsApp Business API | Phase 3: Send invoices, payment reminders, and low-stock alerts via WhatsApp Business API (Meta); two-way payment confirmation |
| AI Business Analytics | Phase 4: LLM-powered insights — 'Your top 3 products by margin this month', cash flow prediction, anomaly detection in expenses |
| AI Stock Prediction | Phase 4: LSTM / Prophet time-series model trained on sales history to predict reorder quantities and prevent stockouts |
| AI Expense Categorization | Phase 4: Auto-categorize expenses using NLP on the description field; reduces manual entry |
| Multi-language Support | Phase 4: Hindi, Tamil, Telugu, Marathi, Kannada — using i18next and a translation management system |
| E-commerce Integration | Phase 4: Sync products and orders from Shopify, WooCommerce, Amazon Seller Central, Flipkart Seller Hub |
| Tally Sync | Phase 4: Real-time bidirectional sync with Tally Prime for businesses maintaining dual systems during migration |
| Voice Billing | Phase 5: Browser speech recognition API — dictate item names and quantities for hands-free invoice creation in retail/service environments |

_— End of Document —_

Indian Business Management ERP | Product & Process Documentation | Version 1.0 | May 2025