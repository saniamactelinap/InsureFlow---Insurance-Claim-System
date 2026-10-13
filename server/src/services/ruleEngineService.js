import { Claim } from '../models/Claim.js';
import { ClaimDocument } from '../models/ClaimDocument.js';
import { CustomerPolicy } from '../models/CustomerPolicy.js';
import { ConfigurableRule } from '../models/ConfigurableRule.js';

class RuleEngineService {
  /**
   * Run automated deterministic rules validation on a given claim
   * @param {string} claimId 
   * @returns {Promise<{status: string, score: number, rules: Array}>}
   */
  async evaluateClaim(claimId) {
    const claim = await Claim.findById(claimId).populate('customerPolicy');
    if (!claim) {
      throw new Error(`Claim not found with ID: ${claimId}`);
    }

    const policy = claim.customerPolicy;
    const documents = await ClaimDocument.find({ claim: claimId });

    // Fetch enabled rules or use defaults
    const dbRules = await ConfigurableRule.find({ isEnabled: true });
    const rulesMap = new Map(dbRules.map(r => [r.ruleId, r]));

    const ruleEvaluations = [];

    // 1. RULE: Policy Active on Incident Date
    const ruleActiveDate = this.evaluatePolicyActiveDate(claim, policy);
    ruleEvaluations.push(ruleActiveDate);

    // 2. RULE: Insurance Category Match
    const ruleCategoryMatch = this.evaluateCategoryMatch(claim, policy);
    ruleEvaluations.push(ruleCategoryMatch);

    // 3. RULE: Coverage Limit Compliance
    const ruleCoverageLimit = this.evaluateCoverageLimit(claim, policy);
    ruleEvaluations.push(ruleCoverageLimit);

    // 4. RULE: Required Documents Completeness
    const ruleDocs = this.evaluateDocumentCompleteness(claim, documents);
    ruleEvaluations.push(ruleDocs);

    // 5. RULE: Duplicate Submission Detection
    const ruleDuplicate = await this.evaluateDuplicateClaim(claim);
    ruleEvaluations.push(ruleDuplicate);

    // 6. RULE: External Policy Verification Check
    const ruleExternal = this.evaluateExternalPolicy(claim, policy);
    ruleEvaluations.push(ruleExternal);

    // 7. RULE: High-Value Surveyor Trigger
    const ruleSurveyorTrigger = this.evaluateSurveyorRequirement(claim);
    ruleEvaluations.push(ruleSurveyorTrigger);

    // Calculate overall status and health score
    let overallStatus = 'PASS';
    let passedCount = 0;

    for (const r of ruleEvaluations) {
      if (r.status === 'PASS') {
        passedCount++;
      } else if (r.status === 'FAIL') {
        overallStatus = 'FAIL';
      } else if (r.status === 'REQUIRES_REVIEW' && overallStatus !== 'FAIL') {
        overallStatus = 'REQUIRES_REVIEW';
      } else if (r.status === 'FLAGGED' && overallStatus !== 'FAIL' && overallStatus !== 'REQUIRES_REVIEW') {
        overallStatus = 'FLAGGED';
      }
    }

    const score = Math.round((passedCount / ruleEvaluations.length) * 100);

    const result = {
      status: overallStatus,
      evaluatedAt: new Date(),
      score,
      rules: ruleEvaluations,
    };

    // Update claim automated validation and high value flag
    claim.automatedValidation = result;
    claim.isHighValueClaim = claim.requestedAmount >= 5000;
    if (ruleDuplicate.status === 'FLAGGED' || ruleDuplicate.status === 'FAIL') {
      claim.isDuplicateWarning = true;
    }
    await claim.save();

    return result;
  }

  evaluatePolicyActiveDate(claim, policy) {
    if (!policy || !policy.startDate || !policy.endDate) {
      return {
        ruleId: 'RULE_ACTIVE_POLICY_ON_INCIDENT',
        name: 'Policy Active on Incident Date',
        status: 'FAIL',
        reason: 'Policy dates are missing or invalid.',
        evidence: { incidentDate: claim.incidentDate },
        severity: 'BLOCKING',
      };
    }

    const incident = new Date(claim.incidentDate).getTime();
    const start = new Date(policy.startDate).getTime();
    const end = new Date(policy.endDate).getTime();

    if (incident >= start && incident <= end) {
      return {
        ruleId: 'RULE_ACTIVE_POLICY_ON_INCIDENT',
        name: 'Policy Active on Incident Date',
        status: 'PASS',
        reason: `Incident date is within policy coverage period (${policy.startDate.toISOString().split('T')[0]} to ${policy.endDate.toISOString().split('T')[0]}).`,
        evidence: { incidentDate: claim.incidentDate, policyStart: policy.startDate, policyEnd: policy.endDate },
        severity: 'BLOCKING',
      };
    } else {
      return {
        ruleId: 'RULE_ACTIVE_POLICY_ON_INCIDENT',
        name: 'Policy Active on Incident Date',
        status: 'FAIL',
        reason: 'Incident occurred outside the active coverage window of this policy.',
        evidence: { incidentDate: claim.incidentDate, policyStart: policy.startDate, policyEnd: policy.endDate },
        severity: 'BLOCKING',
      };
    }
  }

  evaluateCategoryMatch(claim, policy) {
    if (policy && policy.category === claim.category) {
      return {
        ruleId: 'RULE_CATEGORY_MATCH',
        name: 'Insurance Category Match',
        status: 'PASS',
        reason: `Claim category (${claim.category}) matches policy category.`,
        evidence: { claimCategory: claim.category, policyCategory: policy.category },
        severity: 'BLOCKING',
      };
    } else {
      return {
        ruleId: 'RULE_CATEGORY_MATCH',
        name: 'Insurance Category Match',
        status: 'FAIL',
        reason: `Claim category (${claim.category}) does not match policy category (${policy ? policy.category : 'N/A'}).`,
        evidence: { claimCategory: claim.category, policyCategory: policy?.category },
        severity: 'BLOCKING',
      };
    }
  }

  evaluateCoverageLimit(claim, policy) {
    const maxLimit = policy ? policy.coverageAmount : 0;
    if (claim.requestedAmount <= maxLimit) {
      return {
        ruleId: 'RULE_COVERAGE_LIMIT',
        name: 'Coverage Limit Compliance',
        status: 'PASS',
        reason: `Requested amount ($${claim.requestedAmount.toLocaleString()}) is within maximum coverage limit ($${maxLimit.toLocaleString()}).`,
        evidence: { requestedAmount: claim.requestedAmount, coverageLimit: maxLimit },
        severity: 'BLOCKING',
      };
    } else {
      return {
        ruleId: 'RULE_COVERAGE_LIMIT',
        name: 'Coverage Limit Compliance',
        status: 'FLAGGED',
        reason: `Requested amount ($${claim.requestedAmount.toLocaleString()}) exceeds the total coverage limit ($${maxLimit.toLocaleString()}). Payout will be capped.`,
        evidence: { requestedAmount: claim.requestedAmount, coverageLimit: maxLimit },
        severity: 'FLAGGED',
      };
    }
  }

  evaluateDocumentCompleteness(claim, documents) {
    const docCategories = documents.map(d => d.documentCategory);
    let required = [];

    if (claim.category === 'HEALTH') {
      required = ['MEDICAL_BILL'];
    } else if (claim.category === 'VEHICLE') {
      required = ['REPAIR_ESTIMATE', 'VEHICLE_RC'];
    } else {
      required = ['REPAIR_ESTIMATE', 'ACCIDENT_PHOTO'];
    }

    const missing = required.filter(cat => !docCategories.includes(cat));

    if (missing.length === 0) {
      return {
        ruleId: 'RULE_REQUIRED_DOCUMENTS',
        name: 'Required Supporting Documents',
        status: 'PASS',
        reason: `All mandatory document categories are present (${required.join(', ')}).`,
        evidence: { uploadedCategories: docCategories },
        severity: 'BLOCKING',
      };
    } else {
      return {
        ruleId: 'RULE_REQUIRED_DOCUMENTS',
        name: 'Required Supporting Documents',
        status: 'REQUIRES_REVIEW',
        reason: `Missing mandatory document(s): ${missing.join(', ')}.`,
        evidence: { missingCategories: missing, uploadedCategories: docCategories },
        severity: 'FLAGGED',
      };
    }
  }

  async evaluateDuplicateClaim(claim) {
    // Check for another claim by the same customer, on same policy, and same incident date
    const duplicate = await Claim.findOne({
      _id: { $ne: claim._id },
      customer: claim.customer,
      customerPolicy: claim.customerPolicy,
      incidentDate: claim.incidentDate,
      status: { $nin: ['REJECTED', 'CLOSED'] }
    });

    if (duplicate) {
      return {
        ruleId: 'RULE_DUPLICATE_CHECK',
        name: 'Duplicate Submission Check',
        status: 'FLAGGED',
        reason: `Potential duplicate claim detected: Claim ${duplicate.claimReference} shares identical incident date and policy.`,
        evidence: { matchingClaimReference: duplicate.claimReference },
        severity: 'FLAGGED',
      };
    } else {
      return {
        ruleId: 'RULE_DUPLICATE_CHECK',
        name: 'Duplicate Submission Check',
        status: 'PASS',
        reason: 'No duplicate claim submissions found for this incident date and policy.',
        evidence: null,
        severity: 'INFO',
      };
    }
  }

  evaluateExternalPolicy(claim, policy) {
    if (claim.policySource === 'EXTERNAL') {
      if (policy && policy.verificationStatus === 'VERIFIED') {
        return {
          ruleId: 'RULE_EXTERNAL_POLICY_VERIFICATION',
          name: 'External Policy Authentication',
          status: 'PASS',
          reason: `External policy has been verified by an authorized officer (${policy.insurerName}).`,
          evidence: { insurer: policy.insurerName, verifiedAt: policy.verifiedAt },
          severity: 'BLOCKING',
        };
      } else {
        return {
          ruleId: 'RULE_EXTERNAL_POLICY_VERIFICATION',
          name: 'External Policy Authentication',
          status: 'REQUIRES_REVIEW',
          reason: 'External policy is pending manual verification and document audit by insurance officer.',
          evidence: { verificationStatus: policy?.verificationStatus || 'PENDING' },
          severity: 'BLOCKING',
        };
      }
    } else {
      return {
        ruleId: 'RULE_EXTERNAL_POLICY_VERIFICATION',
        name: 'Platform Policy Authentication',
        status: 'PASS',
        reason: 'Claim is backed by an internal direct platform policy.',
        evidence: { policySource: 'PLATFORM' },
        severity: 'INFO',
      };
    }
  }

  evaluateSurveyorRequirement(claim) {
    const HIGH_VALUE_THRESHOLD = 5000;
    if (claim.requestedAmount >= HIGH_VALUE_THRESHOLD || claim.category === 'VEHICLE' || claim.category === 'PROPERTY') {
      return {
        ruleId: 'RULE_SURVEYOR_TRIGGER',
        name: 'Surveyor Technical Inspection Requirement',
        status: 'REQUIRES_REVIEW',
        reason: `Claim exceeds $${HIGH_VALUE_THRESHOLD.toLocaleString()} threshold or involves physical property/vehicle damage, requiring physical or technical surveyor assessment.`,
        evidence: { requestedAmount: claim.requestedAmount, category: claim.category },
        severity: 'INFO',
      };
    } else {
      return {
        ruleId: 'RULE_SURVEYOR_TRIGGER',
        name: 'Surveyor Technical Inspection Requirement',
        status: 'PASS',
        reason: 'Claim amount is below technical survey threshold. Standard officer document review applies.',
        evidence: { requestedAmount: claim.requestedAmount },
        severity: 'INFO',
      };
    }
  }
}

export const ruleEngineService = new RuleEngineService();
