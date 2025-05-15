interface GeolocationData {
  city: string;
  region: string;
  country_name: string;
}

export async function getLocationFromIP(): Promise<GeolocationData> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return {
      city: data.city,
      region: data.region,
      country_name: data.country_name
    };
  } catch (error) {
    console.error('Error fetching location:', error);
    return {
      city: 'São Paulo',
      region: 'São Paulo',
      country_name: 'Brazil'
    };
  }
} 