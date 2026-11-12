export function checkoutDate(bookingDate: string, nights: number): string {
  const [year, month, day] = bookingDate.slice(0, 10).split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + Number(nights));

  return date.toISOString().slice(0, 10);
}
