import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AdminClient } from './AdminClient';

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 1) {
    redirect('/');
  }

  return (
    <AdminClient
      currentUser={{
        name: session.user.name ?? '',
        image: session.user.image ?? null,
      }}
    />
  );
}
