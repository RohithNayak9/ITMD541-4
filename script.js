function fetchSunriseSunsetData(latitude, longitude, date) {
    const url = `https://api.sunrisesunset.io/json?lat=${latitude}&lng=${longitude}&date=${date}`;

    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch sunrise-sunset data. Status: ${response.status}`);
            }
            return response.json();
        });
}

function updateUI(yesterdayData, todayData, tomorrowData, selectedLocation, selectedDate) {
    const resultContainer = document.getElementById('resultContainer');

    if (yesterdayData.status === "OK" && todayData.status === "OK" && tomorrowData.status === "OK") {
        const yesterday = yesterdayData.results;
        const today = todayData.results;
        const tomorrow = tomorrowData.results;


        const formattedSelectedDate = new Date(selectedDate);
        const yesterdayDate = new Date(formattedSelectedDate.getTime() - (24 * 60 * 60 * 1000)).toISOString().split('T')[0];
        const tomorrowDate = new Date(formattedSelectedDate.getTime() + (24 * 60 * 60 * 1000)).toISOString().split('T')[0];

        const title = document.createElement('h2');
        const locationSpan = document.createElement('span');
        locationSpan.textContent = `${selectedLocation} on ${selectedDate}`;
        locationSpan.style.color = 'blue';
        locationSpan.style.fontWeight = 'bold';
        title.appendChild(document.createTextNode('Sunrise-Sunset Data for '));
        title.appendChild(locationSpan);

        const table = document.createElement('table');
        table.classList.add('resultTable');

        const headerRow = table.insertRow(0);
        const headers = ['Property', `Yesterday (${yesterdayDate})`, `Today (${selectedDate})`, `Tomorrow (${tomorrowDate})`];
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });

        addTableRow(table, 'Timezone', yesterday.timezone, today.timezone, tomorrow.timezone);
        addTableRow(table, 'Sunrise', yesterday.sunrise, today.sunrise, tomorrow.sunrise);
        addTableRow(table, 'Sunset', yesterday.sunset, today.sunset, tomorrow.sunset);
        addTableRow(table, 'Dawn', yesterday.dawn, today.dawn, tomorrow.dawn);
        addTableRow(table, 'Dusk', yesterday.dusk, today.dusk, tomorrow.dusk);
        addTableRow(table, 'Day Length', yesterday.day_length, today.day_length, tomorrow.day_length);
        addTableRow(table, 'Solar Noon', yesterday.solar_noon, today.solar_noon, tomorrow.solar_noon);

        resultContainer.innerHTML = '';
        resultContainer.appendChild(title);
        resultContainer.appendChild(table);
    } else {
        handleErrors(new Error('Failed to fetch sunrise-sunset data.'));
    }
}



function addTableRow(table, property, yesterdayValue, todayValue, tomorrowValue) {
    const row = table.insertRow();
    const propertyCell = row.insertCell(0);
    const yesterdayCell = row.insertCell(1);
    const todayCell = row.insertCell(2);
    const tomorrowCell = row.insertCell(3);


    switch (property.toLowerCase()) {
        case 'timezone':
            propertyCell.innerHTML = '<i class="fas fa-globe"></i> ' + property;
            break;
        case 'sunrise':
            propertyCell.innerHTML = '<i class="fas fa-sun"></i> ' + property;
            break;
        case 'sunset':
            propertyCell.innerHTML = '<i class="fas fa-moon"></i> ' + property;
            break;

        default:
            propertyCell.textContent = property;
    }

    yesterdayCell.textContent = yesterdayValue;
    todayCell.textContent = todayValue;
    tomorrowCell.textContent = tomorrowValue;
}

function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                locationInput.value = ''; 
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                const reverseGeocodeUrl = `https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}`;

                fetch(reverseGeocodeUrl)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Failed to fetch reverse geocode data. Status: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(reverseGeocodeData => {
                        const currentLocation = reverseGeocodeData.display_name; 

                        const today = new Date().toISOString().split('T')[0];
                        const yesterday = new Date();
                        yesterday.setDate(new Date().getDate() - 1);
                        const formattedYesterday = yesterday.toISOString().split('T')[0];

                        const tomorrow = new Date();
                        tomorrow.setDate(new Date().getDate() + 1);
                        const formattedTomorrow = tomorrow.toISOString().split('T')[0];

                        Promise.all([
                            fetchSunriseSunsetData(latitude, longitude, formattedYesterday),
                            fetchSunriseSunsetData(latitude, longitude, today),
                            fetchSunriseSunsetData(latitude, longitude, formattedTomorrow)
                        ])
                        .then(([yesterdayData, todayData, tomorrowData]) => {
                            
                            updateUI(yesterdayData, todayData, tomorrowData, currentLocation, today);
                        })
                        .catch(error => {
                            handleErrors(error);
                        });
                    })
                    .catch(error => {
                        handleErrors(error);
                    });
            },
            (error) => {
                handleErrors(new Error(`Geolocation error: ${error.message}`));
            }
        );
    } else {
        handleErrors(new Error('Geolocation is not supported by your browser.'));
    }
}


function searchLocation() {
    const locationInput = document.getElementById('locationInput').value;
    console.log('Searching for location:', locationInput);
    const selectedDate = document.getElementById('dateInput').value || new Date().toISOString().split('T')[0];

    const geocodeUrl = `https://geocode.maps.co/search?q=${locationInput}`;

    fetch(geocodeUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch geocode data. Status: ${response.status}`);
            }
            return response.json();
        })
        .then(geocodeData => {
            if (!geocodeData || geocodeData.length === 0) {
                throw new Error('No results found for the entered location');
            }
            const firstMatch = geocodeData[0];

            const latitude = firstMatch.lat;
            const longitude = firstMatch.lon;

            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date();
            yesterday.setDate(new Date().getDate() - 1);
            const formattedYesterday = yesterday.toISOString().split('T')[0];

            const tomorrow = new Date();
            tomorrow.setDate(new Date().getDate() + 1);
            const formattedTomorrow = tomorrow.toISOString().split('T')[0];

            return fetchSunriseSunsetData(latitude, longitude, formattedYesterday),
            return fetchSunriseSunsetData(latitude, longitude, today),
            return fetchSunriseSunsetData(latitude, longitude, formattedTomorrow)
            })
            .then(data => {
            if (data.status === 'OK') {
                updateUI(yesterdayData, todayData, tomorrowData, locationInput, selectedDate);
            } else {
                throw new Error('Failed to fetch sunrise-sunset data.');
            }
        })
        .catch(error => {
            console.error(error);
            handleErrors(error);
        });
}


function selectCapital(capital) {
    const locationInput = document.getElementById('locationInput');
    locationInput.value = capital;
}


function handleEnterKey(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        searchLocation();
    }
}
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('locationInput').addEventListener('keydown', handleEnterKey);
    loadFavoriteLocation();
});


function handleErrors(error) {
    console.error('An error occurred:', error.message);

    const resultContainer = document.getElementById('resultContainer');
    resultContainer.innerHTML = `<p>Error: ${error.message}</p>`;
}
