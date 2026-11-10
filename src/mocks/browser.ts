import { setupWorker } from "msw/browser";
import { bookingHandlers } from "./bookings.handlers";

export const worker = setupWorker(...bookingHandlers);
