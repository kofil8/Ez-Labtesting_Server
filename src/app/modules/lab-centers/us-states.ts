export type UsStateInfo = {
  code: string;
  name: string;
  latitude: number;
  longitude: number;
};

export const US_STATE_CENTERS: UsStateInfo[] = [
  { code: 'AL', name: 'Alabama', latitude: 32.806671, longitude: -86.79113 },
  { code: 'AK', name: 'Alaska', latitude: 61.370716, longitude: -152.404419 },
  { code: 'AZ', name: 'Arizona', latitude: 33.729759, longitude: -111.431221 },
  { code: 'AR', name: 'Arkansas', latitude: 34.969704, longitude: -92.373123 },
  { code: 'CA', name: 'California', latitude: 36.116203, longitude: -119.681564 },
  { code: 'CO', name: 'Colorado', latitude: 39.059811, longitude: -105.311104 },
  { code: 'CT', name: 'Connecticut', latitude: 41.597782, longitude: -72.755371 },
  { code: 'DE', name: 'Delaware', latitude: 39.318523, longitude: -75.507141 },
  { code: 'FL', name: 'Florida', latitude: 27.766279, longitude: -81.686783 },
  { code: 'GA', name: 'Georgia', latitude: 33.040619, longitude: -83.643074 },
  { code: 'HI', name: 'Hawaii', latitude: 21.094318, longitude: -157.498337 },
  { code: 'ID', name: 'Idaho', latitude: 44.240459, longitude: -114.478828 },
  { code: 'IL', name: 'Illinois', latitude: 40.349457, longitude: -88.986137 },
  { code: 'IN', name: 'Indiana', latitude: 39.849426, longitude: -86.258278 },
  { code: 'IA', name: 'Iowa', latitude: 42.011539, longitude: -93.210526 },
  { code: 'KS', name: 'Kansas', latitude: 38.5266, longitude: -96.726486 },
  { code: 'KY', name: 'Kentucky', latitude: 37.66814, longitude: -84.670067 },
  { code: 'LA', name: 'Louisiana', latitude: 31.169546, longitude: -91.867805 },
  { code: 'ME', name: 'Maine', latitude: 44.693947, longitude: -69.381927 },
  { code: 'MD', name: 'Maryland', latitude: 39.063946, longitude: -76.802101 },
  { code: 'MA', name: 'Massachusetts', latitude: 42.230171, longitude: -71.530106 },
  { code: 'MI', name: 'Michigan', latitude: 43.326618, longitude: -84.536095 },
  { code: 'MN', name: 'Minnesota', latitude: 45.694454, longitude: -93.900192 },
  { code: 'MS', name: 'Mississippi', latitude: 32.741646, longitude: -89.678696 },
  { code: 'MO', name: 'Missouri', latitude: 38.456085, longitude: -92.288368 },
  { code: 'MT', name: 'Montana', latitude: 46.921925, longitude: -110.454353 },
  { code: 'NE', name: 'Nebraska', latitude: 41.12537, longitude: -98.268082 },
  { code: 'NV', name: 'Nevada', latitude: 38.313515, longitude: -117.055374 },
  { code: 'NH', name: 'New Hampshire', latitude: 43.452492, longitude: -71.563896 },
  { code: 'NJ', name: 'New Jersey', latitude: 40.298904, longitude: -74.521011 },
  { code: 'NM', name: 'New Mexico', latitude: 34.840515, longitude: -106.248482 },
  { code: 'NY', name: 'New York', latitude: 42.165726, longitude: -74.948051 },
  { code: 'NC', name: 'North Carolina', latitude: 35.630066, longitude: -79.806419 },
  { code: 'ND', name: 'North Dakota', latitude: 47.528912, longitude: -99.784012 },
  { code: 'OH', name: 'Ohio', latitude: 40.388783, longitude: -82.764915 },
  { code: 'OK', name: 'Oklahoma', latitude: 35.565342, longitude: -96.928917 },
  { code: 'OR', name: 'Oregon', latitude: 44.572021, longitude: -122.070938 },
  { code: 'PA', name: 'Pennsylvania', latitude: 40.590752, longitude: -77.209755 },
  { code: 'RI', name: 'Rhode Island', latitude: 41.680893, longitude: -71.51178 },
  { code: 'SC', name: 'South Carolina', latitude: 33.856892, longitude: -80.945007 },
  { code: 'SD', name: 'South Dakota', latitude: 44.299782, longitude: -99.438828 },
  { code: 'TN', name: 'Tennessee', latitude: 35.747845, longitude: -86.692345 },
  { code: 'TX', name: 'Texas', latitude: 31.054487, longitude: -97.563461 },
  { code: 'UT', name: 'Utah', latitude: 40.150032, longitude: -111.862434 },
  { code: 'VT', name: 'Vermont', latitude: 44.045876, longitude: -72.710686 },
  { code: 'VA', name: 'Virginia', latitude: 37.769337, longitude: -78.169968 },
  { code: 'WA', name: 'Washington', latitude: 47.400902, longitude: -121.490494 },
  { code: 'WV', name: 'West Virginia', latitude: 38.491226, longitude: -80.954453 },
  { code: 'WI', name: 'Wisconsin', latitude: 44.268543, longitude: -89.616508 },
  { code: 'WY', name: 'Wyoming', latitude: 42.755966, longitude: -107.30249 },
];

export const US_STATE_NAME_BY_CODE = Object.fromEntries(
  US_STATE_CENTERS.map((state) => [state.code, state.name]),
) as Record<string, string>;
