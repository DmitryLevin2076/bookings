import { FC, useState } from "react";
import type { SubmitEvent } from "react";
import { ApiError, createBooking, updateBooking } from "./api";
import { getEarliestBookingStart } from "./domain";
import type { Booking } from "./types";

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
    <form onSubmit={handleSubmit}>
      <h2>{booking ? "Редактирование брони" : "Новая бронь"}</h2>
      {!booking && <p>{targetDate} · UTC</p>}

      <fieldset disabled={isSaving}>
        {booking && (
          <label>
            Дата (UTC){" "}
            <input
              name="date"
              type="date"
              value={targetDate}
              onChange={(event) => setTargetDate(event.currentTarget.value)}
              required
            />
          </label>
        )}

        <label>
          Начало{" "}
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
          Окончание{" "}
          <input
            name="end"
            type="time"
            min="09:00"
            max="18:00"
            defaultValue={booking?.end}
            required
          />
        </label>

        <label>
          Название{" "}
          <input name="title" type="text" defaultValue={booking?.title} />
        </label>

        {targetDate && minStart === null && (
          <p role="status">
            На выбранную дату не осталось времени для брони от 30 минут.
          </p>
        )}

        <button type="submit" disabled={minStart === null}>
          {isSaving ? "Сохраняем…" : "Сохранить"}
        </button>
        <button type="button" onClick={onCancel}>
          Отмена
        </button>
      </fieldset>

      {error && <p role="alert">{error}</p>}
    </form>
  );
}
