import { useEffect, useState } from "react";
import { deleteBooking } from "./bookings/api";
import { BookingForm } from "./bookings/BookingForm";
import { getEarliestBookingStart, hasBookingStarted } from "./bookings/domain";
import { useBookings } from "./bookings/useBookings";
import type { Booking } from "./bookings/types";
import styles from "./App.module.css";

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
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Бронирование переговорной</h1>
        <p>Рабочие часы 09:00–18:00 UTC</p>
      </header>

      <div className={styles.toolbar}>
        <label>
          Дата
          <input
            type="date"
            value={date}
            disabled={form !== null || deletingId !== null}
            onChange={(event) => {
              if (event.currentTarget.value) {
                setDate(event.currentTarget.value);
                setDeleteError(null);
              }
            }}
          />
        </label>

        {!form && (
          <button
            className={styles.primary}
            type="button"
            disabled={deletingId !== null || !canCreate}
            onClick={() => setForm({})}
          >
            Новая бронь
          </button>
        )}
      </div>

      {!form && !canCreate && (
        <p className={styles.note}>
          На выбранную дату не осталось времени для новой брони.
        </p>
      )}

      {form && (
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
      )}

      <section className={styles.schedule} aria-labelledby="schedule-heading">
        <h2 id="schedule-heading">Брони на выбранную дату</h2>

        {isLoading && (
          <p className={styles.status} role="status">Загружаем брони…</p>
        )}

        {error && (
          <div className={styles.status}>
            <p className={styles.error} role="alert">{error}</p>
            <button type="button" onClick={reload}>Повторить</button>
          </div>
        )}

        {!isLoading && !error && sortedBookings.length === 0 && (
          <p className={styles.status}>На эту дату броней нет</p>
        )}

        {sortedBookings.length > 0 && (
          <ul className={styles.list}>
            {sortedBookings.map((booking) => (
              <li key={booking.id} className={styles.row}>
                <div className={styles.details}>
                  <span className={styles.time}>{booking.start}–{booking.end}</span>
                  <span>{booking.title || "Бронь"}</span>
                </div>

                {!form && !hasBookingStarted(booking, now) && (
                  <div className={styles.actions}>
                    <button
                      type="button"
                      disabled={deletingId !== null}
                      onClick={() => setForm({ booking })}
                    >
                      Редактировать
                    </button>
                    <button
                      className={styles.danger}
                      type="button"
                      disabled={deletingId !== null}
                      onClick={() => void handleDelete(booking.id)}
                    >
                      {deletingId === booking.id ? "Удаляем…" : "Удалить"}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {deleteError && (
          <p className={`${styles.status} ${styles.error}`} role="alert">
            {deleteError}
          </p>
        )}
      </section>
    </main>
  );
}
