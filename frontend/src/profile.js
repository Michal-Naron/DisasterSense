import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./profile.css";

const USER_API = "http://user-service:8000/edit-user/";

const favoritePlaces = [
  { name: "Warszawa", country: "Polska", temperature: 18, wind: 12, rain: 0 },
  { name: "Berlin", country: "Niemcy", temperature: 16, wind: 9, rain: 1 },
  { name: "Paryż", country: "Francja", temperature: 21, wind: 7, rain: 0 },
];

function Profile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("favorites");

  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
  });

  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(USER_API, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Nie udało się pobrać danych użytkownika");
        }

        const data = await response.json();

        setUserData({
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          username: data.username || "",
          email: data.email || "",
          password: "",
        });
      } catch (error) {
        console.error(error);

        setUserData({
          firstName: localStorage.getItem("firstName") || "Jan",
          lastName: localStorage.getItem("lastName") || "Kowalski",
          username: localStorage.getItem("username") || "jan123",
          email: localStorage.getItem("email") || "jan@example.com",
          password: "",
        });
      }
    };

    loadUserData();
  }, []);

  const startEdit = (field) => {
    setEditingField(field);
    setEditValue(field === "password" ? "" : userData[field] || "");
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const saveField = async (field) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(USER_API, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          [field]: editValue,
        }),
      });

      if (!response.ok) {
        throw new Error("Nie udało się zapisać zmian");
      }

      const updatedUser = await response.json();

      setUserData((prev) => ({
        ...prev,
        ...updatedUser,
        [field]: field === "password" ? "" : editValue,
      }));

      if (field !== "password") {
        localStorage.setItem(field, editValue);
      }

      cancelEdit();
    } catch (error) {
      console.error(error);
    }
  };

  const ProfileField = ({ label, field, type = "text" }) => (
    <div className="profile-data-row">
      <div>
        <span>{label}</span>

        {editingField === field ? (
          <input
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="profile-edit-input"
          />
        ) : (
          <strong>
            {field === "password"
              ? "••••••••"
              : userData[field] || "Brak danych"}
          </strong>
        )}
      </div>

      {editingField === field ? (
        <div className="profile-edit-actions">
          <button onClick={() => saveField(field)}>Zapisz</button>
          <button onClick={cancelEdit}>Anuluj</button>
        </div>
      ) : (
        <button onClick={() => startEdit(field)}>Edytuj</button>
      )}
    </div>
  );

  const username = userData.username || "jan123";
  const email = userData.email || "brak adresu e-mail";

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

            <div className="profile-data-list">
              <ProfileField label="Imię" field="firstName" />
              <ProfileField label="Nazwisko" field="lastName" />
              <ProfileField label="Login" field="username" />
              <ProfileField label="E-mail" field="email" type="email" />
              <ProfileField label="Hasło" field="password" type="password" />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default Profile;