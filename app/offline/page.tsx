import type { Metadata } from "next";
import { brand } from "@/config/brand";
import Link from "next/link";

export const metadata: Metadata = {
  title: `Offline — ${brand.name}`,
};

export default function OfflinePage() {
  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-4"
      style={{ background: "var(--bg)" }}
    >
      <div className="card p-8 flex flex-col items-center gap-6 text-center max-w-sm w-full">
        <span className="text-6xl" aria-hidden="true">📵</span>
        <div>
          <h1 className="text-2xl font-bold mb-2">You&apos;re offline</h1>
          <p className="text-ink/60">
            Snapvite needs an internet connection to parse your screenshot with
            Claude vision. Connect to the internet and try again.
          </p>
        </div>
        <Link href="/" className="btn btn-primary">
          Try again →
        </Link>
      </div>
    </div>
  );
}
