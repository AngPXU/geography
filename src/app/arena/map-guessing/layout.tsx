import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đoán Bản Đồ | Vui học địa lý',
  description: 'Luyện tập kỹ năng nhận diện bản đồ qua mini-game đoán vị trí.',
};

export default function MapGuessingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
