import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import Notification from '@/models/Notification';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const searchParams = req.nextUrl.searchParams;
  const pollOnly = searchParams.get('poll') === '1';

  try {
    const unreadCount = await Notification.countDocuments({
      recipientId: session.user.id,
      isRead: false
    });

    if (pollOnly) {
      return NextResponse.json({ unreadCount });
    }

    const notifications = await Notification.find({ recipientId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  try {
    const body = await req.json().catch(() => ({}));

    if (body.id) {
      // Mark specific notification as read
      await Notification.findOneAndUpdate(
        { _id: body.id, recipientId: session.user.id },
        { isRead: true }
      );
    } else {
      // Mark all as read
      await Notification.updateMany(
        { recipientId: session.user.id, isRead: false },
        { isRead: true }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking notifications read:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
