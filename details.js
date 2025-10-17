// --------- Constants & Data ---------
const apiKey = "b19a6b558c2ca03b863e83fbd9451b1c";

let dayData = JSON.parse(localStorage.getItem('selectedDay'));
let lat = parseFloat(JSON.parse(localStorage.getItem('Lat')));
let lon = parseFloat(JSON.parse(localStorage.getItem('Lon')));

// Check if data exists
if (!dayData || !lat || !lon) {
    alert('No data found. Please select a city first.');
    window.location.href = 'index.html';
}

// --------- Variables ---------
let city = '';
let temp = Math.round(dayData.main.temp);

// --------- Fetch City Name ---------
fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`)
    .then(res => res.json())
    .then(data => {
        city = data[0]?.name || 'Unknown';
        document.querySelector('#cityName').textContent = city;
        
        // Initialize map after city is loaded ✅
        initMap();
    })
    .catch(err => {
        console.error('Error fetching city:', err);
        city = 'Unknown Location';
        document.querySelector('#cityName').textContent = city;
        initMap(); // Still initialize map even if fetch fails
    });

// --------- Date ---------
document.querySelector('#dateText').textContent = new Date(dayData.dt_txt).toLocaleDateString('en-US', {  
    weekday: 'long',  
    year: 'numeric',  
    month: 'long',  
    day: 'numeric'  
});

// --------- Weather Icon ---------
const iconCode = dayData.weather[0].icon;
const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
document.querySelector('#weatherIcon').src = iconUrl;

// --------- Weather Details ---------
document.querySelector('#temperature').textContent = temp + '°C';
document.querySelector('#description').textContent = dayData.weather[0].description;
document.querySelector('#feelsLike').textContent = Math.round(dayData.main.feels_like) + '°C';
document.querySelector('#humidity').textContent = dayData.main.humidity + '%';
document.querySelector('#wind').textContent = dayData.wind.speed + ' m/s';

// --------- Air Quality ---------
fetch(`https://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`)
    .then(res => res.json())
    .then(data => {
        let totalAqi = 0;
        let count = 0;
        
        const targetDate = new Date(dayData.dt * 1000).getDate();
        
        data.list.forEach(item => {
            const itemDate = new Date(item.dt * 1000).getDate();
            if (itemDate === targetDate) {
                totalAqi += item.main.aqi;
                count++;
            }
        });

        const avgAqi = count > 0 ? Math.round(totalAqi / count) : 0;
        
        document.querySelector('#aqiValue').textContent = avgAqi || 'N/A';

        const aqiBox = document.querySelector('#aqiBox');
        const aqiText = document.querySelector('#aqiText');
        
        aqiBox.className = 'aqi-display';

        const aqiLevels = {
            1: { class: 'aqi-good', text: 'Good' },
            2: { class: 'aqi-moderate', text: 'Moderate' },
            3: { class: 'aqi-unhealthy', text: 'Unhealthy' },
            4: { class: 'aqi-very-unhealthy', text: 'Very Unhealthy' },
            5: { class: 'aqi-hazardous', text: 'Hazardous' }
        };

        const level = aqiLevels[avgAqi] || { class: 'aqi-good', text: 'No Data' };
        aqiBox.classList.add(level.class);
        aqiText.textContent = level.text;
    })
    .catch(err => {
        console.error('AQI error:', err);
        document.querySelector('#aqiValue').textContent = 'N/A';
        document.querySelector('#aqiText').textContent = 'Unavailable';
    });

// ========== Map Initialization Function ==========
function initMap() {
    const mapContainer = document.querySelector('#mapContainer');
    mapContainer.innerHTML = '<div id="map" style="width:100%; height:400px; border-radius:20px;"></div>';

    // Create map
    const map = L.map('map').setView([lat, lon], 10);

    // Base layer (streets)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Temperature overlay
    const tempLayer = L.tileLayer(
        `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${apiKey}`,
        { opacity: 0.5 }
    ).addTo(map);

    // Rain overlay
    const rainLayer = L.tileLayer(
        `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${apiKey}`,
        { opacity: 0.5 }
    );

    // Clouds overlay
    const cloudsLayer = L.tileLayer(
        `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${apiKey}`,
        { opacity: 0.5 }
    );

    // Wind overlay
    const windLayer = L.tileLayer(
        `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${apiKey}`,
        { opacity: 0.5 }
    );

    // Location marker
    L.marker([lat, lon])
        .addTo(map)
        .bindPopup(`<b>${city}</b><br>${dayData.weather[0].description}<br>${temp}°C`)
        .openPopup();

    // Layer control
    const overlays = {
        "🌡️ Temperature": tempLayer,
        "🌧️ Rain": rainLayer,
        "☁️ Clouds": cloudsLayer,
        "💨 Wind": windLayer
    };
    
    L.control.layers(null, overlays).addTo(map);
}

// --------- Back Button ---------
document.querySelector('#backBtn').addEventListener('click', () => {
    window.history.back();
});