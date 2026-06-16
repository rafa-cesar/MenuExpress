export function buildWhatsAppOrderUrl(phone: string, message: string) {
  const sanitizedPhone = phone.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${sanitizedPhone}?text=${encodedMessage}`;
}
