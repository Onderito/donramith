import { isValidPhoneNumber } from "libphonenumber-js";

const fields = ["firstName", "lastName", "email", "phone", "instagram", "challenge", "importance", "budget"] as const;
const requiredFields = fields.filter(field => field !== "instagram");
const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c] || c));
const isValidEmail = (value: string) => {
  const email = value.trim();
  const [local, domain, ...extra] = email.split("@");
  return email.length <= 254 && !extra.length && Boolean(local && domain) && !local.startsWith(".") && !local.endsWith(".") && !local.includes("..") && /^[^\s@]+\.[^\s@]{2,}$/.test(domain);
};

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    if (requiredFields.some(field => typeof body[field] !== "string" || !(body[field] as string).trim())) return Response.json({ error: "Please complete every required answer." }, { status: 400 });
    if (!isValidEmail(String(body.email))) return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
    if (!isValidPhoneNumber(String(body.phone))) return Response.json({ error: "Please enter a valid international phone number." }, { status: 400 });
    const key = process.env.RESEND_API_KEY;
    if (!key) return Response.json({ error: "Email delivery is not configured yet. Add a Resend API key before testing submissions." }, { status: 503 });
    const html = fields.map(field => `<p><strong>${field.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase())}</strong><br>${escape(String(body[field] || "Not provided"))}</p>`).join("");
    const sent = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: process.env.COACHING_FROM_EMAIL || "Don Ramith <onboarding@resend.dev>", to: [process.env.COACHING_TO_EMAIL || "ulas.onder@outlook.fr"], reply_to: body.email, subject: `New coaching application: ${body.firstName} ${body.lastName}`, html }) });
    if (!sent.ok) {
      const resendError = await sent.json().catch(() => null) as { message?: string; name?: string } | null;
      const detail = resendError?.message || "The application could not be delivered.";
      console.error("Resend rejected the coaching application:", resendError ?? sent.statusText);
      return Response.json(
        { error: process.env.NODE_ENV === "development" ? `Resend: ${detail}` : "The application could not be delivered." },
        { status: 502 },
      );
    }
    return Response.json({ ok: true, delivered: true });
  } catch { return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 }); }
}
