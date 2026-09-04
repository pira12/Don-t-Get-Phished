/**
 * Chat / DM impersonation scenarios across Slack, Teams, WhatsApp and social DMs.
 * Fictional; links are shown but never navigable.
 */

import type { ChatScenario } from "@/game/types";

export const CHAT_SCENARIOS: ChatScenario[] = [
  {
    id: "chat-ceo-giftcard",
    channel: "chat",
    truth: "phishing",
    difficulty: "medium",
    title: "'CEO' DMs you for gift cards",
    platform: "slack",
    senderName: "Dana Okafor",
    senderHandle: "@dana.okafor.ceo",
    verified: false,
    messages: [
      { from: "them", text: "Hi, you around? Bit tied up but need a quick favour.", time: "10:04" },
      { from: "them", text: "Need to send some gift cards to clients today. Can you buy 5×£100 Amazon cards and DM me the codes? I'll expense it.", time: "10:05" },
    ],
    redFlags: [
      { type: "impersonation", anchor: "@dana.okafor.ceo", explanation: "A brand-new handle mimicking the CEO — real accounts don't append '.ceo'." },
      { type: "payment_fraud", anchor: "gift cards", explanation: "Gift-card requests are the single most common impersonation scam." },
      { type: "urgency", anchor: "today", explanation: "Same-day pressure discourages you from checking with the real person." },
    ],
    techniqueTags: ["impersonation", "payment_fraud", "urgency"],
  },
  {
    id: "chat-it-reset",
    channel: "chat",
    truth: "phishing",
    difficulty: "hard",
    title: "'IT' wants you to confirm a reset",
    platform: "teams",
    senderName: "IT Service Desk",
    senderHandle: "External • it-servicedesk@outlook.com",
    verified: false,
    messages: [
      { from: "them", text: "We're migrating accounts tonight. To keep access, confirm your credentials here:", time: "17:22", link: { text: "company-sso-verify.com", href: "http://company-sso-verify.com/login" } },
      { from: "them", text: "Do this before 6pm or you'll be locked out in the morning.", time: "17:22" },
    ],
    redFlags: [
      { type: "impersonation", anchor: "External • it-servicedesk@outlook.com", explanation: "A real internal IT desk isn't an 'External' contact on a personal Outlook address." },
      { type: "fake_login_page", anchor: "company-sso-verify.com", explanation: "A look-legit domain that isn't your company's real SSO — it harvests logins." },
      { type: "urgency", anchor: "before 6pm", explanation: "Lock-out deadlines manufacture panic so you skip verification." },
    ],
    techniqueTags: ["impersonation", "fake_login_page", "urgency"],
  },
  {
    id: "chat-recruiter-scam",
    channel: "chat",
    truth: "phishing",
    difficulty: "medium",
    title: "A 'recruiter' with an offer too good",
    platform: "linkedin",
    senderName: "Talent Partner",
    senderHandle: "Recruitment • joined this week",
    verified: false,
    messages: [
      { from: "them", text: "Hi! We're hiring remote reviewers — £45/hr, 2 hrs a day. Interested?", time: "14:10" },
      { from: "them", text: "Great! Just pay a small onboarding/equipment deposit and complete verification here:", time: "14:12", link: { text: "quick-onboard-portal.net", href: "http://quick-onboard-portal.net/apply" } },
    ],
    redFlags: [
      { type: "payment_fraud", anchor: "onboarding/equipment deposit", explanation: "Legitimate employers never ask candidates to pay to start." },
      { type: "impersonation", anchor: "joined this week", explanation: "A brand-new profile with no history is a classic job-scam signal." },
      { type: "credential_harvest_link", anchor: "quick-onboard-portal.net", explanation: "The 'verification' link collects your ID and bank details." },
    ],
    techniqueTags: ["payment_fraud", "impersonation", "credential_harvest_link"],
  },
  {
    id: "chat-colleague-real",
    channel: "chat",
    truth: "legit",
    difficulty: "medium",
    title: "A real teammate sharing a doc",
    platform: "slack",
    senderName: "Priya Sharma",
    senderHandle: "@priya • Design",
    verified: true,
    messages: [
      { from: "them", text: "Hey! Dropped my notes from the review into our shared drive — the Q3 folder.", time: "09:30" },
      { from: "you", text: "Perfect, thanks — will take a look.", time: "09:31" },
      { from: "them", text: "No rush 🙂", time: "09:31" },
    ],
    redFlags: [],
    legitSignals: [
      "It's an existing colleague on an internal, verified account.",
      "It points to your normal shared drive rather than an outside link.",
      "There's no urgency, money, credentials or secrecy.",
    ],
    techniqueTags: [],
  },
  {
    id: "chat-whatsapp-family",
    channel: "chat",
    truth: "phishing",
    difficulty: "hard",
    title: "'Hi Mum, this is my new number'",
    platform: "whatsapp",
    senderName: "+44 7700 900555",
    senderHandle: "Not in your contacts",
    verified: false,
    messages: [
      { from: "them", text: "Hi Mum, I dropped my phone down the loo 😩 this is my temporary number.", time: "19:40" },
      { from: "them", text: "I can't log into my banking on this one — could you pay a £280 bill for me today? I'll send the details. Love you x", time: "19:42" },
    ],
    redFlags: [
      { type: "impersonation", anchor: "this is my temporary number", explanation: "The 'new number' story is the entire 'hi mum' scam — the sender is not who they claim." },
      { type: "payment_fraud", anchor: "pay a £280 bill", explanation: "An urgent payment to a new account is the goal of the scam." },
      { type: "urgency", anchor: "today", explanation: "Emotional pressure plus a deadline rushes you past verifying by voice." },
    ],
    techniqueTags: ["impersonation", "payment_fraud", "urgency"],
  },
  {
    id: "chat-vendor-real",
    channel: "chat",
    truth: "legit",
    difficulty: "hard",
    title: "A supplier flags a normal invoice",
    platform: "teams",
    senderName: "Acme Supplies (Verified)",
    senderHandle: "vendor • verified partner",
    verified: true,
    messages: [
      { from: "them", text: "Hi — invoice INV-4471 for last month's order is in the portal as usual.", time: "11:05" },
      { from: "you", text: "Thanks, can you confirm the amount?", time: "11:06" },
      { from: "them", text: "£2,310, same PO as before. Bank details unchanged — pay to the account already on file.", time: "11:07" },
    ],
    redFlags: [],
    legitSignals: [
      "It references an existing PO and the invoice in your normal portal.",
      "It explicitly says bank details are UNCHANGED (a bank-detail change is the thing to distrust).",
      "It's a verified partner and answers your check openly.",
    ],
    techniqueTags: [],
  },
];
