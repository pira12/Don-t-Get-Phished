import { describe, it, expect } from "vitest";
import { defangHtml, redactPii, buildDraftFromRaw } from "@/server/importEmail";

describe("defangHtml", () => {
  it("blocks remote images and media but keeps text + links", () => {
    const dirty = `<p>Hi <img src="http://track.example/pixel.gif" width="1"></p><p><a href="http://bad.example/login">Verify</a></p>`;
    const clean = defangHtml(dirty);
    expect(clean).not.toMatch(/<img/i);
    expect(clean).toContain("remote image blocked");
    expect(clean).toContain("Verify"); // link text preserved
    expect(clean).toContain("bad.example"); // href preserved (never navigated)
  });

  it("strips scripts/handlers and neutralises url() and javascript:", () => {
    const clean = defangHtml(`<div style="background:url(http://x/y.png)" onclick="e()"><script>e()</script><a href="javascript:alert(1)">x</a></div>`);
    expect(clean).not.toMatch(/<script/i);
    expect(clean).not.toMatch(/onclick/i);
    expect(clean).not.toMatch(/url\(http/i);
    expect(clean).toContain('href="#"');
  });
});

describe("redactPii", () => {
  it("masks long digit runs (card/SSN-like)", () => {
    expect(redactPii("card 4111 1111 1111 1111 now")).toContain("redacted");
    expect(redactPii("order #42 shipped")).toBe("order #42 shipped");
  });
});

describe("buildDraftFromRaw", () => {
  it("parses headers, defangs the body, and drops the real recipient", () => {
    const raw = [
      'From: "IT Support" <no-reply@examp1e.com>',
      "To: victim@realcompany.com",
      "Reply-To: attacker@evil.example",
      "Subject: Password expires today",
      "Authentication-Results: mx.google.com; spf=fail dkim=fail dmarc=fail",
      "",
      '<p>Your password expires today. <a href="http://examp1e.com/verify">Verify now</a></p><img src="http://track/x.gif">',
    ].join("\n");
    const d = buildDraftFromRaw(raw);
    expect(d.from).toEqual({ name: "IT Support", address: "no-reply@examp1e.com" });
    expect(d.subject).toBe("Password expires today");
    expect(d.replyTo).toBe("attacker@evil.example");
    expect(d.to).not.toContain("victim"); // recipient never kept
    expect(d.auth).toEqual({ spf: "fail", dkim: "fail", dmarc: "fail" });
    expect(d.bodyHtml).not.toMatch(/<img/i);
    expect(d.bodyHtml).toContain("Verify now");
  });

  it("handles a body-only paste (no headers)", () => {
    const d = buildDraftFromRaw("Click here to reset your password: http://bad.example");
    expect(d.subject).toBe("(imported email)");
    expect(d.bodyHtml).toContain("Click here");
  });
});
