import mongoose from 'mongoose';
import { PolicyProduct } from '../models/PolicyProduct.js';
import { auditService } from '../services/auditService.js';

export const listProducts = async (req, res, next) => {
  try {
    const { category, search, includeUnpublished } = req.query;
    const query = {};

    if (!includeUnpublished) {
      query.isPublished = true;
    }

    if (category && category !== 'ALL') {
      query.category = category.toUpperCase();
    }

    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { insurer: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { planCode: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await PolicyProduct.find(query).sort({ category: 1, annualPremium: 1 });
    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { planCode: id };
    const product = await PolicyProduct.findOne(query);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Policy product not found.' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const compareProducts = async (req, res, next) => {
  try {
    const { ids } = req.query;
    if (!ids || typeof ids !== 'string' || !ids.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comma-separated policy IDs required in query (?ids=id1,id2)',
      });
    }

    // Extract unique identifier tokens (ObjectIds or planCodes)
    const rawTokens = ids.split(',').map((id) => id.trim()).filter(Boolean);
    const uniqueTokens = Array.from(new Set(rawTokens));

    if (uniqueTokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one valid policy identifier is required.',
      });
    }

    const validObjectIds = uniqueTokens.filter((token) => mongoose.Types.ObjectId.isValid(token));
    const orConditions = [];

    if (validObjectIds.length > 0) {
      orConditions.push({ _id: { $in: validObjectIds } });
    }
    orConditions.push({ planCode: { $in: uniqueTokens } });

    // Only return published policies for public comparison
    const products = await PolicyProduct.find({
      isPublished: true,
      $or: orConditions,
    });

    // Sort into the exact order requested by uniqueTokens
    products.sort((a, b) => {
      const idxA = uniqueTokens.findIndex(
        (t) => t === String(a._id) || t.toUpperCase() === (a.planCode || '').toUpperCase()
      );
      const idxB = uniqueTokens.findIndex(
        (t) => t === String(b._id) || t.toUpperCase() === (b.planCode || '').toUpperCase()
      );
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });

    res.json({
      success: true,
      count: products.length,
      requestedCount: uniqueTokens.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const {
      productName,
      insurer,
      category,
      planCode,
      description,
      coverageLimit,
      deductible,
      annualPremium,
      durationMonths,
      eligibilityCriteria,
      keyBenefits,
      exclusions,
      requiredDocuments,
      officialUrl,
      coverageTypeLabel,
      isDemonstration,
      disclaimer,
      isPublished,
    } = req.body;

    const existingCode = await PolicyProduct.findOne({ planCode });
    if (existingCode) {
      return res.status(409).json({ success: false, message: 'Plan code already exists.' });
    }

    const product = await PolicyProduct.create({
      productName,
      insurer,
      category,
      planCode,
      description,
      coverageLimit,
      deductible: deductible || 0,
      annualPremium,
      durationMonths: durationMonths || 12,
      eligibilityCriteria: eligibilityCriteria || [],
      keyBenefits: keyBenefits || [],
      exclusions: exclusions || [],
      requiredDocuments: requiredDocuments || [],
      officialUrl: officialUrl || '',
      coverageTypeLabel: coverageTypeLabel || (category === 'VEHICLE' ? 'Sample Insured Declared Value (IDV)' : category === 'PROPERTY' ? 'Illustrative Insured Value' : 'Sample Coverage Limit'),
      isDemonstration: isDemonstration !== undefined ? isDemonstration : true,
      disclaimer: disclaimer || undefined,
      isPublished: isPublished !== undefined ? isPublished : true,
    });

    await auditService.log(req, 'CREATE_POLICY_PRODUCT', 'PolicyProduct', product._id, { planCode });

    res.status(201).json({
      success: true,
      message: 'Policy product created successfully.',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await PolicyProduct.findByIdAndUpdate(
      req.params.id,
      { ...req.body, $inc: { version: 1 } },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Policy product not found.' });
    }

    await auditService.log(req, 'UPDATE_POLICY_PRODUCT', 'PolicyProduct', product._id, { planCode: product.planCode });

    res.json({
      success: true,
      message: 'Policy product updated successfully.',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await PolicyProduct.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Policy product not found.' });
    }

    await auditService.log(req, 'DELETE_POLICY_PRODUCT', 'PolicyProduct', product._id, { planCode: product.planCode });

    res.json({
      success: true,
      message: 'Policy product deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
