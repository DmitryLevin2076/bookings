import { useState } from "react";
import type { SubmitEvent } from "react";
import { ApiError, createBooking } from "./api";

type Props = {
  date: string;
  onSaved: () => void;
  onConflict: () => void;
  onCancel: () => void;
};

export function BookingForm({ date, onSaved, onConflict, onCancel }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    const fields = new FormData(event.currentTarget);
    setError(null);
    setIsSaving(true);

    try {
      await createBooking({
        date,
        start: String(fields.get("start") ?? ""),
        end: String(fields.get("end") ?? ""),
        title: String(fields.get("title") ?? ""),
      });
      onSaved();
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 409) {
        onConflict();
      }
      setError(error instanceof Error ? error.message : "Не удалось сохранить бронь");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Новая бронь</h2>
      <p>{date} · UTC</p>

      <fieldset disabled={isSaving}>
        <label>
          Начало{" "}
          <input name="start" type="time" min="09:00" max="18:00" required />
        </label>

        <label>
          Окончание{" "}
          <input name="end" type="time" min="09:00" max="18:00" required />
        </label>

        <label>
          Название{" "}
          <input name="title" type="text" />
        </label>

        <button type="submit">{isSaving ? "Сохраняем…" : "Сохранить"}</button>
        <button type="button" onClick={onCancel}>Отмена</button>
      </fieldset>

      {error && <p role="alert">{error}</p>}
    </form>
  );
}
