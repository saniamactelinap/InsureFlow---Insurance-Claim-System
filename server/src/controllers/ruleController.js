import { ConfigurableRule } from '../models/ConfigurableRule.js';
import { auditService } from '../services/auditService.js';

export const listRules = async (req, res, next) => {
  try {
    const rules = await ConfigurableRule.find().sort({ category: 1, ruleId: 1 });
    res.json({
      success: true,
      count: rules.length,
      data: rules,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isEnabled, severity, parameters, description } = req.body;

    const rule = await ConfigurableRule.findById(id);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found.' });
    }

    if (isEnabled !== undefined) rule.isEnabled = isEnabled;
    if (severity) rule.severity = severity;
    if (parameters) rule.parameters = parameters;
    if (description) rule.description = description;
    rule.version += 1;

    await rule.save();
    await auditService.log(req, 'UPDATE_RULE_CONFIGURATION', 'ConfigurableRule', rule._id, {
      ruleId: rule.ruleId,
      isEnabled: rule.isEnabled,
      severity: rule.severity,
    });

    res.json({
      success: true,
      message: `Rule ${rule.ruleId} updated successfully.`,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};
