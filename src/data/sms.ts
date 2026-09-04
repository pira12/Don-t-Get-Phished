/**
 * SMS / smishing scenarios. All fictional, for training only. Phone numbers,
 * short-codes and links are invented; links are shown but never navigable.
 */

import type { SmsScenario } from "@/game/types";

export const SMS_SCENARIOS: SmsScenario[] = [
  {
    id: "sms-delivery-redelivery",
    channel: "sms",
    truth: "phishing",
    difficulty: "easy",
    title: "'Parcel held — pay a small fee'",
    sender: "+44 7700 900321",
    timestamp: "09:14",
    messages: [
      {
        text: "ROYAL-PARCEL: Your package is held at our depot. A £1.45 redelivery fee is required.",
      },
      {
        text: "Confirm here within 24h or it will be returned:",
        link: { text: "royalparcel-redelivery.info/pay", href: "http://royalparcel-redelivery.info/pay?id=8842" },
      },
    ],
    redFlags: [
      { type: "smishing_link", anchor: "royalparcel-redelivery.info", explanation: "The domain isn't the courier's real site — couriers don't collect fees via random links." },
      { type: "urgency", anchor: "within 24h", explanation: "A short deadline is manufactured pressure so you act before thinking." },
      { type: "payment_fraud", anchor: "£1.45 redelivery fee", explanation: "A tiny fee is a lure to harvest your card details, not the £1.45." },
    ],
    techniqueTags: ["smishing_link", "urgency", "payment_fraud"],
  },
  {
    id: "sms-bank-otp",
    channel: "sms",
    truth: "phishing",
    difficulty: "medium",
    title: "'Did you authorise this? Reply with your code'",
    sender: "Barcla-Alert",
    timestamp: "22:47",
    messages: [
      { text: "BARCLAYS: A payment of £729.00 to AMAZON was attempted. If this wasn't you, reply STOP and read back the 6-digit code we just sent to cancel." },
    ],
    redFlags: [
      { type: "otp_theft", anchor: "read back the 6-digit code", explanation: "A real bank will NEVER ask you to read back a one-time code — that code authorises the fraud." },
      { type: "urgency", anchor: "wasn't you", explanation: "Fear of a big payment pushes you to react instead of verifying." },
      { type: "caller_id_spoof", anchor: "Barcla-Alert", explanation: "Sender IDs are trivially spoofed; the near-miss spelling is a tell." },
    ],
    techniqueTags: ["otp_theft", "urgency", "caller_id_spoof"],
  },
  {
    id: "sms-boss-newnumber",
    channel: "sms",
    truth: "phishing",
    difficulty: "hard",
    title: "'It's the CEO on my personal phone'",
    sender: "+1 (415) 555-0197",
    timestamp: "16:02",
    messages: [
      { text: "Hi, it's Dana (CEO) — this is my personal cell. In back-to-back meetings and can't take calls." },
      { text: "Need you to grab some gift cards for client gifts and send me the codes. Will reimburse today. Can you help?" },
    ],
    redFlags: [
      { type: "impersonation", anchor: "it's Dana (CEO)", explanation: "Authority + a brand-new number is the classic executive-impersonation setup." },
      { type: "payment_fraud", anchor: "gift cards", explanation: "Gift-card requests are almost always fraud — the codes are untraceable cash." },
      { type: "pretext_authority", anchor: "can't take calls", explanation: "The 'I'm unreachable' excuse blocks the one thing that would expose it: verifying by voice." },
    ],
    techniqueTags: ["impersonation", "payment_fraud", "pretext_authority"],
  },
  {
    id: "sms-2fa-real",
    channel: "sms",
    truth: "legit",
    difficulty: "medium",
    title: "A genuine 2FA code",
    sender: "GitHub",
    timestamp: "11:20",
    messages: [
      { text: "Your GitHub verification code is 481920. Don't share it. If you didn't request it, reset your password." },
    ],
    redFlags: [],
    legitSignals: [
      "It gives you a code to ENTER yourself — it never asks you to send or read it back.",
      "It contains no link and no request for action beyond a login you started.",
      "The advice ('don't share it') is exactly what a real provider says.",
    ],
    techniqueTags: [],
  },
  {
    id: "sms-delivery-real",
    channel: "sms",
    truth: "legit",
    difficulty: "easy",
    title: "A real delivery notification",
    sender: "DPD",
    timestamp: "07:55",
    messages: [
      { text: "DPD: Your parcel from Zara is on the van and will arrive today between 12:00 and 13:00. No action needed." },
    ],
    redFlags: [],
    legitSignals: [
      "It asks for nothing — no fee, no link, no personal details.",
      "It references a specific order you're expecting and gives a normal delivery window.",
    ],
    techniqueTags: [],
  },
  {
    id: "sms-taxrefund",
    channel: "sms",
    truth: "phishing",
    difficulty: "easy",
    title: "'You are owed a tax refund'",
    sender: "+63 917 555 0142",
    timestamp: "13:31",
    messages: [
      {
        text: "HMRC: You are eligible for a tax refund of £284.50. Claim before the deadline:",
        link: { text: "hmrc-refund-claim.com", href: "http://hmrc-refund-claim.com/gateway" },
      },
    ],
    redFlags: [
      { type: "smishing_link", anchor: "hmrc-refund-claim.com", explanation: "Tax authorities never text refund links — and the real domain is gov.uk, not this." },
      { type: "payment_fraud", anchor: "refund of £284.50", explanation: "The 'refund' is bait to collect your bank/card details." },
      { type: "caller_id_spoof", anchor: "+63 917", explanation: "An overseas number 'from HMRC' is an immediate red flag." },
    ],
    techniqueTags: ["smishing_link", "payment_fraud", "caller_id_spoof"],
  },
  {
    id: "sms-mfa-fatigue",
    channel: "sms",
    truth: "phishing",
    difficulty: "hard",
    title: "'Approve the login to make it stop'",
    sender: "+1 (202) 555-0176",
    timestamp: "02:11",
    messages: [
      { text: "IT Helpdesk: We're seeing repeated login prompts on your account overnight. Please approve the next Authenticator prompt so we can stop the alerts and secure it." },
    ],
    redFlags: [
      { type: "pretext_authority", anchor: "IT Helpdesk", explanation: "Attackers pose as IT to make a harmful action sound like a fix." },
      { type: "otp_theft", anchor: "approve the next Authenticator prompt", explanation: "This is MFA-fatigue: they trigger prompts and ask you to approve one — approving hands them your account." },
      { type: "urgency", anchor: "overnight", explanation: "Odd hours and 'make it stop' pressure you to approve without thinking." },
    ],
    techniqueTags: ["pretext_authority", "otp_theft", "urgency"],
  },
  {
    id: "sms-appointment-real",
    channel: "sms",
    truth: "legit",
    difficulty: "medium",
    title: "A dentist appointment reminder",
    sender: "SmileCare",
    timestamp: "08:30",
    messages: [
      { text: "Reminder: your check-up at SmileCare Dental is tomorrow at 15:30. Reply R to reschedule or call 020 7946 0102." },
    ],
    redFlags: [],
    legitSignals: [
      "It asks for no money, codes or personal data.",
      "It offers a normal reply keyword and a phone number you can independently check.",
      "It matches an appointment you actually have.",
    ],
    techniqueTags: [],
  },
];
