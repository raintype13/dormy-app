import { Header } from '@/components/Header';
import { ListingCard } from '@/components/ListingCard';

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-full">
      <Header />

      <div className="p-4 space-y-4">
        <ListingCard />
        <ListingCard />
        <ListingCard />
      </div>
    </main>
  );
}