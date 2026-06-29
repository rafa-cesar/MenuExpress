export function buildWhatsAppOrderUrl(phone: string, message: string) {
  let sanitizedPhone = phone.replace(/\D/g, '');

  // wa.me exige número no formato internacional sem o '+'.
  // Se o número tiver 10 ou 11 dígitos (sem código de país), adiciona o 55 do Brasil.
  if (sanitizedPhone.length <= 11) {
    sanitizedPhone = '55' + sanitizedPhone;
  }

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${sanitizedPhone}?text=${encodedMessage}`;
}
