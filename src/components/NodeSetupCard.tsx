import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function NodeSetupCard() {
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  const nvmCmd = `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"
nvm install 20 && nvm alias default 20
node -v && npm -v`;

  const debianCmd = `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v && npm -v`;

  const brewCmd = `brew install node@20 && brew link --overwrite node@20
node -v && npm -v`;

  return (
    <Card className="border-border">
      <CardHeader className="p-4">
        <CardTitle className="text-lg sm:text-xl">Node.js is required to run apps locally</CardTitle>
        <CardDescription className="mt-2 space-y-2">
          <p className="text-sm">Install Node 20+ on your machine, then reopen the app.</p>
          <div className="grid grid-cols-1 gap-2">
            <div className="rounded-md border p-3 bg-muted/40">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">nvm (Linux/macOS)</span>
                <Button size="sm" variant="outline" onClick={() => copy(nvmCmd)}>Copy</Button>
              </div>
              <pre className="whitespace-pre-wrap text-xs select-all">{nvmCmd}</pre>
            </div>
            <div className="rounded-md border p-3 bg-muted/40">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">Debian/Ubuntu</span>
                <Button size="sm" variant="outline" onClick={() => copy(debianCmd)}>Copy</Button>
              </div>
              <pre className="whitespace-pre-wrap text-xs select-all">{debianCmd}</pre>
            </div>
            <div className="rounded-md border p-3 bg-muted/40">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">macOS (Homebrew)</span>
                <Button size="sm" variant="outline" onClick={() => copy(brewCmd)}>Copy</Button>
              </div>
              <pre className="whitespace-pre-wrap text-xs select-all">{brewCmd}</pre>
            </div>
            <div className="rounded-md border p-3 bg-muted/40">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Windows</span>
                <a className="text-xs underline" href="https://nodejs.org/en/download" target="_blank" rel="noreferrer">Download</a>
              </div>
            </div>
          </div>
        </CardDescription>
      </CardHeader>
    </Card>
  );
}