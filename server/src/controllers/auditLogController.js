import { AuditLog } from '../models/AuditLog.js';

export const listAuditLogs = async (req, res, next) => {
  try {
    const { action, resourceType, role, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { userEmail: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { resourceId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10)),
      AuditLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    next(error);
  }
};
