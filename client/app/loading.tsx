export default function Loading() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-cream-dark border-t-maroon rounded-full animate-spin"></div>
      <p className="text-navy font-bold tracking-widest uppercase text-sm">Loading...</p>
    </div>
  );
}
