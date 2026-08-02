export function generatePaymentId(type: string, companyName?: string): string {
  const t = String(type).toLowerCase();
  let prefix = "SND";
  if (t === "received" || t === "credit" || t === "receive" || t === "incoming") {
    prefix = "RCV";
  } else if (t === "cycle" || t === "cycle-pay" || t === "recurring") {
    prefix = "CYC";
  } else if (t === "send" || t === "withdraw" || t === "debit" || t === "outgoing") {
    prefix = "SND";
  }

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const timestamp = `${yyyy}${mm}${dd}${hh}${min}${ss}`;

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomChars = '';
  for (let i = 0; i < 6; i++) {
    randomChars += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  let companyInitials = "CMP";
  if (companyName && companyName.trim()) {
    const words = companyName.trim().split(/\s+/);
    const initials = words
      .map(w => w.charAt(0).toUpperCase())
      .join("")
      .replace(/[^A-Z0-9]/g, "");
    if (initials.length > 0) {
      companyInitials = initials;
    }
  }

  return `${prefix}-${timestamp}-${randomChars}-${companyInitials}`;
}
