import Notification from '@/models/Notification';
import dbConnect from '@/utils/db';

export async function notify(
  recipientIds: string | string[],
  type: 'NEW_ASSIGNMENT' | 'SUBMITTED_ASSIGNMENT' | 'GRADED_ASSIGNMENT' | 'LIVE_CLASS_STARTED' | 'CLASS_JOIN' | 'ARENA_INVITE' | 'GENERAL',
  title: string,
  message: string,
  link?: string,
  senderId?: string
) {
  try {
    await dbConnect();
    const ids = Array.isArray(recipientIds) ? recipientIds : [recipientIds];
    
    if (ids.length === 0) return;

    const payload = ids.map(id => ({
      recipientId: id,
      senderId,
      type,
      title,
      message,
      link,
      isRead: false,
      createdAt: new Date()
    }));

    await Notification.insertMany(payload);
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}
