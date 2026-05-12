import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import CountryDetailClient from './CountryDetailClient';

export const metadata: Metadata = {
  title: 'Chi tiết Quốc gia | Admin',
  robots: { index: false, follow: false },
};

export default async function CountryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 1) redirect('/');

  const { id } = await params;

  return <CountryDetailClient id={id} />;
}
