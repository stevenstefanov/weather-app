// Declaring all querySelector variables
var searchEl = document.querySelector(".form-input");
var searchButtonEl = document.querySelector(".submit-search");
var searchHistoryEl = document.querySelector(".search-history");
var currentWeatherEl = document.querySelector(".current-weather");
var apiKey = "213f4adea7d0df4b7cd542cfe6689303";

// Declare object to be used later for easier weather access
var requestedWeatherData;

// Function to build button in HTML
function buildButton(tag, classes, attributeName, attributeValue, text){
  var button = document.createElement(tag);
  button.className = classes;
  button.setAttribute(attributeName, attributeValue);
  button.innerHTML = text;
  return button;
}

// Function to build li search history
function buildSearchHistory(city){
  var li = document.createElement("li");
  li.className = "list-group-item d-flex justify-content-between city-li";

  var cityButton = buildButton("button", "btn btn-secondary submit-saved-city", "type", "button", city);  
  li.appendChild(cityButton);
  searchHistoryEl.appendChild(li);  
  cityButton.addEventListener("click", callHistory);
}

// Function for calling weather data from items in the history
async function callHistory(event){
  event.stopPropagation();
  var historyValue = event.target.textContent;
  await callWeather(historyValue);
  removeHTML(".current-weather");
  buildWeatherMain();
  buildForecast();
}

// Function to build 5-day forecast
function buildForecast(){
  var forecast = buildHTML("section", "d-flex col-12 flex-wrap justify-content-center mt-5 forecast");
  currentWeatherEl.appendChild(forecast);

  var forecastHeader = buildHTML("div", "col-12");
  forecast.appendChild(forecastHeader);
  forecastHeader.appendChild(buildHTML("h4", "forecast-title", "5-Day Forecast:"));
    
  for (var i = 1; i < 6; i++){
    var forecastCard = buildHTML("div", "card d-flex flex-column align-items-center m-2");
    forecastCard.setAttribute("style", "width: 200px;");
    forecast.appendChild(forecastCard);

    // Converts the Unix timestamps
    var forecastDateRaw = new Date(requestedWeatherData.dailyForecast[i].dt*1000);
    var forecastDate = forecastDateRaw.toLocaleDateString("en");

    forecastCard.appendChild(buildHTML("h5", "card-title", forecastDate));
        
    var weatherIcon = `https://openweathermap.org/img/wn/${requestedWeatherData.dailyForecast[i].weather[0].icon}@2x.png`
    var weatherIconEl = buildHTML("img", "col-4 weather-img");
    weatherIconEl.setAttribute("src", weatherIcon);
    forecastCard.appendChild(weatherIconEl);

    forecastCard.appendChild(buildHTML("p", "temperature", `Temperature: ${requestedWeatherData.dailyForecast[i].temp.day} F`));
    forecastCard.appendChild(buildHTML("p", "humidity", `Humidity: ${requestedWeatherData.dailyForecast[i].humidity}%`));
  }
}

// Function for current weather
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

// Function to create HTML elements
function buildHTML(tag, classes, text){
  var element = document.createElement(tag);
  element.className = classes;
  element.textContent = text;
  return element;
}

// Function to remove HTML elements
function removeHTML(query){
  var element = document.querySelector(query);
  while (element.firstChild){
    element.removeChild(element.firstChild);
  }
}

// Function to get weather data
async function callWeather(city){
  var currentWeatherData = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=imperial`);
  var weatherJSON = await currentWeatherData.json();
  
  var lattitude = weatherJSON.coord.lat;
  var longitude = weatherJSON.coord.lon;
  
  var oneCallAPI = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lattitude}&lon=${longitude}&units=imperial&exclude=current,minutely,hourly,alerts&appid=${apiKey}`)
  var oneCallJSON = await oneCallAPI.json();

  requestedWeatherData = {
    cityName: weatherJSON.name,
    currentDate: new Date(weatherJSON.dt*1000),
    currentTemp: `${weatherJSON.main.temp} F`,
    currentHumidity: `${weatherJSON.main.humidity}%`,
    currentWind: `${weatherJSON.wind.speed} mi/h`,
    currentUVI: oneCallJSON.daily[0].uvi,
    dailyForecast: oneCallJSON.daily
  }
}

// Function to search for city
async function searchCity(){
  var searchValue = searchEl.value;
  await callWeather(searchValue)
  .catch(() => {
    alert("This is not a valid city.");
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