import mongoose from 'mongoose';
import { ConfigurableRule } from '../models/ConfigurableRule.js';
import { auditService } from '../services/auditService.js';

const formatRuleResponse = (ruleDoc) => {
  if (!ruleDoc) return null;
  const obj = typeof ruleDoc.toObject === 'function' ? ruleDoc.toObject() : { ...ruleDoc };
  return {
    ...obj,
    isActive: obj.isEnabled,
    ruleCode: obj.ruleId,
  };
};

export const listRules = async (req, res, next) => {
  try {
    const rules = await ConfigurableRule.find().sort({ category: 1, ruleId: 1 });
    const formatted = rules.map(formatRuleResponse);
    res.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

export const getRuleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { ruleId: id };
    const rule = await ConfigurableRule.findOne(query);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found.' });
    }
    res.json({
      success: true,
      data: formatRuleResponse(rule),
    });
  } catch (error) {
    next(error);
  }
};

export const toggleRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isEnabled, isActive } = req.body || {};

    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { ruleId: id };
    const rule = await ConfigurableRule.findOne(query);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found.' });
    }

    const previousState = rule.isEnabled;
    if (isEnabled !== undefined) {
      rule.isEnabled = Boolean(isEnabled);
    } else if (isActive !== undefined) {
      rule.isEnabled = Boolean(isActive);
    } else {
      rule.isEnabled = !rule.isEnabled;
    }

    rule.version = (rule.version || 1) + 1;
    await rule.save();

    await auditService.log(req, 'TOGGLE_RULE_STATE', 'ConfigurableRule', rule._id, {
      ruleId: rule.ruleId,
      isEnabled: rule.isEnabled,
      previousState,
    });

    res.json({
      success: true,
      message: `Rule ${rule.name || rule.ruleId} is now ${rule.isEnabled ? 'Active' : 'Inactive'}.`,
      data: formatRuleResponse(rule),
    });
  } catch (error) {
    next(error);
  }
};

export const updateRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isEnabled, isActive, severity, parameters, description } = req.body || {};

    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { ruleId: id };
    const rule = await ConfigurableRule.findOne(query);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found.' });
    }

    if (isEnabled !== undefined) rule.isEnabled = Boolean(isEnabled);
    else if (isActive !== undefined) rule.isEnabled = Boolean(isActive);

    if (severity) rule.severity = severity;
    if (parameters) rule.parameters = parameters;
    if (description) rule.description = description;
    rule.version = (rule.version || 1) + 1;

    await rule.save();
    await auditService.log(req, 'UPDATE_RULE_CONFIGURATION', 'ConfigurableRule', rule._id, {
      ruleId: rule.ruleId,
      isEnabled: rule.isEnabled,
      severity: rule.severity,
    });

    res.json({
      success: true,
      message: `Rule ${rule.ruleId} updated successfully.`,
      data: formatRuleResponse(rule),
    });
  } catch (error) {
    next(error);
  }
};

