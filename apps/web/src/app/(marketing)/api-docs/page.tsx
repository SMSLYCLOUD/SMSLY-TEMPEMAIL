import { AdLayout } from "@/components/ads";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ApiDocsPage() {
  return (
    <AdLayout showBottomAd>
      <div className="py-12 md:py-20 max-w-5xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">API Documentation</h1>
        <p className="text-xl text-muted-foreground mb-12">
          Integrate TempMail into your testing workflows and applications.
        </p>

        <div className="bg-card border border-border rounded-xl overflow-hidden mb-12">
          <div className="border-b border-border bg-muted/50 p-4 font-mono text-sm text-muted-foreground flex justify-between items-center">
            <span>Authentication</span>
            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-xs">Bearer Token</span>
          </div>
          <div className="p-6">
            <p className="mb-4 text-sm text-muted-foreground">All API requests require an API key passed in the Authorization header.</p>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono border border-border">
              <code>Authorization: Bearer tm_live_xxxxxxxxxxxxxxxxx</code>
            </pre>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6 mt-16">Endpoints</h2>

        <div className="space-y-8">
          {/* Endpoint: Create Inbox */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="border-b border-border bg-muted/50 p-4 flex items-center gap-4">
              <span className="bg-green-500/20 text-green-500 font-bold px-2 py-1 rounded text-xs uppercase tracking-wider">POST</span>
              <span className="font-mono text-sm font-medium">/api/v1/inboxes</span>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-2">Create an Inbox</h3>
              <p className="text-sm text-muted-foreground mb-6">Generates a new random disposable email address.</p>

              <Tabs defaultValue="curl" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="js">Node.js</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                </TabsList>
                <TabsContent value="curl">
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono border border-border">
                    <code>{`curl -X POST https://api.tempmail.com/v1/inboxes \\
  -H "Authorization: Bearer $API_KEY"`}</code>
                  </pre>
                </TabsContent>
                <TabsContent value="js">
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono border border-border">
                    <code>{`const response = await fetch('https://api.tempmail.com/v1/inboxes', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${process.env.API_KEY}\`
  }
});
const data = await response.json();`}</code>
                  </pre>
                </TabsContent>
                <TabsContent value="python">
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono border border-border">
                    <code>{`import requests
import os

headers = {
    'Authorization': f"Bearer {os.getenv('API_KEY')}"
}
response = requests.post('https://api.tempmail.com/v1/inboxes', headers=headers)
data = response.json()`}</code>
                  </pre>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Endpoint: SSE Stream */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="border-b border-border bg-muted/50 p-4 flex items-center gap-4">
              <span className="bg-blue-500/20 text-blue-500 font-bold px-2 py-1 rounded text-xs uppercase tracking-wider">GET</span>
              <span className="font-mono text-sm font-medium">/api/v1/inboxes/:id/stream</span>
              <span className="ml-auto bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest">SSE</span>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-2">Stream Messages</h3>
              <p className="text-sm text-muted-foreground mb-6">Connect to a Server-Sent Events (SSE) stream to receive emails in real-time without polling.</p>

              <Tabs defaultValue="js" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="js">Browser JS</TabsTrigger>
                </TabsList>
                <TabsContent value="js">
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono border border-border">
                    <code>{`const eventSource = new EventSource(\`https://api.tempmail.com/v1/inboxes/\${inboxId}/stream?token=\${apiKey}\`);

eventSource.onmessage = (event) => {
  const email = JSON.parse(event.data);
  console.log('New email received:', email.subject);
};`}</code>
                  </pre>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </AdLayout>
  );
}
