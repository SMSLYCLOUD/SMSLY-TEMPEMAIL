import React from "react";
import Link from "next/link";
import { Mail, Shield, Zap, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center px-4">
        <Link href="/" className="flex items-center gap-2 mr-8">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Mail className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl tracking-tight hidden sm:inline-block">TempMail</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium flex-1">
          <Link href="/pricing" className="transition-colors hover:text-primary text-foreground/60">
            Pricing
          </Link>
          <Link href="/api-docs" className="transition-colors hover:text-primary text-foreground/60">
            API
          </Link>
          <Link href="/blog" className="transition-colors hover:text-primary text-foreground/60">
            Blog
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="hidden sm:flex">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button>
            <Link href="/inbox">Open Inbox</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
