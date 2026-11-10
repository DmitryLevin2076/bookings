import { http, HttpResponse } from "msw/http";
import type { Booking } from "../bookings/types";
import { validateBookingSlot } from "../bookings/domain";

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
];
