import { useState } from "react";
import type { AgeGroup, CalendarEvent } from "../../types";

export interface DaySetup {
  ageGroup: AgeGroup;
  dayDescription: string;
  priorities: string;
  concerns: string;
  events: CalendarEvent[];
}

const ageGroups: { value: AgeGroup; label: string }[] = [
  { value: "under-18", label: "Under 18" },
  { value: "18-24", label: "18–24" },
  { value: "25-44", label: "25–44" },
  { value: "45-64", label: "45–64" },
  { value: "65-plus", label: "65+" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
];

export function DaySetupForm({ onSubmit }: { onSubmit: (setup: DaySetup) => void }) {
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("prefer-not-to-say");
  const [dayDescription, setDayDescription] = useState("");
  const [priorities, setPriorities] = useState("");
  const [concerns, setConcerns] = useState("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventTitle, setEventTitle] = useState("");
  const [eventTime, setEventTime] = useState("09:00");
  const [eventDuration, setEventDuration] = useState("60");
  const [eventLocation, setEventLocation] = useState("");
  const [isOutdoor, setIsOutdoor] = useState(false);

  function addEvent() {
    if (!eventTitle.trim()) return;
    const today = new Date().toISOString().slice(0, 10);
    const start = new Date(`${today}T${eventTime}:00`);
    const end = new Date(start.getTime() + Number(eventDuration) * 60_000);
    setEvents((current) => [
      ...current,
      {
        id: `day-${Date.now()}`,
        title: eventTitle.trim(),
        start: start.toISOString(),
        end: end.toISOString(),
        location: eventLocation.trim() || undefined,
        outdoor: isOutdoor,
      },
    ].sort((a, b) => a.start.localeCompare(b.start)));
    setEventTitle("");
    setEventLocation("");
  }

  return (
    <form className="day-setup-form" onSubmit={(event) => { event.preventDefault(); onSubmit({ ageGroup, dayDescription, priorities, concerns, events }); }}>
      <div className="setup-section">
        <p className="eyebrow">01 / ABOUT YOU</p>
        <label className="setup-label" htmlFor="age-group">What age group are you in?</label>
        <select id="age-group" value={ageGroup} onChange={(event) => setAgeGroup(event.target.value as AgeGroup)}>
          {ageGroups.map((group) => <option key={group.value} value={group.value}>{group.label}</option>)}
        </select>
        <label className="setup-label" htmlFor="day-description">What does your day look like?</label>
        <textarea id="day-description" value={dayDescription} onChange={(event) => setDayDescription(event.target.value)} placeholder="A busy office day, school and practice, errands with the kids…" rows={3} />
      </div>

      <div className="setup-section">
        <p className="eyebrow">02 / YOUR SIGNALS</p>
        <label className="setup-label" htmlFor="priorities">What matters most today?</label>
        <input id="priorities" value={priorities} onChange={(event) => setPriorities(event.target.value)} placeholder="Focus, getting home on time, staying energized…" />
        <label className="setup-label" htmlFor="concerns">What could get in the way?</label>
        <textarea id="concerns" value={concerns} onChange={(event) => setConcerns(event.target.value)} placeholder="Rain, traffic, low battery, a difficult conversation…" rows={3} />
      </div>

      <div className="setup-section">
        <p className="eyebrow">03 / BUILD YOUR DAY</p>
        <div className="event-builder">
          <input aria-label="Event name" value={eventTitle} onChange={(event) => setEventTitle(event.target.value)} placeholder="Add an event or commitment" />
          <div className="event-builder-row">
            <input aria-label="Event time" type="time" value={eventTime} onChange={(event) => setEventTime(event.target.value)} />
            <select aria-label="Event duration" value={eventDuration} onChange={(event) => setEventDuration(event.target.value)}>
              <option value="30">30 min</option><option value="60">1 hour</option><option value="90">90 min</option><option value="120">2 hours</option>
            </select>
          </div>
          <input aria-label="Event location" value={eventLocation} onChange={(event) => setEventLocation(event.target.value)} placeholder="Location (optional)" />
          <label className="checkbox-label"><input type="checkbox" checked={isOutdoor} onChange={(event) => setIsOutdoor(event.target.checked)} /> Outdoors or travel involved</label>
          <button className="button button-ghost" type="button" onClick={addEvent}>Add to my day <span aria-hidden="true">+</span></button>
        </div>
        {events.length > 0 && <ul className="setup-event-list">{events.map((item) => <li key={item.id}><strong>{item.title}</strong><span>{new Date(item.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}{item.outdoor ? " · outdoors" : ""}</span></li>)}</ul>}
      </div>

      <button className="button onboarding-cta" type="submit">Build my contingency plan <span aria-hidden="true">↗</span></button>
    </form>
  );
}
