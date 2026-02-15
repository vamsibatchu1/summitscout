# Project Overview & Development Log

**Project Goal**: Create a React-based application for cartography and geographical creative coding, leveraging the Mapbox API to visualize unique datasets and insights.

## Development Log

### Session 1: Initial Setup
- **Date**: 2026-02-15
- **Actions**:
  - Initialized Vite + React application structure.
  - Installed `mapbox-gl` and configured the access token.
  - Setup basic full-screen map component with navigation controls.
  - Verified build process.
  - **Style Integration**: Decided to use the Mapbox Style URL (`mapbox://styles/vamsibatchuk/cmlo0uerf001m01s5goj0hcna`) over the local file method for easier maintenance and asset handling.
- **Current State**: A functional React app displaying a full-screen interactive map centered on Boston (default test coordinates).

## Application Concepts
We are exploring several creative mapping directions:

1.  **Etymology Map**:
    - *Concept*: interactive map tracking and tracing the roots/origins of words across different locations and languages.
    - *Status*: Brainstorming.

2.  **FIFA / World Cup Cartography**:
    - *Concept*: Visualizing data surrounding the World Cup, perhaps player origins, match locations, or fan demographics.
    - *Status*: Brainstorming.

3.  **Geolocation Game**:
    - *Concept*: A "GeoGuessr" style game where users guess a country or location based on hints presented on the map.
    - *Status*: Brainstorming.

4.  **Paleontology Map**:
    - *Concept*: Mapping dinosaur fossil locations and origins.
    - *Status*: Brainstorming.

## Technical Architecture
- **Frontend Framework**: React (Vite)
- **Mapping Engine**: Mapbox GL JS
- **Styling**: Vanilla CSS (focused on clean, full-screen layouts)
- **Map Style**: Custom Mapbox Style ("American Memory") via URL.

## Next Steps
- Apply the new map style URL to the codebase.
- Define specific data sources for the first feature prototype.
- Add interactivity layers (markers, popups, data visualization layers).
