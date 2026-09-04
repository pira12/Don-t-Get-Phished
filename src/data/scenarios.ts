/**
 * Aggregated non-email scenarios, grouped by channel. Email keeps its own richer
 * dataset (data/emails.ts) and inbox surface; these power the channel arena and
 * the mixed cross-channel round.
 */

import type { Channel, Scenario } from "@/game/types";
import { SMS_SCENARIOS } from "./sms";
import { CALL_SCENARIOS } from "./calls";
import { CHAT_SCENARIOS } from "./chats";
import { WEB_SCENARIOS } from "./web";

export const SCENARIOS_BY_CHANNEL: Record<Exclude<Channel, "email">, Scenario[]> = {
  sms: SMS_SCENARIOS,
  call: CALL_SCENARIOS,
  chat: CHAT_SCENARIOS,
  web: WEB_SCENARIOS,
};

export const ALL_SCENARIOS: Scenario[] = [
  ...SMS_SCENARIOS,
  ...CALL_SCENARIOS,
  ...CHAT_SCENARIOS,
  ...WEB_SCENARIOS,
];

export function scenariosForChannel(channel: Exclude<Channel, "email">): Scenario[] {
  return SCENARIOS_BY_CHANNEL[channel] ?? [];
}
