# SeeStar Session Log

## Current State
New project with no existing application logic.

## Requested Changes (Diff)

### Add
- Full observing session logger for SeeStar telescope users
- User authentication (login/logout)
- Session creation form with fields:
  - Date & time of session
  - Location (city/site name, optional lat/lon)
  - Target name (star, galaxy, nebula, planet, etc.)
  - Target type (enum: Star, Double Star, Galaxy, Nebula, Cluster, Planet, Moon, Comet, Other)
  - SeeStar settings: exposure time, gain, filter used, stacking frames
  - Sky conditions: seeing (1-5 scale), transparency (1-5 scale), Bortle class (1-9)
  - Weather: temperature, humidity, wind
  - Session notes (free text)
  - Session rating (1-5 stars)
- Session list view (all sessions, sorted newest first)
- Session detail view
- Session edit and delete
- Dashboard summary stats: total sessions, targets observed, best rated sessions

### Modify
- None

### Remove
- None

## Implementation Plan
1. Backend: Define ObservingSession data type with all fields; CRUD operations (create, read update, delete); user-scoped data; summary stats query
2. Frontend: Auth guard, dashboard with stats, session list, session form (create/edit), session detail view, dark astronomy-themed UI
