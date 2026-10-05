import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="font-display text-3xl font-bold uppercase">Sayfa bulunamadı</h1>
      <Link href="/yonetim" className="font-semibold text-zw-red-600 hover:underline">
        Panele dön
      </Link>
    </div>
  );
}
