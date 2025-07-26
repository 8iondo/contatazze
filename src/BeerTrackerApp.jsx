
import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { Bell, Beer } from "lucide-react";

const COLORS = ["#facc15", "#f59e0b", "#d97706", "#fbbf24", "#fde68a", "#eab308", "#fcd34d"];

export default function BeerTrackerApp() {
  const [beerLog, setBeerLog] = useState(() => {
    const saved = localStorage.getItem("beerLog");
    return saved ? JSON.parse(saved) : {};
  });
  const [lastUpdate, setLastUpdate] = useState(() => Date.now());

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = beerLog[today] || 0;

  const addBeer = () => {
    const updatedLog = { ...beerLog };
    updatedLog[today] = (updatedLog[today] || 0) + 1;
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
          new Notification("Sei sicuro? Zero birre? Stai bluffando...");
        }
      }
    };

    const schedule = [11, 15, 23];
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

  const barData = Object.entries(beerLog).map(([date, count]) => ({ date, count }));

  const pieDataMap = {};
  Object.entries(beerLog).forEach(([date, count]) => {
    const weekday = new Date(date).toLocaleDateString("en-US", { weekday: "long" });
    pieDataMap[weekday] = (pieDataMap[weekday] || 0) + count;
  });
  const pieData = Object.entries(pieDataMap).map(([name, value]) => ({ name, value }));

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
        <Beer className="text-yellow-500" /> ContaTazze
      </h1>
      <div className="mb-4 flex items-center gap-4">
       
        <button
  onClick={addBeer}
  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl shadow-md"
><h1>+1</h1></button>
        <div className="text-lg font-semibold text-yellow-700">
          Oggi: {todayCount} 🍺
        </div>
      </div>
      <h2 className="text-xl font-semibold mb-2">Totale giornaliero</h2>
      <BarChart width={600} height={300} data={barData} className="mb-6">
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="#facc15" />
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
    </div>
  );
}
