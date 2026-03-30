// ---------------- BACKEND.JS (FINAL FIXED VERSION) ---------------- //
const express = require("express");
const mysql = require("mysql2");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// ---------------- DATABASE CONNECTION ---------------- //
const dbConfig = {
    host: "${{RAILWAY_PRIVATE_DOMAIN}}",
    user: "root",
    password: "${{MYSQL_ROOT_PASSWORD}}",
    database: "railway",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const db = mysql.createPool(dbConfig);

// Test connection
db.getConnection((err, connection) => {
    if (err) {
        console.error("Database connection failed:", err.message);
    } else {
        console.log("Database connected successfully");
        connection.release();
    }
});

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

        if (!isNaN(d)) {
            // ✅ FIX: NO timezone shifting
            formattedDate = d.toLocaleDateString("en-CA"); // YYYY-MM-DD
        }
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
        amenities: bus.amenities
            ? bus.amenities.split(",").map(a => a.trim())
            : [],
        route: bus.route
            ? bus.route.split("→").map(r => r.trim())
            : []
    };
}

// ---------------- PAGES ---------------- //
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "main.html"));
});

app.get("/search.html", (req, res) => {
    res.sendFile(path.join(__dirname, "search.html"));
});

// ---------------- API ---------------- //
app.get("/api/buses", (req, res) => {
    let { from, to, date } = req.query;

    if (!from || !to) {
        return res.status(400).json({ error: "Missing 'from' or 'to' parameter" });
    }

    from = from.trim();
    to = to.trim();

    let sql = `
        SELECT * FROM travels
        WHERE LOWER(TRIM(origin)) = LOWER(?)
        AND LOWER(TRIM(destination)) = LOWER(?)
    `;

    const params = [from, to];
    if (date) {
        sql += ` AND DATE(date) = ?`;
        params.push(date);
    }

    // ✅ FIX: Ensure correct ordering
    sql += ` ORDER BY date ASC`;

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("Database query failed:", err.message);
            return res.status(500).json({ error: "Database query failed" });
        }

        const buses = results.map(formatBus);
        const analytics = calculateAnalytics(buses);

        res.json({ buses, analytics });
    });
});

// ---------------- SERVER ---------------- //
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));