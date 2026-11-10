import { http, HttpResponse } from "msw/http";
import type { Booking } from "../bookings/types";

const now = new Date();
const today = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
  .map((part) => String(part).padStart(2, "0"))
  .join("-");

const bookings: Booking[] = [
  { id: "demo-1", date: today, start: "10:00", end: "11:00", title: "Созвон" },
];

export const bookingHandlers = [
  http.get("/api/bookings", ({ request }) => {
    const date = new URL(request.url).searchParams.get("date");

    if (!date) {
      return HttpResponse.json({ message: "Укажи дату" }, { status: 400 });
    }

    return HttpResponse.json(bookings.filter((booking) => booking.date === date));
  }),
  http.post("/api/bookings", async ({ request }) => {
    const input = await request.json().catch(() => null);

    if (
      !input ||
      typeof input !== "object" ||
      !("date" in input) || typeof input.date !== "string" ||
      !("start" in input) || typeof input.start !== "string" ||
      !("end" in input) || typeof input.end !== "string"
    ) {
      return HttpResponse.json({ message: "Заполни дату и время" }, { status: 400 });
    }

    const { date, start, end } = input;
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
      return HttpResponse.json({ message: "Некорректная дата или время" }, { status: 400 });
    }

    const duration = (endAt - startAt) / 60_000;

    if (start < "09:00" || end > "18:00" || duration < 30 || duration > 120) {
      return HttpResponse.json(
        { message: "Выбери от 30 до 120 минут в пределах 09:00–18:00 UTC" },
        { status: 400 },
      );
    }

    if (startAt < Date.now()) {
      return HttpResponse.json({ message: "Это время уже прошло" }, { status: 400 });
    }

    const isOccupied = bookings.some(
      (booking) => booking.date === date && start < booking.end && booking.start < end,
    );

    if (isOccupied) {
      return HttpResponse.json({ message: "Это время уже занято" }, { status: 409 });
    }

    const title = "title" in input && typeof input.title === "string"
      ? input.title.trim()
      : "";

    const booking: Booking = {
      id: crypto.randomUUID(),
      date,
      start,
      end,
      ...(title ? { title } : {}),
    };

    bookings.push(booking);
    return HttpResponse.json(booking, { status: 201 });
  }),
];
