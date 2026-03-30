// ---------------- BACKEND.JS (JSON/API VERSION) ---------------- //
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors"); // ✅ Added CORS

const app = express();

// ---------------- CORS ---------------- //
// Allow requests from your Netlify frontend
app.use(cors({
    origin: "https://sokky.netlify.app", // replace with your Netlify URL
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
}));

// ---------------- MIDDLEWARE ---------------- //
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (e.g., search.js) if needed
app.use("/static", express.static(__dirname));

// ---------------- HELPERS ---------------- //
function calculateAnalytics(buses) {
    if (!buses.length) return null;

    const cheapest = buses.reduce((a, b) => a.price < b.price ? a : b);
    const expensive = buses.reduce((a, b) => a.price > b.price ? a : b);
    const mostSeats = buses.reduce((a, b) =>
        a.available_seats > b.available_seats ? a : b
    );

    return { cheapest, expensive, mostSeats };
}

function formatBus(bus) {
    let formattedDate = "N/A";
    if (bus.date) {
        const d = new Date(bus.date);
        if (!isNaN(d)) formattedDate = d.toLocaleDateString("en-CA"); // YYYY-MM-DD
    }

    return {
        company: bus.company || "N/A",
        from: bus.origin || "N/A",
        to: bus.destination || "N/A",
        date: formattedDate,
        departure: bus.departure || "N/A",
        price: Number(bus.price) || 0,
        available_seats: Number(bus.available_seats) || 0,
        distance: Number(bus.distance) || 0,
        amenities: Array.isArray(bus.amenities) ? bus.amenities : [],
        route: Array.isArray(bus.route) ? bus.route : []
    };
}

// ---------------- API ---------------- //
app.get("/api/buses", (req, res) => {
    let { from, to, date } = req.query;

    if (!from || !to) return res.status(400).json({ error: "Missing 'from' or 'to' parameter" });

    from = from.trim().toLowerCase();
    to = to.trim().toLowerCase();

    // Read JSON file
    let rawData;
    try {
        rawData = fs.readFileSync(path.join(__dirname, "travels.json"), "utf-8");
    } catch (err) {
        console.error("Failed to read JSON file:", err.message);
        return res.status(500).json({ error: "Failed to read data file" });
    }

    let buses;
    try {
        buses = JSON.parse(rawData);
    } catch (err) {
        console.error("Invalid JSON format:", err.message);
        return res.status(500).json({ error: "Data file is corrupted" });
    }

    // Filter results
    buses = buses.filter(bus => 
        bus.origin.toLowerCase() === from &&
        bus.destination.toLowerCase() === to &&
        (!date || bus.date === date)
    );

    const formattedBuses = buses.map(formatBus);
    const analytics = calculateAnalytics(formattedBuses);

    res.json({ buses: formattedBuses, analytics });
});

// ---------------- SERVER ---------------- //
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
