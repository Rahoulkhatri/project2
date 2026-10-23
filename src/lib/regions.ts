export type Region = {
  code: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  /** Median time-to-first-byte for users in the region, ms. */
  p50: number;
  /** Cache nodes at this location. */
  nodes: number;
};

export const REGIONS: Region[] = [
  { code: "KHI", city: "Karachi", country: "PK", lat: 24.86, lon: 67.01, p50: 9, nodes: 6 },
  { code: "BOM", city: "Mumbai", country: "IN", lat: 19.08, lon: 72.88, p50: 11, nodes: 14 },
  { code: "DXB", city: "Dubai", country: "AE", lat: 25.2, lon: 55.27, p50: 8, nodes: 8 },
  { code: "SIN", city: "Singapore", country: "SG", lat: 1.35, lon: 103.82, p50: 12, nodes: 18 },
  { code: "NRT", city: "Tokyo", country: "JP", lat: 35.68, lon: 139.69, p50: 10, nodes: 16 },
  { code: "SYD", city: "Sydney", country: "AU", lat: -33.87, lon: 151.21, p50: 14, nodes: 9 },
  { code: "FRA", city: "Frankfurt", country: "DE", lat: 50.11, lon: 8.68, p50: 7, nodes: 22 },
  { code: "LHR", city: "London", country: "GB", lat: 51.5, lon: -0.12, p50: 8, nodes: 19 },
  { code: "IAD", city: "Ashburn", country: "US", lat: 39.04, lon: -77.49, p50: 9, nodes: 24 },
  { code: "SFO", city: "San Francisco", country: "US", lat: 37.77, lon: -122.42, p50: 11, nodes: 15 },
  { code: "GRU", city: "São Paulo", country: "BR", lat: -23.55, lon: -46.63, p50: 16, nodes: 10 },
  { code: "JNB", city: "Johannesburg", country: "ZA", lat: -26.2, lon: 28.04, p50: 21, nodes: 5 },
];
