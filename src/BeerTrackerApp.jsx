import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { Bell, Beer } from "lucide-react";
import "./index.css";

const COLORS = ["red", "#fcd34d", "orange", "green", "blue", "purple", "pink"];
const NO_BEER_MESSAGES = [
  "Sei sicuro? Zero birre? Stai bluffando...",
  "Nemmeno una birretta? Sei in punizione?",
  "La tua tazza piange di solitudine.",
  "Oggi dieta ferrea o hai finito i soldi?",
  "Birra assente, motivazione sconosciuta.",
  "Non ti riconosco più, dove sono le birre?",
  "Il barista si sta preoccupando.",
  "Zero birre, zero party.",
  "Hai cambiato vita o solo bar?",
  "La birra ti sta aspettando, non deluderla.",
  "Oggi il fegato ringrazia.",
  "Birra in sciopero?",
  "Hai dimenticato come si beve?",
  "Il bicchiere è mezzo vuoto... o proprio vuoto.",
  "Non è da te, tutto ok?",
  "Il frigorifero è vuoto?",
  "Stai facendo il bravo?",
  "Birra virtuale non conta!",
  "Hai sostituito la birra con l'acqua?",
  "Il pub ha chiuso?",
  "Birra in ferie?",
  "Stai risparmiando per le vacanze?",
  "Oggi solo caffè?",
  "Birra in quarantena?",
  "Hai trovato una nuova passione?",
  "Birra in sciopero di consumo?",
  "Il cameriere si chiede dove sei.",
  "Zero birre, zero storie.",
  "La birra non ti cerca?",
  "Hai dimenticato il brindisi?",
  "Birra in modalità invisibile?",
  "Oggi astinenza volontaria?",
  "Il bicchiere è rimasto pulito?",
  "Birra in pausa pranzo?",
  "Hai cambiato app?",
  "Birra in modalità zen?",
];

export default function BeerTrackerApp() {
  const [beerLog, setBeerLog] = useState(() => {
    const saved = localStorage.getItem("beerLog");
    return saved ? JSON.parse(saved) : {};
  });
  const [lastUpdate, setLastUpdate] = useState(() => Date.now());
  const [count, setCount] = useState(0);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [showDayModal, setShowDayModal] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  // Genera ultimi 7 giorni come opzioni
  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    return {
      value: iso,
      label: i === 0 ? "Oggi" : d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" })
    };
  });

  const todayCount = beerLog[selectedDate] || 0;

  const addBeer = () => {
    let logDate = selectedDate;
    // Se tra mezzanotte e le 5 e si sta aggiungendo per oggi, registra sul giorno precedente
    const now = new Date();
    if (selectedDate === today && now.getHours() < 5) {
      const prevDay = new Date(now);
      prevDay.setDate(now.getDate() - 1);
      logDate = prevDay.toISOString().slice(0, 10);
    }
    const updatedLog = { ...beerLog };
    updatedLog[logDate] = (updatedLog[logDate] || 0) + 1;
    setBeerLog(updatedLog);
    setLastUpdate(Date.now());
  };

  useEffect(() => {
    localStorage.setItem("beerLog", JSON.stringify(beerLog));
  }, [beerLog]);

  useEffect(() => {
    const checkAndNotify = () => {
      if (Date.now() - lastUpdate > 1000 * 60 * 60 * 5) {
        if (Notification.permission === "granted") {
          const msg = NO_BEER_MESSAGES[Math.floor(Math.random() * NO_BEER_MESSAGES.length)];
          new Notification(msg);
        }
      }
    };

    const schedule = [12, 17, 22];
    const timers = schedule.map(hour => {
      const now = new Date();
      const target = new Date();
      target.setHours(hour, hour === 23 ? 59 : 0, 0, 0);
      if (target < now) target.setDate(target.getDate() + 1);
      return setTimeout(() => checkAndNotify(), target.getTime() - now.getTime());
    });

    return () => timers.forEach(clearTimeout);
  }, [lastUpdate]);

  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    // Register service worker for PWA
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then(registration => {
            console.log("Service Worker registered with scope:", registration.scope);
          })
          .catch(error => {
            console.error("Service Worker registration failed:", error);
          });
      });
    }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setShowInstallBtn(false);
    }
  };

  // Prepara i dati per il BarChart con date italiane
  const barData = Object.entries(beerLog).map(([date, count]) => ({
    date: new Date(date).toLocaleDateString("it-IT"),
    birre: count
  }));

  const pieDataMap = {};
  Object.entries(beerLog).forEach(([date, count]) => {
    const weekday = new Date(date).toLocaleDateString("it-IT", { weekday: "long" });
    pieDataMap[weekday] = (pieDataMap[weekday] || 0) + count;
  });
  const pieData = Object.entries(pieDataMap).map(([name, value]) => ({ name, value }));

  // Calcola i tre giorni con il numero più alto (usando la data originale)
  const topDays = [...Object.entries(beerLog)]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([date, count]) => ({ date, count }));

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
        <Beer className="text-yellow-500" /> ContaTazze
      </h1>
      <div className="mb-4 flex items-center gap-4">
        <div className="text-lg font-semibold text-yellow-700 totale-birre flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDayModal(true)}
            className="underline decoration-yellow-400 hover:text-yellow-900"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            
          </button>
          <span onClick={() => setShowDayModal(true)}>
            {dateOptions.find(opt => opt.value === selectedDate)?.label || selectedDate}
          </span>
          <span>
            : {todayCount} 🍺
          </span>
          <button onClick={addBeer} className="ml-2 px-3 py-1 bg-yellow-400 rounded font-bold text-yellow-900 hover:bg-yellow-300">
            +1
          </button>
        </div>
      </div>
      {/* Modal per scegliere il giorno */}
      {showDayModal && (
        <div
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "left",
            zIndex: 1000
          }}
          onClick={() => setShowDayModal(false)}
        >
          <div
            style={{
              background: "#fffbe6",
              border: "2px solid #facc15",
              borderRadius: "12px",
              padding: "2em",
              minWidth: "260px",
              boxShadow: "0 2px 16px rgba(0,0,0,0.15)",
              position: "relative"
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="mb-2 text-lg font-bold text-yellow-700">Scegli il giorno</h3>
            <select
              value={selectedDate}
              onChange={e => {
                setSelectedDate(e.target.value);
                setShowDayModal(false);
              }}
              className="w-full px-2 py-2 rounded border border-yellow-400 bg-yellow-50 text-yellow-900 mb-2"
            >
              {dateOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="text-sm text-yellow-600">Seleziona un giorno per aggiungere birre</p>
          </div>
        </div>
      )}
      <h2 className="text-xl font-semibold mb-2">Totale giornaliero</h2>
      <BarChart width={600} height={300} data={barData} className="mb-6">
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="birre" fill="#facc15" name="Birre" />
      </BarChart>
      <h2 className="text-xl font-semibold mb-2">Distribuzione per giorno della settimana</h2>
      <PieChart width={400} height={300}>
        <Pie data={pieData} cx={200} cy={150} outerRadius={100} fill="#facc15" dataKey="value" label>
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Legend />
      </PieChart>
      <div style={{
        marginTop: "2em",
        background: "#fffbe6",
        border: "3px dashed #222",
        borderRadius: "12px",
        padding: "1em",
        fontSize: "1.1rem"
      }}>
        <span role="img" aria-label="fumetto"> {/* Statistica dei tre giorni top */}
      <div className="mt-8 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-xl">
        <h2 className="text-lg font-bold mb-2 text-yellow-700">💬 certi giorni... da record</h2>
        <ol className="list-decimal ml-6">
          {topDays.map((day, idx) => (
            <li key={day.date} className="font-semibold text-yellow-800"><h3>
              {new Date(day.date).toLocaleDateString("it-IT")}: <span className="font-bold text-red-600"><b>{day.count}</b></span> 🍺
            </h3></li>
          ))}
        </ol>
      </div></span>
      </div>
      {showInstallBtn && (
        <div className="mb-4 flex items-center gap-2">
          <br></br>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<button
            onClick={handleInstallClick}
            className="flex items-center gap-2 px-4 py-2 bg-orange-400 text-orange-900 rounded-lg shadow font-semibold hover:bg-yellow-300 transition"
            style={{ fontSize: "1.1rem" }}
          >
            <Bell className="w-5 h-5 text-orange-700" />
            Installa App
          </button>
        </div>
      )}
      
    </div>
  );
}
