import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  ZoomControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

const LAYERS = [
  { key: "temperature", label: "Temperatura", unit: "°C" },
  { key: "wind", label: "Wiatr", unit: "km/h" },
  { key: "rain", label: "Opady", unit: "%" },
  { key: "humidity", label: "Wilgotność", unit: "%" },
  { key: "risk", label: "Ryzyko", unit: "%" },
];

const SERVICE_URLS = {
  weather: "http://localhost:8001",
  seismic: "http://localhost:8002",
  ocean: "http://localhost:8003",
  risk: "http://localhost:3000",
};

const FALLBACK_CITIES = [
  {
    id: 1,
    name: "Warszawa",
    country: "Polska",
    lat: 52.2297,
    lon: 21.0122,
    temperature: 17,
    wind: 22,
    rain: 15,
    humidity: 63,
    risk: 20,
    source: "fallback",
  },
];

function getColorByLayer(layer, value) {
  if (layer === "temperature") {
    if (value <= 5) return "#60a5fa";
    if (value <= 15) return "#34d399";
    if (value <= 22) return "#fbbf24";
    return "#fb7185";
  }

  if (layer === "wind") {
    if (value <= 10) return "#4ade80";
    if (value <= 20) return "#facc15";
    return "#f97316";
  }

  if (layer === "rain") {
    if (value <= 5) return "#86efac";
    if (value <= 15) return "#60a5fa";
    return "#2563eb";
  }

  if (layer === "humidity") {
    if (value <= 45) return "#f59e0b";
    if (value <= 65) return "#38bdf8";
    return "#1d4ed8";
  }

  if (layer === "risk") {
    if (value <= 25) return "#22c55e";
    if (value <= 50) return "#eab308";
    if (value <= 75) return "#f97316";
    return "#ef4444";
  }

  return "#ffffff";
}

function getRadiusByLayer(layer, value) {
  if (layer === "temperature") return Math.max(10, value * 0.9);
  if (layer === "wind") return Math.max(10, value * 0.7);
  if (layer === "rain") return Math.max(10, value * 0.9);
  if (layer === "humidity") return Math.max(10, value * 0.4);
  if (layer === "risk") return Math.max(10, value * 0.35);
  return 12;
}

function formatValue(layer, value) {
  const found = LAYERS.find((item) => item.key === layer);
  return `${value} ${found?.unit || ""}`.trim();
}

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizePoint(raw, source, index) {
  return {
    id: raw.id ?? `${source}-${index}`,
    name: raw.name ?? raw.city ?? raw.location ?? raw.region ?? `${source}-${index + 1}`,
    country: raw.country ?? raw.country_name ?? "Brak danych",
    lat: safeNumber(raw.lat ?? raw.latitude),
    lon: safeNumber(raw.lon ?? raw.longitude ?? raw.lng),
    temperature: safeNumber(raw.temperature ?? raw.temp ?? raw.temperature_2m, 0),
    wind: safeNumber(raw.wind ?? raw.wind_speed ?? raw.windSpeed, 0),
    rain: safeNumber(raw.rain ?? raw.precipitation ?? raw.precip ?? raw.rainfall, 0),
    humidity: safeNumber(raw.humidity ?? raw.relative_humidity, 0),
    risk: safeNumber(raw.risk ?? raw.risk_score ?? raw.score, 0),
    source,
  };
}

function extractArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.cities)) return data.cities;
  if (Array.isArray(data?.points)) return data.points;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return null;
}

async function fetchService(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.json();
}

function mergeByLocation(points) {
  const map = new Map();

  for (const point of points) {
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lon)) continue;

    const key = `${point.name}-${point.lat}-${point.lon}`;
    const existing = map.get(key);

    if (!existing) {
      map.set(key, { ...point });
    } else {
      map.set(key, {
        ...existing,
        temperature: point.temperature || existing.temperature,
        wind: point.wind || existing.wind,
        rain: point.rain || existing.rain,
        humidity: point.humidity || existing.humidity,
        risk: point.risk || existing.risk,
      });
    }
  }

  return Array.from(map.values());
}

function Dashboard() {
  const navigate = useNavigate();

  const [activeLayer, setActiveLayer] = useState("temperature");
  const [selectedCity, setSelectedCity] = useState(FALLBACK_CITIES[0]);
  const [timeIndex, setTimeIndex] = useState(8);
  const [query, setQuery] = useState("");
  const [cities, setCities] = useState(FALLBACK_CITIES);
  const [loading, setLoading] = useState(true);
  const [loadInfo, setLoadInfo] = useState("Ładowanie danych z mikroserwisów...");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const collected = [];
      const messages = [];

      for (const [source, baseUrl] of Object.entries(SERVICE_URLS)) {
        try {
          const data = await fetchService(`${baseUrl}/`);
          const arr = extractArray(data);

          if (arr) {
            collected.push(...arr.map((item, index) => normalizePoint(item, source, index)));
            messages.push(`${source}: OK`);
          } else if (data && typeof data === "object") {
            collected.push(normalizePoint(data, source, 0));
            messages.push(`${source}: OK`);
          } else {
            messages.push(`${source}: brak rozpoznawalnych danych`);
          }
        } catch (error) {
          messages.push(`${source}: błąd`);
        }
      }

      const merged = mergeByLocation(collected);

      if (merged.length > 0) {
        setCities(merged);
        setSelectedCity(merged[0]);
      } else {
        setCities(FALLBACK_CITIES);
        setSelectedCity(FALLBACK_CITIES[0]);
      }

      setLoadInfo(messages.join(" | "));
      setLoading(false);
    };

    loadData();
  }, []);

  const filteredCities = useMemo(() => {
    if (!query.trim()) return cities;

    return cities.filter((city) =>
      `${city.name} ${city.country}`.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, cities]);

  const timelineLabels = [
    "00:00",
    "03:00",
    "06:00",
    "09:00",
    "12:00",
    "15:00",
    "18:00",
    "21:00",
  ];

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("firstName");
    localStorage.removeItem("lastName");
    navigate("/");
  };

  return (
    <div className="weather-dashboard">
      <aside className="weather-sidebar">
        <div className="sidebar-brand">
          <img src="/logo_white.png" alt="WeatherBe" className="sidebar-logo" />
        </div>

        <div className="sidebar-section">
          <div className="sidebar-title">Warstwy</div>

          <div className="layer-list">
            {LAYERS.map((layer) => (
              <button
                key={layer.key}
                className={`layer-btn ${activeLayer === layer.key ? "layer-btn-active" : ""}`}
                onClick={() => setActiveLayer(layer.key)}
              >
                {layer.label}
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-title">Wybrane miejsce</div>

          <div className="city-card">
            <h3>{selectedCity.name}</h3>
            <p>{selectedCity.country}</p>

            <div className="city-stats">
              <div>
                <span>Temperatura</span>
                <strong>{selectedCity.temperature} °C</strong>
              </div>
              <div>
                <span>Wiatr</span>
                <strong>{selectedCity.wind} km/h</strong>
              </div>
              <div>
                <span>Opady</span>
                <strong>{selectedCity.rain} %</strong>
              </div>
              <div>
                <span>Wilgotność</span>
                <strong>{selectedCity.humidity} %</strong>
              </div>
              <div>
                <span>Ryzyko</span>
                <strong>{selectedCity.risk} %</strong>
              </div>
              <div>
                <span>Źródło</span>
                <strong>{selectedCity.source}</strong>
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
              className="search-input"
            />
          </div>

          <div className="topbar-right">
            <div className="status-chip">
              Warstwa: <strong>{LAYERS.find((item) => item.key === activeLayer)?.label}</strong>
            </div>
            <div className="status-chip">
              {loading ? "Ładowanie..." : loadInfo}
            </div>
          </div>
        </div>

        <div className="map-shell">
          <MapContainer
            center={[51.5, 15.0]}
            zoom={5}
            minZoom={4}
            zoomControl={false}
            className="leaflet-map"
          >
            <ZoomControl position="topright" />

            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {filteredCities.map((city) => {
              const value = city[activeLayer] ?? 0;

              return (
                <CircleMarker
                  key={city.id}
                  center={[city.lat, city.lon]}
                  radius={getRadiusByLayer(activeLayer, value)}
                  pathOptions={{
                    color: "#ffffff",
                    weight: 2,
                    fillColor: getColorByLayer(activeLayer, value),
                    fillOpacity: 0.75,
                  }}
                  eventHandlers={{
                    click: () => setSelectedCity(city),
                  }}
                >
                  <Popup>
                    <div className="popup-card">
                      <strong>{city.name}, {city.country}</strong>
                      <div>{LAYERS.find((item) => item.key === activeLayer)?.label}</div>
                      <div>{formatValue(activeLayer, value)}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>

          <div className="map-overlay-card">
            <div className="overlay-title">Podgląd warstwy</div>
            <div className="overlay-value">
              {LAYERS.find((item) => item.key === activeLayer)?.label}
            </div>
            <div className="overlay-subtitle">
              Kliknij punkt na mapie, aby podejrzeć szczegóły miejsca
            </div>
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

        <div className="timeline-panel">
          <div className="timeline-top">
            <div>
              <div className="timeline-title">Oś czasu</div>
              <div className="timeline-subtitle">Widok demonstracyjny</div>
            </div>
            <div className="timeline-badge">{timelineLabels[timeIndex]}</div>
          </div>

          <input
            type="range"
            min="0"
            max={timelineLabels.length - 1}
            value={timeIndex}
            onChange={(e) => setTimeIndex(Number(e.target.value))}
            className="timeline-slider"
          />

          <div className="timeline-labels">
            {timelineLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;