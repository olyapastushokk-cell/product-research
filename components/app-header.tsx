import Link from "next/link";
import { LogOut } from "lucide-react";
import { logout } from "@/app/actions";

export function AppHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="bg-header bg-[radial-gradient(ellipse_at_top_left,rgba(120,72,44,0.55),transparent_60%)] text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
        <Link href="/" className="bg-primary px-2.5 py-1 text-sm font-extrabold uppercase tracking-wider text-white sm:text-base">
          Product Research
        </Link>
        {signedIn && (
          <nav className="flex items-center gap-4 text-sm font-semibold sm:gap-6">
            <Link href="/" className="hover:text-primary">
              Ніші
            </Link>
            <form action={logout}>
              <button type="submit" className="inline-flex cursor-pointer items-center gap-1.5 text-white/70 hover:text-white">
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Вийти</span>
              </button>
            </form>
          </nav>
        )}
      </div>
    </header>
  );
}
