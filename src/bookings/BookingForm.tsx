import { FC, useState } from "react";
import type { SubmitEvent } from "react";
import { ApiError, createBooking, updateBooking } from "./api";
import { getEarliestBookingStart } from "./domain";
import type { Booking } from "./types";
import styles from "./BookingForm.module.css";

type Props = {
  now: number;
  date: string;
  booking?: Booking;
  onSaved: (date: string) => void;
  onConflict: (date: string) => void;
  onCancel: () => void;
};

export const BookingForm: FC<Props> = (props) => {
  const {
    now,
    date,
    booking,
    onSaved,
    onConflict,
    onCancel,
  } = props;

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [targetDate, setTargetDate] = useState(booking?.date ?? date);

  const minStart = getEarliestBookingStart(targetDate, now);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving || minStart === null) return;

    const fields = new FormData(event.currentTarget);
    const input = {
      date: targetDate,
      start: String(fields.get("start") ?? ""),
      end: String(fields.get("end") ?? ""),
      title: String(fields.get("title") ?? ""),
    };

    setError(null);
    setIsSaving(true);

    try {
      const saved = booking
        ? await updateBooking(booking.id, input)
        : await createBooking(input);

      onSaved(saved.date);
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 409) {
        onConflict(input.date);
      }

      setError(
        error instanceof Error ? error.message : "Не удалось сохранить бронь",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2>{booking ? "Редактирование брони" : "Новая бронь"}</h2>
      {!booking && <p className={styles.hint}>{targetDate} · UTC</p>}

      <fieldset className={styles.fields} disabled={isSaving}>
        {booking && (
          <label>
            Дата (UTC)
            <input
              name="date"
              type="date"
              value={targetDate}
              onChange={(event) => setTargetDate(event.currentTarget.value)}
              required
            />
          </label>
        )}

        <div className={styles.times}>
          <label>
            Начало (UTC)
            <input
              name="start"
              type="time"
              min={minStart ?? "09:00"}
              max="17:30"
              defaultValue={booking?.start}
              required
            />
          </label>

          <label>
            Окончание (UTC)
            <input
              name="end"
              type="time"
              min="09:00"
              max="18:00"
              defaultValue={booking?.end}
              required
            />
          </label>
        </div>

        <label>
          Название (необязательно)
          <input name="title" type="text" defaultValue={booking?.title} />
        </label>

        {targetDate && minStart === null && (
          <p className={styles.hint} role="status">
            На выбранную дату не осталось времени для брони от 30 минут.
          </p>
        )}

        {error && <p className={styles.error} role="alert">{error}</p>}

        <div className={styles.actions}>
          <button type="submit" disabled={minStart === null}>
            {isSaving ? "Сохраняем…" : "Сохранить"}
          </button>
          <button type="button" onClick={onCancel}>Отмена</button>
        </div>
      </fieldset>
    </form>
  );
}
