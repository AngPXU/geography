import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đồng Bằng Sông Cửu Long | Vui học địa lý',
  description: 'Bài học khám phá Đồng bằng sông Cửu Long',
};

export default function MekongDeltaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
