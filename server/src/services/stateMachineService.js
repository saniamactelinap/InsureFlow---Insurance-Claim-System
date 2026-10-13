import { Claim } from '../models/Claim.js';
import { ClaimTimelineEvent } from '../models/ClaimTimelineEvent.js';
import { Notification } from '../models/Notification.js';

class StateMachineService {
  /**
   * Valid transitions dictionary mapping source status to allowed next statuses and allowed roles
   */
  validTransitions = {
    DRAFT: {
      SUBMITTED: ['CUSTOMER', 'ADMIN'],
    },
    SUBMITTED: {
      DOCUMENT_PROCESSING: ['SYSTEM', 'OFFICER', 'ADMIN'],
      UNDER_REVIEW: ['OFFICER', 'ADMIN'],
      DOCUMENTS_REQUIRED: ['OFFICER', 'ADMIN'],
      SURVEYOR_ASSIGNED: ['OFFICER', 'ADMIN'],
      MANAGER_REVIEW: ['OFFICER', 'ADMIN'],
      REJECTED: ['MANAGER', 'ADMIN'],
    },
    DOCUMENT_PROCESSING: {
      UNDER_REVIEW: ['SYSTEM', 'OFFICER', 'ADMIN'],
      DOCUMENTS_REQUIRED: ['OFFICER', 'ADMIN'],
      SURVEYOR_ASSIGNED: ['OFFICER', 'ADMIN'],
    },
    DOCUMENTS_REQUIRED: {
      UNDER_REVIEW: ['CUSTOMER', 'OFFICER', 'ADMIN'],
      DOCUMENT_PROCESSING: ['SYSTEM', 'CUSTOMER', 'OFFICER', 'ADMIN'],
    },
    UNDER_REVIEW: {
      DOCUMENTS_REQUIRED: ['OFFICER', 'ADMIN'],
      SURVEYOR_ASSIGNED: ['OFFICER', 'ADMIN'],
      MANAGER_REVIEW: ['OFFICER', 'ADMIN'],
      REJECTED: ['MANAGER', 'ADMIN'],
    },
    SURVEYOR_ASSIGNED: {
      INSPECTION_IN_PROGRESS: ['SURVEYOR', 'ADMIN'],
      UNDER_REVIEW: ['OFFICER', 'ADMIN'],
    },
    INSPECTION_IN_PROGRESS: {
      SURVEY_REPORT_SUBMITTED: ['SURVEYOR', 'ADMIN'],
      SURVEYOR_ASSIGNED: ['SURVEYOR', 'ADMIN'],
    },
    SURVEY_REPORT_SUBMITTED: {
      UNDER_REVIEW: ['OFFICER', 'ADMIN'],
      MANAGER_REVIEW: ['OFFICER', 'ADMIN'],
    },
    MANAGER_REVIEW: {
      APPROVED: ['MANAGER', 'ADMIN'],
      REJECTED: ['MANAGER', 'ADMIN'],
      UNDER_REVIEW: ['MANAGER', 'ADMIN'], // Return for further review
    },
    APPROVED: {
      SETTLEMENT_PENDING: ['SYSTEM', 'MANAGER', 'ADMIN'],
      SETTLEMENT_PROCESSING: ['OFFICER', 'MANAGER', 'ADMIN'],
      CLOSED: ['ADMIN', 'MANAGER'],
    },
    REJECTED: {
      CLOSED: ['ADMIN', 'MANAGER'],
      UNDER_REVIEW: ['ADMIN'], // Special appeal
    },
    SETTLEMENT_PENDING: {
      SETTLEMENT_PROCESSING: ['OFFICER', 'MANAGER', 'ADMIN'],
    },
    SETTLEMENT_PROCESSING: {
      SETTLED: ['OFFICER', 'MANAGER', 'ADMIN'],
    },
    SETTLED: {
      CLOSED: ['OFFICER', 'MANAGER', 'ADMIN'],
    },
    CLOSED: {}
  };

  /**
   * Validate and transition claim status
   */
  async transition(claimId, nextStatus, user, options = {}) {
    const claim = await Claim.findById(claimId);
    if (!claim) {
      throw new Error(`Claim not found with ID ${claimId}`);
    }

    const currentStatus = claim.status;
    const userRole = user ? user.role : 'SYSTEM';

    // Allow Admin override, otherwise check state table
    const allowedForCurrent = this.validTransitions[currentStatus];
    if (!allowedForCurrent || !allowedForCurrent[nextStatus]) {
      if (userRole !== 'ADMIN') {
        throw new Error(`Invalid status transition from '${currentStatus}' to '${nextStatus}'.`);
      }
    } else {
      const allowedRoles = allowedForCurrent[nextStatus];
      if (userRole !== 'ADMIN' && !allowedRoles.includes(userRole)) {
        throw new Error(`Role '${userRole}' is not authorized to transition claim to '${nextStatus}'.`);
      }
    }

    // Special validation checks
    if (nextStatus === 'REJECTED' && !options.reason && !claim.rejectionReason) {
      throw new Error('A mandatory rejection reason must be provided when rejecting a claim.');
    }

    if (nextStatus === 'APPROVED' && options.approvedAmount === undefined && claim.approvedAmount <= 0) {
      // Default approved amount to requested amount if not explicitly passed
      claim.approvedAmount = claim.requestedAmount;
    } else if (options.approvedAmount !== undefined) {
      claim.approvedAmount = options.approvedAmount;
    }

    if (options.reason) {
      claim.rejectionReason = options.reason;
    }
    if (options.officerNotes) {
      claim.officerNotes = options.officerNotes;
    }
    if (options.managerNotes) {
      claim.managerNotes = options.managerNotes;
    }
    if (options.missingDocuments) {
      claim.missingDocumentsRequested = options.missingDocuments;
    }

    const prev = claim.status;
    claim.status = nextStatus;

    if (nextStatus === 'SETTLED') {
      claim.settledAt = new Date();
    } else if (nextStatus === 'CLOSED') {
      claim.closedAt = new Date();
    }

    await claim.save();

    // Record auditable timeline event
    await ClaimTimelineEvent.create({
      claim: claim._id,
      eventType: `STATUS_CHANGE_TO_${nextStatus}`,
      title: `Claim moved to ${nextStatus.replace(/_/g, ' ')}`,
      description: options.notes || options.reason || `Status updated from ${prev} to ${nextStatus} by ${user ? user.name : 'System'}.`,
      performedBy: user ? user._id : null,
      performerRole: userRole,
      previousStatus: prev,
      newStatus: nextStatus,
      isCustomerVisible: true,
      metadata: options,
    });

    // Notify customer
    await Notification.create({
      recipient: claim.customer,
      title: `Claim ${claim.claimReference} Status Update`,
      message: `Your claim has transitioned to ${nextStatus.replace(/_/g, ' ')}. ${options.notes || options.reason || ''}`,
      type: 'CLAIM_UPDATE',
      link: `/customer/claims/${claim._id}`,
      metadata: { claimId: claim._id, status: nextStatus },
    });

    return claim;
  }
}

export const stateMachineService = new StateMachineService();
