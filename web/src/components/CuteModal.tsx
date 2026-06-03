"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import Portal from "./Portal";

export default function CuteModal({
  open,
  onClose,
  title,
  icon,
  children,
  maxWidth = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overlay-enter"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-pink-300/30 via-fuchsia-200/20 to-rose-300/30 backdrop-blur-sm" />
        <div
          className={`relative bg-white/95 backdrop-blur-xl rounded-3xl border-2 border-pink-200 shadow-[0_20px_60px_rgba(255,107,157,0.25)] p-6 w-full ${maxWidth} mx-4 modal-enter`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute -top-3 -left-3 w-12 h-12 bg-gradient-to-br from-pink-300 to-rose-400 rounded-full flex items-center justify-center text-white text-xl shadow-lg">
            {icon ?? "🌸"}
          </div>
          <div className="flex items-center justify-between mb-5 pl-10">
            <h3 className="text-lg font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-pink-500 hover:bg-pink-50 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </Portal>
  );
}
