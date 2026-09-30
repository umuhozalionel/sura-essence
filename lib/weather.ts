/**
 * OpenWeather key for the Kigali weather readouts (header, hero, driver,
 * transfers and tours pages). It is sent from the browser, so it is public by
 * nature; set NEXT_PUBLIC_WEATHER_API_KEY to use a different key without a code change.
 */
export const OPENWEATHER_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY || "23f292fb66ec335896541f0b5e8b87bf";
