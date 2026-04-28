import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đăng Nhập | Vui học địa lý',
  description: 'Đăng nhập vào hệ thống để tiếp tục hành trình khám phá địa lý.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
