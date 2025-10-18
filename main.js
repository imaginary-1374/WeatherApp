// ---------- متغيرات عامة ----------
const apiKey = "b19a6b558c2ca03b863e83fbd9451b1c";
let selectedLat, selectedLon;

// عناصر DOM
const searchInput = document.querySelector("#searchInput");
const ul = document.querySelector("#results");
const mag = document.querySelector('.fa-magnifying-glass');
const form = document.querySelector('.searchForm');
const weathercards = document.querySelector('.weather-cards');
const search_container = document.querySelector('.search-container');

// حالات الطقس
function getWeatherIcon(main) {
  switch (main.toLowerCase()) {
    case "clear":
    case "clear sky":
      return "fa-sun";
    case "few clouds":
      return "fa-cloud-sun";
    case "scattered clouds":
      return "fa-cloud";
    case "broken clouds":
    case "overcast clouds":
      return "fa-cloud";
    case "drizzle":
      return "fa-cloud-rain";
    case "rain":
    case "light rain":
    case "moderate rain":
      return "fa-cloud-showers-heavy";
    case "thunderstorm":
      return "fa-bolt";
    case "snow":
      return "fa-snowflake";
    case "mist":
    case "fog":
    case "haze":
      return "fa-smog";
    default:
      return "fa-question"; // حالة غير معروفة
  }
}


// ---------- جلب احداثيات المستخدم تلقائيا ----------
window.onload = function(){

// المتصفح لا يدعم تحديد الموقع
if (!navigator.geolocation) {
alert("Browser does not support geolocation");
return;
}

navigator.geolocation.getCurrentPosition(
function (position) {

const lat = position.coords.latitude;
const lon = position.coords.longitude;

selectedLat = lat;
selectedLon = lon;
getCityNameFromCoords(lat, lon);

fetchForecastAPI();
},
function (error) {
switch (error.code) {
case error.PERMISSION_DENIED:
  alert("Location permission denied. Please search manually.");
  break;
case error.POSITION_UNAVAILABLE:
  alert("Location information is unavailable.");
  break;
case error.TIMEOUT:
  alert("Location request timed out.");
  break;
default:
  alert("An unknown error occurred while retrieving location.");
}
}
);
}

// ---------- جلب اسم المدينة من الإحداثيات ----------
async function getCityNameFromCoords(lat, lon) {
try {
const result = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`);
const responses = await result.json();

if (responses && responses.length > 0) {
    const city = responses[0];
    document.getElementById('selectedCityName').textContent = city.name;
    document.getElementById('selectedCityInfo').textContent = `${city.country} - ${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    document.querySelector('.selected-city-banner').classList.add('active');
}
} catch (error) {
console.error( error);
}
}

// ---------- دوال مساعدة ----------
function getCity() {
  return searchInput.value.trim();
}

function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}


// ---------- جلب بيانات الـGeo ----------
async function fetchGEOAPI() {
  try {
    const city = getCity();
    if (!city) return;

    const result = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=5&appid=${apiKey}`);
    const responses = await result.json();

    render_search_results(responses);
  } catch (error) {
    console.error(error);
  }
}

const debouncedFetch = debounce(fetchGEOAPI, 500);
searchInput.addEventListener("keyup", () => {
  if (getCity() !== "") debouncedFetch();
});


// ---------- عرض نتائج البحث ----------
function render_search_results(responses) {
  ul.innerHTML = "";
  const fragment = document.createDocumentFragment();

  responses.forEach(area => {
    const li = document.createElement("li");
    li.className = "result-item";

    // حفظ بيانات الـAPI على العنصر
    li.dataset.lat = area.lat;
    li.dataset.lon = area.lon;

    li.innerHTML = `
      <div class="city-name">${area.name}</div>
      <div class="city-info">
        <span class="country">${area.country}</span>
        <span class="coords">${area.lat.toFixed(2)}, ${area.lon.toFixed(2)}</span>
      </div>`;
    fragment.appendChild(li);
  });

  ul.appendChild(fragment);
}


// ---------- اختيار المدينة و عرضها ----------
ul.addEventListener("click", e => {
  let li = e.target.closest(".result-item");
  if (!li) return;

  selectedLat = li.dataset.lat;
  selectedLon = li.dataset.lon;

  const cityName = li.querySelector('.city-name').textContent;
  const cityInfo = li.querySelector('.city-info').textContent;
  
  document.getElementById('selectedCityName').textContent = cityName;
  document.getElementById('selectedCityInfo').textContent = cityInfo;
  document.querySelector('.selected-city-banner').classList.add('active');

  fetchForecastAPI(); // جلب الطقس مباشرة عند الاختيار

  render_search_icon();
});


// ---------- جلب الطقس ----------
async function fetchForecastAPI() {
  if (!selectedLat || !selectedLon) return;

  try {
    const result = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${selectedLat}&lon=${selectedLon}&appid=${apiKey}&units=metric`);
    const responses = await result.json();
    
    render_weather_cards(responses.list); // إرسال البيانات للكروت
  } catch (error) {
    console.error(error);
  }
}


// ---------- ضبط تنسيق الطقس مع كلاسات CSS ----------
function formatWeatherClass(name) {
  return name.toLowerCase().replace(/\s/g, '-'); 
}

// ---------- عرض كروت الطقس ----------
const uniqueDays = [];

function render_weather_cards(responses) {
  weathercards.innerHTML = "";
  const fragment = document.createDocumentFragment();

   uniqueDays.length = 0;

responses.forEach(item => {
  const day = new Date(item.dt_txt).toLocaleDateString();
  if (!uniqueDays.includes(day)) {
    uniqueDays.push(day);

    const weatherDescription = item.weather[0].description; 

    const weatherClass = formatWeatherClass(weatherDescription);

    const iconClass = getWeatherIcon(item.weather[0].description);

    const article = document.createElement("article");
    article.className = `card ${weatherClass}`;

    article.innerHTML = `
      <h3 class="day">${new Date(item.dt_txt).toLocaleDateString('en-US', { weekday: 'long' })}</h3>
      <i class="fa-solid ${iconClass}"></i>
      <p class="temp">${Math.round(item.main.temp)}°C</p>
      <button class="details">
            <span>details</span>
            <i class="fa-solid fa-arrow-right"></i>
      </button>
    `;
    weathercards.appendChild(article);
    
    article.querySelector('.details').addEventListener('click', () => GoToDetails(item));
  }
});
}

// ---------- حفظ البيانات في localstorage ----------
function Data(daydata){
  localStorage.setItem("selectedDay", JSON.stringify(daydata));
}
function citygeo(lat, lon){
  localStorage.setItem("Lat", JSON.stringify(lat));
  localStorage.setItem("Lon", JSON.stringify(lon));
}
// ---------- الانتقال لصفحة التفاصيل ----------
function GoToDetails(cityData){
  Data(cityData);
  citygeo(selectedLat, selectedLon);
  location.href = "details.html";
}

// ---------- واجهة البحث ----------
function render_search_field() {
  document.querySelector('.search-icon-btn').style.display = 'none';
  form.style.display = 'block';
}

function render_search_icon() {
  document.querySelector('.search-icon-btn').style.display = 'flex';
  form.style.display = 'none';
  searchInput.value = '';
  ul.innerHTML = '';
}

document.querySelector('.search-icon-btn').addEventListener('click', () => {
  render_search_field();
  searchInput.focus();
});

form.addEventListener('submit', e => {
  e.preventDefault();
  render_search_icon();
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search')) {
    render_search_icon();
    ul.innerHTML = '';
  }
});