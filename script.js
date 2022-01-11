
class fetchForcastApi {
    constructor() {
        this.coreDomElements = new coreDomElements();
        this.baseApi = 'https://www.metaweather.com/api/location';
        this.searchApi = `${this.baseApi}/search`;
        this.addCorsHeader();
    }

    addCorsHeader() {
        $.ajaxPrefilter(options => {
            if (options.crossDomain && $.support.cors) {
                options.url = 'https://the-ultimate-api-challenge.herokuapp.com/' + options.url;
            }
        });
    }

    getLocation(query, callback) {
        $.getJSON(this.searchApi, { query }).done(data => callback(data)).fail(() => callback(null));

    }

    getweatherData(location, callback) {
        $.getJSON(`${this.baseApi}/${location}`).done(data => callback(data)).fail(() => callback(null));
    }
}





class coreDomElements {
    constructor() {
        this.searchForm = $('#search-form');
        this.errorBox = $('#error-box');
        this.searchBox = $('#search-box');
        this.loaderBox = $('#loader-box');
        this.forecastBox = $('#forecast-box');
    }
    showForecast() {
        this.hideError();
        this.forecastBox.removeClass('d-none');
        this.forecastBox.addClass('d-flex');
    }

    hideForecast() {
        this.forecastBox.removeClass('d-flex');
        this.forecastBox.addClass('d-none');
    }

    showLoader() {
        this.loaderBox.removeClass('d-none');
    }

    hideLoader() {
        this.loaderBox.addClass('d-none');
    }

    showSearch() {
        this.searchBox.removeClass('d-none');
        this.searchBox.addClass('d-flex');
    }

    hideSearchBox() {
        this.searchBox.removeClass('d-flex');
        this.searchBox.addClass('d-none');
    }

    showError(message) {
        this.hideLoader();
        this.showSearch();
        this.errorBox.removeClass('d-none');
        this.errorBox.addClass('d-block');
        this.errorBox.html(`<p class="mb-0">${message}</p>`);
    }

    hideError() {
        this.errorBox.addClass('d-none');
    }
}

class dataDisplay {
    constructor() {
        this.coreDomElements = new coreDomElements();
        this.imageURL = 'https://www.metaweather.com/static/img/weather';
    }

    gatherTodaysForcastDetails(data) {
        return {
            predictability: {
                value: data.predictability,
                unit: '%',
            },
            humidity: {
                value: data.humidity,
                unit: '%',
            },
            wind: {
                value: Math.round(data.wind_speed),
                unit: 'km/h',
            },
            'air pressure': {
                value: data.air_pressure,
                unit: 'mb',
            },
            'max temp': {
                value: Math.round(this.convertCelsiusToFahrenhiet(data.max_temp)),
                unit: 'F',
            },
            'min temp': {
                value: Math.round(this.convertCelsiusToFahrenhiet(data.min_temp)),
                unit: 'F',
            },
        };
    }

    gatherTodaysForcastGeneral(data) {
        return {
            currentWeekday: moment(data.applicable_date).format('dddd'),
            todaysFullDate: moment(data.applicable_date).format('MMMM Do'),
            locationName: data.title,
            todaysImgUrl: data.weather_state_abbr,
            todaysTemp: Math.round(this.convertCelsiusToFahrenhiet(data.the_temp)),
            weatherState: data.weather_state_name,
        };
    }


    prepareDataforDom(data) {

        const { predictability,
            humidity,
            wind_speed,
            air_pressure,
            max_temp,
            min_temp,
            applicable_date,
            the_temp,
            weather_state_abbr,
            weather_state_name,
        } = data.consolidated_weather[0];

        const todaysForcastGeneral = this.gatherTodaysForcastGeneral({
            applicable_date,
            weather_state_abbr,
            weather_state_name,
            the_temp,
            title: data.title,
        });

        const upcomingForcastData = data.consolidated_weather;

        const todaysForcastDetails = this.gatherTodaysForcastDetails({
            predictability,
            humidity,
            wind_speed,
            air_pressure,
            max_temp,
            min_temp
        });

        this.showTodaysForecast(todaysForcastGeneral);
        this.showTodaysForcastDetails(todaysForcastDetails);
        this.prepareUpcomingForcast(upcomingForcastData);
        this.coreDomElements.hideLoader();
        this.coreDomElements.showForecast();
    }

    prepareUpcomingForcast(weekForcastdata) {
        $.each(weekForcastdata, (index, value) => {
            if (index < 1) return;
            const dayImgUrl = value.weather_state_abbr;
            const maxTemp = Math.round(this.convertCelsiusToFahrenhiet(value.max_temp));
            const weekDay = moment(value.applicable_date).format('dddd').substring(0, 3);
            this.showUpcomingData({ dayImgUrl, maxTemp, weekDay });
        })
    }


    showTodaysForcastDetails(forcast) {
        $.each(forcast, (key, value) => {
            $(`#forecast-details`).append(`
            <div class="d-flex justify-content-between">
                <span class="font-weight-bolder">${key.toUpperCase()}</span>
                <span>${value.value} ${value.unit}</span>
            </div>
        `);
        });
    }

    showUpcomingData({ dayImgUrl, weekDay, maxTemp }) {
        $('#forecast-details-week').append(`
            <li class="forecastBox__week-day d-flex flex-column justify-content-center align-items-center p-2 weather-day">
                <img class="mb-2" width="30" src="${this.imageURL}/${dayImgUrl}.svg" />
                <span class="mb-2">${weekDay}</span>
                <span class="font-weight-bold">${maxTemp}&deg</span>
            </li>
        `);
    }
    showTodaysForecast(forecast) {
        $('#forecast-card-weekday').html(forecast.currentWeekday);
        $('#forecast-card-date').html(forecast.todaysFullDate);
        $('#forecast-card-location').html(forecast.locationName);
        $('#forecast-card-img').attr('src', `${this.imageURL}/${forecast.todaysImgUrl}.svg`);
        $('#forecast-card-temp').html(forecast.todaysTemp);
        $('#forecast-card-description').html(forecast.weatherState);
    }

    convertCelsiusToFahrenhiet(temp) {
        return ((temp * 9) / 5) + 32;
    }

}

class requestController {
    constructor() {
        this.fetchForcastApi = new fetchForcastApi();
        this.coreDomElements = new coreDomElements();
        this.dataDisplay = new dataDisplay();
        this.requestEventListener();
    }

    getQuery() {
        return $('#search-query').val().trim();
    }

    fetchWeather(query) {
        this.fetchForcastApi.getLocation(query, location => {
            if (!location || location.length === 0) {
                this.coreDomElements.showError('Could not find this location, please try again.');
                return;
            }
            this.fetchForcastApi.getweatherData(location[0].woeid, data => {
                if (!data) {
                    this.coreDomElements.showError('Could not proceed with the request, please try again later.');
                    return;
                }
                this.dataDisplay.prepareDataforDom(data);
                this.newSearchBox();
            });
        });

    }

    onSubmit() {
        const query = this.getQuery();
        if (!query) return;

        this.coreDomElements.showLoader();
        this.coreDomElements.hideSearchBox();
        this.fetchWeather(query);
    }

    requestEventListener() {
        this.coreDomElements.searchForm.on('submit', e => {
            e.preventDefault();
            this.onSubmit();
        });

    }

    newSearchBox() {
        const newSearchButton = document.getElementById('newSearch');
        newSearchButton.style.display = 'block';
        newSearchButton.addEventListener('click', e => {
            newSearchButton.style.display = 'none';
            location.reload();
        });
    }

}



const request = new requestController();


