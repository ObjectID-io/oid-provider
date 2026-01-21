import OpenLocationCode from "open-location-code-typescript";

export type ValidationResult = {
  check: boolean[];
  checkMsg: string[];
  checked: boolean;
  geolocation: string;
  distance: number;
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

let geolocationPermissionDenied = false; // flag di modulo

export const validateGeolocation = async (geolocation: string): Promise<ValidationResult> => {
  const c: ValidationResult = {
    check: [],
    checkMsg: [],
    checked: false,
    geolocation: "",
    distance: 0,
  };

  if (!geolocation) {
    c.check.push(false);
    c.checkMsg.push("No geolocation data available.");
    c.checked = true;
    return c;
  }

  // Se l'utente ha già negato, non richiedere più la geolocalizzazione
  if (geolocationPermissionDenied) {
    c.check.push(false);
    c.checkMsg.push("Geolocation permission previously denied. Geolocation check skipped.");
    c.checked = true;
    return c;
  }

  // Browser senza supporto geolocation
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    c.check.push(false);
    c.checkMsg.push("Geolocation is not supported by this browser.");
    c.checked = true;
    return c;
  }

  try {
    const decoded = OpenLocationCode.decode(geolocation);
    const { latitudeCenter: lat1, longitudeCenter: lon1 } = decoded;

    c.geolocation = `${lat1.toFixed(6)}, ${lon1.toFixed(6)}`;

    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    });

    const { latitude: lat2, longitude: lon2 } = position.coords;
    const distance = calculateDistance(lat1, lon1, lat2, lon2);
    c.distance = Number(distance.toFixed(1));

    if (distance > 1) {
      c.check.push(false);
      c.checkMsg.push(
        `Geolocation check warning. Distance from the object's last recorded position: ${distance.toFixed(1)} Km.`
      );
    } else {
      c.check.push(true);
      c.checkMsg.push(
        `Geolocation check successful. Distance from the object's last recorded position: ${distance.toFixed(1)} Km.`
      );
    }
  } catch (err: any) {
    //console.error("Geolocation error:", err);

    // 1 = PERMISSION_DENIED
    if (err && typeof err.code === "number" && err.code === 1) {
      geolocationPermissionDenied = true;
      c.check.push(false);
      c.checkMsg.push("User denied geolocation permission. Geolocation check skipped.");
    } else {
      c.check.push(false);
      c.checkMsg.push("Geolocation check failed.");
    }
  }

  c.checked = true;
  return c;
};
