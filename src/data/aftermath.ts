/**
 * "The Aftermath" — data for the attacker's-eye consequence simulation.
 *
 * Purpose: show a realistic, sobering view of what happens AFTER someone clicks a
 * phishing link and enters credentials — so the stakes feel real. This is strictly
 * an awareness tool: every step describes the *impact* and how to *prevent* it, never
 * how to carry out an attack. Figures are illustrative, drawn from public reporting
 * (FBI IC3, Verizon DBIR, IBM Cost of a Data Breach) — see SOURCES.
 */

export type StepIcon =
  | "capture"
  | "login"
  | "reset"
  | "mfa"
  | "read"
  | "wire"
  | "exfil"
  | "spread"
  | "ransom";

export type AftermathStep = {
  t: string; // relative time, e.g. "0s", "+2 min", "+1 day"
  icon: StepIcon;
  action: string; // what the attacker does (consequence-focused)
  impact: string; // the real-world damage
  why: string; // how the phish enabled it + the defence hook
};

export type ImpactStat = { label: string; value: string; note?: string };

export type AftermathScenario = {
  id: string;
  name: string;
  context: string;
  /** Lookalike URL shown in the fake browser chrome — the tell the victim missed. */
  fakeDomain: string;
  loginTitle: string;
  intro: string;
  steps: AftermathStep[];
  impact: ImpactStat[];
  defenses: string[];
};

export const AFTERMATH_SCENARIOS: AftermathScenario[] = [
  {
    id: "work-email",
    name: "Work email takeover",
    context: "Your work email / single sign-on account",
    fakeDomain: "login.micros0ft-verify.com",
    loginTitle: "Sign in to continue",
    intro:
      "You clicked “Verify account” in that email and reached a login page that looked exactly right. It wasn’t. Watch what one password can unlock.",
    steps: [
      {
        t: "0s",
        icon: "capture",
        action: "Your email and password land in the attacker’s panel — in plain text.",
        impact: "They now hold the keys to your primary account. Everything below follows from this one moment.",
        why: "The page was a copy on a lookalike domain. A password manager wouldn’t have autofilled it — that silence is a warning.",
      },
      {
        t: "+30s",
        icon: "login",
        action: "They sign in as you and add a hidden mail-forwarding rule.",
        impact: "Every future email — including security alerts and reset codes — is silently copied to them. You notice nothing.",
        why: "Single sign-on means this one login often unlocks dozens of connected apps at once.",
      },
      {
        t: "+2 min",
        icon: "reset",
        action: "They request password resets on your other accounts using your inbox.",
        impact: "Bank, social, shopping, cloud storage — anything tied to this email starts falling, one “reset link” at a time.",
        why: "Reused or similar passwords make it instant. Unique passwords + a manager contain the blast radius.",
      },
      {
        t: "+5 min",
        icon: "mfa",
        action: "They trigger repeated MFA prompts to your phone, hoping you tap “approve”.",
        impact: "One tired “yes” hands over accounts that MFA was supposed to protect.",
        why: "Push-fatigue attacks beat tap-to-approve MFA. Phishing-resistant keys/passkeys don’t fall for it.",
      },
      {
        t: "+10 min",
        icon: "read",
        action: "They read your recent threads and find an unpaid invoice.",
        impact: "They reply from your real account and change the payee’s bank details — classic invoice fraud.",
        why: "A message from your genuine mailbox is trusted implicitly. Out-of-band verification stops this.",
      },
      {
        t: "+1 hr",
        icon: "exfil",
        action: "They download shared files and a customer contact list.",
        impact: "Contracts, personal data and customer PII leave the building — a reportable data breach.",
        why: "Your access became their access. Least-privilege and alerting limit what one account can reach.",
      },
      {
        t: "+3 hr",
        icon: "spread",
        action: "They send the same phishing email to your whole contact list — from you.",
        impact: "Colleagues, clients and friends get phished by someone they trust. The blast radius multiplies.",
        why: "This is how one click becomes a hundred. Reporting the original email early breaks the chain.",
      },
      {
        t: "+1 day",
        icon: "ransom",
        action: "With a foothold established, they deploy ransomware and post stolen data for sale.",
        impact: "Operations halt, customers are notified, regulators get involved, and the clean-up runs for months.",
        why: "Most breaches start with exactly this: a phished credential. Stopping step 0 stops all of it.",
      },
    ],
    impact: [
      { label: "Accounts at risk", value: "12+", note: "everything linked to this login" },
      { label: "Typical BEC loss", value: "$50k–$120k", note: "per incident (FBI IC3)" },
      { label: "Avg. breach cost", value: "$4.45M", note: "IBM, phishing-initiated higher" },
      { label: "Time to detect", value: "~200 days", note: "median (IBM)" },
    ],
    defenses: [
      "Don’t click links in unexpected emails — open the site from your own bookmark.",
      "Use a password manager: unique passwords, and it won’t autofill on a fake domain.",
      "Turn on phishing-resistant MFA (a passkey or hardware security key), not just SMS or tap-approve.",
      "Report the email the moment it looks off — early reporting stops it spreading.",
    ],
  },
  {
    id: "bank",
    name: "Online banking",
    context: "Your online banking login",
    fakeDomain: "secure-bankly-login.com",
    loginTitle: "Log in to your account",
    intro:
      "The “unusual transaction — cancel it” email felt urgent, so you clicked and logged in to “cancel”. Here’s what really happened.",
    steps: [
      {
        t: "0s",
        icon: "capture",
        action: "Your banking username and password are captured as you type — in real time.",
        impact: "The attacker relays them into the real bank instantly while your fake page “loads”.",
        why: "Real-time (adversary-in-the-middle) kits also grab the one-time code you enter next.",
      },
      {
        t: "+20s",
        icon: "mfa",
        action: "The fake page asks for the SMS code “to confirm” — and you enter it.",
        impact: "That code is relayed to the real bank, completing the attacker’s login.",
        why: "Never type a one-time code into a page you reached from an email link.",
      },
      {
        t: "+2 min",
        icon: "wire",
        action: "They add a new payee and move funds in small, plausible amounts.",
        impact: "Money leaves before any alert reaches you — often unrecoverable within hours.",
        why: "Banks call, they don’t email links. Go to the app you already have if something seems wrong.",
      },
      {
        t: "+10 min",
        icon: "reset",
        action: "They use your email (found in your profile) to reset linked accounts.",
        impact: "The damage spreads from finances to identity — loans and cards opened in your name.",
        why: "One breach rarely stays contained. Monitor with a breach-alert service.",
      },
      {
        t: "+1 day",
        icon: "exfil",
        action: "Your details are bundled and sold on a criminal marketplace.",
        impact: "Fraud attempts continue for months from buyers you’ll never see.",
        why: "Freeze credit and change reused passwords everywhere the moment you suspect it.",
      },
    ],
    impact: [
      { label: "Median cost of fraud", value: "$500+", note: "per victim (FTC reports)" },
      { label: "Recovery window", value: "hours", note: "before funds move on" },
      { label: "Identity misuse", value: "months", note: "after the initial theft" },
      { label: "Reused-password risk", value: "high", note: "one leak unlocks many" },
    ],
    defenses: [
      "Your bank will never email you a login link — always open the app or type the address yourself.",
      "Never enter a one-time code on a page you reached by clicking a link.",
      "Use unique passwords so a banking leak can’t unlock your email or shopping accounts.",
      "Set up transaction alerts and freeze your credit if you suspect exposure.",
    ],
  },
];

export const SOURCES = [
  { name: "FBI IC3 — Internet Crime Report (BEC losses)", url: "https://www.ic3.gov/AnnualReport/Reports" },
  { name: "IBM — Cost of a Data Breach Report", url: "https://www.ibm.com/reports/data-breach" },
  { name: "Verizon — Data Breach Investigations Report (DBIR)", url: "https://www.verizon.com/business/resources/reports/dbir/" },
  { name: "FTC — Consumer fraud data", url: "https://www.ftc.gov/news-events/data-visualizations/data-spotlight" },
];

export function scenarioById(id: string | null | undefined): AftermathScenario {
  return AFTERMATH_SCENARIOS.find((s) => s.id === id) ?? AFTERMATH_SCENARIOS[0];
}
