import type { Booking, BookingInput } from "./types";

type BookingSlot = Pick<BookingInput, "date" | "start" | "end">;
type BookingIssue = { kind: "invalid" | "conflict"; message: string };
type ValidationOptions = { now: number; excludeBookingId?: string };

export function validateBookingSlot(
  { date, start, end }: BookingSlot,
  bookings: readonly Booking[],
  { now, excludeBookingId }: ValidationOptions,
): BookingIssue | null {
  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
  const startAt = Date.parse(`${date}T${start}:00Z`);
  const endAt = Date.parse(`${date}T${end}:00Z`);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !timePattern.test(start) ||
    !timePattern.test(end) ||
    !Number.isFinite(startAt) ||
    !Number.isFinite(endAt) ||
    new Date(startAt).toISOString().slice(0, 10) !== date
  ) {
    return { kind: "invalid", message: "Некорректная дата или время" };
  }

  const duration = (endAt - startAt) / 60_000;

  if (start < "09:00" || end > "18:00" || duration < 30 || duration > 120) {
    return {
      kind: "invalid",
      message: "Выбери от 30 до 120 минут в пределах 09:00–18:00 UTC",
    };
  }

  if (startAt < now) {
    return { kind: "invalid", message: "Это время уже прошло" };
  }

  const isOccupied = bookings.some(
    (booking) =>
      booking.id !== excludeBookingId &&
      booking.date === date &&
      start < booking.end &&
      booking.start < end,
  );

  return isOccupied ? { kind: "conflict", message: "Это время уже занято" } : null;
}

export function hasBookingStarted(
  booking: Pick<Booking, "date" | "start">,
  now: number,
): boolean {
  return Date.parse(`${booking.date}T${booking.start}:00Z`) <= now;
}

export function getEarliestBookingStart(date: string, now: number): string | null {
  const nextMinute = Math.ceil(now / 60_000) * 60_000;
  const earliest = Math.max(nextMinute, Date.parse(`${date}T09:00:00Z`));
  const latest = Date.parse(`${date}T17:30:00Z`);

  return earliest <= latest
    ? new Date(earliest).toISOString().slice(11, 16)
    : null;
}
