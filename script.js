// Declaring all querySelector variables
var searchEl = document.querySelector(".form-input");
var searchButtonEl = document.querySelector(".submit-search");
var searchHistoryEl = document.querySelector(".search-history");
var currentWeatherEl = document.querySelector(".current-weather");
var apiKey = "213f4adea7d0df4b7cd542cfe6689303";

// Declare variables for current weather and forecast data objects to be manipulated later
var requestedWeatherData;

// Function to build button HTML elements, and returns it
function buildButton(tag, classes, attributeName, attributeValue, text){
    var button = document.createElement(tag);
    button.className = classes;
    button.setAttribute(attributeName, attributeValue);
    button.innerHTML = text;
    return button;
}

// Function to build li elements for the search history, with buttons for functionality
function buildSearchHistory(city){
    var li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between city-li";

    var cityButton = buildButton("button", "btn btn-secondary submit-saved-city", "type", "button", city);
    var closeButton = buildButton("button", "close btn", "type", "button", "<span aria-hidden='true'>&times;</span>");

    li.appendChild(cityButton);
    li.appendChild(closeButton);
    searchHistoryEl.appendChild(li);
    
    cityButton.addEventListener("click", callHistory);
    closeButton.addEventListener("click", deleteHistory);
}

// Function for calling weather data from items in the history
async function callHistory(event){
    event.stopPropagation();
    var historyValue = event.target.textContent; // Since this is on a click event listener, we get city name from this
    await callWeather(historyValue);
    removeHTML(".current-weather");
    buildWeatherMain();
    buildForecast();
}

// Function to delete the generated li element in the history
function deleteHistory(event){
    event.stopPropagation();
    var cityLiEl = event.target;
    cityLiEl.parentElement.parentElement.remove();
}

// Function to build the 5 day forecast
function buildForecast(){
    var forecast = buildHTML("section", "d-flex col-12 flex-wrap justify-content-center mt-5 forecast");
    currentWeatherEl.appendChild(forecast);

    var forecastHeader = buildHTML("div", "col-12");
    forecast.appendChild(forecastHeader);
    forecastHeader.appendChild(buildHTML("h4", "forecast-title", "5-Day Forecast:"));
    
    for (var i = 1; i < 6; i++){
        var forecastCard = buildHTML("div", "card d-flex flex-column align-items-center m-2");
        forecastCard.setAttribute("style", "width: 15rem;");
        forecast.appendChild(forecastCard);

        // Convert the Unix timestamps in requestedWeatherData to YYYY-MM-DD
        var forecastDateRaw = new Date(requestedWeatherData.dailyForecast[i].dt*1000);
        var forecastDate = forecastDateRaw.toLocaleDateString("en");

        forecastCard.appendChild(buildHTML("h5", "card-title", forecastDate));
        
        var weatherIcon = `https://openweathermap.org/img/wn/${requestedWeatherData.dailyForecast[i].weather[0].icon}@2x.png`
        var weatherIconEl = buildHTML("img", "col-4 weather-img");
        weatherIconEl.setAttribute("src", weatherIcon);
        forecastCard.appendChild(weatherIconEl);

        forecastCard.appendChild(buildHTML("p", "temperature", `Temperature: ${requestedWeatherData.dailyForecast[i].temp.day} C`));
        forecastCard.appendChild(buildHTML("p", "humidity", `Humidity: ${requestedWeatherData.dailyForecast[i].humidity}%`));
    }
}

// Function to build current city weather data card
function buildWeatherMain(){
    var selectedCity = buildHTML("section", "col-12 col-lg-5 selected-city");
    currentWeatherEl.appendChild(selectedCity);
    var card = buildHTML("div", "card");
    selectedCity.appendChild(card);
    var cardBody = buildHTML("div", "card-body d-flex flex-column align-items-center");
    card.appendChild(cardBody);

    cardBody.appendChild(buildHTML("h2", "card-title", `${requestedWeatherData.cityName}`));

    var currentDateRaw = new Date(requestedWeatherData.dailyForecast[0].dt*1000);
    var currentDate = currentDateRaw.toLocaleDateString("en");
    cardBody.appendChild(buildHTML("h5", "current-date", `${currentDate}`));

    var weatherIcon = `https://openweathermap.org/img/wn/${requestedWeatherData.dailyForecast[0].weather[0].icon}@2x.png`
    var weatherIconEl = buildHTML("img", "col-1 weather-img");
    weatherIconEl.setAttribute("src", weatherIcon);
    cardBody.appendChild(weatherIconEl);

    cardBody.appendChild(buildHTML("p", "temperature", `Temperature: ${requestedWeatherData.currentTemp}`));
    cardBody.appendChild(buildHTML("p", "humidity", `Humidity: ${requestedWeatherData.currentHumidity}`));
    cardBody.appendChild(buildHTML("p", "windspeed", `Wind Speed: ${requestedWeatherData.currentWind}`));

    var uvClass = requestedWeatherData.currentUVI <= 3 ? "UVindex-low p-2" : requestedWeatherData.currentUVI <= 7 ? "UVindex-med p-2" : "UVindex-high p-2";
    cardBody.appendChild(buildHTML("p", uvClass, `UV Index: ${requestedWeatherData.currentUVI}`));
}

// Helper function to create HTML elements
function buildHTML(tag, classes, text){
    var element = document.createElement(tag);
    element.className = classes;
    element.textContent = text;
    return element;
}

// Helper function to remove HTML elements
function removeHTML(query){
    var element = document.querySelector(query);
    while (element.firstChild){
        element.removeChild(element.firstChild);
    }
}

// Async function to fetch all the weather data we need
async function callWeather(location){
    // Fetch Current Weather API
    var currentWeatherData = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`);
    var weatherJSON = await currentWeatherData.json();

    // Get longitude and latitude from Current Weather API, and feed it into the One Call API for daily forecasts, and UV Index
    var lattitude = weatherJSON.coord.lat;
    var longitude = weatherJSON.coord.lon;

    // Fetch One Call API, using lattitude and longitude from Current Weather API
    var oneCallAPI = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lattitude}&lon=${longitude}&units=metric&exclude=current,minutely,hourly,alerts&appid=${apiKey}`)
    var oneCallJSON = await oneCallAPI.json();

    // Build Object with all the data we need for our app
    requestedWeatherData = {
        cityName: weatherJSON.name,
        currentDate: new Date(weatherJSON.dt*1000),
        currentTemp: `${weatherJSON.main.temp} C`,
        currentHumidity: `${weatherJSON.main.humidity}%`,
        currentWind: `${weatherJSON.wind.speed} km/h`,
        currentUVI: oneCallJSON.daily[0].uvi,
        dailyForecast: oneCallJSON.daily // Don't forget index 0 is today!
    }
}

// Function to search for a city and add it to the search history
async function searchCity(){
    var searchValue = searchEl.value;
    await callWeather(searchValue)
        .catch(() => {
            alert("Not a valid city in the OpenWeather API!");
            return;
        });
    buildSearchHistory(searchValue);
    buildWeatherMain();
    buildForecast();
    searchEl.value = "";
}

// Function to save search history elements to localStorage
function storeHistory(){
    localStorage.setItem("searchHistoryElements", JSON.stringify(searchHistoryEl.innerHTML));
}

// Function to reload save search history elements from localStorage
function restoreHistory(){
    searchHistoryEl.innerHTML = JSON.parse(localStorage.getItem("searchHistoryElements"));
    var closeButton = document.querySelectorAll(".close");
    var cityButton = document.querySelectorAll(".submit-saved-city");
    for (var i = 0; i < searchHistoryEl.childElementCount; i++){
        cityButton[i].addEventListener("click", callHistory);
        closeButton[i].addEventListener("click", deleteHistory);
    }
}

// Function to save current city weather elements to localStorage
function storeCurrentCity(){
    localStorage.setItem("currentWeatherElements", JSON.stringify(currentWeatherEl.innerHTML));
}

// Async function to reload saved city weather elements from localStorage, then refreshes it with current data
async function restoreCurrentCity(){
    currentWeatherEl.innerHTML = await JSON.parse(localStorage.getItem("currentWeatherElements"));
    var currentCityValue = currentWeatherEl.firstElementChild.firstElementChild.firstElementChild.firstElementChild.textContent
    await callWeather(currentCityValue);
    removeHTML(".current-weather");
    buildWeatherMain();
    buildForecast();
}

// localStorage checks upon page load, if valid key-value pairs exist, load them to the page
if (localStorage.searchHistoryElements === undefined && localStorage.currentWeatherElements === undefined){
    console.log("Nothing in localStorage!");
} else {
    if (localStorage.searchHistoryElements){
        restoreHistory();
    }
    if (localStorage.currentWeatherElements){
    restoreCurrentCity();
    }
}

// Event Listener for searching, which replaces the current city data with what is searched
searchButtonEl.addEventListener("click", (event)=>{
    event.preventDefault();
    removeHTML(".current-weather");
    searchCity();
});

// Event listeners for the navbar save history and current city buttons
// saveHistoryButtonEl.addEventListener("click", storeHistory);
// saveCityButtonEl.addEventListener("click", storeCurrentCity);
// clearButtonEl.addEventListener("click", () => {
//     let prompt = confirm("This will clear all saved cities current weather! Continue?");
//     if (prompt === false){
//         return;
//     } else {
//         removeHTML(".current-weather");
//         removeHTML(".search-history");
//         localStorage.clear();
//     }
// });