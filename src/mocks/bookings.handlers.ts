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
];
