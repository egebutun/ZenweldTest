import Link from "next/link";

export default function NotFound() {
  return (
    <div className="zw-container py-28 text-center">
      <div className="font-display text-7xl font-bold text-zw-red-600">404</div>
      <h1 className="mt-4 font-display text-3xl font-bold uppercase">Sayfa bulunamadı</h1>
      <Link
        href="/tr"
        className="mt-8 inline-block rounded-[4px] bg-zw-ink px-6 py-3 text-sm font-semibold uppercase text-white hover:bg-zw-red-600"
      >
        Mağazaya dön
      </Link>
    </div>
  );
}
