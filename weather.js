// Show and hide search results box when selecting and deselecting search bar
document.querySelector('.search-bar').addEventListener('focus', () => {
    document.querySelector('.search-results-dropdown').style.display = 'block'
})
document.querySelector('.search-bar').addEventListener('focusout', () => {
    setTimeout(() => {
        document.querySelector('.search-results-dropdown').style.display = 'none'
    }, 150)
})

let searchData = {}

// Debounce to not spam API when typing in input
const debounce = (fn, t = 250) => {
    let timer
    return function(...args) {
        clearTimeout(timer)
        timer = setTimeout(() => fn(...args), t)
    }
}

// Debounce to not spam API when typing in input
document.querySelector('.search-bar').addEventListener('input', debounce(search))
function search(event) {
    if (event.target.value == "") return
    console.log('Search query sent: ', event.target.value)
    let url = `https://geocoding-api.open-meteo.com/v1/search?name=${event.target.value}&count=5&language=en&format=json`
    callAPI(url).then(data => {
        newSearchResults(data)
        searchData = data
    })
}

// Get cardinal direction from degree input
function windDirection(degree) {
    const cardinals = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
    // +0.5|0 rounds index up to nearest integer, |0 floors.
    const index = degree/22.5+0.5|0
    // % 16 ensures degrees 349-359 return North
    return cardinals[index % 16]
}

// Scaled Horizontal Scrolling
document.addEventListener('wheel', e => {
    if (e.target.closest('.weather-scroll')) {
        e.target.closest('.weather-scroll').scrollLeft += e.deltaY / 3
    }
})

// Create a new weather card with data from API
function newWeatherCard(data) {
    const currentDateZone = new Date(Date.now() + data.utc_offset_seconds * 1000)
    const daynight = isDayTime(currentDateZone.toISOString(), data.daily.sunrise[0], data.daily.sunset[0])? 'day' : 'night'

    const weather = document.querySelector('.weather')
    const weatherCard = elementClass('div', `weather-card weather-card-${daynight}`)
    const city = elementClass('p', 'weather-text-big')
    city.innerHTML = data.name
    const flag = elementClass('i', `fi fi-${data.country_code.toLowerCase()} weather-flag`)
    city.appendChild(flag)

    const weatherTop = elementClass('div', 'weather-top')

    const leftDiv = document.createElement('div')
    const date = elementClass('p', 'weather-text-small')
    date.innerHTML = currentDateZone.toISOString().split('T')[0]
    const time = elementClass('p', 'weather-text-small')
    time.innerHTML = currentDateZone.toISOString().split('T')[1].substring(0,5)
    const zone = elementClass('span', 'weather-time-zone')
    zone.innerHTML = ` ${data.timezone_abbreviation}`
    time.appendChild(zone)
    const temp = elementClass('p', 'weather-text-big')
    temp.innerHTML = `${data.hourly.temperature_2m[currentDateZone.getHours()]}°C`
    const humid = elementClass('p', 'weather-text-small')
    humid.innerHTML = `Rel Hum: ${data.hourly.relative_humidity_2m[currentDateZone.getHours()]}%`
    leftDiv.appendChild(date)
    leftDiv.appendChild(time)
    leftDiv.appendChild(temp)
    leftDiv.appendChild(humid)
    
    weatherTop.appendChild(leftDiv)

    const rightDiv = document.createElement('div')
    const weatherIcon = elementClass('p', 'weather-text-big')
    const icon = elementClass('i', `wi ${weatherCodeToIcon(data.hourly.weather_code[currentDateZone.getHours()])}`)
    weatherIcon.appendChild(icon)
    const rain = elementClass('p', 'weather-text-small')
    rain.innerHTML = `Rain: ${data.hourly.rain[currentDateZone.getHours()]}mm`
    const snow = elementClass('p', 'weather-text-small')
    snow.innerHTML = `Snow: ${data.hourly.snowfall[currentDateZone.getHours()]}mm`
    const wind = elementClass('p', 'weather-text-small')
    wind.innerHTML = `Wind: ${data.hourly.wind_speed_10m[currentDateZone.getHours()]} km/h <br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${data.hourly.wind_direction_10m[currentDateZone.getHours()]}° ${windDirection(data.hourly.wind_direction_10m[currentDateZone.getHours()])}`
    rightDiv.appendChild(weatherIcon)
    rightDiv.appendChild(rain)
    rightDiv.appendChild(snow)
    rightDiv.appendChild(wind)

    weatherTop.appendChild(rightDiv)

    weatherCard.appendChild(city)
    weatherCard.appendChild(weatherTop)

    weather.appendChild(weatherCard)
    
    weatherCard.appendChild(elementClass('hr', `weather-hr-${daynight}`))

    const weatherHour = elementClass('div', 'weather-hour weather-scroll')
    for (let i = 0; i < 24; i++) {
        const smallInfo = elementClass('div', `weather-small-info weather-small-${daynight}`)
        const hour = document.createElement('p')
        hour.innerHTML = `0${i}:00`
        const hourIconP = elementClass('p', 'weather-icon-small')
        const hourIcon = elementClass('i', `wi ${weatherCodeToIcon(data.hourly.weather_code[i])}`)
        hourIconP.appendChild(hourIcon)
        const hourTemp = document.createElement('p')
        hourTemp.innerHTML = `${data.hourly.temperature_2m[i]}°C`

        smallInfo.appendChild(hour)
        smallInfo.appendChild(hourIconP)
        smallInfo.appendChild(hourTemp)

        weatherHour.appendChild(smallInfo)
    }
    weatherCard.appendChild(weatherHour)

    weatherCard.appendChild(elementClass('hr', `weather-hr-${daynight}`))

    const weatherWeek = elementClass('div', 'weather-week weather-scroll' )
    for (let i = 0; i < 7; i++) {
        const smallInfo = elementClass('div', `weather-small-info weather-small-${daynight}`)
        const day = document.createElement('p')
        day.innerHTML = `${data.daily.time[i].substring(5,10)}`
        const dayIconP = elementClass('p', 'weather-icon-small')
        const weatherCodeMode = mode(data.hourly.weather_code.slice(24*i, 24*i+24)) 
        const dayIcon = elementClass('i', `wi ${weatherCodeToIcon(Math.max(...weatherCodeMode))}`)
        dayIconP.appendChild(dayIcon)
        const dayTemp = document.createElement('p')
        const temps = data.hourly.temperature_2m.slice(24*i, 24*i+24)
        dayTemp.innerHTML = `${Math.max(...temps)}°C<br>${Math.min(...temps)}°C`

        smallInfo.appendChild(day)
        smallInfo.appendChild(dayIconP)
        smallInfo.appendChild(dayTemp)

        weatherWeek.appendChild(smallInfo)
    }
    weatherCard.appendChild(weatherWeek)

    // Weather Card, and day/night
    // City Name <P>
    // Weather Top
        // Left Div
            // Date
            // Time and Zone
            // Temperature
            // Humidity
        // Right Div
            // Icon
            // Rain
            // Snow
            // Wind
            // Direction
    // hr
    // Weather Hour
        // Hour
        // Icon
        // Temperature °
    // hr
    // Weather week
        // Month-Day
        // Icon
        // Temp average day, average night

    // Attach to .weather div
}

// Populate the search result box with data from API
function newSearchResults(data) {
    const searchResultsDropdown = document.querySelector('.search-results-dropdown')
    searchResultsDropdown.innerHTML = ''
    if (!data.results) return
    for (let i = 0; i < data.results.length; i++) {
        const resultData = data.results[i]
        const searchResult = elementClass('div', 'search-result')
        searchResult.setAttribute('resultID', i)
        const resultFlag = elementClass('i', `fi fi-${resultData.country_code.toLowerCase()}`)
        const city = elementClass('span', 'search-result-text')
        city.innerHTML = resultData.name
        const country = elementClass('span', 'search-result-text')
        country.innerHTML = resultData.country
        const additional = elementClass('span', 'search-result-text')
        additional.innerHTML = resultData.admin1
        
        searchResult.appendChild(resultFlag)
        searchResult.appendChild(city)
        searchResult.appendChild(country)
        searchResult.appendChild(additional)

        searchResultsDropdown.appendChild(searchResult)
    }

    // Search Result
        // Flag
        // City Name
        // Country Name
        // Admin 1

}

async function callAPI(url) {
    const response = await fetch(url)
    return response.json()
}

// Convert weather code from API to icon class name
function weatherCodeToIcon(code) {
    const weatherMap = {
        0: "wi-day-sunny",
        1: "wi-day-sunny-overcast",
        2: "wi-day-cloudy",
        3: "wi-cloudy",
        45: "wi-fog",
        48: "wi-fog",
        51: "wi-sprinkle",
        53: "wi-sprinkle",
        55: "wi-sprinkle",
        56: "wi-hail",
        57: "wi-hail",
        61: "wi-showers",
        63: "wi-rain-mix",
        65: "wi-rain",
        66: "wi-hail",
        67: "wi-hail",
        71: "wi-snow",
        73: "wi-snow",
        75: "wi-snow",
        77: "wi-snow",
        80: "wi-showers",
        81: "wi-showers",
        82: "wi-rain",
        85: "wi-snow",
        86: "wi-snow",
        95: "wi-thunderstorm",
        96: "wi-thunderstorm",
        99: "wi-thunderstorm"
    }
    return weatherMap[code]
}

// Shorthand for creating element and giving it css classes
function elementClass(element, className) {
    const domElem = document.createElement(element)
    domElem.className = className
    return domElem
}

// Returns booleon if sun is up or down
function isDayTime(date, sunrise, sunset) {
    return date > sunrise && date < sunset
}

// Find the most common element/s of an array
function mode(arr) {
    const count = new Map()

    arr.forEach( e => {
        count.set(e, (count.get(e) || 0) + 1)
    })

    let highestCount = 0
    let modes = []

    count.forEach((value, key) => {
        if (value > highestCount) {
            highestCount = value
            modes = [key]
        } else if (value == highestCount) {
            modes.push(key)
        }
    })

    return modes
}

// Handle click events
document.addEventListener('click', e => {
    // Ctrl click to remove location
    if (e.target.closest(".weather-card") && e.ctrlKey) {
        e.target.closest(".weather-card").remove()
    }
    // Create card from clicked search result
    if (e.target.closest('.search-result')) {
        document.querySelector('.search-bar').value = ""
        // Search with city clicked
        const resultID = e.target.closest('.search-result').getAttribute('resultID')
        const selectedCity = searchData.results[resultID]
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${selectedCity.latitude}&longitude=${selectedCity.longitude}&hourly=temperature_2m,relative_humidity_2m,rain,snowfall,weather_code,wind_speed_10m,wind_direction_10m&daily=sunrise,sunset&timezone=${encodeURIComponent(selectedCity.timezone)}`
        callAPI(url).then(data => {
            const weatherData = {...selectedCity, ...data}
            newWeatherCard(weatherData)
        })
    }
})