const API_KEY = "YOUR_API_KEY";

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");

const weatherCard = document.getElementById("weatherCard");
const loader = document.getElementById("loader");
const errorBox = document.getElementById("errorBox");

const cityName = document.getElementById("cityName");
const weatherDescription = document.getElementById("weatherDescription");
const weatherIcon = document.getElementById("weatherIcon");

const temperature = document.getElementById("temperature");
const feelsLike = document.getElementById("feelsLike");

const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("wind");
const pressure = document.getElementById("pressure");
const visibility = document.getElementById("visibility");

const sunrise = document.getElementById("sunrise");
const sunset = document.getElementById("sunset");

const forecastSection = document.getElementById("forecastSection");
const forecastCards = document.getElementById("forecastCards");

const recentSearches = document.getElementById("recentSearches");

const cityAliases = {
    banglore: "Bengaluru",
    bangalore: "Bengaluru",
    bombay: "Mumbai",
    calcutta: "Kolkata",
    madras: "Chennai",
    hydrabad: "Hyderabad",
    poona: "Pune",
    trivandrum: "Thiruvananthapuram",
    cochin: "Kochi",
    allahabad: "Prayagraj",
    baroda: "Vadodara",
    banaras: "Varanasi",
    kashmir: "Srinagar",
    goa: "Panaji",
    nyc: "New York",
    la: "Los Angeles",
    uk: "London",
    uae: "Dubai"
};

searchBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();

    if (!city) return;

    getWeatherByCity(city);
});

cityInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        searchBtn.click();
    }
});

locationBtn.addEventListener("click", () => {

    if (!navigator.geolocation) {
        showError("Geolocation not supported.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {

            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            getWeatherByCoords(lat, lon);

        },
        () => {
            showError("Unable to access location.");
        }
    );
});

async function getWeatherByCity(city) {

    showLoader();

    try {

        city = cityAliases[city.toLowerCase()] || city;

        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
        );

        if (!response.ok) {
            throw new Error("City not found");
        }

        const data = await response.json();

        displayWeather(data);

        saveRecentSearch(city);

        getForecast(data.coord.lat, data.coord.lon);

    } catch (error) {

        showError(error.message);

    } finally {

        hideLoader();
    }
}

async function getWeatherByCoords(lat, lon) {

    showLoader();

    try {

        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );

        const data = await response.json();

        displayWeather(data);

        getForecast(lat, lon);

    } catch (error) {

        showError("Unable to fetch weather data.");

    } finally {

        hideLoader();
    }
}

async function getForecast(lat, lon) {

    try {

        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );

        const data = await response.json();

        displayForecast(data);

    } catch (error) {

        console.log(error);
    }
}

function displayWeather(data) {

    weatherCard.classList.remove("hidden");

    cityName.textContent =
        `${data.name}, ${data.sys.country}`;

    weatherDescription.textContent =
        data.weather[0].description;

    temperature.textContent =
        `${Math.round(data.main.temp)}°C`;

    feelsLike.textContent =
        `Feels Like ${Math.round(data.main.feels_like)}°C`;

    humidity.textContent =
        `${data.main.humidity}%`;

    windSpeed.textContent =
        `${data.wind.speed} m/s`;

    pressure.textContent =
        `${data.main.pressure} hPa`;

    visibility.textContent =
        `${(data.visibility / 1000).toFixed(1)} km`;

    weatherIcon.src =
        `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

    sunrise.textContent =
        formatTime(data.sys.sunrise);

    sunset.textContent =
        formatTime(data.sys.sunset);

    updateTheme(data.weather[0].main);
}

function displayForecast(data) {

    forecastCards.innerHTML = "";

    const dailyForecasts =
        data.list.filter(item =>
            item.dt_txt.includes("12:00:00")
        );

    dailyForecasts.slice(0, 5).forEach(day => {

        const card =
            document.createElement("div");

        card.className =
            "forecast-card";

        const date =
            new Date(day.dt_txt);

        card.innerHTML = `
            <h4>
                ${date.toLocaleDateString(
                    "en-US",
                    { weekday: "short" }
                )}
            </h4>

            <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png">

            <h3>${Math.round(day.main.temp)}°C</h3>

            <p>${day.weather[0].main}</p>
        `;

        forecastCards.appendChild(card);
    });

    forecastSection.classList.remove("hidden");
}

function updateTheme(weatherType) {

    document.body.className = "";

    switch (weatherType.toLowerCase()) {

        case "clear":
            document.body.classList.add("clear");
            break;

        case "clouds":
            document.body.classList.add("clouds");
            break;

        case "rain":
        case "drizzle":
            document.body.classList.add("rain");
            break;

        case "thunderstorm":
            document.body.classList.add("thunderstorm");
            break;

        case "snow":
            document.body.classList.add("snow");
            break;

        default:
            document.body.classList.add("mist");
    }
}

function formatTime(timestamp) {

    return new Date(timestamp * 1000)
        .toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
}

function showLoader() {

    loader.classList.remove("hidden");

    weatherCard.classList.add("hidden");

    errorBox.classList.add("hidden");
}

function hideLoader() {

    loader.classList.add("hidden");
}

function showError(message) {

    errorBox.textContent = message;

    errorBox.classList.remove("hidden");

    weatherCard.classList.add("hidden");

    forecastSection.classList.add("hidden");

    forecastCards.innerHTML = "";
}

function saveRecentSearch(city) {

    let searches =
        JSON.parse(
            localStorage.getItem("weatherSearches")
        ) || [];

    searches =
        searches.filter(
            item => item !== city
        );

    searches.unshift(city);

    searches =
        searches.slice(0, 5);

    localStorage.setItem(
        "weatherSearches",
        JSON.stringify(searches)
    );

    renderRecentSearches();
}

function renderRecentSearches() {

    const searches =
        JSON.parse(
            localStorage.getItem("weatherSearches")
        ) || [];

    recentSearches.innerHTML = "";

    searches.forEach(city => {

        const item =
            document.createElement("div");

        item.className =
            "recent-item";

        item.textContent =
            city;

        item.addEventListener("click", () => {
            cityInput.value = city;
            getWeatherByCity(city);
        });

        recentSearches.appendChild(item);
    });
}

renderRecentSearches();

getWeatherByCity("Mumbai");
