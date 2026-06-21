"use client";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BackToButton({ href, children }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="back-link cursor-pointer"
      onClick={() => (href ? router.push(href) : router.back())}
    >
      <ChevronLeft size={14} />
      <span className="back-link">Back to {children}</span>
    </button>
  );
}
