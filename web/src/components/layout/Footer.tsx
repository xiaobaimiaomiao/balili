import Link from "next/link";
import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t-2 border-pink-100 py-8 mt-12">
      <div className="max-w-[1400px] mx-auto px-4 text-center">
        <Link href="/" className="text-lg font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
          Balili
        </Link>
        <p className="text-sm text-gray-400 mt-2 flex items-center justify-center gap-1">
          Made with <Heart className="w-3 h-3 text-primary-400 fill-primary-400" /> by Balili Team
        </p>
        <p className="text-xs text-gray-300 mt-1">
          {new Date().getFullYear()} Balili Video Platform
        </p>
      </div>
    </footer>
  );
}
