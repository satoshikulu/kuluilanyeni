/**
 * Her kelimenin ilk harfini büyük yapar (Title Case)
 * Örnek: "ali veli" -> "Ali Veli"
 */
export function toTitleCase(text: string): string {
  if (!text) return ''
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (word.length === 0) return word
      return word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1)
    })
    .join(' ')
}

/**
 * İlk harfi büyük yapar
 * Örnek: "ali" -> "Ali"
 */
export function capitalizeFirst(text: string): string {
  if (!text) return ''
  return text.charAt(0).toLocaleUpperCase('tr-TR') + text.slice(1).toLowerCase()
}

/**
 * Telefon numarasını formatlar
 * Örnek: "5551234567" -> "555 123 45 67"
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`
  }
  return phone
}
