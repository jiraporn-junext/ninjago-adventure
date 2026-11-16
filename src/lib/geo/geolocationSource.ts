export interface RawFix {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export interface GeoError {
  code: number;
  message: string;
}

export function describeGeoError(error: GeoError): string {
  switch (error.code) {
    case 1:
      return "Platsåtkomst nekades. Tillåt GPS i webbläsarens inställningar.";
    case 2:
      return "Kunde inte hitta din plats just nu. Gå till öpppet fält och försök igen.";
    case 3:
      return "GPS-signalen tog för lång tid. Försök igen om en stund.";
    default:
      return "Något gick fel med platsen. Försök igen.";
  }
}

export function startWatching(
  onFix: (fix: RawFix) => void,
  onError: (error: GeoError) => void,
): number {
  if (!("geolocation" in navigator)) {
    onError({ code: 0, message: "Webbläsaren stöder inte GPS." });
    return -1;
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      onFix({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      });
    },
    (error) => onError({ code: error.code, message: error.message }),
    {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 20000,
    },
  );
}
