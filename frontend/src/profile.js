import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./profile.css";

const favoritePlaces = [
  {
    name: "Warszawa",
    country: "Polska",
    temperature: 18,
    wind: 12,
    rain: 0,
  },
  {
    name: "Berlin",
    country: "Niemcy",
    temperature: 16,
    wind: 9,
    rain: 1,
  },
  {
    name: "Paryż",
    country: "Francja",
    temperature: 21,
    wind: 7,
    rain: 0,
  },
];

function Profile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("favorites");

  const username =
    localStorage.getItem("username") ||
    localStorage.getItem("firstName") ||
    "jan123";

  const email = localStorage.getItem("email") || "brak adresu e-mail";

  return (
    <div className="profile-page">
      <div className="profile-container">
        <button className="profile-back" onClick={() => navigate("/dashboard")}>
          ← Wróć do mapy
        </button>

        <section className="profile-header">
          <div className="profile-avatar">
            {username.charAt(0).toUpperCase()}
          </div>

          <div>
            <h1>{username}</h1>
            <p>{email}</p>
          </div>
        </section>

        <div className="profile-tabs">
          <button
            className={activeTab === "favorites" ? "tab-active" : ""}
            onClick={() => setActiveTab("favorites")}
          >
            Ulubione miejsca
          </button>

          <button
            className={activeTab === "settings" ? "tab-active" : ""}
            onClick={() => setActiveTab("settings")}
          >
            Ustawienia
          </button>
        </div>

        {activeTab === "favorites" && (
          <section className="profile-card">
            <h2>Ulubione miejsca</h2>
            <p className="profile-muted">
              Lista lokalizacji zapisanych przez użytkownika.
            </p>

            <div className="favorite-list">
              {favoritePlaces.map((place) => (
                <div className="favorite-card" key={place.name}>
                  <div>
                    <h3>{place.name}</h3>
                    <p>{place.country}</p>
                  </div>

                  <div className="favorite-weather">
                    <span>{place.temperature}°C</span>
                    <span>{place.wind} km/h</span>
                    <span>{place.rain} mm</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "settings" && (
          <section className="profile-card">
            <h2>Ustawienia profilu</h2>
            <p className="profile-muted">
              Tutaj później można dodać zmianę hasła, avataru albo preferowane jednostki.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

export default Profile;