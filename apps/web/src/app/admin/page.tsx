import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Mail, Users, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminOverviewPage() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Inboxes</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14,231</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SMTP Throughput</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">842 msgs/sec</div>
            <p className="text-xs text-muted-foreground">+4.3% from last hour</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pro Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,104</div>
            <p className="text-xs text-muted-foreground">+12 since yesterday</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Abuse Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">7</div>
            <p className="text-xs text-muted-foreground">High spam score IPs detected</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full bg-card rounded-lg flex items-center justify-center border border-border/50 border-dashed">
              <span className="text-muted-foreground text-sm">Traffic Graph Visualization (Hook)</span>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Admin Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { time: "10:42 AM", msg: "Scale event: Added 2 SMTP workers", type: "system" },
                { time: "10:15 AM", msg: "Banned IP 192.168.1.1 (Spam score > 90)", type: "abuse" },
                { time: "09:30 AM", msg: "API Rate limit triggered for User ID 8492", type: "warning" },
                { time: "08:00 AM", msg: "Daily backup completed successfully", type: "system" },
              ].map((log, i) => (
                <div key={i} className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground w-16 shrink-0">{log.time}</span>
                  <span className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    log.type === 'abuse' ? 'bg-destructive' : log.type === 'warning' ? 'bg-yellow-500' : 'bg-primary'
                  )} />
                  <span className="truncate">{log.msg}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
