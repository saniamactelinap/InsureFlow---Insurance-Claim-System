import { Notification } from '../models/Notification.js';

class NotificationService {
  async notifyUser(recipientId, { title, message, type = 'CLAIM_UPDATE', link = '', metadata = {} }) {
    try {
      const notification = await Notification.create({
        recipient: recipientId,
        title,
        message,
        type,
        link,
        metadata,
      });
      return notification;
    } catch (error) {
      console.error('[NotificationService Error]', error);
      return null;
    }
  }

  async getUnreadCount(userId) {
    return Notification.countDocuments({ recipient: userId, isRead: false });
  }

  async markAsRead(notificationId, userId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true },
      { new: true }
    );
  }

  async markAllAsRead(userId) {
    return Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );
  }
}

export const notificationService = new NotificationService();
