// ---------------- search.js (FINAL FIXED VERSION) ---------------- //
const params = new URLSearchParams(window.location.search);
const from = params.get("from");
const to = params.get("to");
const date = params.get("date");

const resultsDiv = document.getElementById("results");
const cheapestDiv = document.getElementById("cheapest");
const expensiveDiv = document.getElementById("expensive");
const mostSeatsDiv = document.getElementById("mostSeats");

function fetchBuses() {
    if (!from || !to) {
        resultsDiv.innerHTML = `<p style="text-align:center; color:red;">
            Missing search parameters!
        </p>`;
        return;
    }

    let url = `/api/buses?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    if (date) url += `&date=${encodeURIComponent(date)}`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            const { buses, analytics } = data;

            if (!buses || buses.length === 0) {
                resultsDiv.innerHTML = `<p style="text-align:center; color:#4b0082;">
                    No buses found for ${from} → ${to}${date ? " on " + date : ""}.
                </p>`;
                cheapestDiv.textContent = "Cheapest bus: -";
                expensiveDiv.textContent = "Most expensive bus: -";
                mostSeatsDiv.textContent = "Bus with most seats: -";
                return;
            }

            // Build table
            let html = `<table>
                <thead>
                    <tr>
                        <th>Company</th><th>Origin</th><th>Destination</th><th>Date</th>
                        <th>Departure</th><th>Price (KES)</th><th>Distance (km)</th>
                        <th>Available Seats</th><th>Amenities</th><th>Route</th>
                    </tr>
                </thead><tbody>`;

            buses.forEach(bus => {
                html += `<tr>
                    <td>${bus.company}</td>
                    <td>${bus.from}</td>
                    <td>${bus.to}</td>
                    <td>${bus.date ? new Date(bus.date).toLocaleDateString() : "-"}</td>
                    <td>${bus.departure}</td>
                    <td>${bus.price}</td>
                    <td>${bus.distance}</td>
                    <td>${bus.available_seats}</td>
                    <td>${bus.amenities.length ? bus.amenities.join(", ") : "-"}</td>
                    <td>${bus.route.length ? bus.route.map(stop => `<div>${stop}</div>`).join("") : "-"}</td>
                </tr>`;
            });

            html += `</tbody></table>`;
            resultsDiv.innerHTML = html;

            if (analytics) {
                cheapestDiv.textContent = `Cheapest bus: ${analytics.cheapest.company} KES ${analytics.cheapest.price}`;
                expensiveDiv.textContent = `Most expensive bus: ${analytics.expensive.company} KES ${analytics.expensive.price}`;
                mostSeatsDiv.textContent = `Bus with most seats: ${analytics.mostSeats.company} (${analytics.mostSeats.available_seats} seats)`;
            }
        })
        .catch(err => {
            console.error(err);
            resultsDiv.innerHTML = `<p style="color:red; text-align:center;">
                Error fetching buses.
            </p>`;
        });
}

fetchBuses();