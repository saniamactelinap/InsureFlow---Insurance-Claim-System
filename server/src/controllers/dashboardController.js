import { Claim } from '../models/Claim.js';
import { CustomerPolicy } from '../models/CustomerPolicy.js';
import { User } from '../models/User.js';
import { Settlement } from '../models/Settlement.js';
import { SurveyAssignment } from '../models/SurveyAssignment.js';
import { OCRJob } from '../models/OCRJob.js';
import { PolicyProduct } from '../models/PolicyProduct.js';
import { ConfigurableRule } from '../models/ConfigurableRule.js';

export const getManagerDashboard = async (req, res, next) => {
  try {
    const [
      pendingReviewCount,
      approvedCount,
      pendingSettlementClaimsCount,
      rejectedCount,
      totalClaimsCount,
      settlements,
      categoryBreakdown,
      pendingClaims,
    ] = await Promise.all([
      // Awaiting Manager Review
      Claim.countDocuments({ status: 'MANAGER_REVIEW' }),
      // Approved Claims
      Claim.countDocuments({
        status: { $in: ['APPROVED', 'SETTLEMENT_PENDING', 'SETTLEMENT_PROCESSING', 'SETTLED', 'CLOSED'] },
      }),
      // Pending Settlements: Claims in settlement pipeline
      Claim.countDocuments({
        status: { $in: ['APPROVED', 'SETTLEMENT_PENDING', 'SETTLEMENT_PROCESSING'] },
      }),
      // Rejected Claims
      Claim.countDocuments({ status: 'REJECTED' }),
      // Total Claims
      Claim.countDocuments(),
      // Settlements for cumulative approved value
      Settlement.find().select('approvedAmount status').lean(),
      // Claims volume breakdown by insurance category
      Claim.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      // Urgent / escalated claims awaiting managerial decision
      Claim.find({ status: 'MANAGER_REVIEW' })
        .populate('customer', 'name email phone')
        .populate('customerPolicy', 'policyNumber insurerName category')
        .sort({ isHighValueClaim: -1, requestedAmount: -1, createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const totalApprovedAmount = settlements.reduce((sum, s) => sum + (s.approvedAmount || 0), 0);

    const formattedPendingClaims = pendingClaims.map((claim) => ({
      ...claim,
      claimNumber: claim.claimReference || claim.claimNumber || `CLM-${claim._id.toString().slice(-6)}`,
      insuranceCategory: claim.category || claim.insuranceCategory || 'GENERAL',
    }));

    const responsePayload = {
      role: 'MANAGER',
      counts: {
        pendingReview: pendingReviewCount,
        approved: approvedCount,
        pendingSettlements: pendingSettlementClaimsCount,
        rejected: rejectedCount,
        total: totalClaimsCount,
      },
      exposure: {
        totalApprovedAmount,
      },
      categoryBreakdown: categoryBreakdown || [],
      pendingClaims: formattedPendingClaims,
      // Legacy flat fields for backwards compatibility
      pendingDecisions: pendingReviewCount,
      approvedCount,
      rejectedCount,
      totalApprovedValue: totalApprovedAmount,
    };

    return res.json({
      success: true,
      data: responsePayload,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminDashboard = async (req, res, next) => {
  try {
    const [
      usersTotal,
      usersByRole,
      policiesPlatform,
      policiesExternal,
      claimsTotal,
      claimsByCategory,
      ocrJobsTotal,
      ocrJobsSuccess,
      settlementsTotal,
      settlementsCount,
      productsCount,
      rulesActiveCount,
      rulesTotalCount,
    ] = await Promise.all([
      User.countDocuments(),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      CustomerPolicy.countDocuments({ policySource: 'PLATFORM' }),
      CustomerPolicy.countDocuments({ policySource: 'EXTERNAL' }),
      Claim.countDocuments(),
      Claim.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      OCRJob.countDocuments(),
      OCRJob.countDocuments({ status: 'COMPLETED' }),
      Settlement.aggregate([
        {
          $group: {
            _id: '$status',
            totalAmount: { $sum: '$approvedAmount' },
            count: { $sum: 1 },
          },
        },
      ]),
      Settlement.countDocuments(),
      PolicyProduct.countDocuments(),
      ConfigurableRule.countDocuments({ isEnabled: true }),
      ConfigurableRule.countDocuments(),
    ]);

    const ocrSuccessRate = ocrJobsTotal > 0 ? Math.round((ocrJobsSuccess / ocrJobsTotal) * 100) : 100;

    return res.json({
      success: true,
      data: {
        role: 'ADMIN',
        counts: {
          users: usersTotal,
          claims: claimsTotal,
          products: productsCount,
          settlements: settlementsCount,
          rules: rulesActiveCount,
          rulesTotal: rulesTotalCount,
        },
        usersTotal,
        usersByRole,
        policiesPlatform,
        policiesExternal,
        claimsTotal,
        claimsByCategory,
        categoryBreakdown: claimsByCategory,
        ocrJobsTotal,
        ocrSuccessRate,
        settlementsTotal,
        systemHealth: {
          database: 'CONNECTED',
          ocrEngine: 'TESSERACT_ONLINE',
          ruleEngine: 'ACTIVE',
          authProvider: 'JWT_SECURE',
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const { role } = req.user;
    const userId = req.user._id;

    if (role === 'MANAGER') {
      return getManagerDashboard(req, res, next);
    }

    if (role === 'ADMIN') {
      return getAdminDashboard(req, res, next);
    }

    if (role === 'CUSTOMER') {
      const [
        totalClaims,
        awaitingReview,
        requiringDocs,
        approvedClaims,
        rejectedClaims,
        settlements,
        activePolicies,
        recentClaims,
      ] = await Promise.all([
        Claim.countDocuments({ customer: userId }),
        Claim.countDocuments({
          customer: userId,
          status: {
            $in: [
              'SUBMITTED',
              'DOCUMENT_PROCESSING',
              'UNDER_REVIEW',
              'SURVEYOR_ASSIGNED',
              'INSPECTION_IN_PROGRESS',
              'SURVEY_REPORT_SUBMITTED',
              'MANAGER_REVIEW',
            ],
          },
        }),
        Claim.countDocuments({ customer: userId, status: 'DOCUMENTS_REQUIRED' }),
        Claim.countDocuments({
          customer: userId,
          status: { $in: ['APPROVED', 'SETTLEMENT_PENDING', 'SETTLEMENT_PROCESSING', 'SETTLED', 'CLOSED'] },
        }),
        Claim.countDocuments({ customer: userId, status: 'REJECTED' }),
        Settlement.find({ customer: userId }),
        CustomerPolicy.countDocuments({ customer: userId, status: 'ACTIVE' }),
        Claim.find({ customer: userId })
          .populate('customerPolicy', 'policyNumber insurerName category')
          .sort({ createdAt: -1 })
          .limit(5),
      ]);

      const totalSettledAmount = settlements
        .filter(s => s.status === 'COMPLETED')
        .reduce((sum, s) => sum + s.approvedAmount, 0);

      const pendingSettlementAmount = settlements
        .filter(s => s.status === 'PENDING' || s.status === 'PROCESSING')
        .reduce((sum, s) => sum + s.approvedAmount, 0);

      return res.json({
        success: true,
        data: {
          role: 'CUSTOMER',
          totalClaims,
          awaitingReview,
          requiringDocs,
          approvedClaims,
          rejectedClaims,
          activePolicies,
          totalSettledAmount,
          pendingSettlementAmount,
          recentClaims,
        },
      });
    }

    if (role === 'OFFICER') {
      const [
        assignedQueue,
        newUnassigned,
        requiringDocs,
        ocrFlagged,
        escalatedToManager,
        recentClaims,
      ] = await Promise.all([
        Claim.countDocuments({ assignedOfficer: userId, status: { $nin: ['SETTLED', 'CLOSED', 'REJECTED'] } }),
        Claim.countDocuments({ assignedOfficer: null, status: 'SUBMITTED' }),
        Claim.countDocuments({ status: 'DOCUMENTS_REQUIRED' }),
        Claim.countDocuments({
          $or: [
            { ocrStatus: 'FLAGGED' },
            { 'automatedValidation.status': { $in: ['FLAGGED', 'REQUIRES_REVIEW'] } },
          ],
        }),
        Claim.countDocuments({ status: 'MANAGER_REVIEW' }),
        Claim.find()
          .populate('customer', 'name email phone')
          .populate('customerPolicy', 'policyNumber insurerName category')
          .sort({ updatedAt: -1 })
          .limit(8),
      ]);

      return res.json({
        success: true,
        data: {
          role: 'OFFICER',
          assignedQueue,
          newUnassigned,
          requiringDocs,
          ocrFlagged,
          escalatedToManager,
          recentClaims,
        },
      });
    }

    if (role === 'SURVEYOR') {
      const [
        totalAssigned,
        scheduledInspections,
        reportsPending,
        completedReports,
        recentAssignments,
      ] = await Promise.all([
        SurveyAssignment.countDocuments({ surveyor: userId }),
        SurveyAssignment.countDocuments({ surveyor: userId, status: 'INSPECTION_SCHEDULED' }),
        SurveyAssignment.countDocuments({
          surveyor: userId,
          status: { $in: ['ASSIGNED', 'INSPECTION_IN_PROGRESS', 'RETURNED_FOR_CORRECTION'] },
        }),
        SurveyAssignment.countDocuments({
          surveyor: userId,
          status: { $in: ['REPORT_SUBMITTED', 'COMPLETED'] },
        }),
        SurveyAssignment.find({ surveyor: userId })
          .populate({
            path: 'claim',
            populate: [
              { path: 'customer', select: 'name email phone' },
              { path: 'customerPolicy', select: 'policyNumber insurerName category' },
            ],
          })
          .sort({ createdAt: -1 })
          .limit(6),
      ]);

      return res.json({
        success: true,
        data: {
          role: 'SURVEYOR',
          totalAssigned,
          scheduledInspections,
          reportsPending,
          completedReports,
          recentAssignments,
        },
      });
    }

    return res.status(400).json({ success: false, message: 'Invalid user role' });
  } catch (error) {
    next(error);
  }
};
