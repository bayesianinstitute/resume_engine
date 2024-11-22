class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.message = message;
    this.statusCode = statusCode;
    this.data = null;
  }
}
export default ErrorHandler;

import dotenv from "dotenv";
dotenv.config();
export const fetchCountryByCity = async (city) => {
  const PUBLIC_GEOAPIFY_API_KEY = process.env.PUBLIC_GEOAPIFY_API_KEY;
  const url = `https://api.geoapify.com/v1/geocode/search?text=${city}&apiKey=${PUBLIC_GEOAPIFY_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const country = data.features[0].properties.country;
      const country_code = data.features[0].properties?.country_code;
      console.log(`Country: ${country}, Country Code: ${country_code}`);
      return country_code;
    } else {
      console.log("City not found!");
      return "USA";
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export function determineStartDate(dateRange) {
  const currentDate = new Date();
  let startDate;

  switch (dateRange.toString()) {
    case "last_week":
      startDate = new Date(currentDate); // Create a copy to avoid modifying currentDate
      startDate.setDate(currentDate.getDate() - 7);
      break;
    case "last_month":
      startDate = new Date(currentDate); // Create a copy
      startDate.setMonth(currentDate.getMonth() - 1);
      break;
    default: // "day" or any other invalid input
      startDate = new Date(currentDate); // Create a copy
      startDate.setDate(currentDate.getDate() - 1);
      break;
  }

  return startDate;
}
