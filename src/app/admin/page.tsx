import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AdminClient } from './AdminClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quản Trị | Vui học địa lý',
  robots: { index: false, follow: false },
};

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
