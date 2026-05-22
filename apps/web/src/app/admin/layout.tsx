import React from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-8 shrink-0">
          <h1 className="font-semibold text-lg">System Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Admin Session</span>
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">
              AD
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-muted/20 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
