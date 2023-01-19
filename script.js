$ = jQuery;

var CODYWEATHER = {};

CODYWEATHER.Api = {
  enpoint: 'https://api.openweathermap.org/data/2.5/weather?',
}

CODYWEATHER.LocalStorage = {
  currentSrchHist: JSON.parse(localStorage.getItem("prevCityWeatherSrch"))
}

CODYWEATHER.Events = {
  init: function () {
    $("#searchHistory").text("loading...");
    console.info('cody weather is starting...');
    CODYWEATHER.Functions.initLocalStorage();
    if ((localStorage.getItem("prevCityWeatherSrch") != "[]")) {
      CODYWEATHER.LocalStorage.currentSrchHist = JSON.parse(localStorage.getItem("prevCityWeatherSrch"));
      CODYWEATHER.Functions.renderLastCity(CODYWEATHER.LocalStorage.currentSrchHist[0]);
    }
    
    var searchBtn = $("#searchBtn");

    $(document).on("click", ".prvCity", function (e) {
      e.preventDefault();
      var cityName = $(this).attr("id");
      var apiWeatherKey = "b551d84abc5fc1204c60cf111070a47a";
      var queryURL = CODYWEATHER.Api.enpoint + "q=" + cityName + "&cnt=5&units=imperial&appid=" + apiWeatherKey;
      $.ajax({
        url: queryURL,
        method: "GET"
      }).then(function (results) {
        CODYWEATHER.Functions.weatherForecast(results);
      });
    });

    searchBtn.on("click", function (e) {
      e.preventDefault();
      var cityName = $("#userInput").val();
      var apiWeatherKey = "b551d84abc5fc1204c60cf111070a47a";
      var queryURL = CODYWEATHER.Api.enpoint + "q=" + cityName + "&cnt=5&units=imperial&appid=" + apiWeatherKey;
      $.ajax({
        url: queryURL,
        method: "GET"
      }).then(function (results) {
        CODYWEATHER.Functions.addToSearchHist(results.name);
        CODYWEATHER.Functions.weatherForecast(results);

      });
      $("#userInput").val("")
    });

  },
  load: function () {
    if ("geolocation" in navigator) { 
    } else {
      console.log("Geolocation not available!");
    }
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(function (position) {
        console.log("Found your location \nLat : " + position.coords.latitude + " \nLang :" + position.coords.longitude);
        CODYWEATHER.Functions.findWithCoords(position.coords.latitude, position.coords.longitude);
      });
    } else {
      console.log("Browser doesn't support geolocation!");
    }
  },
}

CODYWEATHER.Functions = {
  weatherForecast: function (results) {
    $(".hide").attr("class", "row");
    var currentCityName = results.name;
    $("#currentCityInfo").text(currentCityName + " ");
    var currentCityLon = results.coord.lon;
    var currentCityLat = results.coord.lat;
    CODYWEATHER.Functions.findWithCoords(currentCityLat, currentCityLon);
    var currentCityDt = results.sys.sunrise;
    CODYWEATHER.Functions.dateConverter(currentCityDt);
    var currentWethIcon = results.weather[0].icon;
    CODYWEATHER.Functions.weatherIcon(currentWethIcon);
  },

  findWithCoords: function (currentCityCoLat, currentCityCoLon) {
    var apiWeatherKey = "b551d84abc5fc1204c60cf111070a47a";
    var queryURL2 = "https://api.openweathermap.org/data/2.5/onecall?lat=" + currentCityCoLat + "&lon=" + currentCityCoLon + "&exclude=minutely,hourly&units=imperial&appid=" + apiWeatherKey;
    $.ajax({
      url: queryURL2,
      method: "GET"
    }).then(function (results) {
      var currentCityTemp = results.current.temp;
      $("#currentTemp").text("Temperature: " + currentCityTemp + " \u00B0F");
      var currentCityHum = results.current.humidity;
      $("#currentHumid").text("Humidity: " + currentCityHum + "%");
      var currentCityWinSpeed = results.current.wind_speed;
      $("#currentWind").text("Wind Speed: " + currentCityWinSpeed + " MPH");
      var currentCityUvi = results.current.uvi;
      CODYWEATHER.Functions.uviIndexSeverity(currentCityUvi);
      CODYWEATHER.Functions.fiveDayForecast(results);
    });
  },

  dateConverter: function (dt) {
    var inMilliseconds = dt * 1000;
    var inDateFormat = new Date(inMilliseconds);
    var currentIntMonth = inDateFormat.getMonth() + 1;
    var currentIntDay = inDateFormat.getDate();
    var currentIntYear = inDateFormat.getFullYear();
    $("#currentCityInfo").append("<span>" + "(" + currentIntMonth + "/" + currentIntDay + "/" + currentIntYear + ")" + "</span>");
  },

  //weather icon
  weatherIcon: function (currentWethIcon) {
    var currentWethImg = "assets/imgs/" + currentWethIcon + ".gif";
    var currentWethIconImg = $("<img>");
    currentWethIconImg.attr("src", currentWethImg);
    currentWethIconImg.addClass("weatericonmain");
    $("#currentCityInfo").append(currentWethIconImg);
  },

  //get uv index severity and color code
  uviIndexSeverity: function (currentCityUvi) {
    $("#currentUvi").text("");
    var uviIndexText = $("<span>");
    uviIndexText.text("UV Index: ");
    $("#currentUvi").append(uviIndexText);
    var currentCityUviHolder = $("<span>");
    if (currentCityUvi >= 0 && currentCityUvi <= 2) {
      currentCityUviHolder.attr("class", "low-uvi");
    } else if (currentCityUvi > 2 && currentCityUvi <= 5) {
      currentCityUviHolder.attr("class", "moderate-uvi");
    } else if (currentCityUvi > 5 && currentCityUvi <= 7) {
      currentCityUviHolder.attr("class", "high-uvi");
    } else if (currentCityUvi > 7 && currentCityUvi <= 10) {
      currentCityUviHolder.attr("class", "very-high-uvi");
    } else if (currentCityUvi > 10) {
      currentCityUviHolder.attr("class", "extreme-uvi forecast-square");
    }
    currentCityUviHolder.text(currentCityUvi);
    $("#currentUvi").append(currentCityUviHolder);
  },

  fiveDayForecast: function (results) {
    $("#forecast").text("");
    var forecastHeader = $("<h4>");
    forecastHeader.text("5-Day Forecast:");
    $("#forecast").append(forecastHeader);
    for (var i = 1; i < 6; i++) {
      var forecastSquare = $("<div>");
      forecastSquare.attr("class", "col forecast-square");
      //date
      var forecastDateP = $("<p>");
      var forecastDate = results.daily[i].sunrise;
      var inMilliseconds = forecastDate * 1000;
      var inDateFormat = new Date(inMilliseconds);
      var currentIntMonth = inDateFormat.getMonth() + 1;
      var currentIntDay = inDateFormat.getDate();
      var currentIntYear = inDateFormat.getFullYear();
      var monthDayYear = currentIntMonth + "/" + currentIntDay + "/" + currentIntYear;
      forecastDateP.append(monthDayYear);
      //icon
      console.info(results);
      var forecastWethImg = "assets/imgs/" + results.daily[i].weather[0].icon + ".gif";
      var forecastWethIcon = $("<img>");
      forecastWethIcon.addClass('weatericon');
      forecastWethIcon.attr("src", forecastWethImg);
      //temp
      var forecastTempP = $("</p>");
      var forecastTemp = "Temp: " + results.daily[i].temp.max + " \u00B0F";
      forecastTempP.append(forecastTemp);
      //humidity
      var forecastHumP = $("<p>");
      var forecastHum = "Humidity: " + results.daily[i].humidity + "%";
      forecastHumP.append(forecastHum);
      forecastSquare.append(forecastDateP, forecastWethIcon, forecastTempP, forecastHumP);
      $("#forecast").append(forecastSquare);
    }
  },

  initLocalStorage: function () {
    if (localStorage.getItem("prevCityWeatherSrch") === null) {
      localStorage.setItem("prevCityWeatherSrch", "[]");
    } else if (localStorage.getItem("prevCityWeatherSrch") === "[]") {
    }
    CODYWEATHER.Functions.dispalySearchHist();
  },
  renderLastCity: function (lastCity) {
    var cityName = lastCity;
    var apiWeatherKey = "b551d84abc5fc1204c60cf111070a47a";
    var queryURL3 = "https://api.openweathermap.org/data/2.5/weather?q=" + cityName + "&cnt=5&units=imperial&appid=" + apiWeatherKey;
    $.ajax({
      url: queryURL3,
      method: "GET"
    }).then(function (results) {
      $(".hide").attr("class", "row");
      var currentCityName = results.name;
      $("#currentCityInfo").text(currentCityName + " ");
      var currentCityLon = results.coord.lon;
      var currentCityLat = results.coord.lat;
      CODYWEATHER.Functions.findWithCoords(currentCityLat, currentCityLon);
      var currentCityDt = results.sys.sunrise;
      CODYWEATHER.Functions.dateConverter(currentCityDt);
      var currentWethIcon = results.weather[0].icon;
      CODYWEATHER.Functions.weatherIcon(currentWethIcon);
    });
  },
  addToSearchHist: function (newCityName) {
    console.info(newCityName);
    CODYWEATHER.Functions.initLocalStorage();
    CODYWEATHER.LocalStorage.currentSrchHist.unshift(newCityName);
    localStorage.setItem("prevCityWeatherSrch", JSON.stringify(CODYWEATHER.LocalStorage.currentSrchHist));
    CODYWEATHER.Functions.dispalySearchHist();
  },

  dispalySearchHist: function () {
    $("#searchHistory").text("");

    for (var i = 0; i < CODYWEATHER.LocalStorage.currentSrchHist.length; i++) {
      $("#searchHistory").append("<br>");
      var citySrchBtn = $("<button>");
      citySrchBtn.addClass("btn btn-info prvCity");
      citySrchBtn.attr("type", "button");
      citySrchBtn.attr("id", CODYWEATHER.LocalStorage.currentSrchHist[i]);
      citySrchBtn.text(CODYWEATHER.LocalStorage.currentSrchHist[i]);
      $("#searchHistory").append(citySrchBtn);
      if (i > 5) {
        return;
      }
    }
  }
}

$(document).ready(function () {
  CODYWEATHER.Events.init();
});

$(window).on('load', function () {
  CODYWEATHER.Events.load();
});
