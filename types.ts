export type ActivityType = 'Run' | 'Ride' | 'Hike';

export interface Activity {
  id: string;
  type: ActivityType;
  name: string;
  date: string;
  coordinates: [number, number][]; // [Longitude, Latitude]
}

export interface MemoryAnchor {
  id: string;
  coordinate: [number, number];
  title: string;
  date: string;
  note: string;
  imageUrl?: string;
  locationName: string;
}

export interface Bookmark {
  title: string;
  url: string;
}
