import { http, HttpResponse } from "msw/http";
import type { Booking } from "../bookings/types";
import { validateBookingSlot, hasBookingStarted } from "../bookings/domain";

const today = new Date().toISOString().slice(0, 10);

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
    const issue = validateBookingSlot({ date, start, end }, bookings, {
      now: Date.now(),
    });

    if (issue) {
      return HttpResponse.json(
        { message: issue.message },
        { status: issue.kind === "conflict" ? 409 : 400 },
      );
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

  http.patch("/api/bookings/:id", async ({ params, request }) => {
    const body: unknown = await request.json().catch(() => null);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return HttpResponse.json({ message: "Некорректные данные брони" }, { status: 400 });
    }

    const { date, start, end, title } = body as Record<string, unknown>;

    if (
      (date !== undefined && typeof date !== "string") ||
      (start !== undefined && typeof start !== "string") ||
      (end !== undefined && typeof end !== "string") ||
      (title !== undefined && typeof title !== "string")
    ) {
      return HttpResponse.json({ message: "Проверь поля брони" }, { status: 400 });
    }

    const index = bookings.findIndex((booking) => booking.id === params.id);
    const currentBooking = bookings[index];

    if (!currentBooking) {
      return HttpResponse.json({ message: "Бронь не найдена" }, { status: 404 });
    }

    const now = Date.now();
    if (hasBookingStarted(currentBooking, now)) {
      return HttpResponse.json(
        { message: "Эта бронь уже началась" },
        { status: 400 },
      );
    }

    const updatedTitle = title === undefined ? currentBooking.title : title.trim();
    const updatedBooking: Booking = {
      id: currentBooking.id,
      date: date ?? currentBooking.date,
      start: start ?? currentBooking.start,
      end: end ?? currentBooking.end,
      ...(updatedTitle ? { title: updatedTitle } : {}),
    };

    const issue = validateBookingSlot(updatedBooking, bookings, {
      now,
      excludeBookingId: currentBooking.id,
    });

    if (issue) {
      return HttpResponse.json(
        { message: issue.message },
        { status: issue.kind === "conflict" ? 409 : 400 },
      );
    }

    bookings[index] = updatedBooking;
    return HttpResponse.json(updatedBooking);
  }),

  http.delete("/api/bookings/:id", ({ params }) => {
    const index = bookings.findIndex((booking) => booking.id === params.id);
    const booking = bookings[index];

    if (!booking) {
      return HttpResponse.json({ message: "Бронь не найдена" }, { status: 404 });
    }

    if (hasBookingStarted(booking, Date.now())) {
      return HttpResponse.json(
        { message: "Эта бронь уже началась" },
        { status: 400 },
      );
    }

    bookings.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
