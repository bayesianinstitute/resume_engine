const fetchCountryByCity = async (city) => {
    const apiKey = '9a056bd728164a5eaa36ccc54e5ca9c0'; // Replace with your Geoapify API key
    const url = `https://api.geoapify.com/v1/geocode/search?text=${city}&apiKey=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.features && data.features.length > 0) {
            const country = data.features[0].properties.country;
            console.log(`The country for city ${city} is: ${country}`);
        } else {
            console.log('City not found!');
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
};

// Example usage
fetchCountryByCity('Berlin');
