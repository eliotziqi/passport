export type ActivityType = 'Ride' | 'Run' | 'Hike';

export interface Activity {
  id: string;
  type: ActivityType;
  name: string;
  date: string;
  distance: number; // in km
  coordinates: [number, number][]; // LineString array of [lng, lat]
}

export interface MemoryAnchor {
  id: string;
  coordinate: [number, number]; // [lng, lat]
  title: string;
  date: string;
  imageUrl?: string;
  note: string;
}

export interface Bookmark {
  title: string;
  url: string;
  icon?: string;
}

export interface AppData {
  activities: Activity[];
  anchors: MemoryAnchor[];
  bookmarks: Bookmark[];
}