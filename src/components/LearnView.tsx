"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Search,
  FileSearch,
  Flag,
  KeyRound,
  BookOpen,
  ShieldCheck,
  Lightbulb,
} from "lucide-react";

/**
 * Learn / Resources — reinforces the game's lessons and points to REAL, reputable,
 * mostly-free tools for checking and reporting phishing. These are independent
 * third-party services, not affiliated with this training.
 */

type Tool = { name: string; url: string; what: string; free?: boolean };
type Section = { title: string; icon: React.ReactNode; blurb: string; tools: Tool[] };

const SECTIONS: Section[] = [
  {
    title: "Check a suspicious link or file",
    icon: <Search size={18} />,
    blurb: "Never click to “see where it goes”. Copy the link and scan it in a sandbox instead.",
    tools: [
      { name: "VirusTotal", url: "https://www.virustotal.com", what: "Scan a URL, file or hash against 70+ engines.", free: true },
      { name: "urlscan.io", url: "https://urlscan.io", what: "Sandboxes a URL and screenshots what it really loads.", free: true },
      { name: "Google Safe Browsing — Site Status", url: "https://transparencyreport.google.com/safe-browsing/search", what: "Check if Google flags a site as dangerous.", free: true },
      { name: "PhishTank", url: "https://phishtank.org", what: "Community database of known phishing URLs — look one up.", free: true },
      { name: "Cloudflare URL Scanner", url: "https://radar.cloudflare.com/scan", what: "Free URL sandbox + verdict from Cloudflare.", free: true },
    ],
  },
  {
    title: "Inspect email headers & authentication",
    icon: <FileSearch size={18} />,
    blurb: "The “Show original” lesson, for real mail: paste headers to see the true sender and SPF/DKIM/DMARC.",
    tools: [
      { name: "Google Admin Toolbox — Messageheader", url: "https://toolbox.googleapps.com/apps/messageheader/", what: "Paste raw headers → readable delivery path + auth results.", free: true },
      { name: "MXToolbox — Email Header Analyzer", url: "https://mxtoolbox.com/EmailHeaders.aspx", what: "Analyse headers, hops and authentication.", free: true },
      { name: "Learn and Test DMARC", url: "https://www.learndmarc.com", what: "Interactive walk-through of how SPF/DKIM/DMARC work.", free: true },
      { name: "MXToolbox — DMARC/SPF lookup", url: "https://mxtoolbox.com/dmarc.aspx", what: "Check a domain's published SPF/DKIM/DMARC records.", free: true },
    ],
  },
  {
    title: "Report phishing",
    icon: <Flag size={18} />,
    blurb: "Reporting protects everyone. Start with your own mail app's built-in “Report phishing” button, then:",
    tools: [
      { name: "APWG — reportphishing@apwg.org", url: "https://apwg.org/reportphishing/", what: "Forward phishing emails to the Anti-Phishing Working Group.", free: true },
      { name: "FTC — Report Fraud (US)", url: "https://reportfraud.ftc.gov", what: "Report scams to the US Federal Trade Commission.", free: true },
      { name: "NCSC — report@phishing.gov.uk (UK)", url: "https://www.ncsc.gov.uk/collection/phishing-scams/report-scam-website", what: "Forward suspicious emails to the UK NCSC.", free: true },
      { name: "Google — Report Phishing Page", url: "https://safebrowsing.google.com/safebrowsing/report_phish/", what: "Report a phishing website to Google Safe Browsing.", free: true },
    ],
  },
  {
    title: "Protect your accounts",
    icon: <KeyRound size={18} />,
    blurb: "Most phishing exists to steal logins. Make a stolen password useless.",
    tools: [
      { name: "Have I Been Pwned", url: "https://haveibeenpwned.com", what: "Check whether your email appears in known breaches.", free: true },
      { name: "Bitwarden (password manager)", url: "https://bitwarden.com", what: "Free, open-source password manager — unique passwords + it won't autofill on look-alike domains.", free: true },
      { name: "Cloudflare 1.1.1.1 for Families", url: "https://one.one.one.one/family/", what: "Free protective DNS that blocks known-malicious domains.", free: true },
      { name: "Quad9", url: "https://quad9.net", what: "Free security-focused DNS that blocks malicious lookups.", free: true },
    ],
  },
  {
    title: "Learn more (official guidance)",
    icon: <BookOpen size={18} />,
    blurb: "Trusted, vendor-neutral advice from security authorities.",
    tools: [
      { name: "CISA — Recognize & Report Phishing", url: "https://www.cisa.gov/secure-our-world/recognize-and-report-phishing", what: "US cybersecurity agency guidance.", free: true },
      { name: "UK NCSC — Phishing guidance", url: "https://www.ncsc.gov.uk/collection/phishing-scams", what: "Practical advice for individuals and organisations.", free: true },
      { name: "FTC — How to recognise phishing", url: "https://consumer.ftc.gov/articles/how-recognize-and-avoid-phishing-scams", what: "Plain-language consumer guidance.", free: true },
      { name: "Google / Jigsaw Phishing Quiz", url: "https://phishingquiz.withgoogle.com", what: "Another quick quiz to test your eye.", free: true },
    ],
  },
];

const CHECKLIST = [
  "Check the real sender address, not just the display name.",
  "Hover a link to see the true domain — read it right-to-left from the last “.com”.",
  "Watch for urgency, threats, or unusual requests (payments, gift cards, credentials).",
  "Open “Show original” and look for SPF / DKIM / DMARC failures.",
  "Beware attachments — double extensions (.pdf.htm), macro docs (.docm).",
  "When unsure, navigate to the site yourself from a bookmark — never the email's link.",
];

export function LearnView() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:py-10">
      <div className="mb-5 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={16} /> Inbox
        </Link>
        <h1 className="inline-flex items-center gap-2 text-lg font-semibold text-ink">
          <ShieldCheck size={18} className="text-accent" /> Learn &amp; tools
        </h1>
        <span />
      </div>

      {/* Spot-the-phish checklist */}
      <section className="mb-6 rounded-2xl border border-accent/30 bg-accent-soft p-5">
        <h2 className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-ink">
          <Lightbulb size={16} className="text-accent" /> The 6-point phish check
        </h2>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CHECKLIST.map((c, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-ink">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-[color:var(--accent-ink)]">
                {i + 1}
              </span>
              {c}
            </li>
          ))}
        </ul>
      </section>

      <div className="mb-4 rounded-xl border border-border bg-surface-2 p-3 text-xs text-ink-muted">
        The tools below are independent third-party services, listed for convenience and{" "}
        <strong>not affiliated with or endorsed by</strong> this training. Don&apos;t paste
        confidential company data into public scanners — follow your organisation&apos;s policy.
      </div>

      <div className="flex flex-col gap-5">
        {SECTIONS.map((s) => (
          <section key={s.title} className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
              <span className="text-accent">{s.icon}</span> {s.title}
            </h2>
            <p className="mb-3 mt-1 text-xs text-ink-muted">{s.blurb}</p>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {s.tools.map((t) => (
                <li key={t.name}>
                  <a
                    href={t.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex h-full flex-col rounded-client border border-border bg-surface-2 p-3 transition hover:border-accent"
                  >
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                      {t.name}
                      <ExternalLink size={12} className="text-ink-faint transition group-hover:text-accent" />
                      {t.free && <span className="ml-auto rounded-full bg-success-soft px-1.5 py-0.5 text-[10px] font-medium text-success">free</span>}
                    </span>
                    <span className="mt-0.5 text-xs text-ink-muted">{t.what}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-6 text-[11px] leading-snug text-ink-faint">
        Admins: you can turn real research-corpus emails into safe training scenarios from the Admin
        → Custom content → “Import real email” tool (it defangs links, blocks remote images, and
        redacts personal data before you review). See the README for suitable free datasets and
        their licences.
      </p>
    </div>
  );
}
