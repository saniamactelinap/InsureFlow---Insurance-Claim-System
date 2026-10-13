import { CustomerPolicy } from '../models/CustomerPolicy.js';
import { PolicyProduct } from '../models/PolicyProduct.js';
import { auditService } from '../services/auditService.js';
import { notificationService } from '../services/notificationService.js';
import { ocrService } from '../services/ocrService.js';

export const getMyPolicies = async (req, res, next) => {
  try {
    const policies = await CustomerPolicy.find({ customer: req.user._id })
      .populate('product')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: policies.length,
      data: policies,
    });
  } catch (error) {
    next(error);
  }
};

export const listAllPolicies = async (req, res, next) => {
  try {
    const { source, verificationStatus, category, search } = req.query;
    const query = {};

    if (source) query.policySource = source;
    if (verificationStatus) query.verificationStatus = verificationStatus;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { policyNumber: { $regex: search, $options: 'i' } },
        { insurerName: { $regex: search, $options: 'i' } },
        { policyholderName: { $regex: search, $options: 'i' } },
      ];
    }

    const policies = await CustomerPolicy.find(query)
      .populate('customer', 'name email phone')
      .populate('product')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: policies.length,
      data: policies,
    });
  } catch (error) {
    next(error);
  }
};

export const getPolicyById = async (req, res, next) => {
  try {
    const policy = await CustomerPolicy.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('product');

    if (!policy) {
      return res.status(404).json({ success: false, message: 'Policy not found.' });
    }

    // Authorization: customer can only access their own policy, staff can view all
    const isStaff = ['ADMIN', 'MANAGER', 'OFFICER', 'SURVEYOR'].includes(req.user.role);
    if (!isStaff && String(policy.customer._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied to this policy record.' });
    }

    res.json({ success: true, data: policy });
  } catch (error) {
    next(error);
  }
};

export const registerExternalPolicy = async (req, res, next) => {
  try {
    const {
      insurerName,
      policyNumber,
      category,
      policyholderName,
      coverageAmount,
      deductible,
      startDate,
      endDate,
    } = req.body;

    if (!insurerName || !policyNumber || !category || !coverageAmount || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'All external policy details are mandatory (insurer, number, category, coverage, dates).',
      });
    }

    // Check if policy number is already registered
    const existing = await CustomerPolicy.findOne({ policyNumber: policyNumber.trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Policy number '${policyNumber}' is already registered in the system.`,
      });
    }

    let policyDocumentUrl = '';
    if (req.file) {
      policyDocumentUrl = `/uploads/${req.file.filename}`;
    }

    const policy = await CustomerPolicy.create({
      customer: req.user._id,
      policySource: 'EXTERNAL',
      policyNumber: policyNumber.trim(),
      insurerName: insurerName.trim(),
      category,
      policyholderName: policyholderName || req.user.name,
      coverageAmount: Number(coverageAmount),
      deductible: Number(deductible || 0),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      verificationStatus: 'PENDING',
      policyDocumentUrl,
      status: 'ACTIVE',
    });

    await auditService.log(req, 'REGISTER_EXTERNAL_POLICY', 'CustomerPolicy', policy._id, {
      policyNumber,
      insurerName,
    });

    res.status(201).json({
      success: true,
      message: 'External policy registered successfully. Document is queued for officer verification.',
      data: policy,
    });
  } catch (error) {
    next(error);
  }
};

export const applyForPlatformPolicy = async (req, res, next) => {
  try {
    const { productId, policyholderName } = req.body;
    const product = await PolicyProduct.findById(productId);

    if (!product || !product.isPublished) {
      return res.status(404).json({ success: false, message: 'Insurance product not available.' });
    }

    // Generate unique policy number: POL-YYYY-RANDOM
    const policyNumber = `POL-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (product.durationMonths || 12));

    const policy = await CustomerPolicy.create({
      customer: req.user._id,
      policySource: 'PLATFORM',
      policyNumber,
      product: product._id,
      insurerName: product.insurer,
      category: product.category,
      policyholderName: policyholderName || req.user.name,
      coverageAmount: product.coverageLimit,
      deductible: product.deductible,
      startDate,
      endDate,
      verificationStatus: 'VERIFIED',
      status: 'ACTIVE',
    });

    await auditService.log(req, 'PURCHASE_PLATFORM_POLICY', 'CustomerPolicy', policy._id, {
      policyNumber,
      productName: product.productName,
    });

    await notificationService.notifyUser(req.user._id, {
      title: 'Policy Issued Successfully',
      message: `Your policy #${policyNumber} for ${product.productName} is now active.`,
      type: 'SYSTEM',
      link: '/customer/policies',
    });

    res.status(201).json({
      success: true,
      message: `Policy ${policyNumber} issued successfully!`,
      data: policy,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyExternalPolicy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body; // status: 'VERIFIED' or 'REJECTED'

    if (!['VERIFIED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be VERIFIED or REJECTED.' });
    }

    const policy = await CustomerPolicy.findById(id);
    if (!policy) {
      return res.status(404).json({ success: false, message: 'Policy not found.' });
    }

    policy.verificationStatus = status;
    policy.verifiedBy = req.user._id;
    policy.verifiedAt = new Date();
    if (notes) policy.externalVerificationNotes = notes;
    await policy.save();

    await auditService.log(req, `VERIFY_EXTERNAL_POLICY_${status}`, 'CustomerPolicy', policy._id, {
      status,
      notes,
    });

    await notificationService.notifyUser(policy.customer, {
      title: `External Policy Verification: ${status}`,
      message: `Your external policy ${policy.policyNumber} has been ${status.toLowerCase()} by our verification team.`,
      type: 'CLAIM_UPDATE',
      link: '/customer/policies',
    });

    res.json({
      success: true,
      message: `External policy marked as ${status}.`,
      data: policy,
    });
  } catch (error) {
    next(error);
  }
};
