import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Copy } from 'lucide-react';

interface ShareGrammarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareUrl: string;
  copied: boolean;
  onCopyUrl: () => void;
}

export const ShareGrammarDialog: React.FC<ShareGrammarDialogProps> = ({
  open,
  onOpenChange,
  shareUrl,
  copied,
  onCopyUrl,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share Grammar</DialogTitle>
          <DialogDescription>
            Share a snapshot of your grammar with others.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Shareable Link</label>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="font-mono text-sm"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                onClick={onCopyUrl}
                variant={copied ? 'default' : 'outline'}
                className="gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            All data is encoded in the URL -- nothing is stored on a server.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
