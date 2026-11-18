/** Normalise an Indian mobile number to E.164 (+91XXXXXXXXXX), or null if invalid. */
export function toIndianE164(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : null;
}

/** "+919876543210" → "+91 98765 43210" */
export function formatIndianPhone(e164: string): string {
  const d = e164.replace(/^\+91/, "");
  return d.length === 10 ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : e164;
}
