import { Settlement } from '../models/Settlement.js';
import { Claim } from '../models/Claim.js';
import { stateMachineService } from '../services/stateMachineService.js';
import { notificationService } from '../services/notificationService.js';
import { auditService } from '../services/auditService.js';

export const listSettlements = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { settlementReference: { $regex: search, $options: 'i' } },
        { paymentReference: { $regex: search, $options: 'i' } },
      ];
    }

    const settlements = await Settlement.find(query)
      .populate('customer', 'name email phone')
      .populate('claim', 'claimReference requestedAmount approvedAmount category')
      .populate('authorizedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: settlements.length,
      data: settlements,
    });
  } catch (error) {
    next(error);
  }
};

export const getMySettlements = async (req, res, next) => {
  try {
    const settlements = await Settlement.find({ customer: req.user._id })
      .populate('claim', 'claimReference requestedAmount approvedAmount category status incidentDate')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: settlements.length,
      data: settlements,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSettlementStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, paymentReference, disbursementNotes } = req.body;

    const validStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'ON_HOLD'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const settlement = await Settlement.findById(id).populate('claim');
    if (!settlement) {
      return res.status(404).json({ success: false, message: 'Settlement record not found.' });
    }

    settlement.status = status;
    if (paymentReference) settlement.paymentReference = paymentReference;
    if (disbursementNotes) settlement.disbursementNotes = disbursementNotes;

    if (status === 'PROCESSING') {
      settlement.processedAt = new Date();
      await stateMachineService.transition(settlement.claim._id, 'SETTLEMENT_PROCESSING', req.user, {
        notes: `Disbursement in processing with reference ${settlement.settlementReference}.`,
      });
    } else if (status === 'COMPLETED') {
      settlement.completedAt = new Date();
      if (!settlement.paymentReference) {
        settlement.paymentReference = `TXN-EFT-${Date.now().toString().slice(-8)}`;
      }
      await stateMachineService.transition(settlement.claim._id, 'SETTLED', req.user, {
        notes: `Funds disbursed successfully. Transaction reference: ${settlement.paymentReference}.`,
      });

      await notificationService.notifyUser(settlement.customer, {
        title: 'Settlement Payment Completed!',
        message: `Your insurance payout of ₹${Number(settlement.approvedAmount || 0).toLocaleString('en-IN')} has been disbursed (Txn Ref: ${settlement.paymentReference}).`,
        type: 'SETTLEMENT_PROCESSED',
        link: `/customer/claims/${settlement.claim._id}`,
      });
    }

    await settlement.save();

    await auditService.log(req, `UPDATE_SETTLEMENT_${status}`, 'Settlement', settlement._id, {
      status,
      paymentReference: settlement.paymentReference,
    });

    res.json({
      success: true,
      message: `Settlement updated to ${status}.`,
      data: settlement,
    });
  } catch (error) {
    next(error);
  }
};
