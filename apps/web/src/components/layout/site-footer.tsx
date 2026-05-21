import React from "react";
import Link from "next/link";
import { Mail } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40 bg-background/95">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Mail className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl tracking-tight">TempMail</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Enterprise-grade disposable email infrastructure for modern teams and developers.
            </p>
          </div>

          <div>
            <h3 className="font-medium text-foreground mb-4">Product</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link href="/api-docs" className="hover:text-primary transition-colors">API Platform</Link></li>
              <li><Link href="/status" className="hover:text-primary transition-colors">System Status</Link></li>
              <li><Link href="/inbox" className="hover:text-primary transition-colors">Web Inbox</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-foreground mb-4">Resources</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
              <li><Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link></li>
              <li><Link href="/abuse" className="hover:text-primary transition-colors">Report Abuse</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-foreground mb-4">Legal</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} TempMail Enterprise. All rights reserved.
          </p>
          <div className="text-sm text-muted-foreground">
            A production-ready infrastructure demonstration.
          </div>
        </div>
      </div>
    </footer>
  );
}
