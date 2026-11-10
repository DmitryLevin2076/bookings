import type { Booking } from "./types";

export async function getBookings(
  date: string,
  signal?: AbortSignal,
): Promise<Booking[]> {
  const query = new URLSearchParams({ date });
  const response = await fetch(`/api/bookings?${query}`, {
    signal: signal ?? null,
  });

  if (!response.ok) {
    throw new Error(`Не удалось загрузить брони (${response.status})`);
  }

  return response.json();
}
