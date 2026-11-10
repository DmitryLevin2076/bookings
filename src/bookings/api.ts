import type { Booking, BookingInput } from "./types";

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function ensureOk(response: Response, fallback: string): Promise<void> {
  if (response.ok) return;

  const body = await response.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message : fallback;

  throw new ApiError(response.status, message);
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

export function createBooking(input: BookingInput): Promise<Booking> {
  return saveBooking("/api/bookings", "POST", input);
}

export function updateBooking(
  id: string,
  input: Partial<BookingInput>,
): Promise<Booking> {
  return saveBooking(`/api/bookings/${encodeURIComponent(id)}`, "PATCH", input);
}

export async function deleteBooking(id: string): Promise<void> {
  const response = await fetch(`/api/bookings/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  await ensureOk(response, "Не удалось удалить бронь");
}

async function saveBooking(
  url: string,
  method: "POST" | "PATCH",
  input: Partial<BookingInput>,
): Promise<Booking> {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  await ensureOk(response, "Не удалось сохранить бронь")

  return response.json();
}

