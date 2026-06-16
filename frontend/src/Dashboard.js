import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  ZoomControl,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const LAYERS = [
  { key: "temperature", apiKey: "temperature_2m", label: "Temperatura", unit: "°C" },
  { key: "wind", apiKey: "wind_speed_10m", label: "Wiatr", unit: "km/h" },
  { key: "rain", apiKey: "rain", label: "Opady", unit: "mm" },
];

const WEATHER_BASE_URL = "http://localhost:8001/v1/weather";

const DEFAULT_EUROPE_CITIES = [
  { name: "Londyn", country: "Wielka Brytania", lat: 51.5074, lon: -0.1278 },
  { name: "Paryż", country: "Francja", lat: 48.8566, lon: 2.3522 },
  { name: "Berlin", country: "Niemcy", lat: 52.52, lon: 13.405 },
  { name: "Madryt", country: "Hiszpania", lat: 40.4168, lon: -3.7038 },
  { name: "Rzym", country: "Włochy", lat: 41.9028, lon: 12.4964 },
  { name: "Wiedeń", country: "Austria", lat: 48.2082, lon: 16.3738 },
  { name: "Warszawa", country: "Polska", lat: 52.2297, lon: 21.0122 },
  { name: "Budapeszt", country: "Węgry", lat: 47.4979, lon: 19.0402 },
  { name: "Praga", country: "Czechy", lat: 50.0755, lon: 14.4378 },
  { name: "Amsterdam", country: "Holandia", lat: 52.3676, lon: 4.9041 },
];

const DEFAULT_LOCATION =
  DEFAULT_EUROPE_CITIES.find((city) => city.name === "Warszawa") ||
  DEFAULT_EUROPE_CITIES[0];

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getColorByLayer(layer, value) {
  const safeValue = safeNumber(value);

  if (layer === "temperature") {
    if (safeValue <= 0) return "#60a5fa";
    if (safeValue <= 10) return "#34d399";
    if (safeValue <= 20) return "#fbbf24";
    return "#fb7185";
  }

  if (layer === "wind") {
    if (safeValue <= 10) return "#4ade80";
    if (safeValue <= 25) return "#facc15";
    return "#f97316";
  }

  if (layer === "rain") {
    if (safeValue <= 0.2) return "#86efac";
    if (safeValue <= 2) return "#60a5fa";
    return "#2563eb";
  }

  return "#ffffff";
}

function getRadiusByLayer(layer, value) {
  const safeValue = safeNumber(value);

  if (layer === "temperature") return Math.max(12, Math.abs(safeValue) * 0.8 + 10);
  if (layer === "wind") return Math.max(12, safeValue * 0.35 + 10);
  if (layer === "rain") return Math.max(12, safeValue * 3 + 10);

  return 14;
}

function formatValue(layer, value) {
  const found = LAYERS.find((item) => item.key === layer);
  return `${safeNumber(value)} ${found?.unit || ""}`.trim();
}

function MapController({ selectedCity }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedCity?.lat || !selectedCity?.lon) return;

    map.flyTo([selectedCity.lat, selectedCity.lon], 7, {
      duration: 1.2,
    });
  }, [selectedCity, map]);

  return null;
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}

async function fetchWeatherValue(weatherKey, lat, lon) {
  try {
    const url = `${WEATHER_BASE_URL}/${weatherKey}?lat=${lat}&lon=${lon}`;
    const response = await fetch(url);

    if (!response.ok) return 0;

    const data = await response.json();
    const object = data?.[weatherKey];

    if (!object || typeof object !== "object") return 0;

    const values = Object.values(object).map((v) => safeNumber(v, 0));
    return values[0] ?? 0;
  } catch (error) {
    console.error(error);
    return 0;
  }
}

async function getWeatherForLocation(location) {
  const [temperature, wind, rain] = await Promise.all([
    fetchWeatherValue("temperature_2m", location.lat, location.lon),
    fetchWeatherValue("wind_speed_10m", location.lat, location.lon),
    fetchWeatherValue("rain", location.lat, location.lon),
  ]);

  return {
    ...location,
    temperature,
    wind,
    rain,
  };
}

async function fetchRiskScore(location) {
  try {
    const response = await fetch(
      `http://localhost:3000/v1/risk-score?lat=${location.lat}&lon=${location.lon}`
    );

    if (!response.ok) throw new Error("Risk score API error");

    return await response.json();
  } catch (error) {
    console.error(error);

    return {
      score: 21,
      level: "niski",
      history: [12, 18, 15, 22, 19, 25, 21],
    };
  }
}

async function searchLocation(query) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
        query
      )}`
    );

    if (!response.ok) return null;

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) return null;

    const first = data[0];
    const parts = String(first.display_name || "").split(",");

    return {
      name: parts[0]?.trim() || query,
      country: parts[parts.length - 1]?.trim() || "Brak danych",
      lat: safeNumber(first.lat),
      lon: safeNumber(first.lon),
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function reverseGeocode(lat, lon) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
    );

    if (!response.ok) {
      return {
        name: `Lat ${lat.toFixed(3)}, Lon ${lon.toFixed(3)}`,
        country: "Brak danych",
      };
    }

    const data = await response.json();
    const address = data?.address || {};

    return {
      name:
        address.city ||
        address.town ||
        address.village ||
        address.county ||
        "Nowa lokalizacja",
      country: address.country || "Brak danych",
    };
  } catch (error) {
    console.error(error);

    return {
      name: `Lat ${lat.toFixed(3)}, Lon ${lon.toFixed(3)}`,
      country: "Brak danych",
    };
  }
}

function Dashboard() {
  const navigate = useNavigate();

  const [activeLayer, setActiveLayer] = useState("temperature");
  const [query, setQuery] = useState("");
  const [defaultCities, setDefaultCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState({
    ...DEFAULT_LOCATION,
    temperature: 0,
    wind: 0,
    rain: 0,
  });

  const username =
    localStorage.getItem("username") ||
    localStorage.getItem("firstName") ||
    "Użytkowniku";

  const loadWeatherForLocation = async (location) => {
  const cityWithWeather = await getWeatherForLocation(location);
  const risk = await fetchRiskScore(cityWithWeather);

  setSelectedCity(cityWithWeather);
  setRiskData(risk);
};

  const loadWeatherForDefaultCities = async () => {
    const citiesWithWeather = await Promise.all(
      DEFAULT_EUROPE_CITIES.map((city) => getWeatherForLocation(city))
    );

    setDefaultCities(citiesWithWeather);
  };

  useEffect(() => {
    loadWeatherForLocation(DEFAULT_LOCATION);
    loadWeatherForDefaultCities();
  }, []);

  const displayValues = useMemo(() => {
    return {
      temperature: selectedCity.temperature ?? 0,
      wind: selectedCity.wind ?? 0,
      rain: selectedCity.rain ?? 0,
    };
  }, [selectedCity]);

  const markerValue = displayValues[activeLayer];

const handleSearch = async () => {
  if (!query.trim()) return;

  const found = await searchLocation(query);

  if (!found) return;

  const cityWithWeather = await getWeatherForLocation(found);

  setSelectedCity(cityWithWeather);
  setQuery("");
};

  const handleMapClick = async (lat, lon) => {
    const location = await reverseGeocode(lat, lon);

    await loadWeatherForLocation({
      name: location.name,
      country: location.country,
      lat,
      lon,
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleOpenProfile = () => {
    navigate("/profile");
  };

const handleOpenAssistant = () => {
  setIsAssistantOpen(true);
};

const [isAssistantOpen, setIsAssistantOpen] = useState(false);

const [riskData, setRiskData] = useState({
  score: 0,
  level: "brak danych",
  history: [12, 18, 15, 22, 19, 25, 21],
});

  return (
    <div className="weather-dashboard">
      <aside className="weather-sidebar">
        <div className="sidebar-brand">
          <img src="/logo_white.png" alt="WeatherBe" className="sidebar-logo" />
        </div>

        <div className="sidebar-section">
          <div className="sidebar-title">WARSTWY</div>

          <div className="layer-list">
            {LAYERS.map((layer) => (
              <button
                key={layer.key}
                className={`layer-btn ${
                  activeLayer === layer.key ? "layer-btn-active" : ""
                }`}
                onClick={() => setActiveLayer(layer.key)}
              >
                {layer.label}
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-title">WYBRANE MIEJSCE</div>

          <div className="city-card">
            <h3>{selectedCity.name}</h3>
            <p>{selectedCity.country}</p>

            <div className="city-stats">
              <div>
                <span>Temperatura</span>
                <strong>{displayValues.temperature} °C</strong>
              </div>

              <div>
                <span>Wiatr</span>
                <strong>{displayValues.wind} km/h</strong>
              </div>

              <div>
                <span>Opady</span>
                <strong>{displayValues.rain} mm</strong>
              </div>
            </div>
          </div>
          <div className="risk-card">
            <div className="risk-card-header">
              <div>
                <span>RISK SCORE</span>
                <strong>{riskData.score}/100</strong>
              </div>

              <div className={`risk-pill risk-${riskData.level}`}>
                {riskData.level}
              </div>
            </div>
          </div>  
        </div>

        <div className="sidebar-section sidebar-footer">
          <button className="logout-button" onClick={handleLogout}>
            Wyloguj
          </button>
        </div>
      </aside>

      <main className="weather-main">
        <div className="topbar">
          <div className="search-wrap">
            <input
              type="text"
              placeholder="Wpisz miejsce..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              className="search-input"
            />

            <button className="search-button" onClick={handleSearch}>
              Szukaj
            </button>
          </div>

          <div className="topbar-right">
            <button className="assistant-button" onClick={handleOpenAssistant}>
            Asystent AI
            </button>

            <button className="profile-button" onClick={handleOpenProfile}>
              Witaj, {username}
            </button>
          </div>
        </div>
        <div className="map-shell">
          <MapContainer
            center={[selectedCity.lat, selectedCity.lon]}
            zoom={6}
            minZoom={4}
            zoomControl={false}
            className="leaflet-map"
          >
            <MapController selectedCity={selectedCity} />
            <MapClickHandler onMapClick={handleMapClick} />

            <ZoomControl position="topright" />

            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {defaultCities.map((city) => {
              const value = city[activeLayer];

              return (
                <CircleMarker
                  key={city.name}
                  center={[city.lat, city.lon]}
                  radius={getRadiusByLayer(activeLayer, value)}
                  pathOptions={{
                    color: "#ffffff",
                    weight: 2,
                    fillColor: getColorByLayer(activeLayer, value),
                    fillOpacity: 0.8,
                  }}
                >
                  <Popup>
                    <div>
                      <strong>
                        {city.name}, {city.country}
                      </strong>
                      <div>
                        {LAYERS.find((item) => item.key === activeLayer)?.label}
                      </div>
                      <div>{formatValue(activeLayer, value)}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}

            <CircleMarker
              center={[selectedCity.lat, selectedCity.lon]}
              radius={getRadiusByLayer(activeLayer, markerValue)}
              pathOptions={{
                color: "#ffffff",
                weight: 3,
                fillColor: getColorByLayer(activeLayer, markerValue),
                fillOpacity: 0.95,
              }}
            >
              <Popup>
                <div>
                  <strong>
                    {selectedCity.name}, {selectedCity.country}
                  </strong>
                  <div>
                    {LAYERS.find((item) => item.key === activeLayer)?.label}
                  </div>
                  <div>{formatValue(activeLayer, markerValue)}</div>
                </div>
              </Popup>
            </CircleMarker>
          </MapContainer>

          <div className="map-overlay-card">
            <div className="overlay-title">Podgląd warstwy</div>

            <div className="overlay-value">
              {LAYERS.find((item) => item.key === activeLayer)?.label}
            </div>

            <div className="overlay-subtitle">{selectedCity.name}</div>
          </div>

          <div className="legend-box">
            <div className="legend-title">Skala</div>
            <div className="legend-gradient" />
            <div className="legend-labels">
              <span>niska</span>
              <span>wysoka</span>
            </div>
          </div>
        </div>
      </main>
      {isAssistantOpen && (
  <div className="ai-modal-backdrop" onClick={() => setIsAssistantOpen(false)}>
    <div className="ai-modal" onClick={(e) => e.stopPropagation()}>
      <div className="ai-modal-header">
        <h2>Asystent AI</h2>

        <button
          className="ai-modal-close"
          onClick={() => setIsAssistantOpen(false)}
        >
          ×
        </button>
      </div>

      <div className="ai-modal-content">
        <div className="ai-section">
          <span>Aktualna lokalizacja:</span>
          <strong>
            {selectedCity.name}, {selectedCity.country}
          </strong>
        </div>

        <div className="ai-section">
          <span>Parametry:</span>
          <strong>
            Temperatura: {displayValues.temperature}°C, Wiatr:{" "}
            {displayValues.wind} km/h, Opady: {displayValues.rain} mm
          </strong>
        </div>

        <div className="ai-section">
          <span>Rekomendacja:</span>
          <p>
            Warunki są stabilne. Możesz bezpiecznie zaplanować aktywność na
            zewnątrz, ale warto sprawdzić siłę wiatru przed dłuższym spacerem
            lub jazdą rowerem.
          </p>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

export default Dashboard;