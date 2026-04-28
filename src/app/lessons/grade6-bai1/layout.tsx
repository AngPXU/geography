import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lớp 6 - Bài 1 | Vui học địa lý',
  description: 'Bài học Địa lý lớp 6 - Bài 1',
};

export default function Grade6Lesson1Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
