'use client';

import { useParams } from 'next/navigation';
import AssignmentDetailPage from '@/components/ui/AssignmentDetailPage';

export default function Page() {
  const { cid, aid } = useParams() as { cid: string; aid: string };
  return <AssignmentDetailPage classId={cid} assignmentId={aid} />;
}
