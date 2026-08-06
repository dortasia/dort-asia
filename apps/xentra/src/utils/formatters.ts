export function formatCurrency(
  amount: number | null | undefined,
  currency: string = 'SGD',
  locale: string = 'en-SG'
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0.00'
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(
  dateStr: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateStr) return '-'
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleDateString(
    'en-SG',
    options || { year: 'numeric', month: 'short', day: 'numeric' }
  )
}
