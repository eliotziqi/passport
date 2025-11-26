import { Activity, MemoryAnchor, Bookmark } from '../types';

// Helper to generate a random walk path for demo purposes
const generatePath = (start: [number, number], steps: number, stepSize: number): [number, number][] => {
  const path: [number, number][] = [start];
  let [lon, lat] = start;
  for (let i = 0; i < steps; i++) {
    // Bias movement slightly to create "loops" or trails
    lon += (Math.random() - 0.5) * stepSize;
    lat += (Math.random() - 0.5) * stepSize;
    path.push([lon, lat]);
  }
  return path;
};

// Center points for demo data
const SF_COORDS: [number, number] = [-122.4194, 37.7749];
const NYC_COORDS: [number, number] = [-74.0060, 40.7128];
const LONDON_COORDS: [number, number] = [-0.1276, 51.5074];
const TOKYO_COORDS: [number, number] = [139.6917, 35.6895];
const SYDNEY_COORDS: [number, number] = [151.2093, -33.8688];

export const ACTIVITIES: Activity[] = [
  // San Francisco - Dense run cluster
  ...Array.from({ length: 40 }).map((_, i) => ({
    id: `run-sf-${i}`,
    type: 'Run' as const,
    name: `Morning Run in SF #${i + 1}`,
    date: '2023-10-01',
    coordinates: generatePath(SF_COORDS, 100, 0.002),
  })),
  // SF - Wider rides
  ...Array.from({ length: 25 }).map((_, i) => ({
    id: `ride-sf-${i}`,
    type: 'Ride' as const,
    name: `Marin Headlands Ride #${i + 1}`,
    date: '2023-09-15',
    coordinates: generatePath(SF_COORDS, 300, 0.006),
  })),
  // NYC - Runs
  ...Array.from({ length: 35 }).map((_, i) => ({
    id: `run-nyc-${i}`,
    type: 'Run' as const,
    name: `Central Park Loop #${i + 1}`,
    date: '2023-11-02',
    coordinates: generatePath(NYC_COORDS, 120, 0.002),
  })),
  // London - Hikes
  ...Array.from({ length: 20 }).map((_, i) => ({
    id: `hike-ldn-${i}`,
    type: 'Hike' as const,
    name: `Hampstead Heath Walk #${i + 1}`,
    date: '2023-08-20',
    coordinates: generatePath(LONDON_COORDS, 80, 0.003),
  })),
  // Tokyo - Rides
  ...Array.from({ length: 30 }).map((_, i) => ({
    id: `ride-tokyo-${i}`,
    type: 'Ride' as const,
    name: `Tokyo Cycling #${i + 1}`,
    date: '2023-05-10',
    coordinates: generatePath(TOKYO_COORDS, 250, 0.004),
  })),
  // Sydney
   ...Array.from({ length: 15 }).map((_, i) => ({
    id: `run-syd-${i}`,
    type: 'Run' as const,
    name: `Sydney Harbour Run #${i + 1}`,
    date: '2023-12-05',
    coordinates: generatePath(SYDNEY_COORDS, 90, 0.002),
  })),
];

export const MEMORY_ANCHORS: MemoryAnchor[] = [
  {
    id: 'anchor-1',
    coordinate: [-122.4783, 37.8199],
    title: 'Golden Gate Bridge',
    locationName: 'San Francisco, CA',
    date: '2023-10-15',
    note: "Foggy morning run across the bridge. The sound of foghorns was mesmerizing. Stopped halfway to watch a container ship pass underneath.",
    imageUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'anchor-2',
    coordinate: [139.6917, 35.6895],
    title: 'Neon Nights',
    locationName: 'Shinjuku, Tokyo',
    date: '2023-05-12',
    note: "Cycling through the neon-lit streets after midnight. The city never truly sleeps, but the rhythm changes completely.",
    imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'anchor-3',
    coordinate: [-0.1276, 51.5074],
    title: 'Thames Path',
    locationName: 'London, UK',
    date: '2023-08-22',
    note: "A peaceful walk along the Thames. Found a small coffee cart near Tate Modern and sat watching the river traffic.",
    imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80'
  }
];

export const BOOKMARKS: Bookmark[] = [
  { title: 'Calendar', url: 'https://calendar.google.com' },
  { title: 'Gmail', url: 'https://mail.google.com' },
  { title: 'GitHub', url: 'https://github.com' },
  { title: 'YouTube', url: 'https://youtube.com' },
  { title: 'Strava', url: 'https://strava.com' },
];
