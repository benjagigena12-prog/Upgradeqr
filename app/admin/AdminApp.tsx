"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Card } from "@/lib/types";

const SITE_URL = "https://upgradingqr.store";

export default function AdminApp() {
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [cards, setCards] = useState<Card[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [generateCount, setGenerateCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  async function loadCards() {
    setLoadError("");
    try {
      const res = await fetch("/api/admin/cards");
      if (res.status === 401) {
        setAuthenticated(false);
        setAuthChecked(true);
        return;
      }
      if (!res.ok) {
        setLoadError("No se pudieron cargar las tarjetas. Inténtalo de nuevo.");
        setAuthChecked(true);
        return;
      }
      const data = await res.json();
      setCards(data.cards);
      setAuthenticated(true);
      setAuthChecked(true);
    } catch {
      setLoadError("No se pudo conectar con el servidor.");
      setAuthChecked(true);
    }
  }

  useEffect(() => {
    loadCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoginError(data.error || "No se pudo iniciar sesión.");
        setLoggingIn(false);
        return;
      }
      setPassword("");
      setLoggingIn(false);
      await loadCards();
    } catch {
      setLoginError("No se pudo conectar con el servidor.");
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setCards(null);
  }

  async function updateCard(
    code: string,
    changes: Partial<Pick<Card, "active" | "url">>
  ) {
    const res = await fetch(`/api/admin/cards/${code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error || "No se pudo actualizar la tarjeta.");
      return;
    }
    setCards((prev) =>
      prev ? prev.map((c) => (c.code === code ? data.card : c)) : prev
    );
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/cards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: generateCount }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "No se pudieron generar tarjetas nuevas.");
        setGenerating(false);
        return;
      }
      await loadCards();
    } finally {
      setGenerating(false);
    }
  }

  async function copyUrl(code: string) {
    const fullUrl = `${SITE_URL}/${code}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1500);
    } catch {
      window.prompt("Copia esta URL manualmente:", fullUrl);
    }
  }

  if (!authChecked) {
    return (
      <main className="admin-page">
        <p>Cargando...</p>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="admin-page">
        <form className="login-card" onSubmit={handleLogin}>
          <h1>Panel de administración</h1>
          <p>Introduce la contraseña para continuar.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            autoFocus
          />
          {loginError && <p className="error-text">{loginError}</p>}
          <button type="submit" disabled={loggingIn}>
            {loggingIn ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </main>
    );
  }

  const filteredCards = (cards || []).filter((c) =>
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="admin-page">
      <div className="admin-header">
        <h1>Panel de administración — Upgrading</h1>
        <button className="secondary" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>

      <div className="admin-toolbar">
        <input
          type="text"
          placeholder="Buscar código (ej. A001)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="generate-box">
          <input
            type="number"
            min={1}
            max={200}
            value={generateCount}
            onChange={(e) => setGenerateCount(Number(e.target.value))}
          />
          <button onClick={handleGenerate} disabled={generating}>
            {generating ? "Generando..." : "Generar nuevas tarjetas"}
          </button>
        </div>
      </div>

      {loadError && <p className="error-text">{loadError}</p>}

      <div className="cards-table-wrapper">
        <table className="cards-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Estado</th>
              <th>URL de Google Reviews</th>
              <th>QR</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredCards.map((card) => (
              <CardRow
                key={card.code}
                card={card}
                onUpdate={updateCard}
                onCopy={copyUrl}
                copied={copiedCode === card.code}
              />
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function CardRow({
  card,
  onUpdate,
  onCopy,
  copied,
}: {
  card: Card;
  onUpdate: (
    code: string,
    changes: Partial<Pick<Card, "active" | "url">>
  ) => Promise<void>;
  onCopy: (code: string) => void;
  copied: boolean;
}) {
  const [url, setUrl] = useState(card.url || "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onUpdate(card.code, { url, active: true });
    setSaving(false);
  }

  async function handleDeactivate() {
    setSaving(true);
    await onUpdate(card.code, { active: false });
    setSaving(false);
  }

  return (
    <tr>
      <td className="code-cell">
        <span>{card.code}</span>
        <button className="link-button" onClick={() => onCopy(card.code)}>
          {copied ? "¡Copiado!" : "Copiar URL"}
        </button>
      </td>
      <td>
        <span className={card.active ? "badge badge-active" : "badge badge-inactive"}>
          {card.active ? "Activada" : "No activada"}
        </span>
      </td>
      <td>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://search.google.com/local/writereview?placeid=..."
        />
      </td>
      <td>
        <a
          className="link-button"
          href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
            `${SITE_URL}/${card.code}`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Ver / Descargar QR
        </a>
      </td>
      <td className="actions-cell">
        <button onClick={handleSave} disabled={saving}>
          Guardar y activar
        </button>
        {card.active && (
          <button className="secondary" onClick={handleDeactivate} disabled={saving}>
            Desactivar
          </button>
        )}
      </td>
    </tr>
  );
}
