import { describe, it, expect } from "vitest";
import { sanitizeHtml, validateEmailInput } from "@/server/content";

describe("sanitizeHtml", () => {
  it("strips script/style/iframe and inline handlers", () => {
    const dirty = `<p onclick="steal()">hi</p><script>evil()</script><iframe src="x"></iframe>`;
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toMatch(/<script/i);
    expect(clean).not.toMatch(/<iframe/i);
    expect(clean).not.toMatch(/onclick/i);
    expect(clean).toContain("<p");
  });

  it("neutralises javascript: URIs but keeps normal links (lookalikes allowed)", () => {
    expect(sanitizeHtml(`<a href="javascript:alert(1)">x</a>`)).toContain('href="#"');
    expect(sanitizeHtml(`<a href="https://paypa1.com/login">x</a>`)).toContain("paypa1.com");
  });
});

describe("validateEmailInput", () => {
  const good = {
    truth: "phishing",
    difficulty: "medium",
    from: { name: "IT", address: "no-reply@vend0r.example" },
    subject: "Action required",
    bodyHtml: "<p>Click <a href='https://bad.example'>here</a></p>",
    redFlags: [{ type: "lookalike_domain", anchor: "vend0r", explanation: "zero for o" }],
  };

  it("accepts a valid phishing email and derives techniqueTags", () => {
    const r = validateEmailInput(good);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.email.truth).toBe("phishing");
      expect(r.email.techniqueTags).toContain("lookalike_domain");
    }
  });

  it("rejects a phishing email with no red flags", () => {
    const r = validateEmailInput({ ...good, redFlags: [] });
    expect(r.ok).toBe(false);
  });

  it("rejects a legit email with no signals and a bad address", () => {
    const r = validateEmailInput({ truth: "legit", difficulty: "easy", from: { name: "X", address: "not-an-email" }, subject: "Hi", bodyHtml: "<p>hi</p>" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.some((e) => e.includes("address"))).toBe(true);
      expect(r.errors.some((e) => e.includes("reassuring"))).toBe(true);
    }
  });

  it("sanitises body on the way in", () => {
    const r = validateEmailInput({ ...good, bodyHtml: "<p>ok</p><script>evil()</script>" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.email.bodyHtml).not.toMatch(/<script/i);
  });
});
