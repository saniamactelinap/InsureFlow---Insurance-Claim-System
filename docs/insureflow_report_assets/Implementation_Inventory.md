# InsureFlow — Implementation Inventory & Technical Baseline

**Project Title:** InsureFlow — Smart Insurance Claim Processing and Settlement Management System  
**Architecture:** MERN Full-Stack Web Application (MongoDB, Express, React 18, Node.js v22)  
**Audit Date:** October 2026  
**Auditor:** Antigravity IDE Technical Documentation Specialist  

---

## 1. Verified User Roles & Permissions Matrix

The InsureFlow authentication and authorization layer (`server/src/middleware/roleMiddleware.js` and `client/src/components/auth/ProtectedRoute.jsx`) defines five distinct roles:

| Role Identifier | System Label | Core Operational Responsibilities | Authorized Routes / Features |
| :--- | :--- | :--- | :--- |
| `CUSTOMER` | Policyholder | Browse policy catalog, register external policies, submit FNOL insurance claims, upload invoices and medical proofs, track claim timeline, view settlement bank vouchers. | `/customer/dashboard`, `/customer/claims`, `/customer/claims/new`, `/customer/claims/:id`, `/customer/policies`, `/customer/settlements` |
| `OFFICER` | Verification Officer | Access unassigned claims queue, inspect side-by-side OCR extractions, evaluate deterministic rule validation scores, request missing documents, formulate recommendations, audit external policies. | `/officer/queue`, `/officer/adjudicate/:id`, `/officer/documents`, `/officer/policies` |
| `SURVEYOR` | Technical Surveyor | Access assigned inspection roster, perform physical damage assessment, submit technical survey reports with damage evaluations and repair estimates. | `/surveyor/roster`, `/surveyor/inspect/:id`, `/surveyor/reports` |
| `MANAGER` | Claims Manager | Review escalated claims and surveyor inspection reports, execute final financial adjudication (Approve, Reject, Inquire), authorize settlement voucher disbursement. | `/manager/escalations`, `/manager/review/:id`, `/manager/settlements`, `/manager/analytics` |
| `ADMIN` | System Administrator | Manage underwriting policy product catalog (create, edit, publish), configure rule engine parameters and active status, govern user accounts, inspect audit logs. | `/admin/catalog`, `/admin/catalog/new`, `/admin/rules`, `/admin/users`, `/admin/audit-logs` |

---

## 2. Verified Mongoose Domain Models (14 Collections)

All persistent entities are located in `server/src/models/` and utilize Mongoose schema definitions:

1. **`User`** (`server/src/models/User.js`):
   - Fields: `_id`, `name`, `email` (unique), `password` (bcrypt hash), `role` (enum: CUSTOMER, OFFICER, SURVEYOR, MANAGER, ADMIN), `department`, `phone`, `isActive`, `createdAt`, `updatedAt`.
   - Security: Password automatically omitted via `toJSON()`, bcrypt pre-save hook, password comparison method.

2. **`PolicyProduct`** (`server/src/models/PolicyProduct.js`):
   - Fields: `_id`, `productName`, `insurer`, `category` (HEALTH, VEHICLE, PROPERTY), `planCode` (unique), `description`, `coverageLimit`, `deductible`, `annualPremium`, `durationMonths`, `eligibilityCriteria` (array of strings), `keyBenefits` (array of strings), `exclusions` (array of strings), `requiredDocuments` (array of strings), `officialUrl`, `isPublished`, `isDemonstration`.

3. **`CustomerPolicy`** (`server/src/models/CustomerPolicy.js`):
   - Fields: `_id`, `customer` (`Ref: User`), `product` (`Ref: PolicyProduct`), `policySource` (PLATFORM, EXTERNAL), `policyNumber` (unique), `insurerName`, `category`, `coverageAmount`, `deductible`, `startDate`, `endDate`, `verificationStatus` (PENDING, VERIFIED, REJECTED), `verifiedBy` (`Ref: User`), `policyDocumentUrl`.

4. **`PolicyApplication`** (`server/src/models/PolicyApplication.js`):
   - Fields: `_id`, `customer` (`Ref: User`), `product` (`Ref: PolicyProduct`), `applicantName`, `applicantEmail`, `applicantPhone`, `category`, `coverageAmount`, `proposedStartDate`, `nominee`, `kycDocumentUrl`, `applicationStatus` (SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED), `reviewedBy` (`Ref: User`), `reviewNotes`.

5. **`Claim`** (`server/src/models/Claim.js`):
   - Fields: `_id`, `claimReference` (unique, e.g. `CLM-20261015-1234`), `customer` (`Ref: User`), `customerPolicy` (`Ref: CustomerPolicy`), `assignedOfficer` (`Ref: User`), `assignedSurveyor` (`Ref: User`), `category`, `claimType` (CASHLESS, REIMBURSEMENT), `incidentDate`, `incidentDescription`, `incidentLocation`, `requestedAmount`, `approvedAmount`, `status` (15-state FSM), `rejectionReason`, `returnNotes`, `automatedValidation` (embedded score & rule list), `isHighValueClaim`, `surveyAssignment` (`Ref: SurveyAssignment`), `surveyReport` (`Ref: SurveyReport`), `settlement` (`Ref: Settlement`).

6. **`ClaimDocument`** (`server/src/models/ClaimDocument.js`):
   - Fields: `_id`, `claim` (`Ref: Claim`), `uploadedBy` (`Ref: User`), `documentCategory` (MEDICAL_BILL, DISCHARGE_SUMMARY, POLICE_FIR, REPAIR_ESTIMATE, PHOTO_PROOF, KYC, OTHER), `fileName`, `originalName`, `filePath`, `mimeType`, `sizeBytes`, `fileUrl`.

7. **`OCRJob`** (`server/src/models/OCRJob.js`):
   - Fields: `_id`, `claimDocument` (`Ref: ClaimDocument`), `claim` (`Ref: Claim`), `status` (PENDING, PROCESSING, COMPLETED, FAILED), `extractedText`, `extractedFields` (invoiceNumber, totalAmount, invoiceDate, vendorName, confidenceScore), `opticalConfidence`, `fieldConfidence`, `processingTimeMs`, `errorMessage`.

8. **`ConfigurableRule`** (`server/src/models/ConfigurableRule.js`):
   - Fields: `_id`, `ruleId` (unique), `ruleName`, `category`, `description`, `isEnabled`, `severity` (INFO, WARNING, CRITICAL), `parameters` (thresholdAmount, maxAgeDays, requireInvoiceNumber).

9. **`SurveyAssignment`** (`server/src/models/SurveyAssignment.js`):
   - Fields: `_id`, `claim` (`Ref: Claim`), `surveyor` (`Ref: User`), `assignedBy` (`Ref: User`), `status` (ASSIGNED, SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED), `scheduledDate`, `instructions`, `assignedAt`.

10. **`SurveyReport`** (`server/src/models/SurveyReport.js`):
    - Fields: `_id`, `claim` (`Ref: Claim`), `surveyor` (`Ref: User`), `inspectionDate`, `inspectionLocation`, `damageAssessment`, `estimatedRepairCost`, `isClaimValid`, `photoUrls` (array of strings), `summaryRemarks`, `submittedAt`.

11. **`Settlement`** (`server/src/models/Settlement.js`):
    - Fields: `_id`, `settlementReference` (unique, e.g. `SET-20261015-5678`), `claim` (`Ref: Claim`), `customer` (`Ref: User`), `approvedAmount`, `paymentMethod` (BANK_TRANSFER, CHEQUE, UPI), `status` (PENDING, PROCESSING, SETTLED, FAILED), `transactionReference`, `authorizedBy` (`Ref: User`), `authorizedAt`, `disbursedAt`, `bankDetails`.

12. **`ClaimTimelineEvent`** (`server/src/models/ClaimTimelineEvent.js`):
    - Fields: `_id`, `claim` (`Ref: Claim`), `fromStatus`, `toStatus`, `performedBy` (`Ref: User`), `role`, `action`, `notes`, `timestamp`.

13. **`Notification`** (`server/src/models/Notification.js`):
    - Fields: `_id`, `recipient` (`Ref: User`), `type` (CLAIM_STATUS, DOCUMENT_REQUEST, SURVEY_ASSIGNED, SETTLEMENT_READY, SYSTEM_ALERT), `title`, `message`, `link`, `isRead`, `createdAt`.

14. **`AuditLog`** (`server/src/models/AuditLog.js`):
    - Fields: `_id`, `user` (`Ref: User`), `userRole`, `action`, `resourceType`, `resourceId`, `ipAddress`, `userAgent`, `details`, `timestamp`.

---

## 3. Verified Finite State Machine (15 Lifecycle States)

Located in `server/src/services/stateMachineService.js`:

1. `SUBMITTED`: Initial ingestion upon digital claim submission.
2. `DOCUMENT_PROCESSING`: OCR extraction and automated rule evaluation active.
3. `UNDER_REVIEW`: Claim positioned in the officer verification queue.
4. `DOCUMENTS_REQUIRED`: Officer flagged missing documentation; customer upload pending.
5. `SURVEYOR_ASSIGNED`: Technical inspection dispatched to licensed surveyor.
6. `SURVEY_IN_PROGRESS`: Surveyor scheduled or conducting on-site assessment.
7. `SURVEY_COMPLETED`: Surveyor report uploaded with damage evaluation.
8. `MANAGER_REVIEW`: Officer recommended approval/rejection; escalated to executive queue.
9. `APPROVED`: Manager authorized claim payout.
10. `REJECTED`: Manager or system rejected claim with documented cause.
11. `SETTLEMENT_PENDING`: Financial record created; voucher queued for processing.
12. `SETTLEMENT_PROCESSING`: Treasury bank clearance initiated.
13. `SETTLED`: Funds disbursed to policyholder bank account; terminal success state.
14. `CLOSED`: Administrative finalization of claim history.
15. `CANCELLED`: Voluntary withdrawal by policyholder prior to review.

---

## 4. Verified Automated Rule Engine (7 Deterministic Checks)

Located in `server/src/services/ruleEngineService.js`:

1. `RULE_ACTIVE_POLICY_ON_INCIDENT`: Validates that incident date falls strictly between policy `startDate` and `endDate`.
2. `RULE_CATEGORY_MATCH`: Confirms that claim category (HEALTH, VEHICLE, PROPERTY) matches policy underwriting line.
3. `RULE_COVERAGE_LIMIT`: Verifies that requested claim amount does not exceed policy `coverageLimit`.
4. `RULE_DOCUMENT_COMPLETENESS`: Inspects uploaded attachments against policy required document checklist.
5. `RULE_DUPLICATE_CLAIM`: Queries database for identical claim submissions within a 30-day window.
6. `RULE_EXTERNAL_POLICY_VERIFICATION`: Enforces strict officer pre-verification for third-party registered policies.
7. `RULE_SURVEYOR_THRESHOLD`: Triggers mandatory technical surveyor inspection if requested amount exceeds ₹5,000 or category is VEHICLE/PROPERTY.

---

## 5. Verified RESTful API Endpoint Inventory (13 Modules)

| Route Prefix | Controller Module | Primary Endpoints | Access Guard |
| :--- | :--- | :--- | :--- |
| `/api/auth` | `authController.js` | `POST /register`, `POST /login`, `GET /me`, `PUT /profile` | Public & Authenticated |
| `/api/policy-products` | `policyProductController.js` | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` | Public / Admin |
| `/api/customer-policies` | `customerPolicyController.js` | `GET /`, `GET /:id`, `POST /external`, `PUT /:id/verify` | Customer / Officer / Admin |
| `/api/policy-applications` | `policyApplicationController.js` | `GET /`, `POST /`, `GET /:id`, `PUT /:id/review` | Customer / Officer / Admin |
| `/api/claims` | `claimController.js` | `GET /`, `POST /`, `GET /:id`, `POST /:id/documents`, `POST /:id/recommend` | Customer / Officer / Admin |
| `/api/manager` | `managerController.js` | `GET /escalations`, `POST /claims/:id/approve`, `POST /claims/:id/reject` | Manager / Admin |
| `/api/surveys` | `surveyController.js` | `GET /roster`, `POST /assign`, `POST /:id/report`, `GET /:id` | Surveyor / Officer / Manager |
| `/api/settlements` | `settlementController.js` | `GET /`, `GET /:id`, `PUT /:id/process`, `PUT /:id/disburse` | Customer / Manager / Admin |
| `/api/ocr` | `ocrController.js` | `POST /process`, `GET /job/:id`, `GET /claim/:claimId` | Officer / Admin |
| `/api/rules` | `ruleController.js` | `GET /`, `PUT /:id`, `POST /evaluate/:claimId` | Admin / Officer |
| `/api/notifications` | `notificationController.js` | `GET /`, `PUT /:id/read`, `PUT /read-all` | Authenticated Users |
| `/api/dashboard` | `dashboardController.js` | `GET /metrics` | Role-partitioned |
| `/api/audit-logs` | `auditLogController.js` | `GET /` | Admin |

---

## 6. Verified Client Navigation Architecture (33 Routes)

Located in `client/src/App.jsx` and guarded by `ProtectedRoute.jsx`:

- **Public Routes (11 Views):** `/`, `/login`, `/register`, `/catalog`, `/catalog/:id`, `/about`, `/faq`, `/contact`, `/terms`, `/privacy`, `/404`.
- **Customer Workspace (7 Views):** `/customer/dashboard`, `/customer/claims`, `/customer/claims/new`, `/customer/claims/:id`, `/customer/policies`, `/customer/settlements`, `/customer/profile`.
- **Officer Workspace (4 Views):** `/officer/queue`, `/officer/adjudicate/:id`, `/officer/documents`, `/officer/policies`.
- **Surveyor Workspace (3 Views):** `/surveyor/roster`, `/surveyor/inspect/:id`, `/surveyor/reports`.
- **Manager Workspace (4 Views):** `/manager/escalations`, `/manager/review/:id`, `/manager/settlements`, `/manager/analytics`.
- **Admin Workspace (5 Views):** `/admin/catalog`, `/admin/catalog/new`, `/admin/rules`, `/admin/users`, `/admin/audit-logs`.
