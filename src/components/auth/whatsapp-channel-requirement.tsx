'use client';

import { ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';

export const UNIVAI_WHATSAPP_CHANNEL_URL = 'https://whatsapp.com/channel/0029VbD8STOJ93wbnKF7KG3X';

export function WhatsAppChannelRequirement({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-foreground">Join the UnivAI WhatsApp channel</p>
          <p className="mt-1 text-muted-foreground">This is required before creating an account so you can receive updates and important notices.</p>
        </div>
        <Button asChild variant="outline" className="shrink-0 gap-2">
          <a href={UNIVAI_WHATSAPP_CHANNEL_URL} target="_blank" rel="noreferrer">
            Open channel <ExternalLink className="size-4" />
          </a>
        </Button>
      </div>
      <label className="flex items-start gap-3 text-sm text-muted-foreground">
        <input
          type="checkbox"
          name="acceptedWhatsappChannel"
          className="mt-1"
          checked={checked}
          onChange={(event) => onCheckedChange(event.target.checked)}
          required
        />
        <span>I have joined the UnivAI WhatsApp channel.</span>
      </label>
    </div>
  );
}
