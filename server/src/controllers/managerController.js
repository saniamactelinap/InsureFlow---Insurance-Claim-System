import { Claim } from '../models/Claim.js';
import { Settlement } from '../models/Settlement.js';
import { stateMachineService } from '../services/stateMachineService.js';
import { notificationService } from '../services/notificationService.js';
import { auditService } from '../services/auditService.js';

const generateSettlementReference = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `SET-${dateStr}-${randomSuffix}`;
};

export const getPendingDecisions = async (req, res, next) => {
  try {
    const claims = await Claim.find({
      status: { $in: ['MANAGER_REVIEW', 'SURVEY_REPORT_SUBMITTED'] },
    })
      .populate('customer', 'name email phone')
      .populate('customerPolicy', 'policyNumber insurerName category coverageAmount')
      .populate('assignedOfficer', 'name email')
      .populate('assignedSurveyor', 'name email')
      .sort({ requestedAmount: -1 });

    res.json({
      success: true,
      count: claims.length,
      data: claims,
    });
  } catch (error) {
    next(error);
  }
};

export const approveClaim = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approvedAmount, managerNotes, paymentMethod, beneficiaryDetails } = req.body;

    const claim = await Claim.findById(id).populate('customerPolicy');
    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found.' });
    }

    const finalAmount = Number(approvedAmount || claim.requestedAmount);
    if (finalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Approved amount must be greater than zero.' });
    }

    // Check coverage cap
    if (claim.customerPolicy && finalAmount > claim.customerPolicy.coverageAmount) {
      return res.status(400).json({
        success: false,
        message: `Approved amount ($${finalAmount.toLocaleString()}) cannot exceed policy coverage limit ($${claim.customerPolicy.coverageAmount.toLocaleString()}).`,
      });
    }

    // Transition claim to APPROVED
    await stateMachineService.transition(claim._id, 'APPROVED', req.user, {
      approvedAmount: finalAmount,
      managerNotes: managerNotes || 'Approved by claims operations manager.',
      notes: `Claim approved for $${finalAmount.toLocaleString()} by Manager ${req.user.name}.`,
    });

    // Automatically transition to SETTLEMENT_PENDING
    await stateMachineService.transition(claim._id, 'SETTLEMENT_PENDING', req.user, {
      notes: 'Disbursement file created in settlement queue.',
    });

    // Create Settlement Record
    const settlementRef = generateSettlementReference();
    const settlement = await Settlement.create({
      settlementReference: settlementRef,
      claim: claim._id,
      customer: claim.customer,
      approvedAmount: finalAmount,
      status: 'PENDING',
      paymentMethod: paymentMethod || 'BANK_TRANSFER',
      beneficiaryDetails: beneficiaryDetails || {
        accountHolderName: req.user.name,
        bankName: 'National Reserve Bank',
        accountNumber: '**** **** 8821',
        routingOrIfsc: 'NRB00192',
      },
      authorizedBy: req.user._id,
      authorizedAt: new Date(),
      disbursementNotes: managerNotes || '',
    });

    await auditService.log(req, 'APPROVE_CLAIM', 'Claim', claim._id, {
      approvedAmount: finalAmount,
      settlementReference: settlementRef,
    });

    await notificationService.notifyUser(claim.customer, {
      title: `Claim ${claim.claimReference} Approved!`,
      message: `Great news! Your claim has been approved for $${finalAmount.toLocaleString()}. Payout reference ${settlementRef} is being prepared.`,
      type: 'CLAIM_APPROVED',
      link: `/customer/claims/${claim._id}`,
    });

    res.json({
      success: true,
      message: `Claim approved for $${finalAmount.toLocaleString()} and settlement reference ${settlementRef} initiated.`,
      data: {
        claim,
        settlement,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const rejectClaim = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, managerNotes } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A clear, mandatory rejection reason is required for audit and customer disclosure.',
      });
    }

    const updatedClaim = await stateMachineService.transition(id, 'REJECTED', req.user, {
      reason: reason.trim(),
      managerNotes: managerNotes || '',
      notes: `Claim rejected by Manager ${req.user.name}. Reason: ${reason.trim()}`,
    });

    await auditService.log(req, 'REJECT_CLAIM', 'Claim', id, {
      reason: reason.trim(),
    });

    await notificationService.notifyUser(updatedClaim.customer, {
      title: `Claim ${updatedClaim.claimReference} Decision`,
      message: `Your claim has been reviewed and declined. Reason: ${reason.trim()}`,
      type: 'CLAIM_REJECTED',
      link: `/customer/claims/${id}`,
    });

    res.json({
      success: true,
      message: 'Claim marked as rejected with recorded justification.',
      data: updatedClaim,
    });
  } catch (error) {
    next(error);
  }
};

export const returnForInquiry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { inquiryNotes } = req.body;

    if (!inquiryNotes) {
      return res.status(400).json({ success: false, message: 'Inquiry directions are required.' });
    }

    const updatedClaim = await stateMachineService.transition(id, 'UNDER_REVIEW', req.user, {
      managerNotes: `Manager inquiry: ${inquiryNotes}`,
      notes: `Manager returned claim to officer review workspace for further verification: ${inquiryNotes}`,
    });

    res.json({
      success: true,
      message: 'Claim returned to officer queue for further investigation.',
      data: updatedClaim,
    });
  } catch (error) {
    next(error);
  }
};
