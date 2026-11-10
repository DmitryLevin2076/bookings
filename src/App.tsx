import { useState } from "react";
import { useBookings } from "./bookings/useBookings";
import { BookingForm } from "./bookings/BookingForm";

export default function App() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { bookings, isLoading, error, reload } = useBookings(date);

  const sortedBookings = [...bookings].sort((a, b) =>
    a.start.localeCompare(b.start),
  );

  return (
    <main>
      <h1>Бронирование переговорной</h1>
      <p>Рабочие часы 09:00–18:00 UTC</p>

      <label>
        Дата{" "}
        <input
          type="date"
          value={date}
          disabled={isFormOpen}
          onChange={(event) => {
            if (event.target.value) setDate(event.target.value);
          }}
        />
      </label>

      <h2>Брони на выбранную дату</h2>

      {isLoading && <p role="status">Загружаем брони…</p>}

      {error && (
        <>
          <p role="alert">{error}</p>
          <button type="button" onClick={reload}>Повторить</button>
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
            </li>
          ))}
        </ul>
      )}

      {isFormOpen ? (
        <BookingForm
          date={date}
          onSaved={() => {
            setIsFormOpen(false);
            reload();
          }}
          onConflict={reload}
          onCancel={() => setIsFormOpen(false)}
        />
      ) : (
        <button
          type="button"
          disabled={date < new Date().toISOString().slice(0, 10)}
          onClick={() => setIsFormOpen(true)}
        >
          Новая бронь
        </button>
      )}
    </main>
  );
}
