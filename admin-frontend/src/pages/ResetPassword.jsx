import React, { useState } from "react";
import { useLocation } from "react-router-dom";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ResetPassword() {
  const query = useQuery();
  const token = query.get("token");

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!token) {
      setMessage("Токен не передан в URL");
      return;
    }

    if (password.length < 6) {
      setMessage("Пароль должен быть не менее 6 символов");
      return;
    }

    if (password !== passwordConfirm) {
      setMessage("Пароли не совпадают");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Пароль успешно изменён! Можете войти.");
      } else {
        setMessage(data.error || "Ошибка при сбросе пароля");
      }
    } catch (err) {
      setMessage("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "50px auto", padding: 20, border: "1px solid #ccc", borderRadius: 8 }}>
      <h2>Сброс пароля</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Новый пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
          minLength={6}
          style={{ display: "block", width: "100%", marginBottom: 10, padding: 8, fontSize: 16 }}
        />
        <input
          type="password"
          placeholder="Подтверждение пароля"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          disabled={loading}
          required
          minLength={6}
          style={{ display: "block", width: "100%", marginBottom: 10, padding: 8, fontSize: 16 }}
        />
        <button type="submit" disabled={loading} style={{ width: "100%", padding: 10, fontSize: 16 }}>
          {loading ? "Отправка..." : "Сменить пароль"}
        </button>
      </form>
      {message && <p style={{ marginTop: 15 }}>{message}</p>}
    </div>
  );
}
