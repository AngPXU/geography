import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import AssignmentDetailPage from '@/components/ui/AssignmentDetailPage';

export default async function Page({ params }: { params: Promise<{ cid: string; aid: string }> }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const { cid, aid } = await params;
  return <AssignmentDetailPage classId={cid} assignmentId={aid} session={session} />;
}
