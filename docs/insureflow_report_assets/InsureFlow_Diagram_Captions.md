# InsureFlow — Master Project Report Diagram Captions and Technical Catalog

This document establishes the authoritative figure numbers, formal academic captions, asset filenames, and technical narrative summaries for the seven core engineering diagrams designed for the **InsureFlow — Smart Insurance Claim Processing and Settlement Management System** academic project report and viva defense.

---

### Figure 1: System Architecture of InsureFlow
- **Figure Label:** Figure 1: Four-Tier System Architecture of InsureFlow
- **Vector Source:** [`01_System_Architecture.svg`](file:///c:/Users/apste/Desktop/SM/F-U/docs/insureflow_report_assets/01_System_Architecture.svg)
- **High-Resolution Render:** [`01_System_Architecture.png`](file:///c:/Users/apste/Desktop/SM/F-U/docs/insureflow_report_assets/01_System_Architecture.png)
- **Editable Source:** [`01_System_Architecture.puml`](file:///c:/Users/apste/Desktop/SM/F-U/docs/insureflow_report_assets/01_System_Architecture.puml), [`01_System_Architecture.mmd`](file:///c:/Users/apste/Desktop/SM/F-U/docs/insureflow_report_assets/01_System_Architecture.mmd)
- **Technical Explanation:**  
  Illustrates the four-tier architectural decomposition of the InsureFlow platform:
  1. *Presentation Tier:* React 18 SPA built with Vite, Tailwind CSS, Lucide icons, and Axios JWT request interceptors across five dedicated role interfaces.
  2. *API Gateway & Security Tier:* Node.js and Express 4.21 middleware stack enforcing Helmet HTTP headers, CORS policies, JWT Bearer verification, RBAC guards, and Multer multipart streaming with UUID sanitization.
  3. *Business Microservices Tier:* Thirteen Express controllers orchestrating the 7-check deterministic Rule Engine (`ruleEngineService.js`), 15-state Finite State Machine (`stateMachineService.js`), hybrid digital/optical OCR parser (`ocrService.js`), and real-time notification engine.
  4. *Persistence & Storage Tier:* MongoDB Atlas cloud replica set with Mongoose ODM (14 schemas), automated zero-config in-memory fallback (`mongodb-memory-server`), and dedicated disk uploads storage (`uploads/`).

---

### Figure 2: UML Domain Model and Class Diagram
- **Figure Label:** Figure 2: UML Domain Model & Class Diagram of InsureFlow
- **Vector Source:** [`02_UML_Domain_Model.svg`](file:///c:/Users/apste/Desktop/SM/F-U/docs/insureflow_report_assets/02_UML_Domain_Model.svg)
- **High-Resolution Render:** [`02_UML_Domain_Model.png`](file:///c:/Users/apste/Desktop/SM/F-U/docs/insureflow_report_assets/02_UML_Domain_Model.png)
- **Editable Source:** [`02_UML_Domain_Model.puml`](file:///c:/Users/apste/Desktop/SM/F-U/docs/insureflow_report_assets/02_UML_Domain_Model.puml), [`02_UML_Domain_Model.mmd`](file:///c:/Users/apste/Desktop/SM/F-U/docs/insureflow_report_assets/02_UML_Domain_Model.mmd)
- **Technical Explanation:**  
  Presents the object-oriented structure of persistent domain entities and Mongoose ODM models. Each class specifies its primary key (`_id: ObjectId`), attributes with strict data types, unique indices, embedded structures, and schema methods (such as password hashing hooks, token generators, and state transition verifiers). Detailed multiplicity notations (`1`, `1..*`, `0..1`, `*`) capture relationships between Users, Policies, Claims, Documents, OCR Jobs, Surveyor Reports, and Settlements.

---

### Figure 3: UML Sequence Diagram for Claim Processing Lifecycle
- **Figure Label:** Figure 3: UML Sequence Diagram for Claim Processing Lifecycle
- **Vector Source:** [`03_Claim_Processing_Sequence.svg`](file:///c:/Users/apste/Desktop/SM/F-U/docs/insureflow_report_assets/03_Claim_Processing_Sequence.svg)
- **High-Resolution Render:** [`03_Claim_Processing_Sequence.png`](file:///c:/Users/apste/Desktop/SM/F-U/docs/insureflow_report_assets/03_Claim_Processing_Sequence.png)
- **Editable Source:** [`03_Claim_Processing_Sequence.puml`](file:///c:/Users/apste/Desktop/SM/F-U/docs/insureflow_report_assets/03_Claim_Processing_Sequence.puml), [`03_Claim_Processing_Sequence.mmd`](file:///c:/Users/apste/Desktop/SM/F-U/docs/insureflow_report_assets/03_Claim_Processing_Sequence.mmd)
- **Technical Explanation:**  
  Traces the end-to-end temporal execution sequence of a digital claim across seven lifelines: Customer, React Client, Express Gateway, Claim Controller, Rule/OCR Engines, MongoDB, and Reviewer Staff. The diagram models the complete FNOL intake, asynchronous OCR parsing, 7-rule compliance scoring, officer work queue adjudication, optional technical surveyor inspection for high-value claims (via UML `opt` frame), executive manager adjudication (via UML `alt` frame), settlement record creation, and final bank fund disbursement.

---

### Figure 4: UML Use-Case Diagram of InsureFlow
- **Figure Label:** Figure 4: UML Use-Case Diagram of InsureFlow
- **Vector Source:** [`04_UML_Use_Case.svg`](file:///c:/Users/apste/Desktop/SM/F-U/docs/insureflow_report_assets/04_UML_Use_Case.svg)
- **High-Resolution Render:** [`04_UML_Use_Case.png`](file:///c:/Users/apste/Desktop/SM/F-U/docs/insureflow_report_assets/04_UML_Use_Case.png)
- **Editable Source:** [`04_UML_Use_Case.puml`](file:///c:/Users/apste/Desktop/SM/F-U/docs/insureflow_report_assets/04_UML_Use_Case.puml), [`04_UML_Use_Case.mmd`](file:///c:/Users/apste/Desktop/SM/F-U/docs/insureflow_report_assets/04_UML_Use_Case.mmd)
- **Technical Explanation:**  
  Features an official UML `InsureFlow` system boundary containing 22 verified use cases mapped to five external human actors using classic academic stick-figure notation:
  - *Customer (Policyholder):* Browse Catalog, Register External Policy, Submit FNOL Claim, Upload Proofs, Track Timeline, View Settlement Voucher.
  - *Insurance Officer:* Access Work Queue, Audit OCR Data, Evaluate Rule Scores, Request Missing Docs / Assign Surveyor, Formulate Recommendation, Audit External Policies.
  - *Field Surveyor:* Access Inspection Roster, Conduct Physical Assessment, Submit Technical Survey Report.
  - *Claims Manager:* Review Escalated Claims & Survey Reports, Execute Adjudication Decision, Authorize Settlement Disbursement.
  - *Administrator:* Manage Underwriting Catalog, Tune Rule Parameters, Govern User Roles, Inspect Audit Logs.
  *Note:* Explicitly included in the Project Report's **List of Figures**.

---

### Figure 5: UML Activity Diagram with Decision Gates and Survey Triggers
- **Figure Label:** Figure 5: UML Activity Diagram of InsureFlow
- **Vector Source:** [`05_Claim_Activity_Diagram.svg`](file:///c:/Users/apste/Desktop/SM/F-U/docs/insureflow_report_assets/05_Claim_Activity_Diagram.svg)
- **High-Resolution Render:** [`05_Claim_Activity_Diagram.png`](file:///c:/Users/apste/Desktop/SM/F-U/docs/insureflow_report_assets/05_Claim_Activity_Diagram.png)
- **Editable Source:** [`05_Claim_Activity_Diagram.puml`](file:///c:/Users/apste/Desktop/SM/F-U/docs/insureflow_report_assets/05_Claim_Activity_Diagram.puml), [`05_Claim_Activity_Diagram.mmd`](file:///c:/Users/apste/Desktop/SM/F-U/docs/insureflow_report_assets/05_Claim_Activity_Diagram.mmd)
- **Technical Explanation:**  
  Illustrates procedural control flow across four partitioned swimlanes: Customer, Automated System, Officer/Surveyor, and Claims Manager/Finance. Highlights key decision diamonds and branch guards:
  1. *Document Completeness Gate:* Missing mandatory files trigger automatic transition to `DOCUMENTS_REQUIRED`.
  2. *Rule Score Gate:* Scores `< 70%` or flags divert claims to intensive audit queues.
  3. *Surveyor Threshold Gate:* Claims `>= ₹5,000` or property/vehicle categories automatically mandate field surveyor dispatch (`SURVEYOR_ASSIGNED`).
  4. *Manager Adjudication Gate:* Supports three legal paths (Approved -> Settlement; Rejected -> Termination; Return for Inquiry -> Re-audit).

---

### Figure 6: MongoDB Entity-Relationship Diagram (ERD)
- **Figure Label:** Figure 6: MongoDB Entity-Relationship Diagram (ERD) of InsureFlow
- **Vector Source:** [`06_MongoDB_ERD.svg`](file:///c:/Users/apste/Desktop/SM/F-U/docs/insureflow_report_assets/06_MongoDB_ERD.svg)
- **High-Resolution Render:** [`06_MongoDB_ERD.png`](file:///c:/Users/apste/Desktop/SM/F-U/docs/insureflow_report_assets/06_MongoDB_ERD.png)
- **Editable Source:** [`06_MongoDB_ERD.puml`](file:///c:/Users/apste/Desktop/SM/F-U/docs/insureflow_report_assets/06_MongoDB_ERD.puml), [`06_MongoDB_ERD.mmd`](file:///c:/Users/apste/Desktop/SM/F-U/docs/insureflow_report_assets/06_MongoDB_ERD.mmd)
- **Technical Explanation:**  
  Models the persistent NoSQL schema architecture across InsureFlow's core collections. Distinguishes document references (`Ref: ObjectId [FK]`) from embedded subdocument arrays (e.g., `automatedValidation.rules[]`, `eligibilityCriteria[]`, `keyBenefits[]`, `photoUrls[]`). Details index constraints (`UNIQUE`, compound indices) that enforce data integrity and rapid query execution across high-volume claim and audit collections.

---

### Figure 7: React Router Application Navigation Architecture
- **Figure Label:** Figure 7: React Router v6 Application Navigation Architecture
- **Vector Source:** [`07_React_Router_Architecture.svg`](file:///c:/Users/apste/Desktop/SM/F-U/docs/insureflow_report_assets/07_React_Router_Architecture.svg)
- **High-Resolution Render:** [`07_React_Router_Architecture.png`](file:///c:/Users/apste/Desktop/SM/F-U/docs/insureflow_report_assets/07_React_Router_Architecture.png)
- **Editable Source:** [`07_React_Router_Architecture.puml`](file:///c:/Users/apste/Desktop/SM/F-U/docs/insureflow_report_assets/07_React_Router_Architecture.puml), [`07_React_Router_Architecture.mmd`](file:///c:/Users/apste/Desktop/SM/F-U/docs/insureflow_report_assets/07_React_Router_Architecture.mmd)
- **Technical Explanation:**  
  Maps the complete 33-view client-side routing hierarchy managed by React Router v6 in `client/src/App.jsx`. Documents the branching structure:
  - *Public Portal:* 11 unauthenticated endpoints (Catalog, Login, Register, FAQ, About, etc.).
  - *Protected Role Workspaces:* Guarded by `<ProtectedRoute allowedRoles={[...]}>`, partitioning access across Policyholders (7 views), Verification Officers (4 views), Technical Surveyors (3 views), Claims Managers (4 views), and System Administrators (5 views).
  - *Catch-All:* Directs invalid URL requests to a dedicated `<NotFoundPage>` component.
