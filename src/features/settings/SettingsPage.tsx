import { type FormEvent, useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { locationService } from "../../services/locationService";
import { getCurrentUserId, saveCurrentUserProfile } from "../../services/profileService";
import { isSupabaseConfigured } from "../../services/supabaseClient";
import { supabase } from "../../services/supabaseClient";
import { useAppStore } from "../../store/useAppStore";
import type { Contact } from "../../types";

export function SettingsPage() {
  const { mode, profile, setMode, setRiskTolerance, updateContact, addCustomSituation, setProfile } = useAppStore();
  const [notificationEnabled, setNotificationEnabled] = useState<boolean>(
    typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted",
  );
  const [locationStatus, setLocationStatus] = useState<string>("Not checked");
  const [newTitle, setNewTitle] = useState("");
  const [syncStatus, setSyncStatus] = useState(isSupabaseConfigured ? "Checking cloud sync…" : "Local mode");

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    getCurrentUserId()
      .then((userId) => setSyncStatus(userId ? "Cloud sync ready" : "Sign in to enable cloud sync"))
      .catch(() => setSyncStatus("Cloud sync unavailable"));
  }, []);

  async function syncProfile() {
    setSyncStatus("Syncing…");
    try {
      const result = await saveCurrentUserProfile(profile);
      setSyncStatus(result.synced ? "Saved to Supabase" : result.reason);
    } catch {
      setSyncStatus("Could not sync right now");
    }

  }

  async function signOut() {
    await supabase?.auth.signOut();
  }

  async function enableNotifications() {
    if (!("Notification" in window)) {
      setNotificationEnabled(false);
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationEnabled(permission === "granted");
  }

  function checkLocation() {
    if (!("geolocation" in navigator)) {
      setLocationStatus("Location not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async () => {
        setLocationStatus("Location access enabled");
        try {
          const coords = await locationService.getCurrentLocation();
          setLocationStatus(`Location ready: ${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`);
        } catch {
          setLocationStatus("Location ready");
        }
      },
      () => {
        setLocationStatus("Location denied — fallback mode remains active");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function handleContactUpdate(contact: Contact, field: keyof Contact, value: string) {
    updateContact(contact.id, { ...contact, [field]: value });
  }

  function handleAddCustomSituation(event: FormEvent) {
    event.preventDefault();
    if (!newTitle.trim()) {
      return;
    }

    addCustomSituation({
      id: `custom-${Date.now()}`,
      title: newTitle.trim(),
      category: "custom",
      likelihood: 58,
      impact: "medium",
      planA: ["Prepare your fallback route", "Give your team a quick heads-up"],
      planB: ["Reduce the task scope", "Move the task later in the day"],
      status: "open",
    });

    setNewTitle("");
  }

  async function handleShareLocation() {
    const coords = await locationService.getCurrentLocation();
    const mapsUrl = `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;
    const text = `I’m checking in. My location is ${mapsUrl}`;

    if (!window.confirm("Share your live location with a backup contact or group?")) {
      return;
    }

    if (navigator.share) {
      await navigator.share({ title: "My location", text, url: mapsUrl });
      return;
    }

    window.location.href = `sms:?body=${encodeURIComponent(text + "\n" + mapsUrl)}`;
  }

  return (
    <section className="settings-shell">
      <header className="plan-header">
        <div>
          <p className="eyebrow">PROFILE</p>
          <h1>Settings</h1>
        </div>
        <span className="pill">{mode}</span>
      </header>

      <Card className="settings-card">
        <div className="plan-card-header">
          <p className="eyebrow">MODE</p>
          <span className="muted">Operating style</span>
        </div>
        <div className="mode-toggle-row">
          {(["vigilante", "shadow"] as const).map((value) => (
            <Button
              key={value}
              type="button"
              variant={mode === value ? "primary" : "secondary"}
              onClick={() => setMode(value)}
            >
              {value}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="settings-card">
        <div className="plan-card-header">
          <p className="eyebrow">RISK TOLERANCE</p>
          <span className="muted">{profile.riskTolerance.toFixed(1)}</span>
        </div>
        <label className="slider-control" htmlFor="risk-tolerance-slider">
          <input
            id="risk-tolerance-slider"
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={profile.riskTolerance}
            onChange={(event) => setRiskTolerance(Number(event.target.value))}
            aria-label="Risk tolerance"
          />
        </label>
      </Card>

      <Card className="settings-card">
        <div className="plan-card-header">
          <p className="eyebrow">CONTACTS</p>
          <span className="muted">Backup list</span>
        </div>

        <div className="contacts-list">
          {profile.backupContacts.map((contact) => (
            <div key={contact.id} className="contact-row">
              <input
                value={contact.name}
                onChange={(event) => handleContactUpdate(contact, "name", event.target.value)}
                aria-label={`${contact.name} name`}
              />
              <input
                value={contact.phone}
                onChange={(event) => handleContactUpdate(contact, "phone", event.target.value)}
                aria-label={`${contact.name} phone`}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="settings-card">
        <div className="plan-card-header">
          <p className="eyebrow">PERMISSIONS</p>
          <span className="muted">Device access</span>
        </div>

        <div className="toggle-row">
          <span>Alerts</span>
          <Button type="button" variant={notificationEnabled ? "primary" : "secondary"} onClick={enableNotifications}>
            {notificationEnabled ? "Enabled" : "Enable"}
          </Button>
        </div>

        <div className="toggle-row">
          <span>Location</span>
          <Button type="button" variant="secondary" onClick={checkLocation}>
            Check access
          </Button>
        </div>

        <p className="muted form-note" role="status" aria-live="polite">{locationStatus}</p>
        <Button type="button" variant="ghost" onClick={handleShareLocation}>Share my location</Button>
      </Card>

      <Card className="settings-card">
        <div className="plan-card-header">
          <p className="eyebrow">WHATSAPP UPDATES</p>
          <span className="muted">Optional</span>
        </div>
        <label className="setup-label" htmlFor="whatsapp-phone">Mobile number</label>
        <input
          id="whatsapp-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+1 555 123 4567"
          value={profile.whatsappPhone}
          onChange={(event) => setProfile({ ...profile, whatsappPhone: event.target.value })}
        />
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={profile.whatsappOptIn}
            onChange={(event) => setProfile({ ...profile, whatsappOptIn: event.target.checked })}
          />
          I agree to receive timely Contingency Genius updates on WhatsApp.
        </label>
        <p className="muted form-note">Updates cover your schedule, weather, traffic, and relevant news. You can turn them off anytime.</p>
      </Card>

      <Card className="settings-card">
        <div className="plan-card-header">
          <p className="eyebrow">CLOUD SYNC</p>
          <span className="muted">{isSupabaseConfigured ? "Supabase" : "Local only"}</span>
        </div>
        <div className="toggle-row">
          <span className="muted" role="status" aria-live="polite">{syncStatus}</span>
          <Button type="button" variant="secondary" onClick={syncProfile} disabled={!isSupabaseConfigured}>
            Sync profile
          </Button>
        </div>
        <p className="muted form-note">Your local profile remains available even when cloud sync is not configured.</p>
      </Card>

      <Card className="settings-card">
        <div className="plan-card-header">
          <p className="eyebrow">CUSTOM SITUATIONS</p>
          <span className="muted">Library</span>
        </div>

        <form onSubmit={handleAddCustomSituation} className="custom-form">
          <input
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="Add custom risk"
            aria-label="Add custom risk"
          />
          <Button type="submit">Add</Button>
        </form>

        {profile.customSituations.length === 0 ? (
          <p className="muted">No custom situations yet. Add one to customize the briefing.</p>
        ) : (
          <ul className="custom-list">
            {profile.customSituations.map((situation) => (
              <li key={situation.id} className="custom-item">
                <strong>{situation.title}</strong>
                <span>{situation.likelihood}% · {situation.impact}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <button className="button button-ghost sign-out-button" type="button" onClick={signOut}>
        Sign out and start fresh
      </button>
    </section>
  );
}
