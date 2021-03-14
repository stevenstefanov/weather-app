// Declaring all querySelector variables
var userFormEl = document.querySelector('#user-form');
var cityInputEl = document.querySelector('#cityname');
var searchHistoryEl = document.querySelector(".search-history");
var currentWeatherEl = document.querySelector('#weather-container');
var weatherSearchTerm = document.querySelector('#weather-search-term');
var requestedWeatherData;

// Function for input city name in search bar
async function searchSubmit(){
  var cityNameEl = cityInputEl.value.trim();
  await getWeatherData(cityNameEl)
  .catch(() => {
      alert("Not a valid city in the OpenWeather API!");
      return;
  });
  buildSearchHistory(cityNameEl);
  displayMainWeather();
  displayWeatherForecast();
  cityInputEl.value = "";
}

// Function to make saved prior searches as a button
function buildButton(tag, classes, attributeName, attributeValue, text){
  var button = document.createElement(tag);
  button.className = classes;
  button.setAttribute(attributeName, attributeValue);
  button.innerHTML = text;
  return button;
}

// Function to build li of prior searched cities
function buildSearchHistory(city){
  var li = document.createElement("li");
  li.className = "list-group-item d-flex justify-content-between city-li";

  var cityButton = buildButton("button", "btn btn-secondary submit-saved-city", "type", "button", city);
  var closeButton = buildButton("button", "close btn", "type", "button", "<span aria-hidden='true'>&times;</span>");

  li.appendChild(cityButton);
  li.appendChild(closeButton);
  searchHistoryEl.appendChild(li);
  
  cityButton.addEventListener("click", callWeatherHistory);
}

// Function to delete li of prior searched cities
function deleteHistory(event){
  event.stopPropagation();
  var cityLiEl = event.target;
  cityLiEl.parentElement.parentElement.remove();
}

// Function to call search history from local storage
async function callWeatherHistory(event){
  event.stopPropagation();
  var weatherHistory = event.target.textContent;
  await callWeatherHistory(weatherHistory);
  removeHTML(".weather-container");
  displayMainWeather();
  buildForecast();
}

// Function to collect the weather data
async function getWeatherData(city){
  var currentWeatherData = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=213f4adea7d0df4b7cd542cfe6689303&units=imperial`);
  var weatherJSON = await currentWeatherData.json();

  var lattitude = weatherJSON.coord.lat;
  var longitude = weatherJSON.coord.lon;

  var callAPI = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lattitude}&lon=${longitude}&units=imperial&exclude=current,minutely,hourly,alerts&appid=213f4adea7d0df4b7cd542cfe6689303`)
  var callJSON = await callAPI.json();

  requestedWeatherData = {
    cityName: weatherJSON.name,
    currentDate: new Date(weatherJSON.dt*1000),
    currentTemp: `${weatherJSON.main.temp} F`,
    currentHumidity: `${weatherJSON.main.humidity}%`,
    currentWind: `${weatherJSON.wind.speed} km/h`,
    currentUVI: callJSON.daily[0].uvi,
    dailyForecast: callJSON.daily
    }
}

// Function to display 5 day forecast
var displayWeatherForecast = function (city, searchTerm) {
  if (city.length === 0) {
    currentWeatherEl.textContent = 'No repositories found.';
    return;
  }
   
  var forecast = buildHTML("section", "d-flex col-12 flex-wrap justify-content-center mt-5 forecast");
  currentWeatherEl.appendChild(forecast);

  var forecastHeader = buildHTML("div", "col-12");
    forecast.appendChild(forecastHeader);
    forecastHeader.appendChild(buildHTML("h4", "forecast-title", "5-Day Forecast:"));

  var nameCapitalized = searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1);
  weatherSearchTerm.textContent = "Local weather for: " + nameCapitalized;

  for (var i = 0; i < 6; i++) {
    var forecastCard = buildHTML("div", "card d-flex flex-column align-items-center m-2");
    forecastCard.setAttribute("style", "width: 250px;");
    forecast.appendChild(forecastCard);

    var rawForecastDate = new Date(requestedWeatherData.dailyForecast[i].dt*1000);
    var forecastDate = rawForecastDate.toLocaleDateString("en");

    forecastCard.appendChild(buildHTML("h5", "card-title", forecastDate));

    forecastCard.appendChild(buildHTML("p", "temperature", `Temperature: ${requestedWeatherData.dailyForecast[i].temp.day} F`));
    forecastCard.appendChild(buildHTML("p", "humidity", `Humidity: ${requestedWeatherData.dailyForecast[i].humidity}%`));
  }

    // var cityName = city.city.name;
    // var cityTemp = city.list[i].main.temp;

    // var cityEl = document.createElement('div');
    // cityEl.classList = 'list-item flex-row justify-space-between align-center';

    // var titleEl = document.createElement('span');
    // titleEl.textContent = cityName + ": " + cityTemp + " F";

    // cityEl.appendChild(titleEl);

    // currentWeatherEl.appendChild(cityEl);
};

// Function to display current weather information
function displayMainWeather(){
  var citySelection = buildHTML("section", "col-12 col-lg-5 selected-city");
  currentWeatherEl.appendChild(citySelection);
  var card = buildHTML("div", "card");
  citySelection.appendChild(card);
  var cardBody = buildHTML("div", "card-body d-flex flex-column align-items-center");
  card.appendChild(cardBody);

  cardBody.appendChild(buildHTML("h2", "card-title", `${requestedWeatherData.cityName}`));

  var currentDateRaw = new Date(requestedWeatherData.dailyForecast[0].dt*1000);
  var currentDate = currentDateRaw.toLocaleDateString("en");
  cardBody.appendChild(buildHTML("h5", "current-date", `${currentDate}`));

  cardBody.appendChild(buildHTML("p", "temperature", `Temperature: ${requestedWeatherData.currentTemp}`));
  cardBody.appendChild(buildHTML("p", "humidity", `Humidity: ${requestedWeatherData.currentHumidity}`));
  cardBody.appendChild(buildHTML("p", "windspeed", `Wind Speed: ${requestedWeatherData.currentWind}`));

  if (requestedWeatherData.currentUVI <= 3){
      cardBody.appendChild(buildHTML("p", "UVindex-low p-2", `UV Index: ${requestedWeatherData.currentUVI}`));
  } else if (requestedWeatherData.currentUVI >= 3 && requestedWeatherData.currentUVI <= 7) {
      cardBody.appendChild(buildHTML("p", "UVindex-med p-2", `UV Index: ${requestedWeatherData.currentUVI}`));
  } else {
      cardBody.appendChild(buildHTML("p", "UVindex-high p-2", `UV Index: ${requestedWeatherData.currentUVI}`));
  }
}

function buildHTML(tag, classes, text){
  var element = document.createElement(tag);
  element.className = classes;
  element.textContent = text;
  return element;
}

function removeHTML(query){
  var element = document.querySelector(query);
  while (element.firstChild){
      element.removeChild(element.firstChild);
  }
}

// Function to save history to local storage
function storeWeatherHistory(){
  localStorage.setItem("searchHistoryElements", JSON.stringify(searchHistoryEl.innerHTML));

}

//////////////////////
// Function to reload save search history elements from localStorage
function restoreHistory(){
  searchHistoryEl.innerHTML = JSON.parse(localStorage.getItem("searchHistoryElements"));
  var closeButton = document.querySelectorAll(".close");
  var cityButton = document.querySelectorAll(".submit-saved-city");
  for (var i = 0; i < searchHistoryEl.childElementCount; i++){
      cityButton[i].addEventListener("click", callWeatherHistory);
      closeButton[i].addEventListener("click", deleteHistory);
  }
}

// Function to save current city weather elements to localStorage
function storeCurrentCity(){
  localStorage.setItem("currentWeatherElements", JSON.stringify(currentWeatherEl.innerHTML));
}

// Function to restore saved city weather elements from localStorage
async function restoreCurrentCity(){
  currentWeatherEl.innerHTML = await JSON.parse(localStorage.getItem("currentWeatherElements"));
  var currentCityValue = currentWeatherEl.firstElementChild.firstElementChild.firstElementChild.firstElementChild.textContent;
  await callWeather(currentCityValue);
  removeHTML("#weather-container");
  displayMainWeather();
  displayWeatherForecast();
}

// localStorage checks if valid key-value pairs exist
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

// Function for searching, which replaces the current city data with what is searched
userFormEl.addEventListener("click", (event)=>{
  event.preventDefault();
  removeHTML("#weather-container");
  searchSubmit();
});

userFormEl.addEventListener('submit', searchSubmit);