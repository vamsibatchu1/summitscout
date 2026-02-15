export const MAP_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export const MAP_STYLES = [
    {
        id: 'american-memory',
        name: 'American Memory',
        url: 'mapbox://styles/vamsibatchuk/cmlo0uerf001m01s5goj0hcna'
    },
    {
        id: 'oil-company',
        name: 'Oil Company',
        url: 'mapbox://styles/vamsibatchuk/cmlo1bwye000t01qxdsiy3uja'
    }
];

export const DEFAULT_STYLE = MAP_STYLES[1];
