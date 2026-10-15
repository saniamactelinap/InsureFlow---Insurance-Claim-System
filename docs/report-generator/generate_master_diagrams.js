import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const projectRoot = 'C:/Users/apste/Desktop/SM/F-U';
const assetsDir = path.join(projectRoot, 'docs/insureflow_report_assets');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

function renderSvgToPng(svgContent, baseName, width, height) {
  const svgPath = path.join(assetsDir, `${baseName}.svg`);
  const pngPath = path.join(assetsDir, `${baseName}.png`);
  
  // Write SVG file
  fs.writeFileSync(svgPath, svgContent, 'utf8');
  console.log(`[SVG Written] ${baseName}.svg (${svgContent.length} bytes)`);

  // Render to PNG via Headless Edge
  // Wrap SVG in a minimal HTML container for clean edge rendering with exact viewBox
  const htmlWrapper = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #ffffff; display: flex; justify-content: center; align-items: center; width: ${width}px; height: ${height}px; overflow: hidden; }
  svg { width: ${width}px; height: ${height}px; }
</style>
</head>
<body>
${svgContent}
</body>
</html>`;
  
  const tempHtml = path.join(assetsDir, `_temp_${baseName}.html`);
  fs.writeFileSync(tempHtml, htmlWrapper, 'utf8');

  const fileUrl = `file:///${tempHtml.replace(/\\/g, '/')}`;
  const cmd = `"${edgePath}" --headless=new --disable-gpu --screenshot="${pngPath}" --window-size=${width},${height} "${fileUrl}"`;
  
  try {
    execSync(cmd, { stdio: 'pipe' });
    const stat = fs.statSync(pngPath);
    console.log(`[PNG Rendered] ${baseName}.png (${stat.size} bytes, ${width}x${height})`);
  } catch (err) {
    console.error(`Error rendering ${baseName}.png:`, err.message);
  } finally {
    if (fs.existsSync(tempHtml)) fs.unlinkSync(tempHtml);
  }
}

// =========================================================================
// 1. SYSTEM ARCHITECTURE OF INSUREFLOW
// =========================================================================
const svg1 = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="880" viewBox="0 0 1280 880">
  <defs>
    <style>
      .bg { fill: #ffffff; }
      .title { font-family: 'Segoe UI', Arial, sans-serif; font-size: 20px; font-weight: bold; fill: #000000; text-anchor: middle; letter-spacing: 0.5px; }
      .subtitle { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; fill: #333333; text-anchor: middle; font-style: italic; }
      .border { fill: none; stroke: #000000; stroke-width: 2; }
      .tier-box { fill: #fafafa; stroke: #000000; stroke-width: 1.5; rx: 6; }
      .tier-header { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; font-weight: bold; fill: #000000; }
      .tier-tag { font-family: 'Consolas', monospace; font-size: 11px; fill: #444444; }
      .comp-box { fill: #ffffff; stroke: #000000; stroke-width: 1.2; rx: 4; }
      .comp-title { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; font-weight: bold; fill: #000000; }
      .comp-desc { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10px; fill: #333333; }
      .arrow { stroke: #000000; stroke-width: 1.5; fill: none; marker-end: url(#arrowhead); }
      .arrow-bidir { stroke: #000000; stroke-width: 1.5; fill: none; marker-end: url(#arrowhead); marker-start: url(#arrowstart); }
      .flow-label { font-family: 'Consolas', monospace; font-size: 10px; fill: #000000; font-weight: bold; background: #ffffff; }
    </style>
    <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
      <polygon points="0 0, 8 3, 0 6" fill="#000000" />
    </marker>
    <marker id="arrowstart" markerWidth="8" markerHeight="6" refX="1" refY="3" orient="auto">
      <polygon points="8 0, 0 3, 8 6" fill="#000000" />
    </marker>
  </defs>

  <!-- Canvas Background & Academic Border -->
  <rect width="1280" height="880" class="bg" />
  <rect x="15" y="15" width="1250" height="850" class="border" />

  <!-- Diagram Titles -->
  <text x="640" y="48" class="title">FIGURE 1: FOUR-TIER SYSTEM ARCHITECTURE OF INSUREFLOW</text>
  <text x="640" y="68" class="subtitle">Complete Technical Architecture: Client Presentation, Express API Gateway, Core Microservices, and Persistent Data Storage</text>

  <!-- TIER 1: CLIENT PRESENTATION TIER -->
  <rect x="40" y="90" width="1200" height="150" class="tier-box" />
  <text x="60" y="115" class="tier-header">TIER 1: CLIENT PRESENTATION TIER (Single Page Application — React 18 &amp; Vite 5.4)</text>
  <text x="1050" y="115" class="tier-tag">&lt;&lt;Port 5173 / HTTPS&gt;&gt;</text>

  <!-- Sub-boxes in Tier 1 -->
  <g transform="translate(60, 130)">
    <rect width="210" height="90" class="comp-box" />
    <text x="15" y="24" class="comp-title">Customer Portal</text>
    <text x="15" y="42" class="comp-desc">• Policy Catalog &amp; Comparison</text>
    <text x="15" y="58" class="comp-desc">• FNOL Digital Claim Filing</text>
    <text x="15" y="74" class="comp-desc">• Real-time Settlement Tracker</text>
  </g>
  <g transform="translate(290, 130)">
    <rect width="210" height="90" class="comp-box" />
    <text x="15" y="24" class="comp-title">Officer Workstation</text>
    <text x="15" y="42" class="comp-desc">• Unassigned Claims Queue</text>
    <text x="15" y="58" class="comp-desc">• Side-by-Side OCR Audit Modal</text>
    <text x="15" y="74" class="comp-desc">• Compliance Rule Flag Review</text>
  </g>
  <g transform="translate(520, 130)">
    <rect width="210" height="90" class="comp-box" />
    <text x="15" y="24" class="comp-title">Surveyor Console</text>
    <text x="15" y="42" class="comp-desc">• Field Inspection Task Roster</text>
    <text x="15" y="58" class="comp-desc">• Damage Assessment Forms</text>
    <text x="15" y="74" class="comp-desc">• Physical Photo Evidence Upload</text>
  </g>
  <g transform="translate(750, 130)">
    <rect width="210" height="90" class="comp-box" />
    <text x="15" y="24" class="comp-title">Manager Adjudication</text>
    <text x="15" y="42" class="comp-desc">• Escalated Claims Roster</text>
    <text x="15" y="58" class="comp-desc">• Executive Approval / Reject</text>
    <text x="15" y="74" class="comp-desc">• Settlement Voucher Approval</text>
  </g>
  <g transform="translate(980, 130)">
    <rect width="240" height="90" class="comp-box" />
    <text x="15" y="24" class="comp-title">Admin Management</text>
    <text x="15" y="42" class="comp-desc">• Underwriting Plan Publishing</text>
    <text x="15" y="58" class="comp-desc">• Deterministic Rule Config</text>
    <text x="15" y="74" class="comp-desc">• Audit Trail &amp; User RBAC</text>
  </g>

  <!-- Connectors Tier 1 -> Tier 2 -->
  <line x1="640" y1="240" x2="640" y2="280" class="arrow-bidir" />
  <rect x="520" y="250" width="240" height="20" fill="#ffffff" stroke="#000000" stroke-width="1" rx="3" />
  <text x="640" y="264" font-family="Consolas" font-size="10px" font-weight="bold" fill="#000000" text-anchor="middle">RESTful API / HTTPS / JWT Interceptor</text>

  <!-- TIER 2: API GATEWAY &amp; SECURITY MIDDLEWARE -->
  <rect x="40" y="280" width="1200" height="130" class="tier-box" />
  <text x="60" y="305" class="tier-header">TIER 2: API GATEWAY &amp; SECURITY MIDDLEWARE (Node.js v22 &amp; Express 4.21)</text>
  <text x="1050" y="305" class="tier-tag">&lt;&lt;Port 5000 / HTTP REST&gt;&gt;</text>

  <g transform="translate(60, 320)">
    <rect width="260" height="75" class="comp-box" />
    <text x="15" y="22" class="comp-title">Authentication &amp; RBAC</text>
    <text x="15" y="40" class="comp-desc">• JWT Bearer Token Verification</text>
    <text x="15" y="56" class="comp-desc">• Role Middleware (5 Discrete Roles)</text>
  </g>
  <g transform="translate(350, 320)">
    <rect width="260" height="75" class="comp-box" />
    <text x="15" y="22" class="comp-title">Security &amp; Sanitization</text>
    <text x="15" y="40" class="comp-desc">• Helmet HTTP Header Hardening</text>
    <text x="15" y="56" class="comp-desc">• CORS Policy Guard &amp; Input Escaping</text>
  </g>
  <g transform="translate(640, 320)">
    <rect width="270" height="75" class="comp-box" />
    <text x="15" y="22" class="comp-title">Multi-part Stream Ingestion</text>
    <text x="15" y="40" class="comp-desc">• Multer 1.4.5 Disk Streaming</text>
    <text x="15" y="56" class="comp-desc">• UUID v4 Sanitizer &amp; 10MB Threshold</text>
  </g>
  <g transform="translate(940, 320)">
    <rect width="280" height="75" class="comp-box" />
    <text x="15" y="22" class="comp-title">Error Handling &amp; Audit Logger</text>
    <text x="15" y="40" class="comp-desc">• Centralized Exception Dispatcher</text>
    <text x="15" y="56" class="comp-desc">• Immutable System Activity Log</text>
  </g>

  <!-- Connectors Tier 2 -> Tier 3 -->
  <line x1="640" y1="410" x2="640" y2="450" class="arrow" />
  <rect x="530" y="420" width="220" height="20" fill="#ffffff" stroke="#000000" stroke-width="1" rx="3" />
  <text x="640" y="434" font-family="Consolas" font-size="10px" font-weight="bold" fill="#000000" text-anchor="middle">Internal Controller Dispatch</text>

  <!-- TIER 3: CORE APPLICATION MICROSERVICES &amp; CONTROLLERS -->
  <rect x="40" y="450" width="1200" height="190" class="tier-box" />
  <text x="60" y="475" class="tier-header">TIER 3: CORE BUSINESS LOGIC &amp; MICROSERVICES (Express Controllers &amp; Automation Engines)</text>
  <text x="1050" y="475" class="tier-tag">&lt;&lt;Service Layer&gt;&gt;</text>

  <g transform="translate(60, 490)">
    <rect width="210" height="135" class="comp-box" />
    <text x="15" y="24" class="comp-title">REST Controllers (13)</text>
    <text x="15" y="44" class="comp-desc">• authController.js</text>
    <text x="15" y="60" class="comp-desc">• claimController.js</text>
    <text x="15" y="76" class="comp-desc">• managerController.js</text>
    <text x="15" y="92" class="comp-desc">• surveyController.js</text>
    <text x="15" y="108" class="comp-desc">• settlementController.js</text>
    <text x="15" y="124" class="comp-desc">• policyProductController.js</text>
  </g>
  <g transform="translate(290, 490)">
    <rect width="210" height="135" class="comp-box" />
    <text x="15" y="24" class="comp-title">Deterministic Rule Engine</text>
    <text x="15" y="44" class="comp-desc">ruleEngineService.js</text>
    <text x="15" y="64" class="comp-desc">• 7 Automated Validation Rules</text>
    <text x="15" y="80" class="comp-desc">• Coverage Date Verification</text>
    <text x="15" y="96" class="comp-desc">• Cap &amp; Deductible Math</text>
    <text x="15" y="112" class="comp-desc">• Health Score Calculation</text>
  </g>
  <g transform="translate(520, 490)">
    <rect width="210" height="135" class="comp-box" />
    <text x="15" y="24" class="comp-title">Finite State Machine</text>
    <text x="15" y="44" class="comp-desc">stateMachineService.js</text>
    <text x="15" y="64" class="comp-desc">• 15 Lifecycle States</text>
    <text x="15" y="80" class="comp-desc">• Role Guarded Transitions</text>
    <text x="15" y="96" class="comp-desc">• Immutable Audit Trail Log</text>
    <text x="15" y="112" class="comp-desc">• Legal Transition Matrix</text>
  </g>
  <g transform="translate(750, 490)">
    <rect width="210" height="135" class="comp-box" />
    <text x="15" y="24" class="comp-title">OCR &amp; Extraction Engine</text>
    <text x="15" y="44" class="comp-desc">ocrService.js</text>
    <text x="15" y="64" class="comp-desc">• pdf-parse Digital Parser</text>
    <text x="15" y="80" class="comp-desc">• Tesseract.js Image OCR</text>
    <text x="15" y="96" class="comp-desc">• Regex Structured Fields</text>
    <text x="15" y="112" class="comp-desc">• Composite Confidence Score</text>
  </g>
  <g transform="translate(980, 490)">
    <rect width="240" height="135" class="comp-box" />
    <text x="15" y="24" class="comp-title">Settlement &amp; Alerts</text>
    <text x="15" y="44" class="comp-desc">settlement &amp; notificationService</text>
    <text x="15" y="64" class="comp-desc">• SET-YYYYMMDD-XXXX Code Gen</text>
    <text x="15" y="80" class="comp-desc">• Bank Transfer Status Tracking</text>
    <text x="15" y="96" class="comp-desc">• In-App Real-time Notifications</text>
    <text x="15" y="112" class="comp-desc">• Audit Timeline Event Logger</text>
  </g>

  <!-- Connectors Tier 3 -> Tier 4 -->
  <line x1="640" y1="640" x2="640" y2="680" class="arrow-bidir" />
  <rect x="520" y="650" width="240" height="20" fill="#ffffff" stroke="#000000" stroke-width="1" rx="3" />
  <text x="640" y="664" font-family="Consolas" font-size="10px" font-weight="bold" fill="#000000" text-anchor="middle">Mongoose ODM 8.9.5 / MongoDB Wire</text>

  <!-- TIER 4: PERSISTENCE &amp; STORAGE TIER -->
  <rect x="40" y="680" width="1200" height="160" class="tier-box" />
  <text x="60" y="705" class="tier-header">TIER 4: DATA PERSISTENCE &amp; STORAGE TIER (MongoDB ODM &amp; File Storage)</text>
  <text x="1050" y="705" class="tier-tag">&lt;&lt;Storage Layer&gt;&gt;</text>

  <g transform="translate(60, 720)">
    <rect width="360" height="105" class="comp-box" />
    <text x="15" y="24" class="comp-title">MongoDB Atlas Cloud Replica Set</text>
    <text x="15" y="44" class="comp-desc">• Primary Database Engine with automatic failover</text>
    <text x="15" y="60" class="comp-desc">• Strict Mongoose Schema validation &amp; indexing</text>
    <text x="15" y="76" class="comp-desc">• 14 Persistent Collections (Claims, Users, Policies, etc.)</text>
    <text x="15" y="92" class="comp-desc">• Connection URI managed securely in server/.env</text>
  </g>
  <g transform="translate(450, 720)">
    <rect width="370" height="105" class="comp-box" />
    <text x="15" y="24" class="comp-title">In-Memory MongoDB Fallback Engine</text>
    <text x="15" y="44" class="comp-desc">• mongodb-memory-server v10.1.3 Integration</text>
    <text x="15" y="60" class="comp-desc">• Automatic zero-config fallback if Atlas is unreachable</text>
    <text x="15" y="76" class="comp-desc">• Isolated transient state for Jest automated test suite</text>
    <text x="15" y="92" class="comp-desc">• Auto-seeded with 15 catalog products &amp; 5 role accounts</text>
  </g>
  <g transform="translate(850, 720)">
    <rect width="370" height="105" class="comp-box" />
    <text x="15" y="24" class="comp-title">Local Document &amp; Evidence Storage</text>
    <text x="15" y="44" class="comp-desc">• Dedicated server/uploads/ directory for multipart files</text>
    <text x="15" y="60" class="comp-desc">• UUID-based non-colliding filename hashing</text>
    <text x="15" y="76" class="comp-desc">• Serves invoices, medical discharge summaries, FIRs</text>
    <text x="15" y="92" class="comp-desc">• Secure path validation preventing directory traversal</text>
  </g>

</svg>`;

// =========================================================================
// 2. UML DOMAIN MODEL & CLASS DIAGRAM
// =========================================================================
const svg2 = `<svg xmlns="http://www.w3.org/2000/svg" width="1380" height="960" viewBox="0 0 1380 960">
  <defs>
    <style>
      .bg { fill: #ffffff; }
      .border { fill: none; stroke: #000000; stroke-width: 2; }
      .title { font-family: 'Segoe UI', Arial, sans-serif; font-size: 20px; font-weight: bold; fill: #000000; text-anchor: middle; }
      .subtitle { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; fill: #333333; text-anchor: middle; font-style: italic; }
      .class-box { fill: #ffffff; stroke: #000000; stroke-width: 1.5; }
      .class-header { fill: #f1f5f9; stroke: #000000; stroke-width: 1.5; }
      .stereo { font-family: 'Segoe UI', Arial, sans-serif; font-size: 9px; fill: #444444; font-style: italic; text-anchor: middle; }
      .cname { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; font-weight: bold; fill: #000000; text-anchor: middle; }
      .attr { font-family: 'Consolas', monospace; font-size: 10px; fill: #000000; }
      .meth { font-family: 'Consolas', monospace; font-size: 10px; fill: #000000; }
      .divider { stroke: #000000; stroke-width: 1; }
      .assoc { stroke: #000000; stroke-width: 1.5; fill: none; }
      .multi { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10px; fill: #000000; font-weight: bold; }
    </style>
  </defs>

  <rect width="1380" height="960" class="bg" />
  <rect x="15" y="15" width="1350" height="930" class="border" />

  <text x="690" y="48" class="title">FIGURE 2: UML DOMAIN MODEL &amp; CLASS DIAGRAM OF INSUREFLOW</text>
  <text x="690" y="68" class="subtitle">Structural Specification of Core Mongoose Schemas, Persistent Attributes, Schema Operations, and Entity Associations</text>

  <!-- Class 1: User -->
  <g transform="translate(40, 90)">
    <rect width="280" height="230" class="class-box" />
    <rect width="280" height="36" class="class-header" />
    <text x="140" y="16" class="stereo">&lt;&lt;Mongoose Model&gt;&gt;</text>
    <text x="140" y="30" class="cname">User</text>
    <text x="10" y="52" class="attr">+ _id: ObjectId [PK]</text>
    <text x="10" y="68" class="attr">+ name: String</text>
    <text x="10" y="84" class="attr">+ email: String [UNIQUE]</text>
    <text x="10" y="100" class="attr">+ password: String (Bcrypt Hash)</text>
    <text x="10" y="116" class="attr">+ role: Enum (5 User Roles)</text>
    <text x="10" y="132" class="attr">+ department: String</text>
    <text x="10" y="148" class="attr">+ phone: String</text>
    <text x="10" y="164" class="attr">+ isActive: Boolean</text>
    <line x1="0" y1="174" x2="280" y2="174" class="divider" />
    <text x="10" y="192" class="meth">+ comparePassword(pwd): Boolean</text>
    <text x="10" y="208" class="meth">+ pre('save'): Hash Password</text>
    <text x="10" y="224" class="meth">+ toJSON(): Omit Password</text>
  </g>

  <!-- Class 2: PolicyProduct -->
  <g transform="translate(370, 90)">
    <rect width="290" height="230" class="class-box" />
    <rect width="290" height="36" class="class-header" />
    <text x="145" y="16" class="stereo">&lt;&lt;Mongoose Model&gt;&gt;</text>
    <text x="145" y="30" class="cname">PolicyProduct</text>
    <text x="10" y="52" class="attr">+ _id: ObjectId [PK]</text>
    <text x="10" y="68" class="attr">+ productName: String</text>
    <text x="10" y="84" class="attr">+ insurer: String</text>
    <text x="10" y="100" class="attr">+ category: Enum (HEALTH/VEH/PROP)</text>
    <text x="10" y="116" class="attr">+ planCode: String [UNIQUE]</text>
    <text x="10" y="132" class="attr">+ coverageLimit: Number</text>
    <text x="10" y="148" class="attr">+ deductible: Number</text>
    <text x="10" y="164" class="attr">+ annualPremium: Number</text>
    <text x="10" y="180" class="attr">+ isPublished: Boolean</text>
    <line x1="0" y1="190" x2="290" y2="190" class="divider" />
    <text x="10" y="208" class="meth">+ validatePlanCode(): Boolean</text>
    <text x="10" y="224" class="meth">+ calculatePremium(): Number</text>
  </g>

  <!-- Class 3: CustomerPolicy -->
  <g transform="translate(710, 90)">
    <rect width="300" height="230" class="class-box" />
    <rect width="300" height="36" class="class-header" />
    <text x="150" y="16" class="stereo">&lt;&lt;Mongoose Model&gt;&gt;</text>
    <text x="150" y="30" class="cname">CustomerPolicy</text>
    <text x="10" y="52" class="attr">+ _id: ObjectId [PK]</text>
    <text x="10" y="68" class="attr">+ customer: Ref&lt;User&gt; [FK]</text>
    <text x="10" y="84" class="attr">+ product: Ref&lt;PolicyProduct&gt; [FK]</text>
    <text x="10" y="100" class="attr">+ policySource: Enum (PLATFORM/EXT)</text>
    <text x="10" y="116" class="attr">+ policyNumber: String [UNIQUE]</text>
    <text x="10" y="132" class="attr">+ insurerName: String</text>
    <text x="10" y="148" class="attr">+ coverageAmount: Number</text>
    <text x="10" y="164" class="attr">+ startDate: Date</text>
    <text x="10" y="180" class="attr">+ endDate: Date</text>
    <line x1="0" y1="190" x2="300" y2="190" class="divider" />
    <text x="10" y="208" class="meth">+ isCoveredOn(date): Boolean</text>
    <text x="10" y="224" class="meth">+ getRemainingLimit(): Number</text>
  </g>

  <!-- Class 4: ConfigurableRule -->
  <g transform="translate(1060, 90)">
    <rect width="280" height="230" class="class-box" />
    <rect width="280" height="36" class="class-header" />
    <text x="140" y="16" class="stereo">&lt;&lt;Mongoose Model&gt;&gt;</text>
    <text x="140" y="30" class="cname">ConfigurableRule</text>
    <text x="10" y="52" class="attr">+ _id: ObjectId [PK]</text>
    <text x="10" y="68" class="attr">+ ruleId: String [UNIQUE]</text>
    <text x="10" y="84" class="attr">+ ruleName: String</text>
    <text x="10" y="100" class="attr">+ category: Enum</text>
    <text x="10" y="116" class="attr">+ isEnabled: Boolean</text>
    <text x="10" y="132" class="attr">+ severity: Enum (INFO/WARN/CRIT)</text>
    <text x="10" y="148" class="attr">+ parameters: Object</text>
    <line x1="0" y1="160" x2="280" y2="160" class="divider" />
    <text x="10" y="180" class="meth">+ evaluate(claim, policy): Result</text>
    <text x="10" y="198" class="meth">+ toggleActiveStatus(): Boolean</text>
    <text x="10" y="216" class="meth">+ updateParameters(cfg): Object</text>
  </g>

  <!-- Class 5: Claim (Central Entity) -->
  <g transform="translate(470, 380)">
    <rect width="360" height="280" class="class-box" />
    <rect width="360" height="36" class="class-header" />
    <text x="180" y="16" class="stereo">&lt;&lt;Mongoose Model (Central)&gt;&gt;</text>
    <text x="180" y="30" class="cname">Claim</text>
    <text x="10" y="52" class="attr">+ _id: ObjectId [PK]</text>
    <text x="10" y="68" class="attr">+ claimReference: String [UNIQUE, CLM-xxx]</text>
    <text x="10" y="84" class="attr">+ customer: Ref&lt;User&gt; [FK]</text>
    <text x="10" y="100" class="attr">+ customerPolicy: Ref&lt;CustomerPolicy&gt; [FK]</text>
    <text x="10" y="116" class="attr">+ assignedOfficer: Ref&lt;User&gt; [FK, Optional]</text>
    <text x="10" y="132" class="attr">+ assignedSurveyor: Ref&lt;User&gt; [FK, Optional]</text>
    <text x="10" y="148" class="attr">+ category: Enum (HEALTH, VEHICLE, PROPERTY)</text>
    <text x="10" y="164" class="attr">+ requestedAmount: Number</text>
    <text x="10" y="180" class="attr">+ approvedAmount: Number</text>
    <text x="10" y="196" class="attr">+ status: Enum (15 Legal States)</text>
    <text x="10" y="212" class="attr">+ automatedValidation: Object (Score &amp; Rules)</text>
    <text x="10" y="228" class="attr">+ isHighValueClaim: Boolean (&gt;= ₹5,000)</text>
    <line x1="0" y1="238" x2="360" y2="238" class="divider" />
    <text x="10" y="254" class="meth">+ canTransitionTo(targetState, role): Boolean</text>
    <text x="10" y="270" class="meth">+ calculatePayableAmount(): Number</text>
  </g>

  <!-- Class 6: ClaimDocument -->
  <g transform="translate(40, 420)">
    <rect width="280" height="210" class="class-box" />
    <rect width="280" height="36" class="class-header" />
    <text x="140" y="16" class="stereo">&lt;&lt;Mongoose Model&gt;&gt;</text>
    <text x="140" y="30" class="cname">ClaimDocument</text>
    <text x="10" y="52" class="attr">+ _id: ObjectId [PK]</text>
    <text x="10" y="68" class="attr">+ claim: Ref&lt;Claim&gt; [FK]</text>
    <text x="10" y="84" class="attr">+ uploadedBy: Ref&lt;User&gt; [FK]</text>
    <text x="10" y="100" class="attr">+ documentCategory: Enum</text>
    <text x="10" y="116" class="attr">+ fileName: String (UUID)</text>
    <text x="10" y="132" class="attr">+ originalName: String</text>
    <text x="10" y="148" class="attr">+ mimeType: String</text>
    <text x="10" y="164" class="attr">+ sizeBytes: Number</text>
    <line x1="0" y1="174" x2="280" y2="174" class="divider" />
    <text x="10" y="194" class="meth">+ getAbsoluteStoragePath(): String</text>
  </g>

  <!-- Class 7: OCRJob -->
  <g transform="translate(40, 700)">
    <rect width="280" height="210" class="class-box" />
    <rect width="280" height="36" class="class-header" />
    <text x="140" y="16" class="stereo">&lt;&lt;Mongoose Model&gt;&gt;</text>
    <text x="140" y="30" class="cname">OCRJob</text>
    <text x="10" y="52" class="attr">+ _id: ObjectId [PK]</text>
    <text x="10" y="68" class="attr">+ claimDocument: Ref&lt;Doc&gt; [FK]</text>
    <text x="10" y="84" class="attr">+ claim: Ref&lt;Claim&gt; [FK]</text>
    <text x="10" y="100" class="attr">+ status: Enum (PEND/COMP/FAIL)</text>
    <text x="10" y="116" class="attr">+ extractedText: String</text>
    <text x="10" y="132" class="attr">+ extractedFields: Object</text>
    <text x="10" y="148" class="attr">+ opticalConfidence: Number</text>
    <text x="10" y="164" class="attr">+ confidenceScore: Number</text>
    <line x1="0" y1="174" x2="280" y2="174" class="divider" />
    <text x="10" y="194" class="meth">+ parseRegexEntities(): Object</text>
  </g>

  <!-- Class 8: SurveyReport -->
  <g transform="translate(470, 710)">
    <rect width="360" height="200" class="class-box" />
    <rect width="360" height="36" class="class-header" />
    <text x="180" y="16" class="stereo">&lt;&lt;Mongoose Model&gt;&gt;</text>
    <text x="180" y="30" class="cname">SurveyReport</text>
    <text x="10" y="52" class="attr">+ _id: ObjectId [PK]</text>
    <text x="10" y="68" class="attr">+ claim: Ref&lt;Claim&gt; [FK]</text>
    <text x="10" y="84" class="attr">+ surveyor: Ref&lt;User&gt; [FK]</text>
    <text x="10" y="100" class="attr">+ inspectionDate: Date</text>
    <text x="10" y="116" class="attr">+ damageAssessment: String</text>
    <text x="10" y="132" class="attr">+ estimatedRepairCost: Number</text>
    <text x="10" y="148" class="attr">+ isClaimValid: Boolean</text>
    <text x="10" y="164" class="attr">+ photoUrls: Array&lt;String&gt;</text>
    <line x1="0" y1="174" x2="360" y2="174" class="divider" />
    <text x="10" y="192" class="meth">+ submitReport(): Boolean</text>
  </g>

  <!-- Class 9: Settlement -->
  <g transform="translate(970, 420)">
    <rect width="340" height="230" class="class-box" />
    <rect width="340" height="36" class="class-header" />
    <text x="170" y="16" class="stereo">&lt;&lt;Mongoose Model&gt;&gt;</text>
    <text x="170" y="30" class="cname">Settlement</text>
    <text x="10" y="52" class="attr">+ _id: ObjectId [PK]</text>
    <text x="10" y="68" class="attr">+ settlementReference: String [UNIQUE]</text>
    <text x="10" y="84" class="attr">+ claim: Ref&lt;Claim&gt; [FK]</text>
    <text x="10" y="100" class="attr">+ customer: Ref&lt;User&gt; [FK]</text>
    <text x="10" y="116" class="attr">+ approvedAmount: Number</text>
    <text x="10" y="132" class="attr">+ paymentMethod: Enum (BANK/UPI)</text>
    <text x="10" y="148" class="attr">+ status: Enum (PEND/PROC/SETTLED)</text>
    <text x="10" y="164" class="attr">+ authorizedBy: Ref&lt;User&gt; [FK]</text>
    <text x="10" y="180" class="attr">+ disbursedAt: Date</text>
    <line x1="0" y1="190" x2="340" y2="190" class="divider" />
    <text x="10" y="208" class="meth">+ generateVoucher(): String</text>
    <text x="10" y="224" class="meth">+ executeDisbursement(): Boolean</text>
  </g>

  <!-- Association Lines -->
  <!-- User to CustomerPolicy -->
  <line x1="320" y1="190" x2="710" y2="190" class="assoc" />
  <text x="330" y="182" class="multi">1</text>
  <text x="680" y="182" class="multi">0..*</text>

  <!-- PolicyProduct to CustomerPolicy -->
  <line x1="660" y1="190" x2="710" y2="190" class="assoc" />

  <!-- CustomerPolicy to Claim -->
  <line x1="860" y1="320" x2="860" y2="350" class="assoc" />
  <line x1="860" y1="350" x2="720" y2="350" class="assoc" />
  <line x1="720" y1="350" x2="720" y2="380" class="assoc" />
  <text x="870" y="340" class="multi">1</text>
  <text x="730" y="375" class="multi">0..*</text>

  <!-- Claim to ClaimDocument -->
  <line x1="470" y1="520" x2="320" y2="520" class="assoc" />
  <text x="445" y="512" class="multi">1</text>
  <text x="335" y="512" class="multi">1..*</text>

  <!-- ClaimDocument to OCRJob -->
  <line x1="180" y1="630" x2="180" y2="700" class="assoc" />
  <text x="190" y="650" class="multi">1</text>
  <text x="190" y="690" class="multi">1</text>

  <!-- Claim to SurveyReport -->
  <line x1="650" y1="660" x2="650" y2="710" class="assoc" />
  <text x="660" y="680" class="multi">1</text>
  <text x="660" y="700" class="multi">0..1</text>

  <!-- Claim to Settlement -->
  <line x1="830" y1="520" x2="970" y2="520" class="assoc" />
  <text x="845" y="512" class="multi">1</text>
  <text x="945" y="512" class="multi">0..1</text>

</svg>`;

// =========================================================================
// 3. UML SEQUENCE DIAGRAM FOR CLAIM PROCESSING LIFECYCLE
// =========================================================================
const svg3 = `<svg xmlns="http://www.w3.org/2000/svg" width="1380" height="960" viewBox="0 0 1380 960">
  <defs>
    <style>
      .bg { fill: #ffffff; }
      .border { fill: none; stroke: #000000; stroke-width: 2; }
      .title { font-family: 'Segoe UI', Arial, sans-serif; font-size: 20px; font-weight: bold; fill: #000000; text-anchor: middle; }
      .subtitle { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; fill: #333333; text-anchor: middle; font-style: italic; }
      .actor-box { fill: #ffffff; stroke: #000000; stroke-width: 1.5; rx: 4; }
      .actor-text { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; font-weight: bold; fill: #000000; text-anchor: middle; }
      .lifeline { stroke: #000000; stroke-width: 1; stroke-dasharray: 5,5; }
      .msg { stroke: #000000; stroke-width: 1.5; fill: none; marker-end: url(#arr); }
      .ret { stroke: #000000; stroke-width: 1.5; stroke-dasharray: 4,4; fill: none; marker-end: url(#arr); }
      .label { font-family: 'Consolas', monospace; font-size: 10px; fill: #000000; font-weight: bold; }
      .opt-box { fill: none; stroke: #000000; stroke-width: 1.2; stroke-dasharray: 3,3; }
      .opt-tag { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10px; font-weight: bold; fill: #000000; }
    </style>
    <marker id="arr" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
      <polygon points="0 0, 8 3, 0 6" fill="#000000" />
    </marker>
  </defs>

  <rect width="1380" height="960" class="bg" />
  <rect x="15" y="15" width="1350" height="930" class="border" />

  <text x="690" y="48" class="title">FIGURE 3: UML SEQUENCE DIAGRAM FOR CLAIM PROCESSING LIFECYCLE</text>
  <text x="690" y="68" class="subtitle">Complete Interaction Flow: Customer FNOL, Express Gateway, Async OCR, Rule Engine, Officer Adjudication, Survey Triggers, Manager Decision &amp; Settlement</text>

  <!-- Lifeline Columns (7 Entities) -->
  <!-- 1. Customer: x=100 -->
  <!-- 2. React SPA: x=280 -->
  <!-- 3. Express API Gateway: x=480 -->
  <!-- 4. Claim Controller & FSM: x=680 -->
  <!-- 5. OCR & Rule Engines: x=880 -->
  <!-- 6. MongoDB Database: x=1080 -->
  <!-- 7. Staff (Officer/Surveyor/Manager): x=1250 -->

  <!-- Lifeline Headers -->
  <g transform="translate(40, 90)"><rect width="120" height="40" class="actor-box" /><text x="60" y="25" class="actor-text">Customer</text></g>
  <g transform="translate(220, 90)"><rect width="120" height="40" class="actor-box" /><text x="60" y="25" class="actor-text">React Client SPA</text></g>
  <g transform="translate(420, 90)"><rect width="120" height="40" class="actor-box" /><text x="60" y="25" class="actor-text">Express Gateway</text></g>
  <g transform="translate(620, 90)"><rect width="120" height="40" class="actor-box" /><text x="60" y="25" class="actor-text">Claim Controller</text></g>
  <g transform="translate(820, 90)"><rect width="120" height="40" class="actor-box" /><text x="60" y="25" class="actor-text">Rule &amp; OCR Engine</text></g>
  <g transform="translate(1020, 90)"><rect width="120" height="40" class="actor-box" /><text x="60" y="25" class="actor-text">MongoDB Atlas</text></g>
  <g transform="translate(1190, 90)"><rect width="120" height="40" class="actor-box" /><text x="60" y="25" class="actor-text">Reviewer Staff</text></g>

  <!-- Lifelines -->
  <line x1="100" y1="130" x2="100" y2="920" class="lifeline" />
  <line x1="280" y1="130" x2="280" y2="920" class="lifeline" />
  <line x1="480" y1="130" x2="480" y2="920" class="lifeline" />
  <line x1="680" y1="130" x2="680" y2="920" class="lifeline" />
  <line x1="880" y1="130" x2="880" y2="920" class="lifeline" />
  <line x1="1080" y1="130" x2="1080" y2="920" class="lifeline" />
  <line x1="1250" y1="130" x2="1250" y2="920" class="lifeline" />

  <!-- Step 1: Customer submits claim -->
  <line x1="100" y1="160" x2="280" y2="160" class="msg" />
  <text x="115" y="154" class="label">1: Submit Claim Form (details + PDF files)</text>

  <!-- Step 2: React posts to API -->
  <line x1="280" y1="190" x2="480" y2="190" class="msg" />
  <text x="295" y="184" class="label">2: POST /api/claims (Multipart Form Data)</text>

  <!-- Step 3: Gateway validates JWT & uploads file -->
  <line x1="480" y1="220" x2="680" y2="220" class="msg" />
  <text x="495" y="214" class="label">3: Verify JWT Bearer &amp; Multer save files</text>

  <!-- Step 4: Claim Controller creates claim in DB -->
  <line x1="680" y1="250" x2="1080" y2="250" class="msg" />
  <text x="695" y="244" class="label">4: Claim.create({ status: 'SUBMITTED' })</text>
  <line x1="1080" y1="270" x2="680" y2="270" class="ret" />
  <text x="730" y="266" class="label">claimDoc (CLM-xxx)</text>

  <!-- Step 5: Spawn OCR Job -->
  <line x1="680" y1="300" x2="880" y2="300" class="msg" />
  <text x="695" y="294" class="label">5: ocrService.processDocument(claimDocId)</text>
  <line x1="880" y1="330" x2="1080" y2="330" class="msg" />
  <text x="895" y="324" class="label">6: OCRJob.create({ extractedFields })</text>

  <!-- Step 6: Trigger Deterministic Rule Engine -->
  <line x1="680" y1="360" x2="880" y2="360" class="msg" />
  <text x="695" y="354" class="label">7: ruleEngineService.evaluateClaim(claimId)</text>
  <line x1="880" y1="390" x2="1080" y2="390" class="msg" />
  <text x="895" y="384" class="label">8: Read policy, caps, dates &amp; calc score</text>
  <line x1="880" y1="415" x2="680" y2="415" class="ret" />
  <text x="710" y="410" class="label">ValidationResult (PASS/FLAGGED, Score)</text>

  <!-- Step 7: Acknowledge customer -->
  <line x1="680" y1="440" x2="280" y2="440" class="ret" />
  <text x="320" y="434" class="label">HTTP 201 Created (ClaimReference: CLM-xxx)</text>
  <line x1="280" y1="460" x2="100" y2="460" class="ret" />
  <text x="120" y="454" class="label">Render Tracking Dashboard</text>

  <!-- Step 8: Officer retrieves unassigned queue -->
  <line x1="1250" y1="490" x2="480" y2="490" class="msg" />
  <text x="650" y="484" class="label">9: GET /api/claims (Officer Work Queue)</text>
  <line x1="480" y1="510" x2="1250" y2="510" class="ret" />
  <text x="650" y="504" class="label">Claims with OCR &amp; Rule Badges</text>

  <!-- ALT FRAME: High Value or Vehicle/Property -> Survey Required -->
  <rect x="70" y="530" width="1240" height="150" class="opt-box" />
  <rect x="70" y="530" width="420" height="20" fill="#f1f5f9" stroke="#000000" stroke-width="1" />
  <text x="75" y="544" class="opt-tag">[OPT: If requestedAmount &gt;= ₹5,000 OR Category in VEHICLE/PROPERTY]</text>

  <line x1="1250" y1="565" x2="480" y2="565" class="msg" />
  <text x="650" y="559" class="label">10: POST /api/surveys/assign (Assign Field Surveyor)</text>
  <line x1="480" y1="585" x2="1080" y2="585" class="msg" />
  <text x="650" y="579" class="label">Claim.status -&gt; 'SURVEYOR_ASSIGNED'</text>

  <line x1="1250" y1="620" x2="480" y2="620" class="msg" />
  <text x="650" y="614" class="label">11: POST /api/surveys/:id/report (Surveyor submits damage assessment)</text>
  <line x1="480" y1="640" x2="1080" y2="640" class="msg" />
  <text x="650" y="634" class="label">SurveyReport.create() &amp; status -&gt; 'UNDER_REVIEW'</text>

  <!-- Step 12: Officer Recommends to Manager -->
  <line x1="1250" y1="700" x2="480" y2="700" class="msg" />
  <text x="650" y="694" class="label">12: POST /api/claims/:id/recommend (status -&gt; 'MANAGER_REVIEW')</text>

  <!-- ALT FRAME: Manager Decision -->
  <rect x="70" y="720" width="1240" height="180" class="opt-box" />
  <rect x="70" y="720" width="340" height="20" fill="#f1f5f9" stroke="#000000" stroke-width="1" />
  <text x="75" y="734" class="opt-tag">[ALT: Claims Manager Executive Adjudication]</text>

  <!-- Sub-branch A: Approved -->
  <text x="90" y="760" font-family="Consolas" font-size="10px" font-weight="bold" fill="#000000">[Branch: APPROVED]</text>
  <line x1="1250" y1="775" x2="480" y2="775" class="msg" />
  <text x="650" y="769" class="label">13a: POST /api/manager/claims/:id/approve (Authorize Final Settlement)</text>
  <line x1="480" y1="795" x2="1080" y2="795" class="msg" />
  <text x="650" y="789" class="label">Claim.status -&gt; 'APPROVED' &amp; Settlement.create({ SET-xxx, status: 'PENDING' })</text>

  <line x1="1250" y1="825" x2="480" y2="825" class="msg" />
  <text x="650" y="819" class="label">14a: PUT /api/settlements/:id/disburse (Finance executes bank transfer)</text>
  <line x1="480" y1="845" x2="1080" y2="845" class="msg" />
  <text x="650" y="839" class="label">Settlement.status -&gt; 'SETTLED' &amp; Claim.status -&gt; 'SETTLED'</text>

  <line x1="480" y1="875" x2="100" y2="875" class="msg" />
  <text x="180" y="869" class="label">15a: notificationService dispatches Settlement Notification to Customer</text>

</svg>`;

// =========================================================================
// 4. UML USE-CASE DIAGRAM OF INSUREFLOW (Academic Stick Figures + Ovals + Lines)
// =========================================================================
// Exact layout inspired by user's sample image (Actors outside, Ovals inside, Direct Lines)
const svg4 = `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1100" viewBox="0 0 1440 1100">
  <defs>
    <style>
      .bg { fill: #ffffff; }
      .border { fill: none; stroke: #000000; stroke-width: 2; }
      .title { font-family: 'Segoe UI', Arial, sans-serif; font-size: 20px; font-weight: bold; fill: #000000; text-anchor: middle; }
      .subtitle { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; fill: #333333; text-anchor: middle; font-style: italic; }
      .sys-boundary { fill: #ffffff; stroke: #000000; stroke-width: 2; rx: 8; }
      .sys-label { font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; font-weight: bold; fill: #000000; }
      .oval { fill: #ffffff; stroke: #000000; stroke-width: 1.5; rx: 20; ry: 20; }
      .oval-text { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; font-weight: bold; fill: #000000; text-anchor: middle; }
      .actor-label { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; font-weight: bold; fill: #000000; text-anchor: middle; }
      .actor-role { font-family: 'Consolas', monospace; font-size: 10px; fill: #444444; text-anchor: middle; }
      .stick { stroke: #000000; stroke-width: 2; stroke-linecap: round; fill: none; }
      .head { fill: #ffffff; stroke: #000000; stroke-width: 2; }
      .assoc { stroke: #000000; stroke-width: 1.2; fill: none; }
    </style>
  </defs>

  <rect width="1440" height="1100" class="bg" />
  <rect x="15" y="15" width="1410" height="1070" class="border" />

  <text x="720" y="46" class="title">FIGURE 4: UML USE-CASE DIAGRAM OF INSUREFLOW</text>
  <text x="720" y="66" class="subtitle">Complete Role-Based Interaction Specification: Actors, System Boundary, and Verified Functional Responsibilities</text>

  <!-- InsureFlow System Boundary (Center Box) -->
  <rect x="280" y="85" width="880" height="970" class="sys-boundary" />
  <rect x="300" y="75" width="160" height="24" fill="#ffffff" stroke="#000000" stroke-width="1.5" rx="3" />
  <text x="380" y="91" class="sys-label" text-anchor="middle">InsureFlow</text>

  <!-- ================= ACTORS ================= -->

  <!-- ACTOR 1: CUSTOMER (Top Left: cx=140, cy=240) -->
  <g transform="translate(140, 200)">
    <!-- Stick figure -->
    <circle cx="0" cy="0" r="14" class="head" />
    <line x1="0" y1="14" x2="0" y2="50" class="stick" /> <!-- Body -->
    <line x1="-22" y1="26" x2="22" y2="26" class="stick" /> <!-- Arms -->
    <line x1="0" y1="50" x2="-18" y2="82" class="stick" /> <!-- Left Leg -->
    <line x1="0" y1="50" x2="18" y2="82" class="stick" /> <!-- Right Leg -->
    <text x="0" y="105" class="actor-label">Customer</text>
    <text x="0" y="120" class="actor-role">&lt;&lt;Policyholder&gt;&gt;</text>
  </g>

  <!-- ACTOR 2: TECHNICAL SURVEYOR (Bottom Left: cx=140, cy=740) -->
  <g transform="translate(140, 700)">
    <!-- Stick figure -->
    <circle cx="0" cy="0" r="14" class="head" />
    <line x1="0" y1="14" x2="0" y2="50" class="stick" />
    <line x1="-22" y1="26" x2="22" y2="26" class="stick" />
    <line x1="0" y1="50" x2="-18" y2="82" class="stick" />
    <line x1="0" y1="50" x2="18" y2="82" class="stick" />
    <text x="0" y="105" class="actor-label">Field Surveyor</text>
    <text x="0" y="120" class="actor-role">&lt;&lt;Loss Assessor&gt;&gt;</text>
  </g>

  <!-- ACTOR 3: INSURANCE OFFICER (Top Right: cx=1300, cy=200) -->
  <g transform="translate(1300, 160)">
    <circle cx="0" cy="0" r="14" class="head" />
    <line x1="0" y1="14" x2="0" y2="50" class="stick" />
    <line x1="-22" y1="26" x2="22" y2="26" class="stick" />
    <line x1="0" y1="50" x2="-18" y2="82" class="stick" />
    <line x1="0" y1="50" x2="18" y2="82" class="stick" />
    <text x="0" y="105" class="actor-label">Insurance Officer</text>
    <text x="0" y="120" class="actor-role">&lt;&lt;Adjudicator&gt;&gt;</text>
  </g>

  <!-- ACTOR 4: CLAIMS MANAGER (Middle Right: cx=1300, cy=520) -->
  <g transform="translate(1300, 480)">
    <circle cx="0" cy="0" r="14" class="head" />
    <line x1="0" y1="14" x2="0" y2="50" class="stick" />
    <line x1="-22" y1="26" x2="22" y2="26" class="stick" />
    <line x1="0" y1="50" x2="-18" y2="82" class="stick" />
    <line x1="0" y1="50" x2="18" y2="82" class="stick" />
    <text x="0" y="105" class="actor-label">Claims Manager</text>
    <text x="0" y="120" class="actor-role">&lt;&lt;Executive Approver&gt;&gt;</text>
  </g>

  <!-- ACTOR 5: ADMINISTRATOR (Bottom Right: cx=1300, cy=820) -->
  <g transform="translate(1300, 780)">
    <circle cx="0" cy="0" r="14" class="head" />
    <line x1="0" y1="14" x2="0" y2="50" class="stick" />
    <line x1="-22" y1="26" x2="22" y2="26" class="stick" />
    <line x1="0" y1="50" x2="-18" y2="82" class="stick" />
    <line x1="0" y1="50" x2="18" y2="82" class="stick" />
    <text x="0" y="105" class="actor-label">Administrator</text>
    <text x="0" y="120" class="actor-role">&lt;&lt;System Governance&gt;&gt;</text>
  </g>

  <!-- ================= USE CASES (OVALS IN 2 COLUMNS) ================= -->
  <!-- Left Column Ovals: x=480, Right Column Ovals: x=960 -->

  <!-- Customer Use Cases (Left Column) -->
  <!-- UC-1: Browse Catalog -->
  <ellipse cx="480" cy="130" rx="150" ry="22" class="oval" />
  <text x="480" y="134" class="oval-text">Browse &amp; Compare Policy Catalog</text>

  <!-- UC-2: Register External Policy -->
  <ellipse cx="480" cy="185" rx="150" ry="22" class="oval" />
  <text x="480" y="189" class="oval-text">Register External Third-Party Policy</text>

  <!-- UC-3: Submit FNOL Claim -->
  <ellipse cx="480" cy="240" rx="150" ry="22" class="oval" />
  <text x="480" y="244" class="oval-text">Submit Digital Insurance Claim (FNOL)</text>

  <!-- UC-4: Upload Proofs -->
  <ellipse cx="480" cy="295" rx="150" ry="22" class="oval" />
  <text x="480" y="299" class="oval-text">Upload Supporting Invoices &amp; Proofs</text>

  <!-- UC-5: Track Status -->
  <ellipse cx="480" cy="350" rx="150" ry="22" class="oval" />
  <text x="480" y="354" class="oval-text">Track Claim Timeline &amp; Status</text>

  <!-- UC-6: View Settlement Voucher -->
  <ellipse cx="480" cy="405" rx="150" ry="22" class="oval" />
  <text x="480" y="409" class="oval-text">View Settlement Payout Voucher</text>

  <!-- Surveyor Use Cases (Left Column Bottom) -->
  <!-- UC-13: Access Assigned Roster -->
  <ellipse cx="480" cy="680" rx="150" ry="22" class="oval" />
  <text x="480" y="684" class="oval-text">Access Assigned Inspection Roster</text>

  <!-- UC-14: Physical Assessment -->
  <ellipse cx="480" cy="745" rx="150" ry="22" class="oval" />
  <text x="480" y="749" class="oval-text">Conduct Damage Inspection &amp; Photos</text>

  <!-- UC-15: Submit Survey Report -->
  <ellipse cx="480" cy="810" rx="150" ry="22" class="oval" />
  <text x="480" y="814" class="oval-text">Submit Technical Survey &amp; Repair Estimate</text>

  <!-- Officer Use Cases (Right Column Top) -->
  <!-- UC-7: Work Queue -->
  <ellipse cx="960" cy="130" rx="150" ry="22" class="oval" />
  <text x="960" y="134" class="oval-text">Access Claims Adjudication Work Queue</text>

  <!-- UC-8: OCR Audit -->
  <ellipse cx="960" cy="185" rx="150" ry="22" class="oval" />
  <text x="960" y="189" class="oval-text">Audit OCR Extracted Invoice Data</text>

  <!-- UC-9: Evaluate Rules -->
  <ellipse cx="960" cy="240" rx="150" ry="22" class="oval" />
  <text x="960" y="244" class="oval-text">Evaluate Rule Compliance Scores</text>

  <!-- UC-10: Request Docs / Assign Surveyor -->
  <ellipse cx="960" cy="295" rx="150" ry="22" class="oval" />
  <text x="960" y="299" class="oval-text">Request Missing Docs / Assign Surveyor</text>

  <!-- UC-11: Recommend Escalation -->
  <ellipse cx="960" cy="350" rx="150" ry="22" class="oval" />
  <text x="960" y="354" class="oval-text">Formulate Adjudication Recommendation</text>

  <!-- UC-12: Verify External Policies -->
  <ellipse cx="960" cy="405" rx="150" ry="22" class="oval" />
  <text x="960" y="409" class="oval-text">Audit External Policy Registrations</text>

  <!-- Manager Use Cases (Right Column Middle) -->
  <!-- UC-16: Review Escalations -->
  <ellipse cx="960" cy="500" rx="150" ry="22" class="oval" />
  <text x="960" y="504" class="oval-text">Review Escalations &amp; Survey Reports</text>

  <!-- UC-17: Executive Adjudication -->
  <ellipse cx="960" cy="555" rx="150" ry="22" class="oval" />
  <text x="960" y="559" class="oval-text">Execute Decision (Approve / Reject)</text>

  <!-- UC-18: Authorize Settlement -->
  <ellipse cx="960" cy="610" rx="150" ry="22" class="oval" />
  <text x="960" y="614" class="oval-text">Authorize Settlement Voucher &amp; Payout</text>

  <!-- Admin Use Cases (Right Column Bottom) -->
  <!-- UC-19: Policy Catalog -->
  <ellipse cx="960" cy="730" rx="150" ry="22" class="oval" />
  <text x="960" y="734" class="oval-text">Manage Underwriting Policy Catalog</text>

  <!-- UC-20: Rule Config -->
  <ellipse cx="960" cy="785" rx="150" ry="22" class="oval" />
  <text x="960" y="789" class="oval-text">Configure Deterministic Rule Parameters</text>

  <!-- UC-21: User Management -->
  <ellipse cx="960" cy="840" rx="150" ry="22" class="oval" />
  <text x="960" y="844" class="oval-text">Govern User Accounts &amp; RBAC Roles</text>

  <!-- UC-22: Audit Log -->
  <ellipse cx="960" cy="895" rx="150" ry="22" class="oval" />
  <text x="960" y="899" class="oval-text">Inspect System Telemetry &amp; Audit Logs</text>

  <!-- ================= ASSOCIATION LINES ================= -->
  <!-- Customer Lines (from x=160, y=240) -->
  <line x1="160" y1="240" x2="330" y2="130" class="assoc" />
  <line x1="160" y1="240" x2="330" y2="185" class="assoc" />
  <line x1="160" y1="240" x2="330" y2="240" class="assoc" />
  <line x1="160" y1="240" x2="330" y2="295" class="assoc" />
  <line x1="160" y1="240" x2="330" y2="350" class="assoc" />
  <line x1="160" y1="240" x2="330" y2="405" class="assoc" />

  <!-- Surveyor Lines (from x=160, y=740) -->
  <line x1="160" y1="740" x2="330" y2="680" class="assoc" />
  <line x1="160" y1="740" x2="330" y2="745" class="assoc" />
  <line x1="160" y1="740" x2="330" y2="810" class="assoc" />

  <!-- Officer Lines (from x=1280, y=200) -->
  <line x1="1280" y1="200" x2="1110" y2="130" class="assoc" />
  <line x1="1280" y1="200" x2="1110" y2="185" class="assoc" />
  <line x1="1280" y1="200" x2="1110" y2="240" class="assoc" />
  <line x1="1280" y1="200" x2="1110" y2="295" class="assoc" />
  <line x1="1280" y1="200" x2="1110" y2="350" class="assoc" />
  <line x1="1280" y1="200" x2="1110" y2="405" class="assoc" />

  <!-- Manager Lines (from x=1280, y=520) -->
  <line x1="1280" y1="520" x2="1110" y2="500" class="assoc" />
  <line x1="1280" y1="520" x2="1110" y2="555" class="assoc" />
  <line x1="1280" y1="520" x2="1110" y2="610" class="assoc" />

  <!-- Admin Lines (from x=1280, y=820) -->
  <line x1="1280" y1="820" x2="1110" y2="730" class="assoc" />
  <line x1="1280" y1="820" x2="1110" y2="785" class="assoc" />
  <line x1="1280" y1="820" x2="1110" y2="840" class="assoc" />
  <line x1="1280" y1="820" x2="1110" y2="895" class="assoc" />

  <!-- Cross-role include/extend associations between use cases inside boundary -->
  <!-- UC-3 extends UC-4 -->
  <line x1="480" y1="262" x2="480" y2="273" class="assoc" stroke-dasharray="3,3" />

  <!-- Legend in Footer -->
  <g transform="translate(480, 995)">
    <rect width="480" height="40" fill="#fafafa" stroke="#000000" stroke-width="1" rx="4" />
    <text x="240" y="24" font-family="Segoe UI" font-size="11px" font-weight="bold" fill="#000000" text-anchor="middle">
      UML Standard: Stick Figure Actors | System Boundary | Ovals (Use Cases) | Direct Associations
    </text>
  </g>

</svg>`;

// =========================================================================
// 5. UML ACTIVITY DIAGRAM WITH DECISION GATES AND SURVEY TRIGGERS
// =========================================================================
const svg5 = `<svg xmlns="http://www.w3.org/2000/svg" width="1150" height="1250" viewBox="0 0 1150 1250">
  <defs>
    <style>
      .bg { fill: #ffffff; }
      .border { fill: none; stroke: #000000; stroke-width: 2; }
      .title { font-family: 'Segoe UI', Arial, sans-serif; font-size: 20px; font-weight: bold; fill: #000000; text-anchor: middle; }
      .subtitle { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; fill: #333333; text-anchor: middle; font-style: italic; }
      .swimlane-header { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; font-weight: bold; fill: #000000; text-anchor: middle; }
      .swimlane-line { stroke: #000000; stroke-width: 1; stroke-dasharray: 4,4; }
      .init-node { fill: #000000; }
      .final-node-outer { fill: none; stroke: #000000; stroke-width: 2; }
      .final-node-inner { fill: #000000; }
      .action-box { fill: #ffffff; stroke: #000000; stroke-width: 1.5; rx: 12; ry: 12; }
      .action-text { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; font-weight: bold; fill: #000000; text-anchor: middle; }
      .action-sub { font-family: 'Segoe UI', Arial, sans-serif; font-size: 9px; fill: #444444; text-anchor: middle; }
      .decision { fill: #ffffff; stroke: #000000; stroke-width: 1.5; }
      .arrow { stroke: #000000; stroke-width: 1.5; fill: none; marker-end: url(#arr); }
      .branch-lbl { font-family: 'Consolas', monospace; font-size: 10px; font-weight: bold; fill: #000000; }
    </style>
    <marker id="arr" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
      <polygon points="0 0, 8 3, 0 6" fill="#000000" />
    </marker>
  </defs>

  <rect width="1150" height="1250" class="bg" />
  <rect x="15" y="15" width="1120" height="1220" class="border" />

  <text x="575" y="46" class="title">FIGURE 5: UML ACTIVITY DIAGRAM OF INSUREFLOW</text>
  <text x="575" y="66" class="subtitle">Complete Workflow Logic: Control Flow, Decision Diamonds, Surveyor Triggers, Review Gates, and Final Settlement States</text>

  <!-- Swimlanes: 4 Partitions -->
  <!-- 1. Customer: 30..280 (x=155) -->
  <!-- 2. System Automated: 280..580 (x=430) -->
  <!-- 3. Officer & Surveyor: 580..860 (x=720) -->
  <!-- 4. Manager & Finance: 860..1120 (x=990) -->

  <rect x="30" y="80" width="260" height="30" fill="#f1f5f9" stroke="#000000" stroke-width="1" />
  <text x="160" y="100" class="swimlane-header">CUSTOMER WORKSPACE</text>

  <rect x="290" y="80" width="290" height="30" fill="#f1f5f9" stroke="#000000" stroke-width="1" />
  <text x="435" y="100" class="swimlane-header">AUTOMATED SYSTEM / OCR</text>

  <rect x="580" y="80" width="280" height="30" fill="#f1f5f9" stroke="#000000" stroke-width="1" />
  <text x="720" y="100" class="swimlane-header">OFFICER &amp; SURVEYOR</text>

  <rect x="860" y="80" width="260" height="30" fill="#f1f5f9" stroke="#000000" stroke-width="1" />
  <text x="990" y="100" class="swimlane-header">CLAIMS MANAGER &amp; FINANCE</text>

  <!-- Swimlane Dividers -->
  <line x1="290" y1="110" x2="290" y2="1200" class="swimlane-line" />
  <line x1="580" y1="110" x2="580" y2="1200" class="swimlane-line" />
  <line x1="860" y1="110" x2="860" y2="1200" class="swimlane-line" />

  <!-- Initial Node in Customer lane -->
  <circle cx="160" cy="140" r="10" class="init-node" />
  <line x1="160" y1="150" x2="160" y2="180" class="arrow" />

  <!-- Action 1: Fill Claim Form -->
  <g transform="translate(60, 180)">
    <rect width="200" height="45" class="action-box" />
    <text x="100" y="22" class="action-text">Fill Claim Form &amp; Incident</text>
    <text x="100" y="36" class="action-sub">(Date, Description, Amount)</text>
  </g>
  <line x1="160" y1="225" x2="160" y2="255" class="arrow" />

  <!-- Action 2: Upload Documents -->
  <g transform="translate(60, 255)">
    <rect width="200" height="45" class="action-box" />
    <text x="100" y="22" class="action-text">Upload Documents</text>
    <text x="100" y="36" class="action-sub">(Bills, Discharge Summary, FIR)</text>
  </g>

  <!-- Move to System Lane -->
  <line x1="260" y1="277" x2="330" y2="277" class="arrow" />

  <!-- Decision 1: Mandatory Documents Present? -->
  <polygon points="435,255 490,277 435,300 380,277" class="decision" />
  <text x="435" y="280" font-family="Segoe UI" font-size="9px" font-weight="bold" fill="#000000" text-anchor="middle">Docs Check</text>

  <!-- Decision 1: NO -> Loop back to Customer -->
  <line x1="435" y1="300" x2="435" y2="330" class="arrow" />
  <line x1="435" y1="330" x2="260" y2="330" class="arrow" />
  <text x="445" y="320" class="branch-lbl">[No: Missing Required Files]</text>

  <g transform="translate(60, 310)">
    <rect width="200" height="40" class="action-box" stroke-dasharray="3,3" />
    <text x="100" y="20" class="action-text">DOCUMENTS_REQUIRED</text>
    <text x="100" y="32" class="action-sub">Customer Uploads Deficiencies</text>
  </g>
  <line x1="160" y1="310" x2="160" y2="300" class="arrow" />

  <!-- Decision 1: YES -> Asynchronous OCR -->
  <line x1="490" y1="277" x2="520" y2="277" class="arrow" />
  <line x1="520" y1="277" x2="520" y2="380" class="arrow" />
  <line x1="520" y1="380" x2="490" y2="380" class="arrow" />
  <text x="495" y="270" class="branch-lbl">[Yes: Ingested]</text>

  <!-- Action 3: OCR Extraction -->
  <g transform="translate(330, 360)">
    <rect width="210" height="45" class="action-box" />
    <text x="105" y="22" class="action-text">Asynchronous OCR Job</text>
    <text x="105" y="36" class="action-sub">pdf-parse &amp; Tesseract.js Regex</text>
  </g>
  <line x1="435" y1="405" x2="435" y2="435" class="arrow" />

  <!-- Action 4: Rule Engine Evaluation -->
  <g transform="translate(330, 435)">
    <rect width="210" height="45" class="action-box" />
    <text x="105" y="22" class="action-text">Evaluate 7 Rule Engine Checks</text>
    <text x="105" y="36" class="action-sub">Dates, Category, Caps, Duplicates</text>
  </g>
  <line x1="435" y1="480" x2="435" y2="510" class="arrow" />

  <!-- Decision 2: Rule Score Calculation -->
  <polygon points="435,510 490,532 435,555 380,532" class="decision" />
  <text x="435" y="535" font-family="Segoe UI" font-size="9px" font-weight="bold" fill="#000000" text-anchor="middle">Score &gt;= 70%?</text>

  <!-- Rule Score Branches to Officer Lane -->
  <line x1="490" y1="532" x2="620" y2="532" class="arrow" />
  <text x="500" y="525" class="branch-lbl">[Pass: Low Risk]</text>

  <line x1="380" y1="532" x2="350" y2="532" class="arrow" />
  <line x1="350" y1="532" x2="350" y2="590" class="arrow" />
  <line x1="350" y1="590" x2="620" y2="590" class="arrow" />
  <text x="355" y="582" class="branch-lbl">[Fail/Flagged: High Risk Review]</text>

  <!-- Action 5: Officer Review in Work Queue -->
  <g transform="translate(620, 510)">
    <rect width="200" height="90" class="action-box" />
    <text x="100" y="24" class="action-text">Officer Work Queue</text>
    <text x="100" y="42" class="action-sub">• Side-by-side OCR audit</text>
    <text x="100" y="58" class="action-sub">• Rule compliance flags</text>
    <text x="100" y="74" class="action-sub">• Policy entitlement check</text>
  </g>
  <line x1="720" y1="600" x2="720" y2="630" class="arrow" />

  <!-- Decision 3: Survey Inspection Mandated? -->
  <polygon points="720,630 780,655 720,680 660,655" class="decision" />
  <text x="720" y="658" font-family="Segoe UI" font-size="9px" font-weight="bold" fill="#000000" text-anchor="middle">Survey Req?</text>
  <text x="785" y="650" class="branch-lbl">[Yes: &gt;= ₹5000 / Vehicular]</text>

  <!-- Surveyor Branch -->
  <line x1="780" y1="655" x2="820" y2="655" class="arrow" />
  <line x1="820" y1="655" x2="820" y2="710" class="arrow" />
  <line x1="820" y1="710" x2="780" y2="710" class="arrow" />

  <g transform="translate(620, 690)">
    <rect width="200" height="50" class="action-box" />
    <text x="100" y="20" class="action-text">Surveyor Inspection</text>
    <text x="100" y="34" class="action-sub">On-site Damage &amp; Cost Estimation</text>
  </g>

  <line x1="620" y1="715" x2="590" y2="715" class="arrow" />
  <line x1="590" y1="715" x2="590" y2="765" class="arrow" />
  <line x1="590" y1="765" x2="620" y2="765" class="arrow" />

  <!-- Decision 3 NO path -->
  <line x1="660" y1="655" x2="610" y2="655" class="arrow" />
  <line x1="610" y1="655" x2="610" y2="765" class="arrow" />
  <line x1="610" y1="765" x2="620" y2="765" class="arrow" />
  <text x="615" y="645" class="branch-lbl">[No: Desk Adjudication]</text>

  <!-- Action 6: Formulate Recommendation -->
  <g transform="translate(620, 750)">
    <rect width="200" height="45" class="action-box" />
    <text x="100" y="22" class="action-text">Formulate Recommendation</text>
    <text x="100" y="36" class="action-sub">Escalate to 'MANAGER_REVIEW'</text>
  </g>

  <!-- Pass to Manager Lane -->
  <line x1="820" y1="772" x2="890" y2="772" class="arrow" />

  <!-- Action 7: Manager Review -->
  <g transform="translate(890, 750)">
    <rect width="200" height="45" class="action-box" />
    <text x="100" y="22" class="action-text">Manager Review Roster</text>
    <text x="100" y="36" class="action-sub">Audit Officer Notes &amp; Survey</text>
  </g>
  <line x1="990" y1="795" x2="990" y2="830" class="arrow" />

  <!-- Decision 4: Executive Decision (Approve / Reject / Return) -->
  <polygon points="990,830 1060,860 990,890 920,860" class="decision" />
  <text x="990" y="863" font-family="Segoe UI" font-size="9px" font-weight="bold" fill="#000000" text-anchor="middle">Manager Action</text>

  <!-- Decision 4: Return for info -> Back to Officer Queue -->
  <line x1="920" y1="860" x2="840" y2="860" class="arrow" />
  <line x1="840" y1="860" x2="840" y2="570" class="arrow" />
  <line x1="840" y1="570" x2="820" y2="570" class="arrow" />
  <text x="845" y="850" class="branch-lbl">[Return for Inquiry]</text>

  <!-- Decision 4: REJECT -->
  <line x1="1060" y1="860" x2="1100" y2="860" class="arrow" />
  <line x1="1100" y1="860" x2="1100" y2="930" class="arrow" />
  <line x1="1100" y1="930" x2="1050" y2="930" class="arrow" />
  <text x="1065" y="850" class="branch-lbl">[Reject]</text>

  <g transform="translate(890, 910)">
    <rect width="160" height="40" class="action-box" />
    <text x="80" y="24" class="action-text">Status: REJECTED</text>
  </g>

  <!-- Decision 4: APPROVE -->
  <line x1="990" y1="890" x2="990" y2="980" class="arrow" />
  <text x="1000" y="910" class="branch-lbl">[Approve Claim]</text>

  <!-- Action 8: Settlement Creation -->
  <g transform="translate(890, 980)">
    <rect width="200" height="45" class="action-box" />
    <text x="100" y="20" class="action-text">Generate Settlement Voucher</text>
    <text x="100" y="34" class="action-sub">SET-YYYYMMDD-XXXX (PENDING)</text>
  </g>
  <line x1="990" y1="1025" x2="990" y2="1060" class="arrow" />

  <!-- Action 9: Treasury Bank Disbursement -->
  <g transform="translate(890, 1060)">
    <rect width="200" height="45" class="action-box" />
    <text x="100" y="20" class="action-text">Disburse Bank Transfer</text>
    <text x="100" y="34" class="action-sub">Transition Status to 'SETTLED'</text>
  </g>
  <line x1="990" y1="1105" x2="990" y2="1140" class="arrow" />

  <!-- Notify Customer & Final Nodes -->
  <line x1="890" y1="1082" x2="260" y2="1082" class="arrow" />
  <g transform="translate(60, 1060)">
    <rect width="200" height="45" class="action-box" />
    <text x="100" y="20" class="action-text">Receive Payout Alert</text>
    <text x="100" y="34" class="action-sub">Bank Credit Confirmation</text>
  </g>

  <!-- Terminal Nodes -->
  <!-- Final Node Approved -->
  <g transform="translate(990, 1155)">
    <circle cx="0" cy="0" r="14" class="final-node-outer" />
    <circle cx="0" cy="0" r="8" class="final-node-inner" />
  </g>

  <!-- Final Node Rejected -->
  <line x1="970" y1="950" x2="970" y2="970" class="arrow" />
  <g transform="translate(970, 970)">
    <circle cx="0" cy="0" r="12" class="final-node-outer" />
    <circle cx="0" cy="0" r="6" class="final-node-inner" />
  </g>

</svg>`;

// =========================================================================
// 6. MONGODB ENTITY-RELATIONSHIP DIAGRAM (ERD)
// =========================================================================
const svg6 = `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="980" viewBox="0 0 1440 980">
  <defs>
    <style>
      .bg { fill: #ffffff; }
      .border { fill: none; stroke: #000000; stroke-width: 2; }
      .title { font-family: 'Segoe UI', Arial, sans-serif; font-size: 20px; font-weight: bold; fill: #000000; text-anchor: middle; }
      .subtitle { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; fill: #333333; text-anchor: middle; font-style: italic; }
      .coll-box { fill: #ffffff; stroke: #000000; stroke-width: 1.5; }
      .coll-hdr { fill: #f1f5f9; stroke: #000000; stroke-width: 1.5; }
      .coll-title { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; font-weight: bold; fill: #000000; text-anchor: middle; }
      .coll-stereo { font-family: 'Consolas', monospace; font-size: 9px; fill: #555555; text-anchor: middle; }
      .fld { font-family: 'Consolas', monospace; font-size: 10px; fill: #000000; }
      .pk { fill: #000000; font-weight: bold; }
      .fk { fill: #333333; font-style: italic; }
      .ref-line { stroke: #000000; stroke-width: 1.2; fill: none; }
      .card { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10px; font-weight: bold; fill: #000000; }
    </style>
  </defs>

  <rect width="1440" height="980" class="bg" />
  <rect x="15" y="15" width="1410" height="950" class="border" />

  <text x="720" y="46" class="title">FIGURE 6: MONGODB ENTITY-RELATIONSHIP DIAGRAM (ERD) OF INSUREFLOW</text>
  <text x="720" y="66" class="subtitle">Document Topology: Collections, Schema Attributes, Primary Key ObjectIds, Embedded Subdocuments, and Document Reference Cardinality</text>

  <!-- Collection 1: users -->
  <g transform="translate(40, 90)">
    <rect width="260" height="230" class="coll-box" />
    <rect width="260" height="34" class="coll-hdr" />
    <text x="130" y="16" class="coll-stereo">&lt;&lt;collection: users&gt;&gt;</text>
    <text x="130" y="28" class="coll-title">User</text>
    <text x="10" y="50" class="fld pk">+ _id: ObjectId [PK]</text>
    <text x="10" y="66" class="fld">+ name: String</text>
    <text x="10" y="82" class="fld pk">+ email: String [UNIQUE, IDX]</text>
    <text x="10" y="98" class="fld">+ password: String (Hash)</text>
    <text x="10" y="114" class="fld">+ role: Enum (5 roles)</text>
    <text x="10" y="130" class="fld">+ department: String</text>
    <text x="10" y="146" class="fld">+ phone: String</text>
    <text x="10" y="162" class="fld">+ isActive: Boolean</text>
    <text x="10" y="178" class="fld">+ createdAt: Date</text>
    <text x="10" y="194" class="fld">+ updatedAt: Date</text>
    <line x1="0" y1="202" x2="260" y2="202" stroke="#000000" stroke-width="1" />
    <text x="10" y="218" class="fld" fill="#444444">Indexes: { email: 1 }</text>
  </g>

  <!-- Collection 2: policyproducts -->
  <g transform="translate(360, 90)">
    <rect width="280" height="230" class="coll-box" />
    <rect width="280" height="34" class="coll-hdr" />
    <text x="140" y="16" class="coll-stereo">&lt;&lt;collection: policyproducts&gt;&gt;</text>
    <text x="140" y="28" class="coll-title">PolicyProduct</text>
    <text x="10" y="50" class="fld pk">+ _id: ObjectId [PK]</text>
    <text x="10" y="66" class="fld">+ productName: String</text>
    <text x="10" y="82" class="fld">+ insurer: String</text>
    <text x="10" y="98" class="fld">+ category: Enum</text>
    <text x="10" y="114" class="fld pk">+ planCode: String [UNIQUE, IDX]</text>
    <text x="10" y="130" class="fld">+ coverageLimit: Number</text>
    <text x="10" y="146" class="fld">+ deductible: Number</text>
    <text x="10" y="162" class="fld">+ annualPremium: Number</text>
    <text x="10" y="178" class="fld">+ isPublished: Boolean</text>
    <line x1="0" y1="186" x2="280" y2="186" stroke="#000000" stroke-width="1" />
    <text x="10" y="202" class="fld">[Embedded: eligibilityCriteria[]]</text>
    <text x="10" y="218" class="fld">[Embedded: requiredDocuments[]]</text>
  </g>

  <!-- Collection 3: customerpolicies -->
  <g transform="translate(700, 90)">
    <rect width="300" height="230" class="coll-box" />
    <rect width="300" height="34" class="coll-hdr" />
    <text x="150" y="16" class="coll-stereo">&lt;&lt;collection: customerpolicies&gt;&gt;</text>
    <text x="150" y="28" class="coll-title">CustomerPolicy</text>
    <text x="10" y="50" class="fld pk">+ _id: ObjectId [PK]</text>
    <text x="10" y="66" class="fld fk">+ customer: Ref&lt;User._id&gt; [FK]</text>
    <text x="10" y="82" class="fld fk">+ product: Ref&lt;PolicyProduct._id&gt;</text>
    <text x="10" y="98" class="fld">+ policySource: Enum (PLAT/EXT)</text>
    <text x="10" y="114" class="fld pk">+ policyNumber: String [UNIQUE]</text>
    <text x="10" y="130" class="fld">+ insurerName: String</text>
    <text x="10" y="146" class="fld">+ category: Enum</text>
    <text x="10" y="162" class="fld">+ coverageAmount: Number</text>
    <text x="10" y="178" class="fld">+ startDate: Date</text>
    <text x="10" y="194" class="fld">+ endDate: Date</text>
    <text x="10" y="210" class="fld">+ verificationStatus: Enum</text>
  </g>

  <!-- Collection 4: configrules -->
  <g transform="translate(1060, 90)">
    <rect width="320" height="230" class="coll-box" />
    <rect width="320" height="34" class="coll-hdr" />
    <text x="160" y="16" class="coll-stereo">&lt;&lt;collection: configrules&gt;&gt;</text>
    <text x="160" y="28" class="coll-title">ConfigurableRule</text>
    <text x="10" y="50" class="fld pk">+ _id: ObjectId [PK]</text>
    <text x="10" y="66" class="fld pk">+ ruleId: String [UNIQUE, IDX]</text>
    <text x="10" y="82" class="fld">+ ruleName: String</text>
    <text x="10" y="98" class="fld">+ category: Enum</text>
    <text x="10" y="114" class="fld">+ isEnabled: Boolean</text>
    <text x="10" y="130" class="fld">+ severity: Enum (INFO/WARN/CRIT)</text>
    <line x1="0" y1="145" x2="320" y2="145" stroke="#000000" stroke-width="1" />
    <text x="10" y="165" class="fld">[Embedded: parameters Object]</text>
    <text x="20" y="181" class="fld">• thresholdAmount: Number</text>
    <text x="20" y="197" class="fld">• maxAgeDays: Number</text>
    <text x="20" y="213" class="fld">• requireInvoiceNumber: Boolean</text>
  </g>

  <!-- Collection 5: claims (CENTRAL) -->
  <g transform="translate(480, 390)">
    <rect width="360" height="280" class="coll-box" />
    <rect width="360" height="34" class="coll-hdr" />
    <text x="180" y="16" class="coll-stereo">&lt;&lt;collection: claims (Core Entity)&gt;&gt;</text>
    <text x="180" y="28" class="coll-title">Claim</text>
    <text x="10" y="50" class="fld pk">+ _id: ObjectId [PK]</text>
    <text x="10" y="66" class="fld pk">+ claimReference: String [UNIQUE, IDX]</text>
    <text x="10" y="82" class="fld fk">+ customer: Ref&lt;User._id&gt; [FK]</text>
    <text x="10" y="98" class="fld fk">+ customerPolicy: Ref&lt;CustPol._id&gt;</text>
    <text x="10" y="114" class="fld fk">+ assignedOfficer: Ref&lt;User._id&gt;</text>
    <text x="10" y="130" class="fld fk">+ assignedSurveyor: Ref&lt;User._id&gt;</text>
    <text x="10" y="146" class="fld">+ category: Enum</text>
    <text x="10" y="162" class="fld">+ requestedAmount: Number</text>
    <text x="10" y="178" class="fld">+ approvedAmount: Number</text>
    <text x="10" y="194" class="fld">+ status: Enum (15 States)</text>
    <text x="10" y="210" class="fld">+ isHighValueClaim: Boolean</text>
    <line x1="0" y1="218" x2="360" y2="218" stroke="#000000" stroke-width="1" />
    <text x="10" y="234" class="fld">[Embedded: automatedValidation Object]</text>
    <text x="20" y="250" class="fld">• status, score, evaluatedAt</text>
    <text x="20" y="266" class="fld">• rules: Array&lt;RuleEvaluation&gt;</text>
  </g>

  <!-- Collection 6: claimdocuments -->
  <g transform="translate(40, 420)">
    <rect width="280" height="220" class="coll-box" />
    <rect width="280" height="34" class="coll-hdr" />
    <text x="140" y="16" class="coll-stereo">&lt;&lt;collection: claimdocuments&gt;&gt;</text>
    <text x="140" y="28" class="coll-title">ClaimDocument</text>
    <text x="10" y="50" class="fld pk">+ _id: ObjectId [PK]</text>
    <text x="10" y="66" class="fld fk">+ claim: Ref&lt;Claim._id&gt; [FK]</text>
    <text x="10" y="82" class="fld fk">+ uploadedBy: Ref&lt;User._id&gt; [FK]</text>
    <text x="10" y="98" class="fld">+ documentCategory: Enum</text>
    <text x="10" y="114" class="fld">+ fileName: String (UUID)</text>
    <text x="10" y="130" class="fld">+ originalName: String</text>
    <text x="10" y="146" class="fld">+ filePath: String</text>
    <text x="10" y="162" class="fld">+ mimeType: String</text>
    <text x="10" y="178" class="fld">+ sizeBytes: Number</text>
    <text x="10" y="194" class="fld">+ fileUrl: String</text>
    <text x="10" y="210" class="fld">+ createdAt: Date</text>
  </g>

  <!-- Collection 7: ocrjobs -->
  <g transform="translate(40, 710)">
    <rect width="280" height="210" class="coll-box" />
    <rect width="280" height="34" class="coll-hdr" />
    <text x="140" y="16" class="coll-stereo">&lt;&lt;collection: ocrjobs&gt;&gt;</text>
    <text x="140" y="28" class="coll-title">OCRJob</text>
    <text x="10" y="50" class="fld pk">+ _id: ObjectId [PK]</text>
    <text x="10" y="66" class="fld fk">+ claimDocument: Ref&lt;ClaimDoc&gt;</text>
    <text x="10" y="82" class="fld fk">+ claim: Ref&lt;Claim._id&gt;</text>
    <text x="10" y="98" class="fld">+ status: Enum (PEND/COMP/FAIL)</text>
    <text x="10" y="114" class="fld">+ opticalConfidence: Number</text>
    <text x="10" y="130" class="fld">+ confidenceScore: Number</text>
    <line x1="0" y1="140" x2="280" y2="140" stroke="#000000" stroke-width="1" />
    <text x="10" y="158" class="fld">[Embedded: extractedFields Object]</text>
    <text x="20" y="174" class="fld">• invoiceNumber: String</text>
    <text x="20" y="190" class="fld">• totalAmount: Number</text>
    <text x="20" y="206" class="fld">• invoiceDate: String</text>
  </g>

  <!-- Collection 8: surveyreports -->
  <g transform="translate(480, 730)">
    <rect width="360" height="200" class="coll-box" />
    <rect width="360" height="34" class="coll-hdr" />
    <text x="180" y="16" class="coll-stereo">&lt;&lt;collection: surveyreports&gt;&gt;</text>
    <text x="180" y="28" class="coll-title">SurveyReport</text>
    <text x="10" y="50" class="fld pk">+ _id: ObjectId [PK]</text>
    <text x="10" y="66" class="fld fk">+ claim: Ref&lt;Claim._id&gt; [FK]</text>
    <text x="10" y="82" class="fld fk">+ surveyor: Ref&lt;User._id&gt; [FK]</text>
    <text x="10" y="98" class="fld">+ inspectionDate: Date</text>
    <text x="10" y="114" class="fld">+ damageAssessment: String</text>
    <text x="10" y="130" class="fld">+ estimatedRepairCost: Number</text>
    <text x="10" y="146" class="fld">+ isClaimValid: Boolean</text>
    <text x="10" y="162" class="fld">+ summaryRemarks: String</text>
    <line x1="0" y1="172" x2="360" y2="172" stroke="#000000" stroke-width="1" />
    <text x="10" y="190" class="fld">[Embedded: photoUrls: Array&lt;String&gt;]</text>
  </g>

  <!-- Collection 9: settlements -->
  <g transform="translate(1000, 420)">
    <rect width="380" height="230" class="coll-box" />
    <rect width="380" height="34" class="coll-hdr" />
    <text x="190" y="16" class="coll-stereo">&lt;&lt;collection: settlements&gt;&gt;</text>
    <text x="190" y="28" class="coll-title">Settlement</text>
    <text x="10" y="50" class="fld pk">+ _id: ObjectId [PK]</text>
    <text x="10" y="66" class="fld pk">+ settlementReference: String [UNIQUE]</text>
    <text x="10" y="82" class="fld fk">+ claim: Ref&lt;Claim._id&gt; [FK]</text>
    <text x="10" y="98" class="fld fk">+ customer: Ref&lt;User._id&gt; [FK]</text>
    <text x="10" y="114" class="fld">+ approvedAmount: Number</text>
    <text x="10" y="130" class="fld">+ paymentMethod: Enum (BANK/UPI)</text>
    <text x="10" y="146" class="fld">+ status: Enum (PEND/PROC/SETTLED)</text>
    <text x="10" y="162" class="fld">+ transactionReference: String</text>
    <text x="10" y="178" class="fld fk">+ authorizedBy: Ref&lt;User._id&gt;</text>
    <text x="10" y="194" class="fld">+ authorizedAt: Date</text>
    <text x="10" y="210" class="fld">+ disbursedAt: Date</text>
  </g>

  <!-- Reference Connectors -->
  <!-- User to CustomerPolicy -->
  <line x1="300" y1="200" x2="700" y2="200" class="ref-line" />
  <text x="310" y="192" class="card">1</text>
  <text x="680" y="192" class="card">N</text>

  <!-- CustomerPolicy to Claim -->
  <line x1="850" y1="320" x2="850" y2="350" class="ref-line" />
  <line x1="850" y1="350" x2="750" y2="350" class="ref-line" />
  <line x1="750" y1="350" x2="750" y2="390" class="ref-line" />
  <text x="860" y="340" class="card">1</text>
  <text x="760" y="380" class="card">N</text>

  <!-- Claim to ClaimDocument -->
  <line x1="480" y1="530" x2="320" y2="530" class="ref-line" />
  <text x="450" y="522" class="card">1</text>
  <text x="335" y="522" class="card">N</text>

  <!-- ClaimDocument to OCRJob -->
  <line x1="180" y1="640" x2="180" y2="710" class="ref-line" />
  <text x="190" y="660" class="card">1</text>
  <text x="190" y="700" class="card">1</text>

  <!-- Claim to SurveyReport -->
  <line x1="660" y1="670" x2="660" y2="730" class="ref-line" />
  <text x="670" y="690" class="card">1</text>
  <text x="670" y="720" class="card">0..1</text>

  <!-- Claim to Settlement -->
  <line x1="840" y1="530" x2="1000" y2="530" class="ref-line" />
  <text x="860" y="522" class="card">1</text>
  <text x="975" y="522" class="card">0..1</text>

</svg>`;

// =========================================================================
// 7. REACT ROUTER APPLICATION NAVIGATION ARCHITECTURE
// =========================================================================
const svg7 = `<svg xmlns="http://www.w3.org/2000/svg" width="1380" height="920" viewBox="0 0 1380 920">
  <defs>
    <style>
      .bg { fill: #ffffff; }
      .border { fill: none; stroke: #000000; stroke-width: 2; }
      .title { font-family: 'Segoe UI', Arial, sans-serif; font-size: 20px; font-weight: bold; fill: #000000; text-anchor: middle; }
      .subtitle { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; fill: #333333; text-anchor: middle; font-style: italic; }
      .router-root { fill: #f1f5f9; stroke: #000000; stroke-width: 2; rx: 6; }
      .guard-box { fill: #ffffff; stroke: #000000; stroke-width: 1.5; rx: 4; }
      .guard-title { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; font-weight: bold; fill: #000000; text-anchor: middle; }
      .guard-role { font-family: 'Consolas', monospace; font-size: 10px; fill: #444444; text-anchor: middle; }
      .page-box { fill: #fafafa; stroke: #000000; stroke-width: 1; rx: 3; }
      .route-path { font-family: 'Consolas', monospace; font-size: 10px; font-weight: bold; fill: #000000; }
      .route-comp { font-family: 'Segoe UI', Arial, sans-serif; font-size: 9px; fill: #444444; }
      .tree-line { stroke: #000000; stroke-width: 1.2; fill: none; }
    </style>
  </defs>

  <rect width="1380" height="920" class="bg" />
  <rect x="15" y="15" width="1350" height="890" class="border" />

  <text x="690" y="46" class="title">FIGURE 7: REACT ROUTER v6 APPLICATION NAVIGATION ARCHITECTURE</text>
  <text x="690" y="66" class="subtitle">Complete Client-Side Route Hierarchy: Public Portal, Protected Route Guards, Role Workspaces, Layout Wrappers, and Fallbacks</text>

  <!-- Root: BrowserRouter & App.jsx -->
  <g transform="translate(490, 85)">
    <rect width="400" height="50" class="router-root" />
    <text x="200" y="24" font-family="Segoe UI" font-size="14px" font-weight="bold" fill="#000000" text-anchor="middle">&lt;BrowserRouter&gt; App.jsx Hierarchy</text>
    <text x="200" y="40" font-family="Consolas" font-size="11px" fill="#444444" text-anchor="middle">AuthContext, ToastContext &amp; NotificationContext Providers</text>
  </g>

  <!-- Tree trunk line -->
  <line x1="690" y1="135" x2="690" y2="170" class="tree-line" />
  <!-- Horizontal distribution line -->
  <line x1="120" y1="170" x2="1260" y2="170" class="tree-line" />

  <!-- 6 BRANCHES: -->
  <!-- 1. Public Routes: x=120 -->
  <!-- 2. Customer Workspace: x=340 -->
  <!-- 3. Officer Workspace: x=570 -->
  <!-- 4. Surveyor Workspace: x=800 -->
  <!-- 5. Manager Workspace: x=1030 -->
  <!-- 6. Admin Workspace: x=1260 -->

  <!-- ================= BRANCH 1: PUBLIC PORTAL ================= -->
  <line x1="120" y1="170" x2="120" y2="200" class="tree-line" />
  <g transform="translate(20, 200)">
    <rect width="200" height="50" class="guard-box" />
    <text x="100" y="24" class="guard-title">Public Portal</text>
    <text x="100" y="40" class="guard-role">&lt;&lt;Unauthenticated&gt;&gt;</text>
  </g>

  <g transform="translate(20, 260)">
    <rect width="200" height="34" class="page-box" /><text x="10" y="16" class="route-path">/ (Root)</text><text x="10" y="28" class="route-comp">&lt;HomePage /&gt;</text>
  </g>
  <g transform="translate(20, 305)">
    <rect width="200" height="34" class="page-box" /><text x="10" y="16" class="route-path">/login</text><text x="10" y="28" class="route-comp">&lt;LoginPage /&gt;</text>
  </g>
  <g transform="translate(20, 350)">
    <rect width="200" height="34" class="page-box" /><text x="10" y="16" class="route-path">/register</text><text x="10" y="28" class="route-comp">&lt;RegisterPage (Role Guarded)&gt;</text>
  </g>
  <g transform="translate(20, 395)">
    <rect width="200" height="34" class="page-box" /><text x="10" y="16" class="route-path">/catalog</text><text x="10" y="28" class="route-comp">&lt;ProductCatalogPage /&gt;</text>
  </g>
  <g transform="translate(20, 440)">
    <rect width="200" height="34" class="page-box" /><text x="10" y="16" class="route-path">/catalog/:id</text><text x="10" y="28" class="route-comp">&lt;ProductDetailPage /&gt;</text>
  </g>
  <g transform="translate(20, 485)">
    <rect width="200" height="34" class="page-box" /><text x="10" y="16" class="route-path">/about</text><text x="10" y="28" class="route-comp">&lt;AboutPage /&gt;</text>
  </g>
  <g transform="translate(20, 530)">
    <rect width="200" height="34" class="page-box" /><text x="10" y="16" class="route-path">/faq</text><text x="10" y="28" class="route-comp">&lt;FAQPage /&gt;</text>
  </g>
  <g transform="translate(20, 575)">
    <rect width="200" height="34" class="page-box" /><text x="10" y="16" class="route-path">/contact</text><text x="10" y="28" class="route-comp">&lt;ContactPage /&gt;</text>
  </g>
  <g transform="translate(20, 620)">
    <rect width="200" height="34" class="page-box" /><text x="10" y="16" class="route-path">* (Catch-All)</text><text x="10" y="28" class="route-comp">&lt;NotFoundPage (404)&gt;</text>
  </g>

  <!-- ================= BRANCH 2: CUSTOMER WORKSPACE ================= -->
  <line x1="340" y1="170" x2="340" y2="200" class="tree-line" />
  <g transform="translate(240, 200)">
    <rect width="200" height="50" class="guard-box" />
    <text x="100" y="24" class="guard-title">&lt;ProtectedRoute&gt;</text>
    <text x="100" y="40" class="guard-role">allowedRoles: ['CUSTOMER']</text>
  </g>

  <g transform="translate(240, 260)">
    <rect width="200" height="34" class="page-box" /><text x="10" y="16" class="route-path">/customer/dashboard</text><text x="10" y="28" class="route-comp">&lt;CustomerDashboard /&gt;</text>
  </g>
  <g transform="translate(240, 305)">
    <rect width="200" height="34" class="page-box" /><text x="10" y="16" class="route-path">/customer/claims</text><text x="10" y="28" class="route-comp">&lt;CustomerClaimsList /&gt;</text>
  </g>
  <g transform="translate(240, 350)">
    <rect width="200" height="34" class="page-box" /><text x="10" y="16" class="route-path">/customer/claims/new</text><text x="10" y="28" class="route-comp">&lt;NewClaimSubmission (FNOL)&gt;</text>
  </g>
  <g transform="translate(240, 395)">
    <rect width="200" height="34" class="page-box" /><text x="10" y="16" class="route-path">/customer/claims/:id</text><text x="10" y="28" class="route-comp">&lt;ClaimDetailTimeline /&gt;</text>
  </g>
  <g transform="translate(240, 440)">
    <rect width="200" height="34" class="page-box" /><text x="10" y="16" class="route-path">/customer/policies</text><text x="10" y="28" class="route-comp">&lt;CustomerPolicies /&gt;</text>
  </g>
  <g transform="translate(240, 485)">
    <rect width="200" height="34" class="page-box" /><text x="10" y="16" class="route-path">/customer/settlements</text><text x="10" y="28" class="route-comp">&lt;CustomerSettlements /&gt;</text>
  </g>
  <g transform="translate(240, 530)">
    <rect width="200" height="34" class="page-box" /><text x="10" y="16" class="route-path">/customer/profile</text><text x="10" y="28" class="route-comp">&lt;UserProfileSettings /&gt;</text>
  </g>

  <!-- ================= BRANCH 3: OFFICER WORKSPACE ================= -->
  <line x1="570" y1="170" x2="570" y2="200" class="tree-line" />
  <g transform="translate(470, 200)">
    <rect width="200" height="50" class="guard-box" />
    <text x="100" y="24" class="guard-title">&lt;ProtectedRoute&gt;</text>
    <text x="100" y="40" class="guard-role">allowedRoles: ['OFFICER']</text>
  </g>

  <g transform="translate(470, 260)">
    <rect width="200" height="34" class="page-box" /><text x="10" y="16" class="route-path">/officer/queue</text><text x="10" y="28" class="route-comp">&lt;OfficerQueueWorkspace /&gt;</text>
  </g>
  <g transform="translate(470, 305)">
    <rect width="200" height="34" class="page-box" /><text x="10" y="16" class="route-path">/officer/adjudicate/:id</text><text x="10" y="28" class="route-comp">&lt;ClaimAdjudicationModal /&gt;</text>
  </g>
  <g transform="translate(470, 350)">
    <rect width="200" height="34" class="page-box" /><text x="10" y="16" class="route-path">/officer/documents</text><text x="10" y="28" class="route-comp">&lt;OCRInspectionViewer /&gt;</text>
  </g>
  <g transform="translate(470, 395)">
    <rect width="200" height="34" class="page-box" /><text x="10" y="16" class="route-path">/officer/policies</text><text x="10" y="28" class="route-comp">&lt;ExternalPolicyAudit /&gt;</text>
  </g>

  <!-- ================= BRANCH 4: SURVEYOR WORKSPACE ================= -->
  <line x1="800" y1="170" x2="800" y2="200" class="tree-line" />
  <g transform="translate(700, 200)">
    <rect width="200" height="50" class="guard-box" />
    <text x="100" y="24" class="guard-title">&lt;ProtectedRoute&gt;</text>
    <text x="100" y="40" class="guard-role">allowedRoles: ['SURVEYOR']</text>
  </g>

  <g transform="translate(700, 260)">
    <rect width="200" height="34" class="page-box" /><text x="10" y="16" class="route-path">/surveyor/roster</text><text x="10" y="28" class="route-comp">&lt;SurveyorRoster /&gt;</text>
  </g>
  <g transform="translate(700, 305)">
    <rect width="200" height="34" class="page-box" /><text x="10" y="16" class="route-path">/surveyor/inspect/:id</text><text x="10" y="28" class="route-comp">&lt;DamageAssessmentForm /&gt;</text>
  </g>
  <g transform="translate(700, 350)">
    <rect width="200" height="34" class="page-box" /><text x="10" y="16" class="route-path">/surveyor/reports</text><text x="10" y="28" class="route-comp">&lt;CompletedSurveysHistory /&gt;</text>
  </g>

  <!-- ================= BRANCH 5: MANAGER WORKSPACE ================= -->
  <line x1="1030" y1="170" x2="1030" y2="200" class="tree-line" />
  <g transform="translate(930, 200)">
    <rect width="200" height="50" class="guard-box" />
    <text x="100" y="24" class="guard-title">&lt;ProtectedRoute&gt;</text>
    <text x="100" y="40" class="guard-role">allowedRoles: ['MANAGER']</text>
  </g>

  <g transform="translate(930, 260)">
    <rect width="200" height="34" class="page-box" /><text x="10" y="16" class="route-path">/manager/escalations</text><text x="10" y="28" class="route-comp">&lt;ManagerEscalationQueue /&gt;</text>
  </g>
  <g transform="translate(930, 305)">
    <rect width="200" height="34" class="page-box" /><text x="10" y="16" class="route-path">/manager/review/:id</text><text x="10" y="28" class="route-comp">&lt;ExecutiveDecisionPortal /&gt;</text>
  </g>
  <g transform="translate(930, 350)">
    <rect width="200" height="34" class="page-box" /><text x="10" y="16" class="route-path">/manager/settlements</text><text x="10" y="28" class="route-comp">&lt;SettlementAuthorization /&gt;</text>
  </g>
  <g transform="translate(930, 395)">
    <rect width="200" height="34" class="page-box" /><text x="10" y="16" class="route-path">/manager/analytics</text><text x="10" y="28" class="route-comp">&lt;ClaimsAnalyticsDashboard /&gt;</text>
  </g>

  <!-- ================= BRANCH 6: ADMIN WORKSPACE ================= -->
  <line x1="1260" y1="170" x2="1260" y2="200" class="tree-line" />
  <g transform="translate(1160, 200)">
    <rect width="200" height="50" class="guard-box" />
    <text x="100" y="24" class="guard-title">&lt;ProtectedRoute&gt;</text>
    <text x="100" y="40" class="guard-role">allowedRoles: ['ADMIN']</text>
  </g>

  <g transform="translate(1160, 260)">
    <rect width="200" height="34" class="page-box" /><text x="10" y="16" class="route-path">/admin/catalog</text><text x="10" y="28" class="route-comp">&lt;UnderwritingCatalogMgmt /&gt;</text>
  </g>
  <g transform="translate(1160, 305)">
    <rect width="200" height="34" class="page-box" /><text x="10" y="16" class="route-path">/admin/catalog/new</text><text x="10" y="28" class="route-comp">&lt;ProductPublishingForm /&gt;</text>
  </g>
  <g transform="translate(1160, 350)">
    <rect width="200" height="34" class="page-box" /><text x="10" y="16" class="route-path">/admin/rules</text><text x="10" y="28" class="route-comp">&lt;RuleEngineTuningPanel /&gt;</text>
  </g>
  <g transform="translate(1160, 395)">
    <rect width="200" height="34" class="page-box" /><text x="10" y="16" class="route-path">/admin/users</text><text x="10" y="28" class="route-comp">&lt;UserRoleGovernance /&gt;</text>
  </g>
  <g transform="translate(1160, 440)">
    <rect width="200" height="34" class="page-box" /><text x="10" y="16" class="route-path">/admin/audit-logs</text><text x="10" y="28" class="route-comp">&lt;SystemAuditLogViewer /&gt;</text>
  </g>

  <!-- Navigation Flow Legend -->
  <g transform="translate(390, 720)">
    <rect width="600" height="130" fill="#ffffff" stroke="#000000" stroke-width="1.5" rx="6" />
    <text x="300" y="26" font-family="Segoe UI" font-size="12px" font-weight="bold" fill="#000000" text-anchor="middle">ROUTING PRINCIPLES &amp; ARCHITECTURAL PATTERNS</text>
    <text x="20" y="52" font-family="Segoe UI" font-size="11px" fill="#000000">• <tspan font-weight="bold">Role-Based Guarding:</tspan> ProtectedRoute checks user?.role against allowedRoles array; unauthorized requests redirect to /login.</text>
    <text x="20" y="74" font-family="Segoe UI" font-size="11px" fill="#000000">• <tspan font-weight="bold">JWT Interceptor:</tspan> Centralized Axios client injects Bearer token in request headers and handles 401 expiration auto-redirect.</text>
    <text x="20" y="96" font-family="Segoe UI" font-size="11px" fill="#000000">• <tspan font-weight="bold">Modular Layouts:</tspan> Role-specific layouts (CustomerLayout, StaffLayout) isolate sidebar navigation and activity feeds.</text>
    <text x="20" y="118" font-family="Segoe UI" font-size="11px" fill="#000000">• <tspan font-weight="bold">Total Routes:</tspan> 33 unique verified view endpoints mapped to dedicated single-responsibility components.</text>
  </g>

</svg>`;

// Execute rendering for all 7 diagrams
console.log('[Master Diagram Generator] Generating 7 High-Precision Academic Diagrams...');

renderSvgToPng(svg1, '01_System_Architecture', 1280, 880);
renderSvgToPng(svg2, '02_UML_Domain_Model', 1380, 960);
renderSvgToPng(svg3, '03_Claim_Processing_Sequence', 1380, 960);
renderSvgToPng(svg4, '04_UML_Use_Case', 1440, 1100);
renderSvgToPng(svg5, '05_Claim_Activity_Diagram', 1150, 1250);
renderSvgToPng(svg6, '06_MongoDB_ERD', 1440, 980);
renderSvgToPng(svg7, '07_React_Router_Architecture', 1380, 920);

// Also copy to legacy aliases for backward compatibility with existing report
const aliases = [
  ['01_System_Architecture.png', 'architecture_diagram.png'],
  ['02_UML_Domain_Model.png', 'class_diagram.png'],
  ['03_Claim_Processing_Sequence.png', 'sequence_diagram.png'],
  ['04_UML_Use_Case.png', 'usecase_diagram.png'],
  ['05_Claim_Activity_Diagram.png', 'activity_diagram.png'],
  ['06_MongoDB_ERD.png', 'erd_diagram.png'],
  ['07_React_Router_Architecture.png', 'navigation_diagram.png'],
];

aliases.forEach(([src, dest]) => {
  const srcPath = path.join(assetsDir, src);
  const destPath = path.join(assetsDir, dest);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`[Synced Alias] ${src} -> ${dest}`);
  }
});

console.log('[Master Diagram Generator] All 7 Diagrams Generated and Rendered Successfully!');
