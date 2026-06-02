export default function Skeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="kawaii-card animate-pulse">
          <div className="aspect-video bg-pink-100" />
          <div className="p-3 space-y-2">
            <div className="h-4 bg-pink-100 rounded-full w-full" />
            <div className="h-3 bg-pink-50 rounded-full w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
