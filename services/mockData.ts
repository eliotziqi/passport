import { AppData, Activity, MemoryAnchor } from '../types';

// Helper to generate a wavy line around a center point to simulate a route
const generateRoute = (center: [number, number], points: number, spread: number): [number, number][] => {
  const route: [number, number][] = [];
  let [lng, lat] = center;
  for (let i = 0; i < points; i++) {
    lng += (Math.random() - 0.5) * spread;
    lat += (Math.random() - 0.5) * spread;
    route.push([lng, lat]);
  }
  return route;
};

// Mock Activities (San Francisco Area)
const sfActivities: Activity[] = [
  {
    id: 'a1',
    type: 'Run',
    name: 'Golden Gate Morning Run',
    date: '2023-10-15',
    distance: 8.5,
    coordinates: generateRoute([-122.4783, 37.8199], 50, 0.002)
  },
  {
    id: 'a2',
    type: 'Ride',
    name: 'Hawk Hill Loop',
    date: '2023-10-12',
    distance: 25.0,
    coordinates: generateRoute([-122.4983, 37.8399], 100, 0.005)
  },
  {
    id: 'a3',
    type: 'Hike',
    name: 'Lands End Trail',
    date: '2023-09-20',
    distance: 5.2,
    coordinates: generateRoute([-122.51, 37.78], 40, 0.001)
  },
  {
    id: 'a4',
    type: 'Run',
    name: 'Embarcadero Jog',
    date: '2023-11-01',
    distance: 6.0,
    coordinates: generateRoute([-122.39, 37.79], 60, 0.002)
  }
];

// Mock Activities (New York Area)
const nyActivities: Activity[] = [
    {
      id: 'ny1',
      type: 'Run',
      name: 'Central Park Loop',
      date: '2023-08-10',
      distance: 10.0,
      coordinates: generateRoute([-73.9665, 40.7812], 80, 0.003)
    },
    {
        id: 'ny2',
        type: 'Ride',
        name: 'Hudson Greenway',
        date: '2023-08-12',
        distance: 15.0,
        coordinates: generateRoute([-74.009, 40.72], 120, 0.004)
    }
];

// Mock Anchors
const anchors: MemoryAnchor[] = [
  {
    id: 'm1',
    coordinate: [-122.4783, 37.8199],
    title: 'Golden Gate Bridge',
    date: 'Oct 15, 2023',
    note: 'The fog finally cleared up this morning. Perfect running weather.',
    imageUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'm2',
    coordinate: [-73.9665, 40.7812],
    title: 'Central Park',
    date: 'Aug 10, 2023',
    note: 'Marathon training day 1. Felt good but humid.',
    imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=600&q=80'
  }
];

export const APP_DATA: AppData = {
  activities: [...sfActivities, ...nyActivities],
  anchors: anchors,
  bookmarks: [
    { title: 'GitHub', url: 'https://github.com' },
    { title: 'YouTube', url: 'https://youtube.com' },
    { title: 'Gmail', url: 'https://mail.google.com' },
    { title: 'Strava', url: 'https://strava.com' },
    { title: 'Dribbble', url: 'https://dribbble.com' },
  ]
};