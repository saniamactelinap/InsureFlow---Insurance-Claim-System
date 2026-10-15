import fs from 'fs';
import path from 'path';

const assetsDir = 'C:/Users/apste/Desktop/SM/F-U/docs/insureflow_report_assets';

// -------------------------------------------------------------
// 1. System Architecture
// -------------------------------------------------------------
const puml1 = `@startuml 01_System_Architecture
!theme plain
skinparam monochrome true
skinparam defaultFontName "Segoe UI"
skinparam packageStyle rectangle

title Figure 1: Four-Tier System Architecture of InsureFlow

package "Tier 1: Client Presentation Tier (React 18 & Vite)" {
  [Customer Portal\\n(Browse, Apply, Claim, Status)] as CustApp
  [Officer Workstation\\n(Queue, OCR Audit, Rules)] as OffApp
  [Surveyor Console\\n(Roster, Damage Report)] as SurvApp
  [Manager Adjudication\\n(Escalations, Approval)] as MgrApp
  [Admin Management\\n(Catalog, Rules, Audit)] as AdminApp
}

package "Tier 2: API Gateway & Security (Node.js & Express)" {
  [JWT & RBAC Middleware] as AuthGuard
  [Multer Multipart Streamer\\n(UUID Sanitizer, 10MB)] as UploadGuard
  [Helmet, CORS & Error Handler] as SecGuard
}

package "Tier 3: Core Business Logic Services" {
  [13 REST Controllers] as Controllers
  [Deterministic Rule Engine\\n(7 Automated Checks)] as RuleEngine
  [Finite State Machine\\n(15 Legal States)] as FSM
  [OCR Processing Engine\\n(pdf-parse + Tesseract.js)] as OCREngine
  [Settlement & Notification] as Notify
}

package "Tier 4: Data Persistence & Storage" {
  database "MongoDB Atlas\\n(Primary Cloud Replica Set)" as Atlas
  database "In-Memory MongoDB\\n(mongodb-memory-server)" as MemDB
  folder "Local Disk Storage\\n(server/uploads/)" as LocalDisk
}

CustApp --> AuthGuard : HTTP / JSON (Bearer Token)
OffApp --> AuthGuard
SurvApp --> AuthGuard
MgrApp --> AuthGuard
AdminApp --> AuthGuard

AuthGuard --> Controllers
UploadGuard --> LocalDisk : Store PDFs / Images
Controllers --> RuleEngine
Controllers --> FSM
Controllers --> OCREngine
Controllers --> Notify

Controllers --> Atlas : Mongoose ODM (14 Schemas)
Controllers ..> MemDB : Automatic Fallback
@enduml`;

const mmd1 = `graph TD
  classDef default fill:#ffffff,stroke:#000000,stroke-width:1.5px,color:#000000;
  
  subgraph T1["Tier 1: Client Presentation Tier (React 18 & Vite)"]
    CP["Customer Portal<br/>(Catalog, Claims, Status)"]
    OW["Officer Workstation<br/>(Queue, OCR Audit, Rules)"]
    SC["Surveyor Console<br/>(Roster, Damage Reports)"]
    MA["Manager Adjudication<br/>(Escalations, Approvals)"]
    AM["Admin Console<br/>(Catalog, Rules, Logs)"]
  end

  subgraph T2["Tier 2: API Gateway & Security (Express 4.21)"]
    GW["JWT Authentication & RBAC Guard"]
    UP["Multer File Streamer (UUID v4)"]
    SEC["Helmet & CORS Security"]
  end

  subgraph T3["Tier 3: Business Microservices & Automation"]
    CTRL["13 REST Controllers"]
    RE["Rule Engine (7 Automated Checks)"]
    FSM["Finite State Machine (15 States)"]
    OCR["OCR Engine (pdf-parse + Tesseract.js)"]
    SET["Settlement & Notification Engine"]
  end

  subgraph T4["Tier 4: Persistence & Storage"]
    DB[("MongoDB Atlas Cloud Database")]
    MEMDB[("In-Memory MongoDB Fallback")]
    DISK[("Local File Uploads Storage")]
  end

  CP --> GW
  OW --> GW
  SC --> GW
  MA --> GW
  AM --> GW

  GW --> CTRL
  UP --> DISK
  CTRL --> RE
  CTRL --> FSM
  CTRL --> OCR
  CTRL --> SET

  CTRL --> DB
  CTRL -.-> MEMDB`;

// -------------------------------------------------------------
// 2. UML Domain Model & Class Diagram
// -------------------------------------------------------------
const puml2 = `@startuml 02_UML_Domain_Model
!theme plain
skinparam monochrome true
skinparam defaultFontName "Consolas"
skinparam classAttributeIconSize 0

title Figure 2: UML Domain Model & Class Diagram of InsureFlow

class User <<Mongoose Model>> {
  + _id: ObjectId [PK]
  + name: String
  + email: String [UNIQUE]
  + password: String
  + role: Enum (5 Roles)
  + department: String
  + phone: String
  + isActive: Boolean
  --
  + comparePassword(pwd): Boolean
  + toJSON(): Omit Password
}

class PolicyProduct <<Mongoose Model>> {
  + _id: ObjectId [PK]
  + productName: String
  + insurer: String
  + category: Enum (HEALTH, VEHICLE, PROPERTY)
  + planCode: String [UNIQUE]
  + coverageLimit: Number
  + deductible: Number
  + annualPremium: Number
  + isPublished: Boolean
  --
  + validatePlanCode(): Boolean
}

class CustomerPolicy <<Mongoose Model>> {
  + _id: ObjectId [PK]
  + customer: Ref<User>
  + product: Ref<PolicyProduct>
  + policySource: Enum (PLATFORM, EXTERNAL)
  + policyNumber: String [UNIQUE]
  + coverageAmount: Number
  + startDate: Date
  + endDate: Date
  + verificationStatus: Enum
  --
  + isCoveredOn(date): Boolean
}

class Claim <<Mongoose Model>> {
  + _id: ObjectId [PK]
  + claimReference: String [UNIQUE]
  + customer: Ref<User>
  + customerPolicy: Ref<CustomerPolicy>
  + assignedOfficer: Ref<User>
  + assignedSurveyor: Ref<User>
  + category: Enum
  + requestedAmount: Number
  + approvedAmount: Number
  + status: Enum (15 States)
  + isHighValueClaim: Boolean
  --
  + canTransitionTo(target, role): Boolean
}

class ClaimDocument <<Mongoose Model>> {
  + _id: ObjectId [PK]
  + claim: Ref<Claim>
  + uploadedBy: Ref<User>
  + documentCategory: Enum
  + fileName: String
  + mimeType: String
  + sizeBytes: Number
}

class OCRJob <<Mongoose Model>> {
  + _id: ObjectId [PK]
  + claimDocument: Ref<ClaimDocument>
  + claim: Ref<Claim>
  + status: Enum
  + extractedText: String
  + confidenceScore: Number
}

class SurveyReport <<Mongoose Model>> {
  + _id: ObjectId [PK]
  + claim: Ref<Claim>
  + surveyor: Ref<User>
  + inspectionDate: Date
  + damageAssessment: String
  + estimatedRepairCost: Number
  + isClaimValid: Boolean
}

class Settlement <<Mongoose Model>> {
  + _id: ObjectId [PK]
  + settlementReference: String [UNIQUE]
  + claim: Ref<Claim>
  + customer: Ref<User>
  + approvedAmount: Number
  + paymentMethod: Enum
  + status: Enum (PENDING, SETTLED)
  + authorizedBy: Ref<User>
}

User "1" -- "0..*" CustomerPolicy : owns >
PolicyProduct "1" -- "0..*" CustomerPolicy : instantiates >
CustomerPolicy "1" -- "0..*" Claim : covers >
User "1" -- "0..*" Claim : files >
Claim "1" -- "1..*" ClaimDocument : contains >
ClaimDocument "1" -- "1" OCRJob : analyzed by >
Claim "1" -- "0..1" SurveyReport : assessed by >
Claim "1" -- "0..1" Settlement : generates >
@enduml`;

const mmd2 = `classDiagram
  class User {
    +ObjectId _id
    +String name
    +String email
    +String password
    +Enum role
    +Boolean isActive
    +comparePassword(pwd) Boolean
  }

  class PolicyProduct {
    +ObjectId _id
    +String productName
    +String insurer
    +Enum category
    +String planCode
    +Number coverageLimit
    +Boolean isPublished
  }

  class CustomerPolicy {
    +ObjectId _id
    +Ref customer
    +Ref product
    +Enum policySource
    +String policyNumber
    +Date startDate
    +Date endDate
    +isCoveredOn(date) Boolean
  }

  class Claim {
    +ObjectId _id
    +String claimReference
    +Ref customer
    +Ref customerPolicy
    +Number requestedAmount
    +Number approvedAmount
    +Enum status
    +Boolean isHighValueClaim
  }

  class ClaimDocument {
    +ObjectId _id
    +Ref claim
    +Enum documentCategory
    +String fileName
    +String mimeType
  }

  class OCRJob {
    +ObjectId _id
    +Ref claimDocument
    +Enum status
    +String extractedText
    +Number confidenceScore
  }

  class SurveyReport {
    +ObjectId _id
    +Ref claim
    +Ref surveyor
    +String damageAssessment
    +Number estimatedRepairCost
    +Boolean isClaimValid
  }

  class Settlement {
    +ObjectId _id
    +String settlementReference
    +Ref claim
    +Number approvedAmount
    +Enum status
  }

  User "1" --> "0..*" CustomerPolicy
  PolicyProduct "1" --> "0..*" CustomerPolicy
  CustomerPolicy "1" --> "0..*" Claim
  Claim "1" --> "1..*" ClaimDocument
  ClaimDocument "1" --> "1" OCRJob
  Claim "1" --> "0..1" SurveyReport
  Claim "1" --> "0..1" Settlement`;

// -------------------------------------------------------------
// 3. Claim Processing Sequence
// -------------------------------------------------------------
const puml3 = `@startuml 03_Claim_Processing_Sequence
!theme plain
skinparam monochrome true
skinparam defaultFontName "Segoe UI"
skinparam sequenceMessageAlign center

title Figure 3: UML Sequence Diagram for Claim Processing Lifecycle

actor Customer as Cust
boundary "React Client" as UI
control "Express Gateway" as API
control "Claim Controller" as CTRL
entity "Rule & OCR Engine" as Engines
database "MongoDB Atlas" as DB
actor "Reviewer Staff" as Staff

Cust -> UI : Fill Claim & Attach Bills
UI -> API : POST /api/claims (multipart/form-data)
API -> CTRL : Verify JWT & Multer save file
CTRL -> DB : Claim.create({ status: 'SUBMITTED' })
DB --> CTRL : claimDoc (CLM-xxx)

CTRL -> Engines : ocrService.processDocument(docId)
Engines -> DB : OCRJob.create({ extractedFields })

CTRL -> Engines : ruleEngineService.evaluateClaim(claimId)
Engines -> DB : Read policy caps & dates
Engines --> CTRL : ValidationResult (Score & Flags)

CTRL --> UI : HTTP 201 Created (ClaimReference)
UI --> Cust : Render Status Dashboard

Staff -> API : GET /api/claims (Officer Queue)
API --> Staff : Live Claims with OCR Badges

alt If requestedAmount >= 5000 or Vehicular/Property Damage
  Staff -> API : POST /api/surveys/assign
  API -> DB : status -> 'SURVEYOR_ASSIGNED'
  Staff -> API : POST /api/surveys/:id/report
  API -> DB : SurveyReport.create() & status -> 'UNDER_REVIEW'
end

Staff -> API : POST /api/claims/:id/recommend
API -> DB : status -> 'MANAGER_REVIEW'

alt Manager Adjudication
  Staff -> API : POST /api/manager/claims/:id/approve
  API -> DB : status -> 'APPROVED' & Settlement.create()
  Staff -> API : PUT /api/settlements/:id/disburse
  API -> DB : status -> 'SETTLED'
  API -> Cust : Dispatched Bank Settlement Notification
else Reject
  Staff -> API : POST /api/manager/claims/:id/reject
  API -> DB : status -> 'REJECTED'
end
@enduml`;

const mmd3 = `sequenceDiagram
  autonumber
  actor Cust as Customer
  participant UI as React Client
  participant API as Express Gateway
  participant CTRL as Claim Controller
  participant ENG as Rule & OCR Engine
  participant DB as MongoDB Atlas
  actor Staff as Reviewer Staff

  Cust->>UI: Fill Claim & Attach Bills
  UI->>API: POST /api/claims (Multipart Form Data)
  API->>CTRL: Verify JWT & Multer Save File
  CTRL->>DB: Claim.create({ status: 'SUBMITTED' })
  DB-->>CTRL: claimDoc (CLM-xxx)
  
  CTRL->>ENG: ocrService.processDocument(docId)
  ENG->>DB: OCRJob.create({ extractedFields })

  CTRL->>ENG: ruleEngineService.evaluateClaim(claimId)
  ENG->>DB: Read Policy Caps & Coverage Dates
  ENG-->>CTRL: ValidationResult (Score, Flags)

  CTRL-->>UI: HTTP 201 Created (CLM-xxx)
  UI-->>Cust: Render Status Timeline

  Staff->>API: GET /api/claims (Officer Queue)
  API-->>Staff: Live Claims List with OCR Badges

  opt If requestedAmount >= 5000 or Vehicle/Property Damage
    Staff->>API: POST /api/surveys/assign (Assign Surveyor)
    API->>DB: Claim.status -> 'SURVEYOR_ASSIGNED'
    Staff->>API: POST /api/surveys/:id/report (Survey Damage Report)
    API->>DB: SurveyReport.create() & status -> 'UNDER_REVIEW'
  end

  Staff->>API: POST /api/claims/:id/recommend (Escalate)
  API->>DB: Claim.status -> 'MANAGER_REVIEW'

  alt Manager Adjudication: Approved
    Staff->>API: POST /api/manager/claims/:id/approve
    API->>DB: Claim.status -> 'APPROVED' & Settlement.create()
    Staff->>API: PUT /api/settlements/:id/disburse (Finance Transfer)
    API->>DB: Settlement.status -> 'SETTLED'
    API-->>Cust: Dispatch Bank Settlement Notification
  else Manager Adjudication: Rejected
    Staff->>API: POST /api/manager/claims/:id/reject
    API->>DB: Claim.status -> 'REJECTED'
  end`;

// -------------------------------------------------------------
// 4. UML Use-Case Diagram
// -------------------------------------------------------------
const puml4 = `@startuml 04_UML_Use_Case
!theme plain
skinparam monochrome true
skinparam defaultFontName "Segoe UI"
skinparam packageStyle rectangle

title Figure 4: UML Use-Case Diagram of InsureFlow

actor Customer as Cust
actor "Field Surveyor" as Surv
actor "Insurance Officer" as Off
actor "Claims Manager" as Mgr
actor Administrator as Admin

rectangle "InsureFlow System Boundary" {
  (Browse & Compare Catalog) as UC1
  (Register External Policy) as UC2
  (Submit Digital Claim) as UC3
  (Upload Supporting Invoices) as UC4
  (Track Claim Timeline) as UC5
  (View Settlement Voucher) as UC6

  (Access Work Queue) as UC7
  (Audit OCR Extracted Data) as UC8
  (Evaluate Rule Compliance) as UC9
  (Request Missing Docs / Assign Surveyor) as UC10
  (Formulate Recommendation) as UC11
  (Verify External Policies) as UC12

  (Access Inspection Roster) as UC13
  (Conduct Damage Inspection) as UC14
  (Submit Survey Report) as UC15

  (Review Escalated Claims) as UC16
  (Execute Decision Approve/Reject) as UC17
  (Authorize Settlement Payout) as UC18

  (Manage Policy Catalog) as UC19
  (Configure Rule Engine) as UC20
  (Govern User Roles) as UC21
  (Inspect System Audit Logs) as UC22
}

Cust --> UC1
Cust --> UC2
Cust --> UC3
Cust --> UC4
Cust --> UC5
Cust --> UC6

Surv --> UC13
Surv --> UC14
Surv --> UC15

Off --> UC7
Off --> UC8
Off --> UC9
Off --> UC10
Off --> UC11
Off --> UC12

Mgr --> UC16
Mgr --> UC17
Mgr --> UC18

Admin --> UC19
Admin --> UC20
Admin --> UC21
Admin --> UC22
@enduml`;

const mmd4 = `graph LR
  classDef default fill:#ffffff,stroke:#000000,stroke-width:1.5px,color:#000000;

  Cust["fa:fa-user Customer<br/>(Policyholder)"]
  Surv["fa:fa-search Field Surveyor<br/>(Loss Assessor)"]
  Off["fa:fa-clipboard Insurance Officer<br/>(Adjudicator)"]
  Mgr["fa:fa-balance-scale Claims Manager<br/>(Executive)"]
  Admin["fa:fa-cog Administrator<br/>(System Admin)"]

  subgraph InsureFlow["InsureFlow System Boundary"]
    UC1(["UC-01: Browse & Compare Policies"])
    UC2(["UC-02: Register External Policy"])
    UC3(["UC-03: Submit Digital Claim (FNOL)"])
    UC4(["UC-04: Upload Supporting Invoices"])
    UC5(["UC-05: Track Claim Timeline & Status"])
    UC6(["UC-06: View Settlement Voucher"])

    UC7(["UC-07: Access Claims Work Queue"])
    UC8(["UC-08: Audit OCR Extracted Data"])
    UC9(["UC-09: Evaluate Rule Compliance"])
    UC10(["UC-10: Request Docs / Assign Surveyor"])
    UC11(["UC-11: Recommend Escalation"])
    UC12(["UC-12: Audit External Policies"])

    UC13(["UC-13: Access Inspection Roster"])
    UC14(["UC-14: Conduct Damage Inspection"])
    UC15(["UC-15: Submit Technical Survey Report"])

    UC16(["UC-16: Review Escalated Claims"])
    UC17(["UC-17: Executive Adjudication"])
    UC18(["UC-18: Authorize Settlement Payout"])

    UC19(["UC-19: Manage Policy Catalog"])
    UC20(["UC-20: Configure Rule Parameters"])
    UC21(["UC-21: Govern User Roles & RBAC"])
    UC22(["UC-22: Inspect System Audit Logs"])
  end

  Cust --- UC1
  Cust --- UC2
  Cust --- UC3
  Cust --- UC4
  Cust --- UC5
  Cust --- UC6

  Surv --- UC13
  Surv --- UC14
  Surv --- UC15

  Off --- UC7
  Off --- UC8
  Off --- UC9
  Off --- UC10
  Off --- UC11
  Off --- UC12

  Mgr --- UC16
  Mgr --- UC17
  Mgr --- UC18

  Admin --- UC19
  Admin --- UC20
  Admin --- UC21
  Admin --- UC22`;

// -------------------------------------------------------------
// 5. UML Activity Diagram
// -------------------------------------------------------------
const puml5 = `@startuml 05_Claim_Activity_Diagram
!theme plain
skinparam monochrome true
skinparam defaultFontName "Segoe UI"

title Figure 5: UML Activity Diagram of InsureFlow

start
:Fill Claim Form & Incident Details;
:Upload Supporting Documents (PDF / Images);

if (Mandatory Documents Present?) then (No)
  :Transition to DOCUMENTS_REQUIRED;
  :Customer Uploads Missing Evidence;
else (Yes)
  :Store Files via Multer (UUID Hash);
endif

:Trigger Asynchronous OCR Job;
:Execute 7 Deterministic Rule Checks;

if (Rule Validation Score >= 70%?) then (Pass)
  :Flag Low-Risk Track;
else (Flagged / Fail)
  :Flag High-Risk Audit Required;
endif

:Deliver to Officer Work Queue;
:Officer Audits OCR Side-by-Side;

if (Claim >= 5000 OR Category VEHICLE/PROPERTY?) then (Yes)
  :Assign Field Surveyor (SURVEYOR_ASSIGNED);
  :Surveyor Conducts Physical Inspection;
  :Submit Survey Report & Cost Estimate;
  :Resume Officer Review (UNDER_REVIEW);
else (No)
  :Desk Adjudication;
endif

:Officer Submits Adjudication Recommendation;
:Escalate Claim to MANAGER_REVIEW;

if (Manager Executive Decision?) then (Return)
  :Return Claim to Officer for Inquiry;
  detach
elseif (Reject) then (Reject)
  :Update Status to REJECTED;
  :Notify Customer with Rejection Cause;
  stop
else (Approve)
  :Update Status to APPROVED;
  :Automatically Generate Settlement Record;
  :Queue Settlement Voucher (SET-xxx);
  :Finance Executes Bank Transfer Disbursement;
  :Transition Status to SETTLED;
  :Dispatch Settlement Notification to Customer;
  stop
endif
@enduml`;

const mmd5 = `flowchart TD
  classDef default fill:#ffffff,stroke:#000000,stroke-width:1.5px,color:#000000;
  
  START((Start)) --> A1[Fill Claim Form & Incident Details]
  A1 --> A2[Upload Invoices & Medical Proofs]
  A2 --> D1{Mandatory Docs Present?}

  D1 -- No --> A3[Status: DOCUMENTS_REQUIRED]
  A3 --> A2
  
  D1 -- Yes --> A4[Async OCR Extraction pdf-parse/Tesseract]
  A4 --> A5[Evaluate 7 Rule Engine Checks]
  A5 --> D2{Rule Score >= 70%?}

  D2 -- Yes --> A6[Queue: Officer Low-Risk Review]
  D2 -- No --> A7[Queue: Officer High-Risk Audit]

  A6 --> A8[Officer Audits OCR Side-by-Side]
  A7 --> A8
  
  A8 --> D3{Survey Required? Amount >= 5000?}

  D3 -- Yes --> A9[Assign Surveyor: SURVEYOR_ASSIGNED]
  A9 --> A10[Surveyor Submits Damage Report]
  A10 --> A11[Officer Formulates Recommendation]

  D3 -- No --> A11

  A11 --> A12[Escalate to MANAGER_REVIEW]
  A12 --> D4{Manager Decision?}

  D4 -- Return --> A8
  D4 -- Reject --> T1[Status: REJECTED] --> END1(((End)))
  D4 -- Approve --> A13[Status: APPROVED]
  A13 --> A14[Create Settlement Voucher SET-xxx]
  A14 --> A15[Finance Disburses Bank Transfer]
  A15 --> A16[Status: SETTLED]
  A16 --> END2(((End)))`;

// -------------------------------------------------------------
// 6. MongoDB ERD
// -------------------------------------------------------------
const puml6 = `@startuml 06_MongoDB_ERD
!theme plain
skinparam monochrome true
skinparam defaultFontName "Consolas"

title Figure 6: MongoDB Entity-Relationship Diagram (ERD) of InsureFlow

entity "users" as User {
  * _id: ObjectId [PK]
  --
  * name: String
  * email: String [UNIQUE, INDEX]
  * password: String (Hash)
  * role: Enum
  * isActive: Boolean
}

entity "policyproducts" as Product {
  * _id: ObjectId [PK]
  --
  * productName: String
  * insurer: String
  * category: Enum
  * planCode: String [UNIQUE, INDEX]
  * coverageLimit: Number
  * isPublished: Boolean
}

entity "customerpolicies" as CustPol {
  * _id: ObjectId [PK]
  --
  * customer: Ref<User._id> [FK]
  * product: Ref<PolicyProduct._id> [FK]
  * policyNumber: String [UNIQUE, INDEX]
  * coverageAmount: Number
  * startDate: Date
  * endDate: Date
}

entity "claims" as Claim {
  * _id: ObjectId [PK]
  --
  * claimReference: String [UNIQUE, INDEX]
  * customer: Ref<User._id> [FK]
  * customerPolicy: Ref<CustomerPolicy._id> [FK]
  * category: Enum
  * requestedAmount: Number
  * approvedAmount: Number
  * status: Enum (15 States)
}

entity "claimdocuments" as Doc {
  * _id: ObjectId [PK]
  --
  * claim: Ref<Claim._id> [FK]
  * uploadedBy: Ref<User._id> [FK]
  * documentCategory: Enum
  * fileName: String (UUID)
}

entity "ocrjobs" as OCR {
  * _id: ObjectId [PK]
  --
  * claimDocument: Ref<Doc._id> [FK]
  * claim: Ref<Claim._id> [FK]
  * extractedFields: Object
  * confidenceScore: Number
}

entity "surveyreports" as Survey {
  * _id: ObjectId [PK]
  --
  * claim: Ref<Claim._id> [FK]
  * surveyor: Ref<User._id> [FK]
  * damageAssessment: String
  * estimatedRepairCost: Number
}

entity "settlements" as Sett {
  * _id: ObjectId [PK]
  --
  * settlementReference: String [UNIQUE, INDEX]
  * claim: Ref<Claim._id> [FK]
  * customer: Ref<User._id> [FK]
  * approvedAmount: Number
  * status: Enum
}

User ||..o{ CustPol : "customer"
Product ||..o{ CustPol : "product"
CustPol ||..o{ Claim : "customerPolicy"
User ||..o{ Claim : "customer"
Claim ||..|{ Doc : "claim"
Doc ||..|| OCR : "claimDocument"
Claim ||..o| Survey : "claim"
Claim ||..o| Sett : "claim"
@enduml`;

const mmd6 = `erDiagram
  users ||--o{ customerpolicies : "customer"
  policyproducts ||--o{ customerpolicies : "product"
  customerpolicies ||--o{ claims : "customerPolicy"
  users ||--o{ claims : "customer"
  claims ||--|{ claimdocuments : "claim"
  claimdocuments ||--|| ocrjobs : "claimDocument"
  claims ||--o| surveyreports : "claim"
  claims ||--o| settlements : "claim"

  users {
    ObjectId _id PK
    String name
    String email UK
    String password
    Enum role
    Boolean isActive
  }

  policyproducts {
    ObjectId _id PK
    String productName
    String insurer
    String planCode UK
    Number coverageLimit
    Boolean isPublished
  }

  customerpolicies {
    ObjectId _id PK
    ObjectId customer FK
    ObjectId product FK
    String policyNumber UK
    Number coverageAmount
    Date startDate
    Date endDate
  }

  claims {
    ObjectId _id PK
    String claimReference UK
    ObjectId customer FK
    ObjectId customerPolicy FK
    Number requestedAmount
    Number approvedAmount
    Enum status
  }

  claimdocuments {
    ObjectId _id PK
    ObjectId claim FK
    String fileName
    Enum documentCategory
  }

  ocrjobs {
    ObjectId _id PK
    ObjectId claimDocument FK
    String extractedText
    Number confidenceScore
  }

  surveyreports {
    ObjectId _id PK
    ObjectId claim FK
    ObjectId surveyor FK
    String damageAssessment
    Number estimatedRepairCost
  }

  settlements {
    ObjectId _id PK
    String settlementReference UK
    ObjectId claim FK
    Number approvedAmount
    Enum status
  }
`;

// -------------------------------------------------------------
// 7. React Router Navigation Architecture
// -------------------------------------------------------------
const puml7 = `@startuml 07_React_Router_Architecture
!theme plain
skinparam monochrome true
skinparam defaultFontName "Segoe UI"
skinparam packageStyle rectangle

title Figure 7: React Router v6 Application Navigation Architecture

rectangle "<BrowserRouter> (App.jsx Master Switch)" {
  rectangle "Public Portal (Unauthenticated)" as Public {
    [/ (Root)] --> [HomePage]
    [/login] --> [LoginPage]
    [/register] --> [RegisterPage]
    [/catalog] --> [ProductCatalogPage]
    [/catalog/:id] --> [ProductDetailPage]
    [/about] --> [AboutPage]
    [/faq] --> [FAQPage]
    [/contact] --> [ContactPage]
    [* (Catch-All)] --> [NotFoundPage (404)]
  }

  rectangle "Role-Guarded Workspaces (<ProtectedRoute>)" as Protected {
    package "Customer Workspace (allowedRoles: ['CUSTOMER'])" {
      [/customer/dashboard] --> [CustomerDashboard]
      [/customer/claims] --> [CustomerClaimsList]
      [/customer/claims/new] --> [NewClaimSubmission]
      [/customer/claims/:id] --> [ClaimDetailTimeline]
      [/customer/policies] --> [CustomerPolicies]
      [/customer/settlements] --> [CustomerSettlements]
    }

    package "Officer Workspace (allowedRoles: ['OFFICER'])" {
      [/officer/queue] --> [OfficerQueueWorkspace]
      [/officer/adjudicate/:id] --> [ClaimAdjudicationModal]
      [/officer/documents] --> [OCRInspectionViewer]
      [/officer/policies] --> [ExternalPolicyAudit]
    }

    package "Surveyor Workspace (allowedRoles: ['SURVEYOR'])" {
      [/surveyor/roster] --> [SurveyorRoster]
      [/surveyor/inspect/:id] --> [DamageAssessmentForm]
      [/surveyor/reports] --> [CompletedSurveysHistory]
    }

    package "Manager Workspace (allowedRoles: ['MANAGER'])" {
      [/manager/escalations] --> [ManagerEscalationQueue]
      [/manager/review/:id] --> [ExecutiveDecisionPortal]
      [/manager/settlements] --> [SettlementAuthorization]
      [/manager/analytics] --> [ClaimsAnalyticsDashboard]
    }

    package "Admin Workspace (allowedRoles: ['ADMIN'])" {
      [/admin/catalog] --> [UnderwritingCatalogMgmt]
      [/admin/catalog/new] --> [ProductPublishingForm]
      [/admin/rules] --> [RuleEngineTuningPanel]
      [/admin/users] --> [UserRoleGovernance]
      [/admin/audit-logs] --> [SystemAuditLogViewer]
    }
  }
}
@enduml`;

const mmd7 = `graph TD
  classDef default fill:#ffffff,stroke:#000000,stroke-width:1.5px,color:#000000;

  ROOT["&lt;BrowserRouter&gt; (App.jsx)"]

  subgraph PUB["Public Routes (Unauthenticated)"]
    P1["/ -> HomePage"]
    P2["/login -> LoginPage"]
    P3["/register -> RegisterPage"]
    P4["/catalog -> ProductCatalogPage"]
    P5["/catalog/:id -> ProductDetailPage"]
    P6["/about -> AboutPage"]
    P7["/faq -> FAQPage"]
    P8["/contact -> ContactPage"]
    P9["* -> NotFoundPage (404)"]
  end

  subgraph CUST["Customer Workspace (Role: CUSTOMER)"]
    C1["/customer/dashboard"]
    C2["/customer/claims"]
    C3["/customer/claims/new"]
    C4["/customer/claims/:id"]
    C5["/customer/policies"]
    C6["/customer/settlements"]
  end

  subgraph OFF["Officer Workspace (Role: OFFICER)"]
    O1["/officer/queue"]
    O2["/officer/adjudicate/:id"]
    O3["/officer/documents"]
    O4["/officer/policies"]
  end

  subgraph SURV["Surveyor Workspace (Role: SURVEYOR)"]
    S1["/surveyor/roster"]
    S2["/surveyor/inspect/:id"]
    S3["/surveyor/reports"]
  end

  subgraph MGR["Manager Workspace (Role: MANAGER)"]
    M1["/manager/escalations"]
    M2["/manager/review/:id"]
    M3["/manager/settlements"]
    M4["/manager/analytics"]
  end

  subgraph ADM["Admin Workspace (Role: ADMIN)"]
    A1["/admin/catalog"]
    A2["/admin/catalog/new"]
    A3["/admin/rules"]
    A4["/admin/users"]
    A5["/admin/audit-logs"]
  end

  ROOT --> PUB
  ROOT --> CUST
  ROOT --> OFF
  ROOT --> SURV
  ROOT --> MGR
  ROOT --> ADM`;

const pumlFiles = [
  ['01_System_Architecture.puml', puml1],
  ['02_UML_Domain_Model.puml', puml2],
  ['03_Claim_Processing_Sequence.puml', puml3],
  ['04_UML_Use_Case.puml', puml4],
  ['05_Claim_Activity_Diagram.puml', puml5],
  ['06_MongoDB_ERD.puml', puml6],
  ['07_React_Router_Architecture.puml', puml7],
];

const mmdFiles = [
  ['01_System_Architecture.mmd', mmd1],
  ['02_UML_Domain_Model.mmd', mmd2],
  ['03_Claim_Processing_Sequence.mmd', mmd3],
  ['04_UML_Use_Case.mmd', mmd4],
  ['05_Claim_Activity_Diagram.mmd', mmd5],
  ['06_MongoDB_ERD.mmd', mmd6],
  ['07_React_Router_Architecture.mmd', mmd7],
];

pumlFiles.forEach(([name, content]) => {
  fs.writeFileSync(path.join(assetsDir, name), content, 'utf8');
  console.log(`[PlantUML Written] ${name}`);
});

mmdFiles.forEach(([name, content]) => {
  fs.writeFileSync(path.join(assetsDir, name), content, 'utf8');
  console.log(`[Mermaid Written] ${name}`);
});

console.log('[Source Exporter] All PlantUML and Mermaid Source Files Generated!');
