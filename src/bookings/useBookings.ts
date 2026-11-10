import { useEffect, useState } from "react";
import { getBookings } from "./api";
import type { Booking } from "./types";

type Result = {
  requestKey: string;
  bookings: Booking[];
  error: string | null;
};

export const useBookings = (date: string) => {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const requestKey = `${date}:${revision}`;

  useEffect(() => {
    const controller = new AbortController();

    getBookings(date, controller.signal)
      .then((bookings) => {
        if (controller.signal.aborted) return;
        setResult({ requestKey, bookings, error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setResult({
          requestKey,
          bookings: [],
          error: error instanceof Error ? error.message : "Не удалось загрузить брони",
        });
      });

    return () => controller.abort();
  }, [date, requestKey]);

  const current = result?.requestKey === requestKey ? result : null;

  return {
    bookings: current?.bookings ?? [],
    isLoading: current === null,
    error: current?.error ?? null,
    reload: () => setRevision((value) => value + 1),
  };
}
