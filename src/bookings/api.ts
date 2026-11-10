import type { Booking, BookingInput } from "./types";

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function getBookings(
  date: string,
  signal?: AbortSignal,
): Promise<Booking[]> {
  const query = new URLSearchParams({ date });
  const response = await fetch(`/api/bookings?${query}`, {
    signal: signal ?? null,
  });

  if (!response.ok) {
    throw new ApiError(
      response.status,
      `Не удалось загрузить брони (${response.status})`,
    );
  }

  return response.json();
}

export async function createBooking(input: BookingInput): Promise<Booking> {
  const response = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      typeof body?.message === "string"
        ? body.message
        : "Не удалось сохранить бронь";

    throw new ApiError(response.status, message);
  }

  return response.json();
}

