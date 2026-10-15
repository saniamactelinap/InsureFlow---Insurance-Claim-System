import fs from 'fs';
import path from 'path';

const filePath = 'C:/Users/apste/Desktop/SM/F-U/docs/report-generator/generate_report_final.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update docx imports
content = content.replace(
  `import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ImageRun,
  PageBreak,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  ShadingType,
  VerticalAlign,
} from 'docx';`,
  `import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ImageRun,
  PageBreak,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  ShadingType,
  VerticalAlign,
  PageBorderOffsetFrom,
  PageBorderZOrder,
  PageBorderDisplay,
} from 'docx';`
);

// 2. Output file paths
content = content.replace(
  `const docxOutputPath = path.join(reportDir, 'InsureFlow_Project_Report.docx');`,
  `const docxOutputPath = path.join(reportDir, 'InsureFlow_Project_Report_Final.docx');`
);
content = content.replace(
  `const pdfOutputPath = path.join(reportDir, 'InsureFlow_Project_Report.pdf');`,
  `const pdfOutputPath = path.join(reportDir, 'InsureFlow_Project_Report_Final.pdf');`
);

// 3. Define standardPageBorders
const borderSnippet = `
const standardPageBorders = {
  pageBorders: {
    display: PageBorderDisplay.ALL_PAGES,
    offsetFrom: PageBorderOffsetFrom.PAGE,
    zOrder: PageBorderZOrder.FRONT,
  },
  pageBorderTop: { style: BorderStyle.SINGLE, size: 4, space: 24, color: '000000' },
  pageBorderBottom: { style: BorderStyle.SINGLE, size: 4, space: 24, color: '000000' },
  pageBorderLeft: { style: BorderStyle.SINGLE, size: 4, space: 24, color: '000000' },
  pageBorderRight: { style: BorderStyle.SINGLE, size: 4, space: 24, color: '000000' },
};
`;

content = content.replace(
  `console.log('[Report Builder] Assembling InsureFlow Academic Project Report...');`,
  `console.log('[Report Builder] Assembling InsureFlow Academic Project Report (Final Version)...');\n${borderSnippet}`
);

// 4. Update Header and Footer colors to 000000
content = content.replace(`color: '64748B',`, `color: '000000',`);
content = content.replace(/color:\s*'334155',/g, `color: '000000',`);
content = content.replace(/color:\s*'1E3A8A',/g, `color: '000000',`);
content = content.replace(/color:\s*'0F172A',/g, `color: '000000',`);
content = content.replace(/color:\s*'1E293B',/g, `color: '000000',`);
content = content.replace(/color:\s*'475569',/g, `color: '000000',`);
content = content.replace(/color:\s*'64748B',/g, `color: '000000',`);
content = content.replace(/color:\s*'2563EB',/g, `color: '000000',`);

// 5. Update every section's page property to include borders: standardPageBorders
// Replace standard pattern of margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
content = content.replace(
  /margin:\s*\{\s*top:\s*1440,\s*right:\s*1440,\s*bottom:\s*1440,\s*left:\s*1440\s*\},/g,
  `margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },\n      borders: standardPageBorders,`
);

// 6. Update Figure 4.4 caption in Chapter 4 and List of Figures
content = content.replace(
  `['Figure 4.4', 'UML Use Case Diagram across Five Core Roles', '34'],`,
  `['Figure 4.4', 'UML Use-Case Diagram of InsureFlow', '34'],`
);
content = content.replace(
  `...createFigure(path.join(assetsDir, 'usecase_diagram.png'), 'Figure 4.4: UML Use Case Diagram across Five Core Roles', 600, 360),`,
  `...createFigure(path.join(assetsDir, 'usecase_diagram.png'), 'Figure 4.4: UML Use-Case Diagram of InsureFlow', 600, 360),`
);

// 7. Enhance Appendix A with actual seed JSON and additional authentic project excerpts
const appendixAEnhancement = `  sectionHeading('A.2', 'Baseline Data Seeding Manifest (JSON Configuration)'),
  bodyParagraph(
    'The InsureFlow architecture utilizes persistent MongoDB collections managed by Mongoose Object Document Mapping (ODM). Initial demonstration catalogs, underwriting rules, and test accounts are initialized via native JSON structures defined in server/src/seed/seedData.js. The project does not rely on external CSV files for persistence, relying instead on structured JavaScript/JSON schema manifests for strict type validation.'
  ),
  ...codeBlock(
    \`// Excerpt from: server/src/seed/seedData.js
export const INSURANCE_CATALOG_PRODUCTS = [
  {
    productName: 'my Secure',
    insurer: 'HDFC ERGO',
    category: 'HEALTH',
    planCode: 'HLTH-HDF-01',
    description: 'Health insurance for eligible hospitalization and covered medical expenses, subject to the selected plan policy wording.',
    coverageLimit: 1000000,
    deductible: 0,
    annualPremium: 18000,
    durationMonths: 12,
    officialUrl: 'https://www.hdfcergo.com/health-insurance/optima-secure',
    isDemonstration: true,
    eligibilityCriteria: [
      'Adult entry age from 18 years to 65 years (dependent children eligible from 91 days)',
      'Individual or family floater underwriting evaluation',
    ],
    keyBenefits: [
      'Eligible inpatient hospitalization and authorized day-care procedures',
      'Pre-hospitalization (up to 60 days) and post-hospitalization (up to 180 days) coverage',
      'Emergency road ambulance cover across accredited network facilities'
    ],
    requiredDocuments: [
      'Hospital discharge summary with clinical diagnosis and doctor certification',
      'Itemized medical bills, pharmacy receipts, and paid payment vouchers',
      'Valid government identity proof (Aadhaar / PAN) and KYC documentation'
    ],
    isPublished: true,
  }
];\`,
    'seedData.js — Insurance Product Catalog Seed Manifest'
  ),
  sectionHeading('A.3', 'Core RESTful Controller Implementation (claimController.js)'),
  bodyParagraph(
    'Digital claim intake and validation initiation are governed by createClaim() in server/src/controllers/claimController.js. The function authenticates the customer, verifies policy ownership, generates an immutable reference code, and creates the persistent Claim entity.'
  ),
  ...codeBlock(
    \`// Excerpt from: server/src/controllers/claimController.js
export const createClaim = async (req, res, next) => {
  try {
    const { customerPolicyId, claimType, incidentDate, incidentDescription, requestedAmount } = req.body;
    if (!customerPolicyId || !incidentDate || !incidentDescription || !requestedAmount) {
      return res.status(400).json({ success: false, message: 'Policy, incident date, incident description, and requested amount are required.' });
    }
    const policy = await CustomerPolicy.findById(customerPolicyId);
    if (!policy) return res.status(404).json({ success: false, message: 'Policy not found.' });
    if (String(policy.customer) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Cannot file a claim on a policy you do not own.' });
    }
    const claimReference = generateClaimReference();
    const claim = await Claim.create({
      claimReference,
      customer: req.user._id,
      customerPolicy: policy._id,
      category: policy.category,
      claimType: claimType || 'REIMBURSEMENT',
      incidentDate: new Date(incidentDate),
      incidentDescription,
      requestedAmount: parseFloat(requestedAmount),
      status: 'SUBMITTED',
    });
    res.status(201).json({ success: true, claim });
  } catch (error) {
    next(error);
  }
};\`,
    'claimController.js — Customer Claim Submission Endpoint'
  ),
  sectionHeading('A.4', 'Automated Jest Test Suite (rulesEngine.test.js)'),
  bodyParagraph(
    'Automated validation logic is continuously tested via server/tests/rulesEngine.test.js. The snippet below illustrates test assertions verifying that valid claims within active dates and coverage limits receive a PASS outcome and compliant composite score.'
  ),
  ...codeBlock(
    \`// Excerpt from: server/tests/rulesEngine.test.js
describe('Deterministic Automated Rule Engine Service', () => {
  let policy;
  beforeAll(async () => {
    policy = await CustomerPolicy.findOne({ policySource: 'PLATFORM' });
  });

  it('should PASS rules for valid claim within active dates and coverage', async () => {
    const validClaim = await Claim.create({
      claimReference: \\\`CLM-TEST-\\\${Date.now()}\\\`,
      customer: policy.customer,
      customerPolicy: policy._id,
      category: policy.category,
      incidentDate: new Date(),
      incidentDescription: 'Valid outpatient consultation within dates.',
      requestedAmount: 1200,
      status: 'SUBMITTED',
    });

    const result = await ruleEngineService.evaluateClaim(validClaim._id);
    expect(result.status).toBe('PASS');
    expect(result.score).toBeGreaterThanOrEqual(70);

    const activeRule = result.rules.find(r => r.ruleId === 'RULE_ACTIVE_POLICY_ON_INCIDENT');
    expect(activeRule.status).toBe('PASS');
  });
});\`,
    'rulesEngine.test.js — Automated Deterministic Rule Validation Suite'
  ),`;

content = content.replace(
  `  new Paragraph({ children: [new PageBreak()] })\n];\n\nmainBodyChildren.push(...appendixAChildren);`,
  `${appendixAEnhancement}\n  new Paragraph({ children: [new PageBreak()] })\n];\n\nmainBodyChildren.push(...appendixAChildren);`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully prepared generate_report_final.js!');
