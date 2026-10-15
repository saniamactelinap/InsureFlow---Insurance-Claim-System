import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const projectRoot = 'C:/Users/apste/Desktop/SM/F-U';
const assetsDir = path.join(projectRoot, 'docs/insureflow_report_assets');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

function renderHtmlToPng(htmlContent, outputPngName, width = 1400, height = 900) {
  const tempHtml = path.join(assetsDir, `_temp_${outputPngName}.html`);
  const outputPng = path.join(assetsDir, outputPngName);
  
  fs.writeFileSync(tempHtml, htmlContent, 'utf8');
  const fileUrl = `file:///${tempHtml.replace(/\\/g, '/')}`;
  const cmd = `"${edgePath}" --headless=new --disable-gpu --screenshot="${outputPng}" --window-size=${width},${height} "${fileUrl}"`;
  
  try {
    execSync(cmd, { stdio: 'pipe' });
    console.log(`[Generated] ${outputPngName} (${width}x${height})`);
  } catch (err) {
    console.error(`Error generating ${outputPngName}:`, err.message);
  } finally {
    if (fs.existsSync(tempHtml)) fs.unlinkSync(tempHtml);
  }
}

// -------------------------------------------------------------
// 1. UML CLASS DIAGRAM (Academic Black & White Styling)
// -------------------------------------------------------------
const classDiagramHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {
    margin: 0; padding: 20px; font-family: 'Consolas', 'Segoe UI', Arial, monospace;
    background: #ffffff; color: #000000;
  }
  .container {
    width: 1420px; margin: 0 auto; border: 2px solid #000000; border-radius: 4px;
    padding: 20px; background: #ffffff;
  }
  .title {
    text-align: center; font-size: 22px; font-weight: 700; color: #000000;
    font-family: 'Segoe UI', Arial, sans-serif; margin-bottom: 2px; text-transform: uppercase;
  }
  .subtitle {
    text-align: center; font-size: 12px; color: #333333; font-family: 'Segoe UI', Arial, sans-serif;
    margin-bottom: 20px; font-style: italic;
  }
  .uml-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;
  }
  .class-box {
    background: #ffffff; border: 1.5px solid #000000; border-radius: 4px;
    box-shadow: 2px 2px 0px rgba(0,0,0,0.1); overflow: hidden; font-size: 11px;
  }
  .class-name {
    background: #f1f5f9; font-weight: 700; text-align: center; padding: 6px;
    border-bottom: 1.5px solid #000000; color: #000000; font-family: 'Segoe UI', Arial, sans-serif;
  }
  .class-stereo {
    font-size: 9px; font-style: italic; color: #333333; display: block;
  }
  .section {
    padding: 6px 8px; line-height: 1.45;
  }
  .attrs {
    border-bottom: 1px solid #000000; background: #fbfbfb; color: #000000;
  }
  .methods {
    background: #ffffff; color: #000000;
  }
  .rel { color: #000000; font-weight: 700; }
  .type { color: #333333; }
</style>
</head>
<body>
<div class="container">
  <div class="title">InsureFlow — UML Domain Model & Class Diagram</div>
  <div class="subtitle">Structural Specification of Core Mongoose Schemas, Persistent Attributes & Entity Associations</div>

  <div class="uml-grid">
    <!-- User -->
    <div class="class-box">
      <div class="class-name"><span class="class-stereo">&lt;&lt;Mongoose Model&gt;&gt;</span>User</div>
      <div class="section attrs">
        + _id: <span class="type">ObjectId</span> [PK]<br>
        + name: <span class="type">String</span><br>
        + email: <span class="type">String</span> [UNIQUE]<br>
        + password: <span class="type">String</span> (Bcrypt Hash)<br>
        + role: <span class="type">Enum</span> (CUSTOMER, OFFICER, SURVEYOR, MANAGER, ADMIN)<br>
        + department: <span class="type">String</span><br>
        + phone: <span class="type">String</span><br>
        + isActive: <span class="type">Boolean</span>
      </div>
      <div class="section methods">
        + comparePassword(pwd): <span class="type">Boolean</span><br>
        + pre('save'): Hash Password<br>
        + toJSON(): Omit Password
      </div>
    </div>

    <!-- PolicyProduct -->
    <div class="class-box">
      <div class="class-name"><span class="class-stereo">&lt;&lt;Mongoose Model&gt;&gt;</span>PolicyProduct</div>
      <div class="section attrs">
        + _id: <span class="type">ObjectId</span> [PK]<br>
        + productName: <span class="type">String</span><br>
        + insurer: <span class="type">String</span><br>
        + category: <span class="type">Enum</span> (HEALTH, VEHICLE, PROPERTY)<br>
        + planCode: <span class="type">String</span> [UNIQUE]<br>
        + coverageLimit: <span class="type">Number</span><br>
        + deductible: <span class="type">Number</span><br>
        + annualPremium: <span class="type">Number</span><br>
        + durationMonths: <span class="type">Number</span> (12)<br>
        + isPublished: <span class="type">Boolean</span>
      </div>
      <div class="section methods">
        + validatePlanCode(): <span class="type">Boolean</span><br>
        + calculatePremium(): <span class="type">Number</span>
      </div>
    </div>

    <!-- CustomerPolicy -->
    <div class="class-box">
      <div class="class-name"><span class="class-stereo">&lt;&lt;Mongoose Model&gt;&gt;</span>CustomerPolicy</div>
      <div class="section attrs">
        + _id: <span class="type">ObjectId</span> [PK]<br>
        + customer: <span class="rel">Ref&lt;User&gt;</span> [FK]<br>
        + product: <span class="rel">Ref&lt;PolicyProduct&gt;</span> [FK]<br>
        + policySource: <span class="type">Enum</span> (PLATFORM, EXTERNAL)<br>
        + policyNumber: <span class="type">String</span> [UNIQUE]<br>
        + insurerName: <span class="type">String</span><br>
        + category: <span class="type">Enum</span><br>
        + coverageAmount: <span class="type">Number</span><br>
        + startDate: <span class="type">Date</span><br>
        + endDate: <span class="type">Date</span><br>
        + verificationStatus: <span class="type">Enum</span>
      </div>
      <div class="section methods">
        + isCoveredOn(date): <span class="type">Boolean</span><br>
        + getRemainingCoverage(): <span class="type">Number</span>
      </div>
    </div>

    <!-- Claim -->
    <div class="class-box">
      <div class="class-name"><span class="class-stereo">&lt;&lt;Mongoose Model&gt;&gt;</span>Claim</div>
      <div class="section attrs">
        + _id: <span class="type">ObjectId</span> [PK]<br>
        + claimReference: <span class="type">String</span> [UNIQUE]<br>
        + customer: <span class="rel">Ref&lt;User&gt;</span> [FK]<br>
        + customerPolicy: <span class="rel">Ref&lt;CustomerPolicy&gt;</span><br>
        + category: <span class="type">Enum</span> (HEALTH, VEHICLE, PROPERTY)<br>
        + incidentDate: <span class="type">Date</span><br>
        + requestedAmount: <span class="type">Number</span><br>
        + approvedAmount: <span class="type">Number</span><br>
        + status: <span class="type">Enum</span> [15 States]<br>
        + automatedValidation: <span class="type">Object</span><br>
        + isHighValueClaim: <span class="type">Boolean</span>
      </div>
      <div class="section methods">
        + transitionTo(status, user)<br>
        + evaluateRules(): <span class="type">ValidationResult</span>
      </div>
    </div>

    <!-- ClaimDocument -->
    <div class="class-box">
      <div class="class-name"><span class="class-stereo">&lt;&lt;Mongoose Model&gt;&gt;</span>ClaimDocument</div>
      <div class="section attrs">
        + _id: <span class="type">ObjectId</span> [PK]<br>
        + claim: <span class="rel">Ref&lt;Claim&gt;</span> [FK]<br>
        + originalName: <span class="type">String</span><br>
        + fileName: <span class="type">String</span><br>
        + fileUrl: <span class="type">String</span><br>
        + mimeType: <span class="type">String</span><br>
        + sizeBytes: <span class="type">Number</span><br>
        + documentCategory: <span class="type">Enum</span> [10 Types]<br>
        + uploadedBy: <span class="rel">Ref&lt;User&gt;</span><br>
        + ocrJob: <span class="rel">Ref&lt;OCRJob&gt;</span>
      </div>
      <div class="section methods">
        + triggerOCR(): <span class="type">OCRJob</span><br>
        + verifyDocument(officerId)
      </div>
    </div>

    <!-- OCRJob -->
    <div class="class-box">
      <div class="class-name"><span class="class-stereo">&lt;&lt;Mongoose Model&gt;&gt;</span>OCRJob</div>
      <div class="section attrs">
        + _id: <span class="type">ObjectId</span> [PK]<br>
        + claim: <span class="rel">Ref&lt;Claim&gt;</span> [FK]<br>
        + document: <span class="rel">Ref&lt;ClaimDocument&gt;</span><br>
        + status: <span class="type">Enum</span> (QUEUED, PROCESSING, COMPLETED, FAILED)<br>
        + rawExtractedText: <span class="type">String</span><br>
        + confidenceScore: <span class="type">Number</span> (0-100)<br>
        + structuredFields: <span class="type">Mixed</span><br>
        + warnings: <span class="type">Array&lt;String&gt;</span>
      </div>
      <div class="section methods">
        + executeExtraction(): <span class="type">Promise</span><br>
        + computeConfidence(): <span class="type">Number</span>
      </div>
    </div>

    <!-- ConfigurableRule -->
    <div class="class-box">
      <div class="class-name"><span class="class-stereo">&lt;&lt;Mongoose Model&gt;&gt;</span>ConfigurableRule</div>
      <div class="section attrs">
        + _id: <span class="type">ObjectId</span> [PK]<br>
        + ruleId: <span class="type">String</span> [UNIQUE]<br>
        + name: <span class="type">String</span><br>
        + category: <span class="type">Enum</span> (ELIGIBILITY, COVERAGE, FRAUD, etc.)<br>
        + isEnabled: <span class="type">Boolean</span><br>
        + severity: <span class="type">Enum</span> (BLOCKING, FLAGGED, INFO)<br>
        + parameters: <span class="type">Mixed</span><br>
        + version: <span class="type">Number</span>
      </div>
      <div class="section methods">
        + evaluate(claim, policy): <span class="type">Result</span><br>
        + toggleStatus(adminId)
      </div>
    </div>

    <!-- SurveyAssignment & Report -->
    <div class="class-box">
      <div class="class-name"><span class="class-stereo">&lt;&lt;Mongoose Model&gt;&gt;</span>SurveyAssignment / Report</div>
      <div class="section attrs">
        + _id: <span class="type">ObjectId</span> [PK]<br>
        + claim: <span class="rel">Ref&lt;Claim&gt;</span> [FK]<br>
        + surveyor: <span class="rel">Ref&lt;User&gt;</span> [FK]<br>
        + scheduledDate: <span class="type">Date</span><br>
        + status: <span class="type">Enum</span> [6 States]<br>
        + estimatedRepairCost: <span class="type">Number</span><br>
        + recommendedSettlementAmount: <span class="type">Number</span><br>
        + liabilityAssessment: <span class="type">Enum</span><br>
        + damageSummary: <span class="type">String</span>
      </div>
      <div class="section methods">
        + submitReport(reportData)<br>
        + completeSurvey()
      </div>
    </div>

    <!-- Settlement -->
    <div class="class-box">
      <div class="class-name"><span class="class-stereo">&lt;&lt;Mongoose Model&gt;&gt;</span>Settlement</div>
      <div class="section attrs">
        + _id: <span class="type">ObjectId</span> [PK]<br>
        + settlementReference: <span class="type">String</span> [UNIQUE]<br>
        + claim: <span class="rel">Ref&lt;Claim&gt;</span> [FK]<br>
        + customer: <span class="rel">Ref&lt;User&gt;</span> [FK]<br>
        + approvedAmount: <span class="type">Number</span><br>
        + status: <span class="type">Enum</span> (PENDING, PROCESSING, COMPLETED, FAILED)<br>
        + paymentMethod: <span class="type">Enum</span><br>
        + beneficiaryDetails: <span class="type">Object</span><br>
        + authorizedBy: <span class="rel">Ref&lt;User&gt;</span>
      </div>
      <div class="section methods">
        + processPayment(): <span class="type">Boolean</span><br>
        + generateReceipt(): <span class="type">String</span>
      </div>
    </div>

    <!-- ClaimTimelineEvent -->
    <div class="class-box">
      <div class="class-name"><span class="class-stereo">&lt;&lt;Mongoose Model&gt;&gt;</span>ClaimTimelineEvent</div>
      <div class="section attrs">
        + _id: <span class="type">ObjectId</span> [PK]<br>
        + claim: <span class="rel">Ref&lt;Claim&gt;</span> [FK]<br>
        + eventType: <span class="type">String</span><br>
        + fromStatus: <span class="type">String</span><br>
        + toStatus: <span class="type">String</span><br>
        + performedBy: <span class="rel">Ref&lt;User&gt;</span><br>
        + message: <span class="type">String</span><br>
        + metadata: <span class="type">Mixed</span><br>
        + createdAt: <span class="type">Date</span>
      </div>
      <div class="section methods">
        + formatEventString(): <span class="type">String</span>
      </div>
    </div>

    <!-- Notification -->
    <div class="class-box">
      <div class="class-name"><span class="class-stereo">&lt;&lt;Mongoose Model&gt;&gt;</span>Notification</div>
      <div class="section attrs">
        + _id: <span class="type">ObjectId</span> [PK]<br>
        + recipient: <span class="rel">Ref&lt;User&gt;</span> [FK]<br>
        + type: <span class="type">String</span><br>
        + title: <span class="type">String</span><br>
        + message: <span class="type">String</span><br>
        + claim: <span class="rel">Ref&lt;Claim&gt;</span> [FK]<br>
        + isRead: <span class="type">Boolean</span> (false)<br>
        + createdAt: <span class="type">Date</span>
      </div>
      <div class="section methods">
        + markAsRead(): <span class="type">Promise</span>
      </div>
    </div>

    <!-- AuditLog -->
    <div class="class-box">
      <div class="class-name"><span class="class-stereo">&lt;&lt;Mongoose Model&gt;&gt;</span>AuditLog</div>
      <div class="section attrs">
        + _id: <span class="type">ObjectId</span> [PK]<br>
        + user: <span class="rel">Ref&lt;User&gt;</span> [FK]<br>
        + action: <span class="type">String</span><br>
        + resourceType: <span class="type">String</span><br>
        + resourceId: <span class="type">String</span><br>
        + ipAddress: <span class="type">String</span><br>
        + details: <span class="type">Mixed</span><br>
        + createdAt: <span class="type">Date</span>
      </div>
      <div class="section methods">
        + logSecurityEvent(entry)
      </div>
    </div>
  </div>
</div>
</body>
</html>`;

renderHtmlToPng(classDiagramHtml, 'class_diagram.png', 1440, 960);
fs.writeFileSync(path.join(assetsDir, 'class_diagram.html'), classDiagramHtml, 'utf8');

// -------------------------------------------------------------
// 2. UML SEQUENCE DIAGRAM (Academic Black & White Styling)
// -------------------------------------------------------------
const sequenceDiagramHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {
    margin: 0; padding: 20px; font-family: 'Segoe UI', Arial, sans-serif;
    background: #ffffff; color: #000000;
  }
  .container {
    width: 1400px; margin: 0 auto; border: 2px solid #000000; border-radius: 4px;
    padding: 24px; background: #ffffff;
  }
  .title {
    text-align: center; font-size: 22px; font-weight: 700; color: #000000; margin-bottom: 2px;
    text-transform: uppercase;
  }
  .subtitle {
    text-align: center; font-size: 13px; color: #333333; margin-bottom: 24px; font-style: italic;
  }
  .actors {
    display: grid; grid-template-columns: repeat(7, 1fr); gap: 12px; margin-bottom: 20px;
    text-align: center;
  }
  .actor-box {
    background: #f8fafc; color: #000000; border: 1.5px solid #000000; padding: 10px; border-radius: 4px;
    font-size: 12px; font-weight: 700; box-shadow: 1px 1px 0px rgba(0,0,0,0.1);
  }
  .lifelines {
    position: relative; border-left: 2px dashed #000000; margin-left: 50px;
    padding-left: 20px;
  }
  .step-row {
    display: flex; align-items: flex-start; margin-bottom: 16px; position: relative;
  }
  .step-num {
    background: #000000; color: white; border-radius: 50%; width: 26px; height: 26px;
    display: flex; align-items: center; justify-content: center; font-size: 11px;
    font-weight: 700; flex-shrink: 0; margin-right: 14px;
  }
  .step-content {
    background: #ffffff; border: 1.5px solid #000000; border-left: 5px solid #000000;
    border-radius: 4px; padding: 10px 14px; width: 100%; box-shadow: 1px 1px 2px rgba(0,0,0,0.05);
  }
  .step-header {
    font-size: 13px; font-weight: 700; color: #000000; margin-bottom: 4px;
    display: flex; justify-content: space-between;
  }
  .step-parties {
    font-size: 11px; font-weight: 700; color: #000000;
  }
  .step-desc {
    font-size: 12px; color: #000000; line-height: 1.4;
  }
  .step-code {
    background: #f1f5f9; border: 1px solid #cbd5e1; padding: 2px 6px; border-radius: 3px;
    font-family: 'Consolas', monospace; font-size: 11px; color: #000000; font-weight: bold;
  }
</style>
</head>
<body>
<div class="container">
  <div class="title">InsureFlow — UML Sequence Diagram</div>
  <div class="subtitle">End-to-End Execution Trace: Claim Ingestion, Automated Rules Evaluation, Officer Review & Manager Settlement</div>

  <div class="actors">
    <div class="actor-box">Customer<br>(Browser Client)</div>
    <div class="actor-box">API Gateway<br>(Express.js / Multer)</div>
    <div class="actor-box">OCR Service<br>(Tesseract / PDF-Parse)</div>
    <div class="actor-box">Deterministic Rule Engine<br>(ruleEngineService)</div>
    <div class="actor-box">Insurance Officer<br>(Adjudication Portal)</div>
    <div class="actor-box">Claims Manager<br>(Executive Portal)</div>
    <div class="actor-box">MongoDB & FSM<br>(stateMachineService)</div>
  </div>

  <div class="lifelines">
    <!-- Step 1 -->
    <div class="step-row">
      <div class="step-num">1</div>
      <div class="step-content">
        <div class="step-header">
          <span>Claim Filing with PDF Invoice Attachment</span>
          <span class="step-parties">Customer ➔ API Gateway</span>
        </div>
        <div class="step-desc">
          Customer inputs incident details, selects active policy (<span class="step-code">customerPolicyId</span>), attaches medical bill/repair estimate, and triggers <span class="step-code">POST /api/claims</span> with JWT Bearer Token.
        </div>
      </div>
    </div>

    <!-- Step 2 -->
    <div class="step-row">
      <div class="step-num">2</div>
      <div class="step-content">
        <div class="step-header">
          <span>Multipart Stream Ingestion & Claim Entity Creation</span>
          <span class="step-parties">API Gateway ➔ MongoDB</span>
        </div>
        <div class="step-desc">
          Multer streams file into <span class="step-code">server/uploads/</span> with randomized UUID filename. Express initializes new <span class="step-code">Claim</span> entity with status <span class="step-code">SUBMITTED</span> and reference <span class="step-code">CLM-YYYYMMDD-XXXX</span>.
        </div>
      </div>
    </div>

    <!-- Step 3 -->
    <div class="step-row">
      <div class="step-num">3</div>
      <div class="step-content">
        <div class="step-header">
          <span>Asynchronous OCR Text & Field Extraction</span>
          <span class="step-parties">API Gateway ➔ OCR Service</span>
        </div>
        <div class="step-desc">
          OCR service evaluates MIME type. Extracts selectable text via <span class="step-code">pdf-parse</span> or renders page streams to <span class="step-code">tesseract.js</span> optical worker. Extracts regex fields (Invoice No, Dates, Total Amount) and computes composite confidence score.
        </div>
      </div>
    </div>

    <!-- Step 4 -->
    <div class="step-row">
      <div class="step-num">4</div>
      <div class="step-content">
        <div class="step-header">
          <span>Deterministic Claim Rule Engine Execution</span>
          <span class="step-parties">API Gateway ➔ Rule Engine Service</span>
        </div>
        <div class="step-desc">
          Executes <span class="step-code">evaluateClaim(claimId)</span> against active policy. Assesses: 1) Active Date Coverage, 2) Category Match, 3) Coverage Limit Compliance, 4) Document Completeness, 5) Duplicate Submission Check, 6) Policy Source Authentication, 7) High-Value Surveyor Trigger.
        </div>
      </div>
    </div>

    <!-- Step 5 -->
    <div class="step-row">
      <div class="step-num">5</div>
      <div class="step-content">
        <div class="step-header">
          <span>Persist Automated Validation & Log Timeline Event</span>
          <span class="step-parties">Rule Engine ➔ MongoDB & FSM</span>
        </div>
        <div class="step-desc">
          Claim document updated with <span class="step-code">automatedValidation</span> (status: PASS/FLAGGED/REQUIRES_REVIEW/FAIL, score: 0-100%). FSM records immutable <span class="step-code">ClaimTimelineEvent</span> in MongoDB.
        </div>
      </div>
    </div>

    <!-- Step 6 -->
    <div class="step-row">
      <div class="step-num">6</div>
      <div class="step-content">
        <div class="step-header">
          <span>Officer Queue Fetch & OCR Cross-Audit</span>
          <span class="step-parties">Officer ➔ API Gateway ➔ MongoDB</span>
        </div>
        <div class="step-desc">
          Officer opens <span class="step-code">/officer/claims/:id</span>. System renders side-by-side OCR audit modal comparing extracted PDF amounts against claimed amounts. Officer audits rule compliance badges.
        </div>
      </div>
    </div>

    <!-- Step 7 -->
    <div class="step-row">
      <div class="step-num">7</div>
      <div class="step-content">
        <div class="step-header">
          <span>Officer Recommendation & Manager Escalation</span>
          <span class="step-parties">Officer ➔ API Gateway ➔ FSM</span>
        </div>
        <div class="step-desc">
          Officer approves audit, inputs recommendation note and recommended amount, executing <span class="step-code">POST /api/claims/:id/recommend</span>. FSM transitions claim to <span class="step-code">MANAGER_REVIEW</span>.
        </div>
      </div>
    </div>

    <!-- Step 8 -->
    <div class="step-row">
      <div class="step-num">8</div>
      <div class="step-content">
        <div class="step-header">
          <span>Manager Final Adjudication & Settlement Generation</span>
          <span class="step-parties">Manager ➔ API Gateway ➔ Settlement Service</span>
        </div>
        <div class="step-desc">
          Manager reviews officer notes and rule score. Executes <span class="step-code">POST /api/manager/claims/:id/approve</span>. FSM updates claim to <span class="step-code">SETTLEMENT_PENDING</span> and instantiates <span class="step-code">Settlement</span> record (<span class="step-code">SET-YYYYMMDD-XXXX</span>).
        </div>
      </div>
    </div>

    <!-- Step 9 -->
    <div class="step-row">
      <div class="step-num">9</div>
      <div class="step-content">
        <div class="step-header">
          <span>Settlement Execution & Customer Notification</span>
          <span class="step-parties">Settlement Service ➔ MongoDB ➔ Customer</span>
        </div>
        <div class="step-desc">
          Finance marks settlement <span class="step-code">SETTLED</span> with bank transaction reference. Notification service pushes in-app alert to customer. Customer views settled status and payment reference in <span class="step-code">/customer/settlements</span>.
        </div>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;

renderHtmlToPng(sequenceDiagramHtml, 'sequence_diagram.png', 1440, 960);
fs.writeFileSync(path.join(assetsDir, 'sequence_diagram.html'), sequenceDiagramHtml, 'utf8');

// -------------------------------------------------------------
// 3. UML ACTIVITY DIAGRAM (Academic Black & White Styling)
// -------------------------------------------------------------
const activityDiagramHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {
    margin: 0; padding: 20px; font-family: 'Segoe UI', Arial, sans-serif;
    background: #ffffff; color: #000000;
  }
  .container {
    width: 1360px; margin: 0 auto; border: 2px solid #000000; border-radius: 4px;
    padding: 24px; background: #ffffff;
  }
  .title {
    text-align: center; font-size: 22px; font-weight: 700; color: #000000; margin-bottom: 2px;
    text-transform: uppercase;
  }
  .subtitle {
    text-align: center; font-size: 13px; color: #333333; margin-bottom: 24px; font-style: italic;
  }
  .flow {
    display: flex; flex-direction: column; align-items: center; gap: 14px;
  }
  .circle-start {
    width: 32px; height: 32px; background: #000000; border-radius: 50%;
  }
  .circle-end {
    width: 34px; height: 34px; border: 3px solid #000000; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
  }
  .circle-end-inner {
    width: 20px; height: 20px; background: #000000; border-radius: 50%;
  }
  .act-node {
    background: #ffffff; border: 2px solid #000000; border-radius: 18px;
    padding: 10px 24px; font-size: 13px; font-weight: 700; color: #000000;
    text-align: center; box-shadow: 1px 1px 0px rgba(0,0,0,0.1); min-width: 320px;
  }
  .branch-row {
    display: flex; justify-content: space-around; width: 100%; gap: 20px;
  }
  .branch-col {
    display: flex; flex-direction: column; align-items: center; gap: 10px; flex: 1;
    background: #fafafa; padding: 14px; border-radius: 6px; border: 1.5px solid #000000;
  }
  .branch-label {
    font-size: 11px; font-weight: 700; color: #000000; text-transform: uppercase;
  }
  .arrow-v { color: #000000; font-size: 16px; font-weight: bold; }
</style>
</head>
<body>
<div class="container">
  <div class="title">InsureFlow — UML Activity Diagram</div>
  <div class="subtitle">Claim Lifecycle Control Flow, Automated Evaluation Gates & Multi-Stage Human Decisions</div>

  <div class="flow">
    <div class="circle-start" title="Initial State"></div>
    <div class="arrow-v">▼</div>

    <div class="act-node">Customer Files Claim with Supporting Documents & Incident Proof</div>
    <div class="arrow-v">▼</div>

    <div class="act-node">Document Ingestion & Asynchronous OCR Text / Entity Extraction (Tesseract + PDF-Parse)</div>
    <div class="arrow-v">▼</div>

    <div class="act-node">Deterministic Rule Engine Evaluates 7 Compliance Checks (Coverage, Dates, Docs, Duplicates)</div>
    <div class="arrow-v">▼</div>

    <div class="branch-row">
      <!-- Path 1: Missing Docs -->
      <div class="branch-col">
        <div class="branch-label">[Missing Mandatory Documents]</div>
        <div class="act-node">Transition: DOCUMENTS_REQUIRED</div>
        <div class="arrow-v">▼</div>
        <div class="act-node">Customer Re-Uploads Missing Files</div>
      </div>

      <!-- Path 2: High Value or Vehicle/Property -->
      <div class="branch-col">
        <div class="branch-label">[Amount ≥ ₹5,000 OR Vehicle/Property]</div>
        <div class="act-node">Assign Technical Surveyor</div>
        <div class="arrow-v">▼</div>
        <div class="act-node">Surveyor Conducts Physical Inspection & Submits Damage Report</div>
      </div>

      <!-- Path 3: Standard Claim -->
      <div class="branch-col">
        <div class="branch-label">[Standard Claim / Health]</div>
        <div class="act-node">Officer Direct Work Queue Pickup</div>
        <div class="arrow-v">▼</div>
        <div class="act-node">Officer Audits OCR Match & Rule Flags</div>
      </div>
    </div>

    <div class="arrow-v">▼</div>
    <div class="act-node">Officer Formulates Recommendation (APPROVE / REJECT) & Escalates to Manager</div>
    <div class="arrow-v">▼</div>

    <div class="branch-row" style="max-width: 900px;">
      <div class="branch-col">
        <div class="branch-label">[Manager Rejects]</div>
        <div class="act-node">Status: REJECTED</div>
        <div class="arrow-v">▼</div>
        <div class="act-node">Notification Dispatched to Customer with Rejection Reason</div>
      </div>

      <div class="branch-col">
        <div class="branch-label">[Manager Approves]</div>
        <div class="act-node">Status: SETTLEMENT_PENDING</div>
        <div class="arrow-v">▼</div>
        <div class="act-node">Generate Settlement Record (SET-YYYYMMDD-XXXX)</div>
        <div class="arrow-v">▼</div>
        <div class="act-node">Finance Processes Bank Transfer & Marks SETTLED</div>
      </div>
    </div>

    <div class="arrow-v">▼</div>
    <div class="act-node">Claim Closed & Audit Log Finalized</div>
    <div class="arrow-v">▼</div>

    <div class="circle-end" title="Final State"><div class="circle-end-inner"></div></div>
  </div>
</div>
</body>
</html>`;

renderHtmlToPng(activityDiagramHtml, 'activity_diagram.png', 1400, 960);
fs.writeFileSync(path.join(assetsDir, 'activity_diagram.html'), activityDiagramHtml, 'utf8');

// -------------------------------------------------------------
// 4. DATABASE ERD (Academic Black & White Styling)
// -------------------------------------------------------------
const erdDiagramHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {
    margin: 0; padding: 20px; font-family: 'Consolas', 'Segoe UI', Arial, monospace;
    background: #ffffff; color: #000000;
  }
  .container {
    width: 1400px; margin: 0 auto; border: 2px solid #000000; border-radius: 4px;
    padding: 24px; background: #ffffff;
  }
  .title {
    text-align: center; font-size: 22px; font-weight: 700; color: #000000;
    font-family: 'Segoe UI', Arial, sans-serif; margin-bottom: 2px; text-transform: uppercase;
  }
  .subtitle {
    text-align: center; font-size: 13px; color: #333333; font-family: 'Segoe UI', Arial, sans-serif;
    margin-bottom: 24px; font-style: italic;
  }
  .erd-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;
  }
  .entity-box {
    background: #ffffff; border: 1.5px solid #000000; border-radius: 4px;
    box-shadow: 2px 2px 0px rgba(0,0,0,0.06); overflow: hidden; font-size: 11px;
  }
  .entity-header {
    background: #f1f5f9; color: #000000; border-bottom: 1.5px solid #000000; padding: 8px; font-weight: 700;
    text-align: center; font-family: 'Segoe UI', Arial, sans-serif;
  }
  .table-row {
    display: flex; padding: 4px 8px; border-bottom: 1px solid #e2e8f0;
  }
  .key-col { width: 34px; font-weight: 700; color: #000000; }
  .name-col { flex: 1; font-weight: 600; color: #000000; }
  .type-col { width: 90px; color: #475569; text-align: right; }
</style>
</head>
<body>
<div class="container">
  <div class="title">InsureFlow — MongoDB Entity-Relationship Diagram (ERD)</div>
  <div class="subtitle">Document Schemas, Primary ObjectIds, Foreign Key References & Cardinality</div>

  <div class="erd-grid">
    <!-- User -->
    <div class="entity-box">
      <div class="entity-header">users</div>
      <div class="table-row"><span class="key-col">PK</span><span class="name-col">_id</span><span class="type-col">ObjectId</span></div>
      <div class="table-row"><span class="key-col">UQ</span><span class="name-col">email</span><span class="type-col">String</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">name</span><span class="type-col">String</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">password</span><span class="type-col">String</span></div>
      <div class="table-row"><span class="key-col">IDX</span><span class="name-col">role</span><span class="type-col">String</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">department</span><span class="type-col">String</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">isActive</span><span class="type-col">Boolean</span></div>
    </div>

    <!-- PolicyProduct -->
    <div class="entity-box">
      <div class="entity-header">policyproducts</div>
      <div class="table-row"><span class="key-col">PK</span><span class="name-col">_id</span><span class="type-col">ObjectId</span></div>
      <div class="table-row"><span class="key-col">UQ</span><span class="name-col">planCode</span><span class="type-col">String</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">productName</span><span class="type-col">String</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">insurer</span><span class="type-col">String</span></div>
      <div class="table-row"><span class="key-col">IDX</span><span class="name-col">category</span><span class="type-col">String</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">coverageLimit</span><span class="type-col">Number</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">annualPremium</span><span class="type-col">Number</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">isPublished</span><span class="type-col">Boolean</span></div>
    </div>

    <!-- CustomerPolicy -->
    <div class="entity-box">
      <div class="entity-header">customerpolicies</div>
      <div class="table-row"><span class="key-col">PK</span><span class="name-col">_id</span><span class="type-col">ObjectId</span></div>
      <div class="table-row"><span class="key-col">FK</span><span class="name-col">customer</span><span class="type-col">users._id</span></div>
      <div class="table-row"><span class="key-col">FK</span><span class="name-col">product</span><span class="type-col">policyproducts._id</span></div>
      <div class="table-row"><span class="key-col">UQ</span><span class="name-col">policyNumber</span><span class="type-col">String</span></div>
      <div class="table-row"><span class="key-col">IDX</span><span class="name-col">policySource</span><span class="type-col">String</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">coverageAmount</span><span class="type-col">Number</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">startDate</span><span class="type-col">Date</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">endDate</span><span class="type-col">Date</span></div>
    </div>

    <!-- Claim -->
    <div class="entity-box">
      <div class="entity-header">claims</div>
      <div class="table-row"><span class="key-col">PK</span><span class="name-col">_id</span><span class="type-col">ObjectId</span></div>
      <div class="table-row"><span class="key-col">UQ</span><span class="name-col">claimReference</span><span class="type-col">String</span></div>
      <div class="table-row"><span class="key-col">FK</span><span class="name-col">customer</span><span class="type-col">users._id</span></div>
      <div class="table-row"><span class="key-col">FK</span><span class="name-col">customerPolicy</span><span class="type-col">customerpolicies._id</span></div>
      <div class="table-row"><span class="key-col">IDX</span><span class="name-col">category</span><span class="type-col">String</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">requestedAmount</span><span class="type-col">Number</span></div>
      <div class="table-row"><span class="key-col">IDX</span><span class="name-col">status</span><span class="type-col">String</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">isHighValueClaim</span><span class="type-col">Boolean</span></div>
    </div>

    <!-- ClaimDocument -->
    <div class="entity-box">
      <div class="entity-header">claimdocuments</div>
      <div class="table-row"><span class="key-col">PK</span><span class="name-col">_id</span><span class="type-col">ObjectId</span></div>
      <div class="table-row"><span class="key-col">FK</span><span class="name-col">claim</span><span class="type-col">claims._id</span></div>
      <div class="table-row"><span class="key-col">FK</span><span class="name-col">uploadedBy</span><span class="type-col">users._id</span></div>
      <div class="table-row"><span class="key-col">FK</span><span class="name-col">ocrJob</span><span class="type-col">ocrjobs._id</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">fileName</span><span class="type-col">String</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">mimeType</span><span class="type-col">String</span></div>
      <div class="table-row"><span class="key-col">IDX</span><span class="name-col">documentCategory</span><span class="type-col">String</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">isVerified</span><span class="type-col">Boolean</span></div>
    </div>

    <!-- OCRJob -->
    <div class="entity-box">
      <div class="entity-header">ocrjobs</div>
      <div class="table-row"><span class="key-col">PK</span><span class="name-col">_id</span><span class="type-col">ObjectId</span></div>
      <div class="table-row"><span class="key-col">FK</span><span class="name-col">claim</span><span class="type-col">claims._id</span></div>
      <div class="table-row"><span class="key-col">FK</span><span class="name-col">document</span><span class="type-col">claimdocuments._id</span></div>
      <div class="table-row"><span class="key-col">IDX</span><span class="name-col">status</span><span class="type-col">String</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">confidenceScore</span><span class="type-col">Number</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">structuredFields</span><span class="type-col">Mixed</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">rawExtractedText</span><span class="type-col">String</span></div>
    </div>

    <!-- SurveyAssignment -->
    <div class="entity-box">
      <div class="entity-header">surveyassignments</div>
      <div class="table-row"><span class="key-col">PK</span><span class="name-col">_id</span><span class="type-col">ObjectId</span></div>
      <div class="table-row"><span class="key-col">FK</span><span class="name-col">claim</span><span class="type-col">claims._id</span></div>
      <div class="table-row"><span class="key-col">FK</span><span class="name-col">surveyor</span><span class="type-col">users._id</span></div>
      <div class="table-row"><span class="key-col">FK</span><span class="name-col">assignedBy</span><span class="type-col">users._id</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">scheduledDate</span><span class="type-col">Date</span></div>
      <div class="table-row"><span class="key-col">IDX</span><span class="name-col">status</span><span class="type-col">String</span></div>
    </div>

    <!-- SurveyReport -->
    <div class="entity-box">
      <div class="entity-header">surveyreports</div>
      <div class="table-row"><span class="key-col">PK</span><span class="name-col">_id</span><span class="type-col">ObjectId</span></div>
      <div class="table-row"><span class="key-col">FK</span><span class="name-col">claim</span><span class="type-col">claims._id</span></div>
      <div class="table-row"><span class="key-col">FK</span><span class="name-col">surveyAssignment</span><span class="type-col">surveyassignments._id</span></div>
      <div class="table-row"><span class="key-col">FK</span><span class="name-col">surveyor</span><span class="type-col">users._id</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">estimatedRepairCost</span><span class="type-col">Number</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">liabilityAssessment</span><span class="type-col">String</span></div>
    </div>

    <!-- Settlement -->
    <div class="entity-box">
      <div class="entity-header">settlements</div>
      <div class="table-row"><span class="key-col">PK</span><span class="name-col">_id</span><span class="type-col">ObjectId</span></div>
      <div class="table-row"><span class="key-col">UQ</span><span class="name-col">settlementReference</span><span class="type-col">String</span></div>
      <div class="table-row"><span class="key-col">FK</span><span class="name-col">claim</span><span class="type-col">claims._id</span></div>
      <div class="table-row"><span class="key-col">FK</span><span class="name-col">customer</span><span class="type-col">users._id</span></div>
      <div class="table-row"><span class="key-col">FK</span><span class="name-col">authorizedBy</span><span class="type-col">users._id</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">approvedAmount</span><span class="type-col">Number</span></div>
      <div class="table-row"><span class="key-col">IDX</span><span class="name-col">status</span><span class="type-col">String</span></div>
    </div>

    <!-- ClaimTimelineEvent -->
    <div class="entity-box">
      <div class="entity-header">claimtimelineevents</div>
      <div class="table-row"><span class="key-col">PK</span><span class="name-col">_id</span><span class="type-col">ObjectId</span></div>
      <div class="table-row"><span class="key-col">FK</span><span class="name-col">claim</span><span class="type-col">claims._id</span></div>
      <div class="table-row"><span class="key-col">FK</span><span class="name-col">performedBy</span><span class="type-col">users._id</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">fromStatus</span><span class="type-col">String</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">toStatus</span><span class="type-col">String</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">message</span><span class="type-col">String</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">createdAt</span><span class="type-col">Date</span></div>
    </div>

    <!-- ConfigurableRule -->
    <div class="entity-box">
      <div class="entity-header">configurablerules</div>
      <div class="table-row"><span class="key-col">PK</span><span class="name-col">_id</span><span class="type-col">ObjectId</span></div>
      <div class="table-row"><span class="key-col">UQ</span><span class="name-col">ruleId</span><span class="type-col">String</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">name</span><span class="type-col">String</span></div>
      <div class="table-row"><span class="key-col">IDX</span><span class="name-col">category</span><span class="type-col">String</span></div>
      <div class="table-row"><span class="key-col">IDX</span><span class="name-col">isEnabled</span><span class="type-col">Boolean</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">severity</span><span class="type-col">String</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">parameters</span><span class="type-col">Mixed</span></div>
    </div>

    <!-- AuditLog -->
    <div class="entity-box">
      <div class="entity-header">auditlogs</div>
      <div class="table-row"><span class="key-col">PK</span><span class="name-col">_id</span><span class="type-col">ObjectId</span></div>
      <div class="table-row"><span class="key-col">FK</span><span class="name-col">user</span><span class="type-col">users._id</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">action</span><span class="type-col">String</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">resourceType</span><span class="type-col">String</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">resourceId</span><span class="type-col">String</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">ipAddress</span><span class="type-col">String</span></div>
      <div class="table-row"><span class="key-col"></span><span class="name-col">createdAt</span><span class="type-col">Date</span></div>
    </div>
  </div>
</div>
</body>
</html>`;

renderHtmlToPng(erdDiagramHtml, 'erd_diagram.png', 1440, 840);
fs.writeFileSync(path.join(assetsDir, 'erd_diagram.html'), erdDiagramHtml, 'utf8');

// -------------------------------------------------------------
// 5. NAVIGATION TREE (Academic Black & White Styling)
// -------------------------------------------------------------
const navigationDiagramHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {
    margin: 0; padding: 20px; font-family: 'Segoe UI', Arial, sans-serif;
    background: #ffffff; color: #000000;
  }
  .container {
    width: 1360px; margin: 0 auto; border: 2px solid #000000; border-radius: 4px;
    padding: 24px; background: #ffffff;
  }
  .title {
    text-align: center; font-size: 22px; font-weight: 700; color: #000000; margin-bottom: 2px;
    text-transform: uppercase;
  }
  .subtitle {
    text-align: center; font-size: 13px; color: #333333; margin-bottom: 24px; font-style: italic;
  }
  .root-node {
    background: #f1f5f9; color: #000000; border: 2px solid #000000; padding: 10px 24px; border-radius: 4px;
    font-size: 14px; font-weight: 700; text-align: center; width: 280px; margin: 0 auto 20px auto;
  }
  .portals-grid {
    display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px;
  }
  .portal-column {
    background: #ffffff; border: 1.5px solid #000000; border-radius: 4px;
    padding: 12px; box-shadow: 1px 1px 0px rgba(0,0,0,0.05);
  }
  .portal-header {
    font-size: 13px; font-weight: 700; text-align: center; padding-bottom: 8px;
    margin-bottom: 10px; border-bottom: 2px solid #000000; color: #000000;
  }
  .route-item {
    background: #fafafa; border: 1px solid #000000; border-radius: 3px;
    padding: 6px 8px; margin-bottom: 6px; font-size: 11px; color: #000000;
  }
  .route-path {
    font-family: 'Consolas', monospace; font-size: 10px; color: #333333; display: block;
  }
</style>
</head>
<body>
<div class="container">
  <div class="title">InsureFlow — React Router v6 Navigation Tree</div>
  <div class="subtitle">Complete Hierarchy of 33 Client Routes across Public, Protected Customer & Staff Workspaces</div>

  <div class="root-node">App Root &lt;Routes&gt;</div>

  <div class="portals-grid">
    <!-- Public Portal -->
    <div class="portal-column">
      <div class="portal-header">Public Portal (11)</div>
      <div class="route-item"><b>Landing Page</b><span class="route-path">/</span></div>
      <div class="route-item"><b>Policy Catalog</b><span class="route-path">/policies</span></div>
      <div class="route-item"><b>Policy Detail</b><span class="route-path">/policies/:id</span></div>
      <div class="route-item"><b>Compare Plans</b><span class="route-path">/compare</span></div>
      <div class="route-item"><b>How Claims Work</b><span class="route-path">/how-it-works</span></div>
      <div class="route-item"><b>About Platform</b><span class="route-path">/about</span></div>
      <div class="route-item"><b>Help & FAQ</b><span class="route-path">/faq</span></div>
      <div class="route-item"><b>Contact Us</b><span class="route-path">/contact</span></div>
      <div class="route-item"><b>User Sign In</b><span class="route-path">/login</span></div>
      <div class="route-item"><b>Registration</b><span class="route-path">/register</span></div>
      <div class="route-item"><b>Pass Recovery</b><span class="route-path">/forgot-password</span></div>
    </div>

    <!-- Customer Portal -->
    <div class="portal-column">
      <div class="portal-header">Customer Portal (7)</div>
      <div class="route-item"><b>Dashboard</b><span class="route-path">/customer/dashboard</span></div>
      <div class="route-item"><b>My Policies</b><span class="route-path">/customer/policies</span></div>
      <div class="route-item"><b>Register External</b><span class="route-path">/customer/policies/...</span></div>
      <div class="route-item"><b>File New Claim</b><span class="route-path">/customer/claims/new</span></div>
      <div class="route-item"><b>Claims History</b><span class="route-path">/customer/claims</span></div>
      <div class="route-item"><b>Claim Timeline</b><span class="route-path">/customer/claims/:id</span></div>
      <div class="route-item"><b>Settlements</b><span class="route-path">/customer/settlements</span></div>
    </div>

    <!-- Officer Portal -->
    <div class="portal-column">
      <div class="portal-header">Officer Portal (4)</div>
      <div class="route-item"><b>Dashboard</b><span class="route-path">/officer/dashboard</span></div>
      <div class="route-item"><b>Claims Queue</b><span class="route-path">/officer/queue</span></div>
      <div class="route-item"><b>Adjudication</b><span class="route-path">/officer/claims/:id</span></div>
      <div class="route-item"><b>Audit Policies</b><span class="route-path">/officer/external-p...</span></div>
    </div>

    <!-- Surveyor Portal -->
    <div class="portal-column">
      <div class="portal-header">Surveyor Portal (3)</div>
      <div class="route-item"><b>Dashboard</b><span class="route-path">/surveyor/dashboard</span></div>
      <div class="route-item"><b>Inspection Queue</b><span class="route-path">/surveyor/inspections</span></div>
      <div class="route-item"><b>Damage Workspace</b><span class="route-path">/surveyor/inspec.../:id</span></div>
    </div>

    <!-- Manager Portal -->
    <div class="portal-column">
      <div class="portal-header">Manager Portal (4)</div>
      <div class="route-item"><b>Dashboard</b><span class="route-path">/manager/dashboard</span></div>
      <div class="route-item"><b>Decisions List</b><span class="route-path">/manager/decisions</span></div>
      <div class="route-item"><b>Claim Approval</b><span class="route-path">/manager/claims/:id</span></div>
      <div class="route-item"><b>Settlement Auth</b><span class="route-path">/manager/settlements</span></div>
    </div>

    <!-- Admin Suite -->
    <div class="portal-column">
      <div class="portal-header">Admin Suite (5)</div>
      <div class="route-item"><b>Dashboard</b><span class="route-path">/admin/dashboard</span></div>
      <div class="route-item"><b>User Management</b><span class="route-path">/admin/users</span></div>
      <div class="route-item"><b>Product Catalog</b><span class="route-path">/admin/policies</span></div>
      <div class="route-item"><b>Rule Engine</b><span class="route-path">/admin/rules</span></div>
      <div class="route-item"><b>Audit Trail</b><span class="route-path">/admin/audit-logs</span></div>
    </div>
  </div>
</div>
</body>
</html>`;

renderHtmlToPng(navigationDiagramHtml, 'navigation_diagram.png', 1400, 780);
fs.writeFileSync(path.join(assetsDir, 'navigation_diagram.html'), navigationDiagramHtml, 'utf8');

console.log('All diagrams re-rendered with black-ink academic styling.');
