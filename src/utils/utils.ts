export type ValidationResult = {
  check: boolean[];
  checkMsg: string[];
  checked: boolean;
  distance: number;
};

type ObjectInfoResult = {
  objectData: {
    fields: Record<string, any>;
    type: string;
    id: string;
    network: string;
  };
  objectType: string;
  objectPackageId: string;
  eventType: string;
  objectPackageName: string;
};

const debug = false;

export const generateSeedHex = (length = 64): string => {
  const bytes = new Uint8Array(length / 2);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};
