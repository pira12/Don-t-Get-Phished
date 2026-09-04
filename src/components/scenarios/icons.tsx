"use client";

import {
  Mail,
  MessageSquare,
  MessagesSquare,
  Phone,
  PhoneOff,
  QrCode,
  ShieldAlert,
  Archive,
  Trash2,
  Check,
  type LucideIcon,
} from "lucide-react";

/** Resolve the string icon names used in the pure game/channels.ts module. */
const ICONS: Record<string, LucideIcon> = {
  Mail,
  MessageSquare,
  MessagesSquare,
  Phone,
  PhoneOff,
  QrCode,
  ShieldAlert,
  Archive,
  Trash2,
  Check,
};

export function ChannelIcon({ name, size = 16, className }: { name: string; size?: number; className?: string }) {
  const Icon = ICONS[name] ?? Mail;
  return <Icon size={size} className={className} aria-hidden />;
}
