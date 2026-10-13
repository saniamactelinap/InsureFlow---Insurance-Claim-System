import { AuditLog } from '../models/AuditLog.js';

class AuditService {
  async log(req, action, resourceType, resourceId, details = {}) {
    try {
      const user = req?.user;
      const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || '';

      await AuditLog.create({
        user: user ? user._id : null,
        userEmail: user ? user.email : 'system',
        role: user ? user.role : 'SYSTEM',
        action,
        resourceType,
        resourceId: String(resourceId || ''),
        details,
        ipAddress,
      });
    } catch (error) {
      console.error('[AuditService Error]', error);
    }
  }
}

export const auditService = new AuditService();
