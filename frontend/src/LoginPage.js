import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8004/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
        }),
      });

      const data = await response.json();
      console.log("LOGIN RESPONSE:", data);

      if (response.ok) {
        localStorage.setItem("accessToken", data.tokens.access);
        localStorage.setItem("refreshToken", data.tokens.refresh);
        localStorage.setItem("username", data.user.username);
        localStorage.setItem("email", data.user.email || "");
        localStorage.setItem("firstName", data.user.first_name || "");
        localStorage.setItem("lastName", data.user.last_name || "");

        navigate("/dashboard");
      } else {
        setError(data.detail || "Nieprawidłowe dane logowania.");
      }
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setError("Nie udało się połączyć z backendem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <video className="background-video" autoPlay loop muted playsInline>
        <source src="/background.mp4" type="video/mp4" />
      </video>

      <div className="video-overlay" />

      <div className="auth-wrapper">
        <div className="auth-card">

          <div className="brand-wrap">
            <img
              src="/logo_white.png"
              alt="WeatherBe"
              className="brand-logo"
            />
          </div>

          <p className="auth-subtitle auth-subtitle-centered">
            Zaloguj się do systemu monitorowania warunków pogodowych
          </p>

          <form className="auth-form" onSubmit={handleLogin}>
            <input
              className="auth-input"
              type="text"
              name="username"
              placeholder="Login"
              value={form.username}
              onChange={handleChange}
              required
            />

            <input
              className="auth-input"
              type="password"
              name="password"
              placeholder="Hasło"
              value={form.password}
              onChange={handleChange}
              required
            />

            {error && <div className="auth-error">{error}</div>}

            <button className="auth-button" type="submit" disabled={loading}>
              {loading ? "Logowanie..." : "Zaloguj się"}
            </button>
          </form>

          <div className="auth-switch">
            Nie masz konta? <Link to="/register">Zarejestruj się</Link>
          </div>

        </div>
      </div>
    </div>
  );
}

export default LoginPage;