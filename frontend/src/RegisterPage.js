import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    password2: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8004/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      console.log("REGISTER RESPONSE:", data);

      if (response.ok) {
        localStorage.setItem("accessToken", data.tokens.access);
        localStorage.setItem("refreshToken", data.tokens.refresh);
        localStorage.setItem("username", data.user.username);
        localStorage.setItem("email", data.user.email || "");
        localStorage.setItem("firstName", data.user.first_name || "");
        localStorage.setItem("lastName", data.user.last_name || "");

        navigate("/dashboard");
      } else {
        if (typeof data === "object") {
          const firstError = Object.values(data)[0];
          if (Array.isArray(firstError)) {
            setError(firstError[0]);
          } else if (typeof firstError === "string") {
            setError(firstError);
          } else {
            setError("Nie udało się utworzyć konta.");
          }
        } else {
          setError("Nie udało się utworzyć konta.");
        }
      }
    } catch (err) {
      console.error("REGISTER ERROR:", err);
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
            Utwórz konto użytkownika.
          </p>

          <form className="auth-form" onSubmit={handleRegister}>
            <input className="auth-input" type="text" name="username" placeholder="Login" value={form.username} onChange={handleChange} required />
            <input className="auth-input" type="text" name="first_name" placeholder="Imię" value={form.first_name} onChange={handleChange} required />
            <input className="auth-input" type="text" name="last_name" placeholder="Nazwisko" value={form.last_name} onChange={handleChange} required />
            <input className="auth-input" type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            <input className="auth-input" type="password" name="password" placeholder="Hasło" value={form.password} onChange={handleChange} required />
            <input className="auth-input" type="password" name="password2" placeholder="Powtórz hasło" value={form.password2} onChange={handleChange} required />

            {error && <div className="auth-error">{error}</div>}

            <button className="auth-button" type="submit" disabled={loading}>
              {loading ? "Rejestracja..." : "Zarejestruj się"}
            </button>
          </form>

          <div className="auth-switch">
            Masz konto? <Link to="/">Zaloguj się</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;