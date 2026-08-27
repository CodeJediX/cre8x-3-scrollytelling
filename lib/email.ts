const gold = "#e9c64a";

function emailDocument(title: string, message: string, action?: { label: string; url: string }) {
  return `<!doctype html><html><body style="margin:0;background:#050505;color:#f5f2e8;font-family:Arial,sans-serif"><div style="max-width:620px;margin:auto;padding:42px 24px"><div style="border:1px solid #3c351c;background:#0b0a08;padding:36px"><p style="margin:0 0 12px;color:${gold};font-size:11px;letter-spacing:3px">CREATE X 3.0 · 2050 PROTOCOL</p><h1 style="margin:0 0 22px;font-family:Georgia,serif;font-size:42px;line-height:1;color:#fff">${title}</h1><p style="color:#b5b5b5;line-height:1.7">${message}</p>${action ? `<a href="${action.url}" style="display:inline-block;margin-top:22px;padding:14px 20px;background:${gold};color:#070707;text-decoration:none;font-weight:bold;font-size:12px;letter-spacing:1px">${action.label}</a>` : ""}</div><p style="color:#666;font-size:11px;line-height:1.6">The future is not found. It is designed.<br>CreateX 3.0 · Kotelawala Defence University Student Chapter</p></div></body></html>`;
}

export async function sendCreateXEmail(input: { to: string; subject: string; title: string; message: string; action?: { label: string; url: string } }) {
  const apiKey = process.env.RESEND_API_KEY; const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return { skipped: true };
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [input.to], subject: input.subject, html: emailDocument(input.title, input.message, input.action) }) });
  return response.ok ? { sent: true } : { sent: false, error: await response.text() };
}
