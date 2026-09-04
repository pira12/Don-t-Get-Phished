import type { GameEmail } from "@/game/types";

/**
 * ============================================================================
 * Seed email dataset — Don't Get Phished
 * ============================================================================
 *
 * All emails are FICTIONAL and written for security-awareness training only.
 * Company / vendor names are invented ("Northwind" is the player's employer;
 * "Brightpay", "Cloudvault", "Ledgerly", etc. are fictional vendors). No real
 * brands, logos, or wordmarks are used.
 *
 * In production this content lives in the database (server-authored, versioned,
 * scoped by orgId so admins can add their own scenarios). This file is the
 * built-in "global" seed set (orgId = null).
 *
 * ---------------------------------------------------------------------------
 * FULLY WORKED EXAMPLE (template for the rest)
 * ---------------------------------------------------------------------------
 * The first record below is annotated to show how each field maps to a forensic
 * surface in the UI:
 *   - `from.address` vs `from.name`  -> Sender detail popover / "?" avatar
 *   - `replyTo`                      -> Sender detail table + header panel
 *   - `links[].href` vs `.text`      -> Hover status bar + link inspector
 *   - `auth` (spf/dkim/dmarc)        -> "Show original" header panel
 *   - `redFlags[].anchor`            -> Clickable evidence chips (scroll+flash)
 *   - `legitSignals`                 -> Reassuring signals for legit mail
 */

export const EMAILS: GameEmail[] = [
  // ==========================================================================
  // 1) WORKED EXAMPLE — EASY PHISHING (lookalike domain + urgency + cred link)
  // ==========================================================================
  {
    id: "e01",
    orgId: null,
    version: 1,
    truth: "phishing",
    difficulty: "easy",
    from: { name: "Microsoft Account Team", address: "no-reply@micros0ft-support.net" },
    replyTo: "recovery@micros0ft-support.net",
    to: "you@northwind.example",
    subject: "Unusual sign-in activity — verify within 24 hours",
    timestamp: "2026-09-02T08:14:00Z",
    snippet:
      "We detected an unusual sign-in to your account. Verify your identity now or your account will be locked.",
    bodyHtml: `
      <p>Dear User,</p>
      <p>We detected an <strong>unusual sign-in</strong> to your account from a new device in another country.
      For your protection, access will be <strong>locked within 24 hours</strong> unless you verify your identity.</p>
      <p><a class="btn" href="https://micros0ft-support.net/verify?id=8842">Verify my account</a></p>
      <p>If you do not recognise this activity, confirm immediately to avoid permanent suspension.</p>
      <p class="muted">Microsoft Account Team</p>
    `,
    links: [
      // Visible text implies the real portal; href is a lookalike (zero for "o").
      { text: "Verify my account", href: "https://micros0ft-support.net/verify?id=8842" },
    ],
    auth: { spf: "fail", dkim: "fail", dmarc: "fail" },
    firstTimeSender: true,
    mailedBy: "micros0ft-support.net",
    signedBy: "—",
    redFlags: [
      {
        type: "lookalike_domain",
        anchor: "micros0ft-support.net",
        explanation:
          "The domain uses a zero in place of the 'o' (micros0ft) and a lookalike suffix. The real vendor would never mail from this domain.",
      },
      {
        type: "urgency",
        anchor: "locked within 24 hours",
        explanation:
          "A countdown that threatens account loss is classic pressure designed to stop you checking the details.",
      },
      {
        type: "credential_harvest_link",
        anchor: "Verify my account",
        explanation:
          "The button points to the lookalike domain, not the official sign-in page — it exists to capture your password.",
      },
      {
        type: "auth_fail",
        anchor: "SPF: FAIL",
        explanation: "SPF, DKIM and DMARC all fail — the sender is not authorised for this domain.",
      },
      {
        type: "generic_greeting",
        anchor: "Dear User",
        explanation: "A real security alert addresses you by name and references your actual account.",
      },
    ],
    techniqueTags: ["lookalike_domain", "urgency", "credential_harvest_link", "auth_fail", "generic_greeting"],
  },

  // ==========================================================================
  // EASY
  // ==========================================================================
  {
    id: "e02",
    truth: "legit",
    difficulty: "easy",
    from: { name: "Northwind IT", address: "it-notices@northwind.example" },
    to: "you@northwind.example",
    subject: "Scheduled maintenance this Saturday, 10pm–1am",
    timestamp: "2026-09-01T15:02:00Z",
    snippet: "The VPN and internal wiki will be briefly unavailable during a planned upgrade this weekend.",
    bodyHtml: `
      <p>Hi there,</p>
      <p>Our infrastructure team will perform scheduled maintenance this <strong>Saturday between 10:00pm and 1:00am</strong>.
      During this window the VPN and the internal wiki may be briefly unavailable.</p>
      <p>No action is needed on your part. If you have questions, reply to this message or open a ticket in the Help Center.</p>
      <p class="muted">— Northwind IT Operations</p>
    `,
    links: [],
    auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
    firstTimeSender: false,
    mailedBy: "northwind.example",
    signedBy: "northwind.example",
    redFlags: [],
    legitSignals: [
      "Sender domain matches your company (northwind.example).",
      "SPF, DKIM and DMARC all pass.",
      "No links, no attachments, and no request for credentials or action.",
      "Informational tone with no artificial urgency.",
    ],
    techniqueTags: [],
  },
  {
    id: "e03",
    truth: "phishing",
    difficulty: "easy",
    from: { name: "IT Security Team", address: "helpdesk.support2291@gmail.com" },
    to: "you@northwind.example",
    subject: "ACTION REQUIRED: Password reset for all staff",
    timestamp: "2026-09-02T07:41:00Z",
    snippet: "All employees must reset their password today using the secure portal below.",
    bodyHtml: `
      <p>Attention All Staff,</p>
      <p>Due to a security incident, <strong>all employees must reset their password today</strong>.
      Use the secure portal to update your credentials before end of day.</p>
      <p><a class="btn" href="http://northwind-it.net/reset">Reset password now</a></p>
      <p>Failure to comply will result in account deactivation.</p>
      <p class="muted">IT Security Team</p>
    `,
    links: [{ text: "Reset password now", href: "http://northwind-it.net/reset" }],
    auth: { spf: "pass", dkim: "fail", dmarc: "fail" },
    firstTimeSender: true,
    mailedBy: "gmail.com",
    signedBy: "gmail.com",
    redFlags: [
      {
        type: "display_name_spoof",
        anchor: "helpdesk.support2291@gmail.com",
        explanation:
          "The display name says 'IT Security Team' but the address is a random personal Gmail account — your IT team mails from the company domain.",
      },
      {
        type: "lookalike_domain",
        anchor: "northwind-it.net",
        explanation:
          "A hyphenated lookalike ('northwind-it.net') that is not your real company domain (northwind.example).",
      },
      {
        type: "urgency",
        anchor: "before end of day",
        explanation: "A same-day deadline plus a deactivation threat is manufactured pressure.",
      },
    ],
    techniqueTags: ["display_name_spoof", "lookalike_domain", "urgency", "credential_harvest_link"],
  },
  {
    id: "e04",
    truth: "legit",
    difficulty: "easy",
    from: { name: "Brightpay Payroll", address: "no-reply@brightpay.com" },
    to: "you@northwind.example",
    subject: "Your August payslip is ready",
    timestamp: "2026-08-31T09:00:00Z",
    snippet: "Your latest payslip is available to view in the Brightpay portal. Log in from your bookmark as usual.",
    bodyHtml: `
      <p>Hello,</p>
      <p>Your <strong>August payslip</strong> is now available in the Brightpay employee portal.</p>
      <p>For your security we don't link directly to documents in email — please open Brightpay from your saved bookmark and sign in as usual.</p>
      <p class="muted">Brightpay — payroll for Northwind</p>
    `,
    links: [],
    auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
    firstTimeSender: false,
    mailedBy: "brightpay.com",
    signedBy: "brightpay.com",
    redFlags: [],
    legitSignals: [
      "All three authentication checks (SPF/DKIM/DMARC) pass.",
      "Known vendor domain you've received payslips from before.",
      "Deliberately does NOT link to the document — tells you to use your own bookmark.",
      "No urgency and no credential request.",
    ],
    techniqueTags: [],
  },
  {
    id: "e05",
    truth: "phishing",
    difficulty: "easy",
    from: { name: "Parcelly Delivery", address: "tracking@parcelly-delivery-alert.com" },
    to: "you@northwind.example",
    subject: "Your package is on hold — pay $2.99 customs fee",
    timestamp: "2026-09-01T18:22:00Z",
    snippet: "We could not deliver your parcel. Pay the outstanding customs fee to release it.",
    bodyHtml: `
      <p>Dear Customer,</p>
      <p>Your parcel is currently <strong>on hold</strong> at our depot. A small customs fee of <strong>$2.99</strong> is required to release it for delivery.</p>
      <p><a class="btn" href="https://parcelly-delivery-alert.com/pay">Pay fee &amp; release parcel</a></p>
      <p>Unclaimed parcels are returned after 48 hours.</p>
    `,
    links: [{ text: "Pay fee & release parcel", href: "https://parcelly-delivery-alert.com/pay" }],
    auth: { spf: "softfail", dkim: "fail", dmarc: "fail" },
    firstTimeSender: true,
    mailedBy: "parcelly-delivery-alert.com",
    signedBy: "—",
    redFlags: [
      {
        type: "unexpected_request",
        anchor: "customs fee",
        explanation:
          "A tiny 'fee' to release a package you weren't expecting is a common lure to capture card details.",
      },
      {
        type: "lookalike_domain",
        anchor: "parcelly-delivery-alert.com",
        explanation: "A throwaway lookalike domain, not the courier's real site.",
      },
      {
        type: "generic_greeting",
        anchor: "Dear Customer",
        explanation: "No name, no tracking number tied to you — a blast sent to many recipients.",
      },
    ],
    techniqueTags: ["unexpected_request", "lookalike_domain", "generic_greeting", "credential_harvest_link"],
  },
  {
    id: "e06",
    truth: "legit",
    difficulty: "easy",
    from: { name: "Trellink", address: "notifications@trellink.com" },
    to: "you@northwind.example",
    subject: "Priya assigned you a card: “Draft Q4 rollout plan”",
    timestamp: "2026-09-02T11:12:00Z",
    snippet: "You were assigned a card on the Marketing board. Open Trellink to see the details.",
    bodyHtml: `
      <p>Hi,</p>
      <p><strong>Priya Nair</strong> assigned you a card on the <em>Marketing</em> board:</p>
      <blockquote>Draft Q4 rollout plan — due next Friday</blockquote>
      <p><a class="btn" href="https://app.trellink.com/c/9f2a">Open card in Trellink</a></p>
      <p class="muted">You're receiving this because you're a member of the Marketing board. Manage notifications in settings.</p>
    `,
    links: [{ text: "Open card in Trellink", href: "https://app.trellink.com/c/9f2a" }],
    auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
    firstTimeSender: false,
    mailedBy: "trellink.com",
    signedBy: "trellink.com",
    redFlags: [],
    legitSignals: [
      "The link's real destination (app.trellink.com) matches the sender's domain.",
      "SPF/DKIM/DMARC all pass.",
      "References a real coworker, board, and a plausible task you'd expect.",
      "Standard notification footer explaining why you received it.",
    ],
    techniqueTags: [],
  },
  {
    id: "e07",
    truth: "phishing",
    difficulty: "easy",
    from: { name: "HR Department", address: "hr@northvvind.example" },
    to: "you@northwind.example",
    subject: "Updated employee handbook — acknowledge receipt",
    timestamp: "2026-09-01T13:30:00Z",
    snippet: "Please review the attached handbook and sign in to acknowledge you have read it.",
    bodyHtml: `
      <p>Dear Employee,</p>
      <p>Please review the updated employee handbook and confirm receipt by signing in below.</p>
      <p><a class="btn" href="https://northvvind-portal.example/ack">Acknowledge receipt</a></p>
      <p class="muted">Human Resources</p>
    `,
    links: [{ text: "Acknowledge receipt", href: "https://northvvind-portal.example/ack" }],
    auth: { spf: "fail", dkim: "fail", dmarc: "fail" },
    firstTimeSender: true,
    mailedBy: "northvvind.example",
    signedBy: "—",
    redFlags: [
      {
        type: "lookalike_domain",
        anchor: "northvvind.example",
        explanation:
          "Two 'v' characters (vv) impersonate the 'w' in northwind — a homoglyph swap that's easy to miss at a glance.",
      },
      {
        type: "auth_fail",
        anchor: "DMARC: FAIL",
        explanation: "Authentication fails, confirming this isn't really from your company.",
      },
      {
        type: "generic_greeting",
        anchor: "Dear Employee",
        explanation: "Internal HR mail addresses you by name.",
      },
    ],
    techniqueTags: ["lookalike_domain", "auth_fail", "generic_greeting", "credential_harvest_link"],
  },
  {
    id: "e08",
    truth: "legit",
    difficulty: "easy",
    from: { name: "Cloudvault Security", address: "security@cloudvault.com" },
    to: "you@northwind.example",
    subject: "New sign-in to your Cloudvault account",
    timestamp: "2026-08-30T20:05:00Z",
    snippet: "We noticed a new sign-in from Chrome on Windows. If this was you, no action is needed.",
    bodyHtml: `
      <p>Hi,</p>
      <p>Your Cloudvault account was just accessed from a new session:</p>
      <ul>
        <li>Chrome on Windows</li>
        <li>Amsterdam, NL · today at 20:03</li>
      </ul>
      <p>If this was you, you can safely ignore this email. If it wasn't, open Cloudvault from your bookmark and review your active sessions.</p>
      <p class="muted">Cloudvault Security</p>
    `,
    links: [],
    auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
    firstTimeSender: false,
    mailedBy: "cloudvault.com",
    signedBy: "cloudvault.com",
    redFlags: [],
    legitSignals: [
      "Authentication passes and the domain matches the real vendor.",
      "Gives you specific context (device, location, time) rather than a vague threat.",
      "Says 'no action needed if this was you' — no pressure, no login link.",
    ],
    techniqueTags: [],
  },
  {
    id: "e09",
    truth: "phishing",
    difficulty: "easy",
    from: { name: "Payroll", address: "payroll-update@brightpay-secure.com" },
    to: "you@northwind.example",
    subject: "Confirm your bank details to receive September salary",
    timestamp: "2026-09-02T06:58:00Z",
    snippet: "Our records are incomplete. Confirm your bank account to avoid a delay in your salary.",
    bodyHtml: `
      <p>Hello,</p>
      <p>Our payroll records are incomplete. To avoid a delay to your <strong>September salary</strong>,
      please confirm your bank account details using the secure form.</p>
      <p><a class="btn" href="https://brightpay-secure.com/bank">Confirm bank details</a></p>
    `,
    links: [{ text: "Confirm bank details", href: "https://brightpay-secure.com/bank" }],
    auth: { spf: "fail", dkim: "fail", dmarc: "fail" },
    firstTimeSender: true,
    mailedBy: "brightpay-secure.com",
    signedBy: "—",
    redFlags: [
      {
        type: "unexpected_request",
        anchor: "confirm your bank account details",
        explanation:
          "Payroll changes to bank details are a top target — legitimate payroll never collects them via an emailed form.",
      },
      {
        type: "lookalike_domain",
        anchor: "brightpay-secure.com",
        explanation: "A hyphenated 'secure' lookalike of the real Brightpay domain (brightpay.com).",
      },
      {
        type: "urgency",
        anchor: "avoid a delay",
        explanation: "Threatening your salary is designed to make you act before thinking.",
      },
    ],
    techniqueTags: ["unexpected_request", "lookalike_domain", "urgency", "auth_fail"],
  },
  {
    id: "e10",
    truth: "legit",
    difficulty: "easy",
    from: { name: "Northwind Facilities", address: "facilities@northwind.example" },
    to: "you@northwind.example",
    subject: "Reminder: office closed for the public holiday Monday",
    timestamp: "2026-08-29T10:00:00Z",
    snippet: "A quick reminder that the office will be closed on Monday. Badge access is unaffected.",
    bodyHtml: `
      <p>Hi everyone,</p>
      <p>A reminder that the office will be <strong>closed on Monday</strong> for the public holiday. Normal hours resume Tuesday.</p>
      <p>Badge access remains active if you need to collect anything. Have a great long weekend!</p>
      <p class="muted">— Facilities, Northwind</p>
    `,
    links: [],
    auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
    firstTimeSender: false,
    mailedBy: "northwind.example",
    signedBy: "northwind.example",
    redFlags: [],
    legitSignals: [
      "From your own company domain with full authentication.",
      "Purely informational — nothing to click, download, or confirm.",
      "Friendly, routine tone consistent with internal announcements.",
    ],
    techniqueTags: [],
  },
  {
    id: "e11",
    truth: "phishing",
    difficulty: "easy",
    from: { name: "Streambox", address: "billing@streamb0x.tv" },
    to: "you@northwind.example",
    subject: "Your subscription has been suspended",
    timestamp: "2026-08-28T22:41:00Z",
    snippet: "Your payment was declined. Update your payment method within 24h to keep your subscription.",
    bodyHtml: `
      <p>Hi,</p>
      <p>We couldn't process your latest payment and your subscription has been <strong>suspended</strong>.
      Update your payment method within 24 hours to avoid cancellation.</p>
      <p><a class="btn" href="https://streamb0x.tv/billing/update">Update payment method</a></p>
    `,
    links: [{ text: "Update payment method", href: "https://streamb0x.tv/billing/update" }],
    auth: { spf: "fail", dkim: "fail", dmarc: "fail" },
    firstTimeSender: true,
    mailedBy: "streamb0x.tv",
    signedBy: "—",
    redFlags: [
      {
        type: "lookalike_domain",
        anchor: "streamb0x.tv",
        explanation: "A zero replaces the 'o' in 'streambox' — a homoglyph swap in the domain.",
      },
      {
        type: "credential_harvest_link",
        anchor: "Update payment method",
        explanation: "The link goes to the lookalike domain to capture your card details.",
      },
      {
        type: "urgency",
        anchor: "within 24 hours",
        explanation: "A short countdown to cancellation pressures you into acting fast.",
      },
    ],
    techniqueTags: ["lookalike_domain", "credential_harvest_link", "urgency", "auth_fail"],
  },

  // ==========================================================================
  // MEDIUM
  // ==========================================================================
  {
    id: "e12",
    truth: "phishing",
    difficulty: "medium",
    from: { name: "David Okafor", address: "david.okafor@northwind.example" },
    replyTo: "d.okafor.finance@gmail.com",
    to: "you@northwind.example",
    subject: "Quick favour — are you at your desk?",
    timestamp: "2026-09-02T09:26:00Z",
    snippet: "I'm going into back-to-back meetings. Need you to handle a quick vendor payment for me.",
    bodyHtml: `
      <p>Hi,</p>
      <p>I'm heading into back-to-back meetings and can't get to a call. I need you to handle a quick vendor payment before 2pm — it's time sensitive.</p>
      <p>Reply to let me know you're free and I'll send the account details.</p>
      <p>Thanks,<br/>David<br/><span class="muted">Sent from my iPhone</span></p>
    `,
    links: [],
    auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
    firstTimeSender: false,
    mailedBy: "northwind.example",
    signedBy: "northwind.example",
    redFlags: [
      {
        type: "reply_to_mismatch",
        anchor: "d.okafor.finance@gmail.com",
        explanation:
          "The From address looks internal, but Reply-To silently redirects your response to a personal Gmail — the attacker's real inbox.",
      },
      {
        type: "unexpected_request",
        anchor: "handle a quick vendor payment",
        explanation:
          "An out-of-band payment request with 'I can't talk right now' is the signature of Business Email Compromise (CEO/finance fraud).",
      },
      {
        type: "urgency",
        anchor: "before 2pm — it's time sensitive",
        explanation: "Time pressure plus unavailability discourages you from verifying by phone.",
      },
    ],
    techniqueTags: ["reply_to_mismatch", "unexpected_request", "urgency"],
  },
  {
    id: "e13",
    truth: "legit",
    difficulty: "medium",
    from: { name: "Ledgerly Invoices", address: "invoices@ledgerly.com" },
    to: "you@northwind.example",
    subject: "Invoice #INV-20418 from Ledgerly is available",
    timestamp: "2026-09-01T16:44:00Z",
    snippet: "Your monthly invoice is ready. View it in your Ledgerly account.",
    bodyHtml: `
      <p>Hello Northwind,</p>
      <p>Your monthly invoice <strong>#INV-20418</strong> for €480.00 is now available.</p>
      <p><a class="btn" href="https://app.ledgerly.com/invoices/20418">View invoice</a></p>
      <p>Payment is due in 30 days. Questions? Reply to this email and our billing team will help.</p>
      <p class="muted">Ledgerly · billing@ledgerly.com</p>
    `,
    links: [{ text: "View invoice", href: "https://app.ledgerly.com/invoices/20418" }],
    auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
    firstTimeSender: false,
    mailedBy: "ledgerly.com",
    signedBy: "ledgerly.com",
    redFlags: [],
    legitSignals: [
      "The 'View invoice' link resolves to app.ledgerly.com — the same domain as the sender.",
      "SPF/DKIM/DMARC all pass and the domain is a known vendor.",
      "Specific invoice number and amount; reasonable 30-day terms, no urgency.",
    ],
    techniqueTags: [],
  },
  {
    id: "e14",
    truth: "phishing",
    difficulty: "medium",
    from: { name: "Nimbus Cloud Storage", address: "no-reply@nimbus.com" },
    replyTo: "no-reply@nimbus.com",
    to: "you@northwind.example",
    subject: "A document was shared with you: “Q3 Budget Final.xlsx”",
    timestamp: "2026-09-02T10:10:00Z",
    snippet: "Someone shared a file with you. Sign in to view the document.",
    bodyHtml: `
      <p>Hi,</p>
      <p>A document has been shared with you on Nimbus:</p>
      <p><strong>Q3 Budget Final.xlsx</strong></p>
      <p><a class="btn" href="https://nimbus-docs-view.com/open?f=q3budget">Open in Nimbus</a></p>
      <p class="muted">You received this because a file was shared with your email address.</p>
    `,
    links: [{ text: "Open in Nimbus", href: "https://nimbus-docs-view.com/open?f=q3budget" }],
    auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
    firstTimeSender: false,
    mailedBy: "nimbus.com",
    signedBy: "nimbus.com",
    redFlags: [
      {
        type: "credential_harvest_link",
        anchor: "nimbus-docs-view.com",
        explanation:
          "The email domain looks right (nimbus.com) but the button goes to a completely different domain — a fake sign-in page. Authentication passing does NOT mean the links are safe.",
      },
      {
        type: "unexpected_request",
        anchor: "Q3 Budget Final.xlsx",
        explanation:
          "A finance document 'shared' by no-one in particular is a lure. The mismatch between sender domain and link domain is the giveaway.",
      },
    ],
    techniqueTags: ["credential_harvest_link", "unexpected_request"],
  },
  {
    id: "e15",
    truth: "legit",
    difficulty: "medium",
    from: { name: "Vaultwise", address: "no-reply@vaultwise.com" },
    to: "you@northwind.example",
    subject: "Your password was changed",
    timestamp: "2026-08-27T14:12:00Z",
    snippet: "This is a confirmation that your Vaultwise master password was changed. If this wasn't you, act now.",
    bodyHtml: `
      <p>Hello,</p>
      <p>This is a confirmation that your Vaultwise password was changed on <strong>27 August at 14:10</strong>.</p>
      <p>If you made this change, no action is needed. If you did <strong>not</strong>, open Vaultwise from your bookmark and secure your account, or contact support at support@vaultwise.com.</p>
      <p class="muted">Vaultwise Account Notifications</p>
    `,
    links: [],
    auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
    firstTimeSender: false,
    mailedBy: "vaultwise.com",
    signedBy: "vaultwise.com",
    redFlags: [],
    legitSignals: [
      "A post-hoc confirmation of an action you took — not a demand to click.",
      "Authentication passes; domain matches the real vendor.",
      "Directs you to your own bookmark and a real support address rather than a login link.",
    ],
    techniqueTags: [],
  },
  {
    id: "e16",
    truth: "phishing",
    difficulty: "medium",
    from: { name: "DocuSign", address: "dse@docus1gn-mail.com" },
    to: "you@northwind.example",
    subject: "Completed: Vendor NDA requires your signature",
    timestamp: "2026-09-01T11:55:00Z",
    snippet: "A document is waiting for your signature. Review and sign to complete the agreement.",
    bodyHtml: `
      <p>Hello,</p>
      <p>You have a document waiting for signature: <strong>Vendor NDA 2026</strong>.</p>
      <p><a class="btn" href="https://docus1gn-mail.com/sign/aa19">Review &amp; sign</a></p>
      <p class="muted">This notice was sent via the DocuSign electronic signing service.</p>
    `,
    links: [{ text: "Review & sign", href: "https://docus1gn-mail.com/sign/aa19" }],
    auth: { spf: "softfail", dkim: "fail", dmarc: "fail" },
    firstTimeSender: true,
    mailedBy: "docus1gn-mail.com",
    signedBy: "—",
    redFlags: [
      {
        type: "lookalike_domain",
        anchor: "docus1gn-mail.com",
        explanation: "The number 1 replaces the 'i' in the brand, on an unofficial '-mail' domain.",
      },
      {
        type: "auth_fail",
        anchor: "SPF: SOFTFAIL",
        explanation: "SPF softfails and DKIM/DMARC fail — the sending server isn't authorised.",
      },
      {
        type: "credential_harvest_link",
        anchor: "Review & sign",
        explanation: "E-signature lures are popular because people expect to click to sign; the link harvests logins.",
      },
    ],
    techniqueTags: ["lookalike_domain", "auth_fail", "credential_harvest_link"],
  },
  {
    id: "e17",
    truth: "legit",
    difficulty: "medium",
    from: { name: "Northwind Benefits", address: "benefits@northwind.example" },
    to: "you@northwind.example",
    subject: "Open enrolment starts next week — what to expect",
    timestamp: "2026-08-26T09:30:00Z",
    snippet: "Annual benefits enrolment opens Monday. Here's a summary of what's changing and where to review options.",
    bodyHtml: `
      <p>Hi,</p>
      <p>Annual <strong>open enrolment</strong> begins Monday and runs for two weeks. You'll review your options in the benefits portal — we'll send the direct link from this same address on Monday.</p>
      <p>Nothing to do today. This note is just a heads-up so you can plan time to review your choices.</p>
      <p class="muted">— People Team, Northwind</p>
    `,
    links: [],
    auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
    firstTimeSender: false,
    mailedBy: "northwind.example",
    signedBy: "northwind.example",
    redFlags: [],
    legitSignals: [
      "Internal domain with passing authentication.",
      "A heads-up with no link and no action required today.",
      "Sets expectations ('we'll send the link Monday from this address') — a trust-building pattern.",
    ],
    techniqueTags: [],
  },
  {
    id: "e18",
    truth: "phishing",
    difficulty: "medium",
    from: { name: "IT Helpdesk", address: "helpdesk@northwind.example" },
    replyTo: "helpdesk@northwind.example",
    to: "you@northwind.example",
    subject: "Your mailbox is almost full (98%)",
    timestamp: "2026-09-02T08:03:00Z",
    snippet: "Your mailbox is 98% full. Increase your quota to keep receiving email.",
    bodyHtml: `
      <p>Dear User,</p>
      <p>Your mailbox has reached <strong>98% of its storage quota</strong>. Once full, you will stop receiving new messages.</p>
      <p>Click below to verify your account and receive a free quota upgrade.</p>
      <p><a class="btn" href="https://northwind.example.mailquota-upgrade.com/login">Increase my quota</a></p>
      <p class="muted">IT Helpdesk</p>
    `,
    links: [{ text: "Increase my quota", href: "https://northwind.example.mailquota-upgrade.com/login" }],
    auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
    firstTimeSender: false,
    mailedBy: "northwind.example",
    signedBy: "northwind.example",
    redFlags: [
      {
        type: "lookalike_domain",
        anchor: "northwind.example.mailquota-upgrade.com",
        explanation:
          "Your company name appears only as a SUBDOMAIN. The real domain is 'mailquota-upgrade.com' — read domains right-to-left to spot this trick, even when the email itself authenticates.",
      },
      {
        type: "credential_harvest_link",
        anchor: "Increase my quota",
        explanation: "The '/login' page on the attacker's domain exists to steal your mailbox password.",
      },
      {
        type: "generic_greeting",
        anchor: "Dear User",
        explanation: "Your real helpdesk knows your name.",
      },
    ],
    techniqueTags: ["lookalike_domain", "credential_harvest_link", "generic_greeting"],
  },
  {
    id: "e19",
    truth: "legit",
    difficulty: "medium",
    from: { name: "Bankly", address: "alerts@bankly.com" },
    to: "you@northwind.example",
    subject: "You spent £42.10 at Corner Coffee",
    timestamp: "2026-09-02T08:47:00Z",
    snippet: "A transaction of £42.10 was made on your card ending 4417. Not you? Freeze your card in the app.",
    bodyHtml: `
      <p>Hi,</p>
      <p>A transaction was made on your card ending <strong>4417</strong>:</p>
      <ul>
        <li>£42.10 · Corner Coffee · today 08:45</li>
      </ul>
      <p>If this was you, no action is needed. If not, freeze your card from the Bankly app on your phone.</p>
      <p class="muted">Bankly transaction alerts</p>
    `,
    links: [],
    auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
    firstTimeSender: false,
    mailedBy: "bankly.com",
    signedBy: "bankly.com",
    redFlags: [],
    legitSignals: [
      "Real transaction alert: specific amount, merchant, and last four digits.",
      "Directs you to the app you already have, not a link to log in.",
      "Passes authentication from the bank's real domain.",
    ],
    techniqueTags: [],
  },
  {
    id: "e20",
    truth: "phishing",
    difficulty: "medium",
    from: { name: "Zoom", address: "no-reply@zoom-meeting-invite.com" },
    to: "you@northwind.example",
    subject: "You have a missed voicemail (0:38)",
    timestamp: "2026-08-31T17:19:00Z",
    snippet: "A new voicemail was left for your account. Sign in to listen to the message.",
    bodyHtml: `
      <p>Hello,</p>
      <p>You have a new <strong>voicemail (0:38)</strong> waiting on your account.</p>
      <p><a class="btn" href="https://zoom-meeting-invite.com/vm/listen">Listen to voicemail</a></p>
      <p class="muted">This is an automated notification.</p>
    `,
    links: [{ text: "Listen to voicemail", href: "https://zoom-meeting-invite.com/vm/listen" }],
    auth: { spf: "fail", dkim: "fail", dmarc: "fail" },
    firstTimeSender: true,
    mailedBy: "zoom-meeting-invite.com",
    signedBy: "—",
    redFlags: [
      {
        type: "lookalike_domain",
        anchor: "zoom-meeting-invite.com",
        explanation: "An unofficial domain riding on a well-known brand name.",
      },
      {
        type: "credential_harvest_link",
        anchor: "Listen to voicemail",
        explanation: "Voicemail/fax notification lures push you to a fake login to 'listen'.",
      },
      {
        type: "auth_fail",
        anchor: "DKIM: FAIL",
        explanation: "All authentication checks fail.",
      },
    ],
    techniqueTags: ["lookalike_domain", "credential_harvest_link", "auth_fail"],
  },
  {
    id: "e21",
    truth: "phishing",
    difficulty: "medium",
    from: { name: "Accounts Payable", address: "ap@northwind-finance.com" },
    to: "you@northwind.example",
    subject: "Updated banking details for supplier payment",
    timestamp: "2026-09-01T12:34:00Z",
    snippet: "Please note our banking details have changed. Use the new account for all future payments.",
    bodyHtml: `
      <p>Hello,</p>
      <p>Please be advised that our banking details have <strong>changed</strong>. For all future payments, use the account in the attached remittance form.</p>
      <p>Kindly update your records and confirm once done.</p>
      <p class="muted">Accounts Payable</p>
    `,
    links: [],
    attachments: [
      { name: "Updated-Bank-Details.pdf", sizeKB: 88, suspicious: true, reason: "Requests a bank-account change — verify by phone using a known number." },
    ],
    auth: { spf: "fail", dkim: "fail", dmarc: "fail" },
    firstTimeSender: true,
    mailedBy: "northwind-finance.com",
    signedBy: "—",
    redFlags: [
      {
        type: "lookalike_domain",
        anchor: "northwind-finance.com",
        explanation: "A hyphenated cousin domain, not your real company domain (northwind.example).",
      },
      {
        type: "unexpected_request",
        anchor: "banking details have changed",
        explanation:
          "A supplier 'change of bank details' is invoice-redirection fraud. Always verify via a phone number you already have — never one in the email.",
      },
      {
        type: "auth_fail",
        anchor: "SPF: FAIL",
        explanation: "Authentication fails across the board.",
      },
    ],
    techniqueTags: ["lookalike_domain", "unexpected_request", "auth_fail", "attachment_lure"],
  },
  {
    id: "e22",
    truth: "legit",
    difficulty: "medium",
    from: { name: "ShopNest Orders", address: "orders@shopnest.com" },
    to: "you@northwind.example",
    subject: "Your order #NST-77120 has shipped",
    timestamp: "2026-08-30T13:05:00Z",
    snippet: "Good news — your order is on the way. Track it any time from your account.",
    bodyHtml: `
      <p>Hi,</p>
      <p>Your order <strong>#NST-77120</strong> has shipped and should arrive in 2–3 days.</p>
      <p><a class="btn" href="https://www.shopnest.com/orders/NST-77120">Track your order</a></p>
      <p class="muted">Thanks for shopping with ShopNest.</p>
    `,
    links: [{ text: "Track your order", href: "https://www.shopnest.com/orders/NST-77120" }],
    auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
    firstTimeSender: false,
    mailedBy: "shopnest.com",
    signedBy: "shopnest.com",
    redFlags: [],
    legitSignals: [
      "Tracking link stays on the real shopnest.com domain (matches the sender).",
      "References a specific order number for a purchase you made.",
      "Authentication passes; no request for credentials or payment.",
    ],
    techniqueTags: [],
  },
  {
    id: "e23",
    truth: "phishing",
    difficulty: "medium",
    from: { name: "Northwind Survey", address: "survey@northwind.example" },
    replyTo: "rewards-team@survey-rewards-hub.com",
    to: "you@northwind.example",
    subject: "Complete our staff survey and claim your $50 gift card",
    timestamp: "2026-08-29T15:40:00Z",
    snippet: "Share your feedback in our 2-minute survey and receive a $50 gift card as a thank you.",
    bodyHtml: `
      <p>Hi,</p>
      <p>Help us improve! Complete our short staff survey and claim a <strong>$50 gift card</strong> as a thank you.</p>
      <p><a class="btn" href="https://survey-rewards-hub.com/northwind">Start survey &amp; claim reward</a></p>
      <p class="muted">Reply-to for reward queries: rewards-team@survey-rewards-hub.com</p>
    `,
    links: [{ text: "Start survey & claim reward", href: "https://survey-rewards-hub.com/northwind" }],
    auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
    firstTimeSender: false,
    mailedBy: "northwind.example",
    signedBy: "northwind.example",
    redFlags: [
      {
        type: "reply_to_mismatch",
        anchor: "rewards-team@survey-rewards-hub.com",
        explanation:
          "Even though the From domain looks internal, Reply-To and the link both point to an external 'rewards' domain.",
      },
      {
        type: "credential_harvest_link",
        anchor: "survey-rewards-hub.com",
        explanation: "Gift-card bait leads to a data-harvesting site off your company domain.",
      },
      {
        type: "unexpected_request",
        anchor: "$50 gift card",
        explanation: "Unsolicited rewards for 'a quick survey' are a classic incentive lure.",
      },
    ],
    techniqueTags: ["reply_to_mismatch", "credential_harvest_link", "unexpected_request"],
  },
  {
    id: "e24",
    truth: "legit",
    difficulty: "medium",
    from: { name: "Cloudvault", address: "no-reply@cloudvault.com" },
    to: "you@northwind.example",
    subject: "Your shared folder “Design Assets” is nearly full",
    timestamp: "2026-08-28T11:20:00Z",
    snippet: "The Design Assets folder is at 92% of its quota. Ask an admin to upgrade if you need more space.",
    bodyHtml: `
      <p>Hi,</p>
      <p>The shared folder <strong>Design Assets</strong> is at <strong>92%</strong> of its storage quota.</p>
      <p>No immediate action is required. If you need more space, ask your workspace admin to upgrade the plan from the Cloudvault console.</p>
      <p class="muted">Cloudvault Notifications</p>
    `,
    links: [],
    auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
    firstTimeSender: false,
    mailedBy: "cloudvault.com",
    signedBy: "cloudvault.com",
    redFlags: [],
    legitSignals: [
      "Quota notices from a real vendor that don't demand you click to 'upgrade' immediately.",
      "Authentication passes; sender domain matches the product.",
      "Refers you to your admin/console rather than an embedded login link — contrast with the fake 'mailbox full' phish.",
    ],
    techniqueTags: [],
  },

  // ==========================================================================
  // HARD
  // ==========================================================================
  {
    id: "e25",
    truth: "phishing",
    difficulty: "hard",
    from: { name: "Cloudvault", address: "no-reply@cloudvault.com" },
    replyTo: "no-reply@cloudvault.com",
    to: "you@northwind.example",
    subject: "Reminder: 2 files are waiting in your shared workspace",
    timestamp: "2026-09-02T09:59:00Z",
    snippet: "You have 2 unopened files in the Finance workspace. Open them before they expire.",
    bodyHtml: `
      <p>Hi,</p>
      <p>You have <strong>2 unopened files</strong> waiting in the <em>Finance</em> workspace. Shared links expire after 7 days.</p>
      <p><a class="btn" href="https://cloudvault.com.storage-relay.net/open">Open shared files</a></p>
      <p class="muted">Cloudvault — file sharing made simple.</p>
    `,
    links: [{ text: "Open shared files", href: "https://cloudvault.com.storage-relay.net/open" }],
    auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
    firstTimeSender: false,
    mailedBy: "cloudvault.com",
    signedBy: "cloudvault.com",
    redFlags: [
      {
        type: "lookalike_domain",
        anchor: "cloudvault.com.storage-relay.net",
        explanation:
          "The real registered domain is 'storage-relay.net' — 'cloudvault.com' is only a subdomain placed there to look legitimate. This is the single hardest tell: even with authentication passing, the LINK domain is the attacker's. Read the domain right-to-left from the final '.net'.",
      },
      {
        type: "urgency",
        anchor: "expire after 7 days",
        explanation: "A soft expiry deadline nudges you to click without inspecting the link.",
      },
    ],
    techniqueTags: ["lookalike_domain", "urgency", "credential_harvest_link"],
  },
  {
    id: "e26",
    truth: "legit",
    difficulty: "hard",
    from: { name: "Vaultwise Security", address: "security@vaultwise.com" },
    to: "you@northwind.example",
    subject: "Confirm your new device to finish sign-in",
    timestamp: "2026-09-02T08:31:00Z",
    snippet: "We sent this to confirm the device you just tried to sign in from. Approve it in the app you already have.",
    bodyHtml: `
      <p>Hi,</p>
      <p>We noticed a sign-in attempt from a <strong>new device</strong> a moment ago. To finish signing in, approve the request in your Vaultwise app.</p>
      <ul>
        <li>Device: Firefox on macOS</li>
        <li>Approx location: Utrecht, NL</li>
      </ul>
      <p>Didn't try to sign in? You can ignore this — without approval, access is denied automatically. We'll never ask for your master password by email.</p>
      <p class="muted">Vaultwise Security</p>
    `,
    links: [],
    auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
    firstTimeSender: false,
    mailedBy: "vaultwise.com",
    signedBy: "vaultwise.com",
    redFlags: [],
    legitSignals: [
      "Push-to-approve MFA flow: it points you to the app, not a web login.",
      "Explicitly states it will never ask for your master password by email.",
      "Authentication passes; domain matches the real vendor; matches a sign-in you can verify you started.",
      "'Ignore it and access is denied' is a safe default — no pressure to click.",
    ],
    techniqueTags: [],
  },
  {
    id: "e27",
    truth: "phishing",
    difficulty: "hard",
    from: { name: "Priya Nair", address: "priya.nair@northwind.example" },
    replyTo: "priya.nair@northwind.example",
    to: "you@northwind.example",
    subject: "Re: Q4 rollout plan — one more doc",
    timestamp: "2026-09-02T10:41:00Z",
    snippet: "Thanks for the draft. I added comments in this doc — can you take a look before our 3pm?",
    bodyHtml: `
      <p>Thanks for the draft — really solid.</p>
      <p>I dropped a few comments into a follow-up doc. Can you skim it before our 3pm sync?</p>
      <p><a class="btn" href="https://docs.northwind.example.sharepoint-review.com/d/q4">Open the doc with my comments</a></p>
      <p>Priya</p>
    `,
    links: [{ text: "Open the doc with my comments", href: "https://docs.northwind.example.sharepoint-review.com/d/q4" }],
    auth: { spf: "fail", dkim: "fail", dmarc: "fail" },
    firstTimeSender: false,
    mailedBy: "sharepoint-review.com",
    signedBy: "—",
    redFlags: [
      {
        type: "auth_fail",
        anchor: "SPF: FAIL",
        explanation:
          "This looks like a real reply from a coworker on a real thread — but SPF/DKIM/DMARC all FAIL. The From address is spoofed; the message did not come from Priya's mailbox. Headers are the only reliable tell here.",
      },
      {
        type: "lookalike_domain",
        anchor: "docs.northwind.example.sharepoint-review.com",
        explanation:
          "Your company name is buried in subdomains; the real domain is 'sharepoint-review.com', controlled by the attacker.",
      },
      {
        type: "credential_harvest_link",
        anchor: "Open the doc with my comments",
        explanation: "Thread-hijacking + a fake doc link is a highly convincing credential grab.",
      },
    ],
    techniqueTags: ["auth_fail", "lookalike_domain", "credential_harvest_link", "display_name_spoof"],
  },
  {
    id: "e28",
    truth: "legit",
    difficulty: "hard",
    from: { name: "Northwind Security", address: "security@northwind.example" },
    to: "you@northwind.example",
    subject: "Mandatory: reset your password after our incident",
    timestamp: "2026-09-01T08:00:00Z",
    snippet: "Following a contained incident, all staff must reset passwords. Do it from the intranet, not this email.",
    bodyHtml: `
      <p>Hello,</p>
      <p>Following a security incident that has now been contained, <strong>all staff must reset their password</strong> by Friday.</p>
      <p>For your safety, this email contains <strong>no reset link</strong>. Please go to the intranet from your browser bookmark (or type the address you always use) and use the "Reset password" tile. IT will never email you a reset link during this process.</p>
      <p>If anything about a "reset" message looks off, report it to security@northwind.example.</p>
      <p class="muted">— Northwind Security Team</p>
    `,
    links: [],
    auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
    firstTimeSender: false,
    mailedBy: "northwind.example",
    signedBy: "northwind.example",
    redFlags: [],
    legitSignals: [
      "Has urgency AND asks you to reset a password — yet it's legit, to teach you not to flag on keywords alone.",
      "Deliberately contains NO link and tells you to use your own bookmark.",
      "From the real internal domain with full authentication.",
      "Warns that IT will never email a reset link — the opposite of what a phish does.",
    ],
    techniqueTags: [],
  },
  {
    id: "e29",
    truth: "phishing",
    difficulty: "hard",
    from: { name: "Ledgerly Billing", address: "billing@ledgerly.com" },
    replyTo: "billing-support@ledgerly-billing.com",
    to: "you@northwind.example",
    subject: "Payment failed for invoice #INV-20418",
    timestamp: "2026-09-02T07:12:00Z",
    snippet: "We couldn't process payment for your latest invoice. Update your card to avoid service interruption.",
    bodyHtml: `
      <p>Hello Northwind,</p>
      <p>We were unable to process payment for invoice <strong>#INV-20418</strong>. To avoid interruption, please update your card details.</p>
      <p><a class="btn" href="https://ledgerly.com@billing-secure-ledgerly.com/pay">Update payment details</a></p>
      <p class="muted">Ledgerly Billing</p>
    `,
    links: [{ text: "Update payment details", href: "https://ledgerly.com@billing-secure-ledgerly.com/pay" }],
    auth: { spf: "pass", dkim: "fail", dmarc: "softfail" },
    firstTimeSender: false,
    mailedBy: "ledgerly.com",
    signedBy: "billing-secure-ledgerly.com",
    redFlags: [
      {
        type: "lookalike_domain",
        anchor: "ledgerly.com@billing-secure-ledgerly.com",
        explanation:
          "The '@' trick: everything before the '@' in a URL is just a username. The real host is 'billing-secure-ledgerly.com', not ledgerly.com. This is one of the sneakiest URL disguises.",
      },
      {
        type: "reply_to_mismatch",
        anchor: "billing-support@ledgerly-billing.com",
        explanation: "Reply-To points to a different domain than the sender — replies go to the attacker.",
      },
      {
        type: "auth_fail",
        anchor: "DKIM: FAIL",
        explanation: "DKIM fails and DMARC softfails; 'signed-by' is a suspicious lookalike domain.",
      },
    ],
    techniqueTags: ["lookalike_domain", "reply_to_mismatch", "auth_fail", "credential_harvest_link"],
  },
  {
    id: "e30",
    truth: "legit",
    difficulty: "hard",
    from: { name: "Brightpay", address: "no-reply@mail.brightpay.com" },
    to: "you@northwind.example",
    subject: "Action needed: confirm your tax details by 15 Sept",
    timestamp: "2026-08-30T10:15:00Z",
    snippet: "Please review your tax details in the Brightpay portal before the deadline to avoid a delay.",
    bodyHtml: `
      <p>Hi,</p>
      <p>To make sure your next payslip is correct, please review your tax details in Brightpay before <strong>15 September</strong>.</p>
      <p>Open Brightpay the way you always do — from your saved bookmark or your company's app launcher — and go to <em>Profile → Tax details</em>. We don't include a login link in these reminders.</p>
      <p class="muted">Brightpay Payroll · mail.brightpay.com is our sending subdomain</p>
    `,
    links: [],
    auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
    firstTimeSender: false,
    mailedBy: "mail.brightpay.com",
    signedBy: "brightpay.com",
    redFlags: [],
    legitSignals: [
      "Has a real deadline and asks for 'action', yet contains no link and can't harvest anything.",
      "Sends from a legitimate subdomain (mail.brightpay.com) and is DKIM-signed by brightpay.com.",
      "Tells you to navigate yourself and names the exact menu path — a trust-building pattern.",
    ],
    techniqueTags: [],
  },
  {
    id: "e31",
    truth: "phishing",
    difficulty: "hard",
    from: { name: "Northwind IT Service Desk", address: "servicedesk@northwind.example" },
    replyTo: "servicedesk@northwind.example",
    to: "you@northwind.example",
    subject: "MFA re-enrolment required — complete today",
    timestamp: "2026-09-02T09:05:00Z",
    snippet: "We're migrating our MFA provider. Re-enrol your authenticator today to avoid losing access.",
    bodyHtml: `
      <p>Hello,</p>
      <p>We are migrating to a new multi-factor authentication provider. To keep access, please <strong>re-enrol your authenticator today</strong> by scanning the QR code on the enrolment page and entering your current password and one-time code.</p>
      <p><a class="btn" href="https://northwind-mfa-enroll.com/setup">Re-enrol my authenticator</a></p>
      <p class="muted">Northwind IT Service Desk</p>
    `,
    links: [{ text: "Re-enrol my authenticator", href: "https://northwind-mfa-enroll.com/setup" }],
    auth: { spf: "pass", dkim: "pass", dmarc: "softfail" },
    firstTimeSender: false,
    mailedBy: "northwind.example",
    signedBy: "northwind.example",
    redFlags: [
      {
        type: "lookalike_domain",
        anchor: "northwind-mfa-enroll.com",
        explanation: "A brand-new hyphenated domain, not your real intranet — where a real MFA migration would live.",
      },
      {
        type: "credential_harvest_link",
        anchor: "entering your current password and one-time code",
        explanation:
          "Asking for BOTH your password and a live one-time code is a real-time MFA phishing (adversary-in-the-middle) attack — the site relays your code instantly. No legitimate migration needs your current OTP typed into a web page.",
      },
      {
        type: "urgency",
        anchor: "today",
        explanation: "Same-day pressure to bypass your caution.",
      },
    ],
    techniqueTags: ["lookalike_domain", "credential_harvest_link", "urgency"],
  },
  {
    id: "e32",
    truth: "legit",
    difficulty: "hard",
    from: { name: "GitHub", address: "noreply@github.com" },
    to: "you@northwind.example",
    subject: "[northwind/platform] A new SSH key was added to your account",
    timestamp: "2026-08-31T19:22:00Z",
    snippet: "A new SSH key was added. If you didn't do this, review your security settings from your bookmark.",
    bodyHtml: `
      <p>Hi,</p>
      <p>A new SSH key was added to your account:</p>
      <ul>
        <li>Title: <strong>work-laptop</strong></li>
        <li>Fingerprint: SHA256:9c…a1</li>
      </ul>
      <p>If you did this, no action is needed. If you didn't, sign in to GitHub from your browser and review your keys and sessions.</p>
      <p class="muted">You're receiving this mandatory security alert about your account.</p>
    `,
    links: [],
    auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
    firstTimeSender: false,
    mailedBy: "github.com",
    signedBy: "github.com",
    redFlags: [],
    legitSignals: [
      "Security alert with specifics (key title, fingerprint) rather than a vague threat.",
      "No login link — asks you to navigate to the site yourself if concerned.",
      "Passes authentication from the platform's real domain.",
      "'Mandatory security alert' footer matches how real developer platforms phrase these.",
    ],
    techniqueTags: [],
  },
  {
    id: "e33",
    truth: "phishing",
    difficulty: "hard",
    from: { name: "Adobe Cloud", address: "message@adobe.com" },
    replyTo: "message@adobe.com",
    to: "you@northwind.example",
    subject: "Scanned document from the office printer",
    timestamp: "2026-09-01T14:58:00Z",
    snippet: "A document was scanned and sent to you from RICOH-MP-3F. Open the attachment to view.",
    bodyHtml: `
      <p>A document was scanned and sent to you from the device <strong>RICOH-MP-3F</strong> on the 3rd floor.</p>
      <p>Open the attached file to view the scan.</p>
      <p class="muted">Scan to Email service</p>
    `,
    links: [],
    attachments: [
      {
        name: "Scan_2026_09_01.pdf.htm",
        sizeKB: 41,
        suspicious: true,
        reason:
          "Double extension: it's actually an .htm file (a local web page that opens a fake login), disguised as a PDF.",
      },
    ],
    auth: { spf: "fail", dkim: "fail", dmarc: "fail" },
    firstTimeSender: true,
    mailedBy: "mailer-scan.net",
    signedBy: "—",
    redFlags: [
      {
        type: "attachment_lure",
        anchor: "Scan_2026_09_01.pdf.htm",
        explanation:
          "The real extension is .htm, not .pdf — a double-extension trick. Opening it loads a fake login page in your browser.",
      },
      {
        type: "auth_fail",
        anchor: "SPF: FAIL",
        explanation: "'From' says a well-known brand, but authentication fails and 'mailed-by' is an unrelated domain.",
      },
      {
        type: "display_name_spoof",
        anchor: "message@adobe.com",
        explanation:
          "The visible From is spoofed; the real sending server (mailer-scan.net, and failing auth) gives it away.",
      },
    ],
    techniqueTags: ["attachment_lure", "auth_fail", "display_name_spoof"],
  },
  {
    id: "e34",
    truth: "phishing",
    difficulty: "hard",
    from: { name: "Finance Team", address: "finance@northwind.example" },
    replyTo: "finance@northwind.example",
    to: "you@northwind.example",
    subject: "September invoice — please process",
    timestamp: "2026-09-02T10:02:00Z",
    snippet: "Please find attached the September invoice for processing. Let me know if you need anything.",
    bodyHtml: `
      <p>Hi,</p>
      <p>Please find the September invoice attached for processing. Enable content if prompted so the totals calculate correctly.</p>
      <p>Thanks,<br/>Finance</p>
    `,
    links: [],
    attachments: [
      {
        name: "Invoice_September.docm",
        sizeKB: 132,
        suspicious: true,
        reason: "Macro-enabled Word document (.docm) that asks you to 'enable content' — a classic malware delivery.",
      },
    ],
    auth: { spf: "pass", dkim: "fail", dmarc: "fail" },
    firstTimeSender: false,
    mailedBy: "northwind.example",
    signedBy: "—",
    redFlags: [
      {
        type: "attachment_lure",
        anchor: "Invoice_September.docm",
        explanation:
          "A .docm is macro-enabled. The instruction to 'enable content' is how attackers get you to run the macro. Real invoices are almost never .docm.",
      },
      {
        type: "auth_fail",
        anchor: "DKIM: FAIL",
        explanation:
          "The From looks internal, but DKIM and DMARC fail — the message is spoofed, not really from Finance.",
      },
      {
        type: "unexpected_request",
        anchor: "Enable content if prompted",
        explanation: "No legitimate document needs macros enabled just to display totals.",
      },
    ],
    techniqueTags: ["attachment_lure", "auth_fail", "unexpected_request"],
  },
  {
    id: "e35",
    truth: "legit",
    difficulty: "hard",
    from: { name: "Northwind Finance", address: "finance@northwind.example" },
    to: "you@northwind.example",
    subject: "September expense report attached (PDF)",
    timestamp: "2026-09-01T16:20:00Z",
    snippet: "Here is the signed-off September expense summary for your records. No action needed.",
    bodyHtml: `
      <p>Hi,</p>
      <p>Attached is the signed-off <strong>September expense summary</strong> for your records. No action needed — it's just for your files.</p>
      <p>Ping me if any line looks off.</p>
      <p class="muted">— Northwind Finance</p>
    `,
    links: [],
    attachments: [
      { name: "Northwind_Expenses_Sept.pdf", sizeKB: 214, suspicious: false, reason: "A plain PDF from your own finance team." },
    ],
    auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
    firstTimeSender: false,
    mailedBy: "northwind.example",
    signedBy: "northwind.example",
    redFlags: [],
    legitSignals: [
      "A plain .pdf (single extension) from your real internal domain — contrast with the .docm and .pdf.htm phishing attachments.",
      "Full authentication passes.",
      "No action requested, no macros, no links — purely informational.",
    ],
    techniqueTags: [],
  },
  {
    id: "e36",
    truth: "phishing",
    difficulty: "hard",
    from: { name: "Okta Support", address: "support@okta-verify.help" },
    to: "you@northwind.example",
    subject: "Your session will expire — reauthenticate now",
    timestamp: "2026-09-02T08:55:00Z",
    snippet: "Your SSO session is about to expire. Reauthenticate to avoid being signed out of all apps.",
    bodyHtml: `
      <p>Hello,</p>
      <p>Your single sign-on session is about to expire. Reauthenticate now to avoid being signed out of all connected apps.</p>
      <p><a class="btn" href="https://okta-verify.help/reauth">Reauthenticate</a></p>
      <p class="muted">Identity Services</p>
    `,
    links: [{ text: "Reauthenticate", href: "https://okta-verify.help/reauth" }],
    auth: { spf: "softfail", dkim: "fail", dmarc: "fail" },
    firstTimeSender: true,
    mailedBy: "okta-verify.help",
    signedBy: "—",
    redFlags: [
      {
        type: "lookalike_domain",
        anchor: "okta-verify.help",
        explanation: "A brand name on an unusual TLD (.help) with no relationship to your real identity provider.",
      },
      {
        type: "credential_harvest_link",
        anchor: "Reauthenticate",
        explanation: "SSO 'reauth' pages are prime credential-harvest targets — one login unlocks every app.",
      },
      {
        type: "auth_fail",
        anchor: "SPF: SOFTFAIL",
        explanation: "Authentication does not pass.",
      },
    ],
    techniqueTags: ["lookalike_domain", "credential_harvest_link", "auth_fail"],
  },
  {
    id: "e37",
    truth: "legit",
    difficulty: "hard",
    from: { name: "Trellink", address: "no-reply@trellink.com" },
    to: "you@northwind.example",
    subject: "Weekly digest: 6 updates across your boards",
    timestamp: "2026-08-31T07:30:00Z",
    snippet: "Here's what changed on your boards this week. Manage your digest frequency in settings.",
    bodyHtml: `
      <p>Good morning,</p>
      <p>Here's your weekly summary across your boards:</p>
      <ul>
        <li>3 cards completed on <strong>Marketing</strong></li>
        <li>2 new comments on <strong>Website Revamp</strong></li>
        <li>1 card assigned to you on <strong>Q4 Planning</strong></li>
      </ul>
      <p><a class="btn" href="https://app.trellink.com/digest">Open Trellink</a></p>
      <p class="muted">Change how often you get this in Settings → Notifications.</p>
    `,
    links: [{ text: "Open Trellink", href: "https://app.trellink.com/digest" }],
    auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
    firstTimeSender: false,
    mailedBy: "trellink.com",
    signedBy: "trellink.com",
    redFlags: [],
    legitSignals: [
      "Digest link resolves to app.trellink.com, matching the sender domain.",
      "Content maps to real boards and activity you'd recognise.",
      "Authentication passes; footer explains how to change frequency.",
    ],
    techniqueTags: [],
  },
  {
    id: "e38",
    truth: "phishing",
    difficulty: "medium",
    from: { name: "Apple", address: "appleid@icloud-billing-support.com" },
    to: "you@northwind.example",
    subject: "Your receipt: App Store purchase €99.99",
    timestamp: "2026-09-01T21:03:00Z",
    snippet: "Thanks for your purchase. If you did not authorise this, cancel within 24 hours.",
    bodyHtml: `
      <p>Dear Customer,</p>
      <p>Thank you for your purchase of <strong>€99.99</strong> in the App Store.</p>
      <p>If you did <strong>not</strong> authorise this transaction, cancel it within 24 hours:</p>
      <p><a class="btn" href="https://icloud-billing-support.com/cancel">Cancel transaction</a></p>
    `,
    links: [{ text: "Cancel transaction", href: "https://icloud-billing-support.com/cancel" }],
    auth: { spf: "fail", dkim: "fail", dmarc: "fail" },
    firstTimeSender: true,
    mailedBy: "icloud-billing-support.com",
    signedBy: "—",
    redFlags: [
      {
        type: "unexpected_request",
        anchor: "cancel it within 24 hours",
        explanation:
          "The 'fake receipt' trick: alarm at a charge you don't recognise pushes you to click 'cancel' — which is really a login/payment harvest.",
      },
      {
        type: "lookalike_domain",
        anchor: "icloud-billing-support.com",
        explanation: "An unofficial support-style domain unrelated to the real brand.",
      },
      {
        type: "generic_greeting",
        anchor: "Dear Customer",
        explanation: "A real receipt uses your name and your actual order details.",
      },
    ],
    techniqueTags: ["unexpected_request", "lookalike_domain", "generic_greeting", "credential_harvest_link"],
  },
  {
    id: "e39",
    truth: "legit",
    difficulty: "medium",
    from: { name: "Northwind Learning", address: "learning@northwind.example" },
    to: "you@northwind.example",
    subject: "You've been enrolled in Security Awareness 2026",
    timestamp: "2026-08-25T09:15:00Z",
    snippet: "Your annual security training is now available. Find it under Assigned in the learning portal.",
    bodyHtml: `
      <p>Hi,</p>
      <p>You've been enrolled in <strong>Security Awareness 2026</strong>, due by the end of the month.</p>
      <p>Find it under <em>Assigned</em> when you open the learning portal from the intranet. It takes about 20 minutes.</p>
      <p class="muted">— Northwind Learning &amp; Development</p>
    `,
    links: [],
    auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
    firstTimeSender: false,
    mailedBy: "northwind.example",
    signedBy: "northwind.example",
    redFlags: [],
    legitSignals: [
      "Internal domain with full authentication.",
      "No link — tells you to open the portal yourself from the intranet.",
      "Routine L&D enrolment with a reasonable deadline and no credential request.",
    ],
    techniqueTags: [],
  },
  {
    id: "e40",
    truth: "phishing",
    difficulty: "medium",
    from: { name: "Google Workspace", address: "no-reply@g00gle-workspace.com" },
    to: "you@northwind.example",
    subject: "Storage limit reached — action required",
    timestamp: "2026-09-02T06:40:00Z",
    snippet: "Your account has reached its storage limit. Verify to restore full functionality.",
    bodyHtml: `
      <p>Hello,</p>
      <p>Your account has reached its storage limit. Some features are disabled until you verify your account.</p>
      <p><a class="btn" href="https://g00gle-workspace.com/verify">Verify and restore storage</a></p>
    `,
    links: [{ text: "Verify and restore storage", href: "https://g00gle-workspace.com/verify" }],
    auth: { spf: "fail", dkim: "fail", dmarc: "fail" },
    firstTimeSender: true,
    mailedBy: "g00gle-workspace.com",
    signedBy: "—",
    redFlags: [
      {
        type: "lookalike_domain",
        anchor: "g00gle-workspace.com",
        explanation: "Two zeros replace the 'oo' in the brand name — a homoglyph domain.",
      },
      {
        type: "credential_harvest_link",
        anchor: "Verify and restore storage",
        explanation: "'Verify your account' on a fake domain is a login harvest.",
      },
      {
        type: "auth_fail",
        anchor: "DMARC: FAIL",
        explanation: "All authentication fails.",
      },
    ],
    techniqueTags: ["lookalike_domain", "credential_harvest_link", "auth_fail"],
  },
  {
    id: "e41",
    truth: "legit",
    difficulty: "easy",
    from: { name: "Priya Nair", address: "priya.nair@northwind.example" },
    to: "you@northwind.example",
    subject: "Lunch to celebrate the launch?",
    timestamp: "2026-09-02T12:31:00Z",
    snippet: "Great work shipping this week! Want to grab lunch Thursday with the team?",
    bodyHtml: `
      <p>Hey,</p>
      <p>Great work shipping this week 🎉 Want to grab lunch on Thursday with the team? Thinking the place around the corner around 12:30.</p>
      <p>Let me know!</p>
      <p>Priya</p>
    `,
    links: [],
    auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
    firstTimeSender: false,
    mailedBy: "northwind.example",
    signedBy: "northwind.example",
    redFlags: [],
    legitSignals: [
      "A genuine, casual note from a real coworker on your own domain.",
      "Authentication passes; nothing to click, download, or confirm.",
      "No pressure, no request for data — just a normal human message.",
    ],
    techniqueTags: [],
  },
  {
    id: "e42",
    truth: "phishing",
    difficulty: "hard",
    from: { name: "Northwind Payroll", address: "payroll@northwind.example" },
    replyTo: "payroll.support@northwlnd.example",
    to: "you@northwind.example",
    subject: "Confirm direct deposit change you requested",
    timestamp: "2026-09-02T09:44:00Z",
    snippet: "We received a request to change your direct deposit. Confirm or reject the change.",
    bodyHtml: `
      <p>Hi,</p>
      <p>We received a request to change the bank account for your direct deposit. If you made this request, confirm below. If not, reject it to keep your current account.</p>
      <p><a class="btn" href="https://northwlnd.example/deposit/confirm">Confirm or reject change</a></p>
      <p class="muted">Northwind Payroll</p>
    `,
    links: [{ text: "Confirm or reject change", href: "https://northwlnd.example/deposit/confirm" }],
    auth: { spf: "fail", dkim: "fail", dmarc: "fail" },
    firstTimeSender: false,
    mailedBy: "northwlnd.example",
    signedBy: "—",
    redFlags: [
      {
        type: "lookalike_domain",
        anchor: "northwlnd.example",
        explanation:
          "A lowercase 'L' replaces the 'i' in northwind (northwLnd). Both the Reply-To and the link use it, while the From is spoofed to look real.",
      },
      {
        type: "reply_to_mismatch",
        anchor: "payroll.support@northwlnd.example",
        explanation: "Reply-To quietly uses the lookalike domain, not your real company domain.",
      },
      {
        type: "auth_fail",
        anchor: "SPF: FAIL",
        explanation: "Authentication fails; despite the reassuring 'confirm or reject' framing, this is a payroll-diversion phish.",
      },
    ],
    techniqueTags: ["lookalike_domain", "reply_to_mismatch", "auth_fail", "credential_harvest_link"],
  },
];

/** Fictional-content disclaimer surfaced in the UI footer and feedback. */
export const CONTENT_DISCLAIMER =
  "All emails in this training are fictional and AI-generated for education only. Company and product names are invented for realism and do not represent real organisations.";
