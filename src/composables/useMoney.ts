export function useMoney() {
  function formatMoney(value: number) {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(value)
  }

  function formatDate(dateStr: string) {
    return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short' }).format(new Date(dateStr))
  }

  function today() {
    return new Date().toISOString().slice(0, 10)
  }

  return { formatMoney, formatDate, today }
}
