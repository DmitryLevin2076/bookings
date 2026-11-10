import { useEffect, useState } from "react";
import { deleteBooking } from "./bookings/api";
import { BookingForm } from "./bookings/BookingForm";
import { getEarliestBookingStart, hasBookingStarted } from "./bookings/domain";
import type { Booking } from "./bookings/types";
import { useBookings } from "./bookings/useBookings";

export default function App() {
  const [now, setNow] = useState<number>(() => Date.now());
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [form, setForm] = useState<{ booking?: Booking } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { bookings, isLoading, error, reload } = useBookings(date);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const canCreate = getEarliestBookingStart(date, now) !== null;

  const sortedBookings = [...bookings].sort((a, b) =>
    a.start.localeCompare(b.start),
  );

  const refreshDay = (nextDate: string) => {
    setDate(nextDate);
    reload();
  }

  const handleDelete = async (id: string) => {
    if (deletingId !== null || !window.confirm("Удалить эту бронь?")) return;

    setDeleteError(null);
    setDeletingId(id);

    try {
      await deleteBooking(id);
      reload();
    } catch (error: unknown) {
      setDeleteError(
        error instanceof Error ? error.message : "Не удалось удалить бронь",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main>
      <h1>Бронирование переговорной</h1>
      <p>Рабочие часы 09:00–18:00 UTC</p>

      <label>
        Дата{" "}
        <input
          type="date"
          value={date}
          disabled={form !== null || deletingId !== null}
          onChange={(event) => {
            if (event.target.value) {
              setDate(event.target.value);
              setDeleteError(null);
            }
          }}
        />
      </label>

      <h2>Брони на выбранную дату</h2>

      {isLoading && <p role="status">Загружаем брони…</p>}

      {error && (
        <>
          <p role="alert">{error}</p>
          <button type="button" onClick={reload}>
            Повторить
          </button>
        </>
      )}

      {!isLoading && !error && sortedBookings.length === 0 && (
        <p>На эту дату броней нет</p>
      )}

      {sortedBookings.length > 0 && (
        <ul>
          {sortedBookings.map((booking) => (
            <li key={booking.id}>
              {booking.start}–{booking.end} · {booking.title || "Бронь"}

              {!form && !hasBookingStarted(booking, now) && (
                <>
                  <button
                    type="button"
                    disabled={deletingId !== null}
                    onClick={() => setForm({ booking })}
                  >
                    Редактировать
                  </button>

                  <button
                    type="button"
                    disabled={deletingId !== null}
                    onClick={() => void handleDelete(booking.id)}
                  >
                    {deletingId === booking.id ? "Удаляем…" : "Удалить"}
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {!form && !canCreate && (
        <p>На выбранную дату не осталось времени для новой брони.</p>
      )}

      {deleteError && <p role="alert">{deleteError}</p>}

      {form ? (
        <BookingForm
          now={now}
          date={date}
          booking={form.booking}
          onSaved={(savedDate) => {
            setForm(null);
            refreshDay(savedDate);
          }}
          onConflict={refreshDay}
          onCancel={() => setForm(null)}
        />
      ) : (
        <button
          type="button"
          disabled={deletingId !== null || !canCreate}
          onClick={() => setForm({})}
        >
          Новая бронь
        </button>
      )}
    </main>
  );
}
