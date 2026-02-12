Kiosk–CMS System (Realtime Digital Signage Platform)
Overview

This project is a full-stack digital kiosk system consisting of:

CMS (Admin Dashboard) – used by administrators to manage media, announcements, kiosk settings, and view assistant interaction logs.

Kiosk App (Display Client) – a fullscreen display that shows rotating media, live announcements, and an interactive assistant avatar.

Both applications communicate in real time using Supabase as the backend.

System Architecture
kiosk-cms-system/
│
├── cms/                 # Admin dashboard (React + Tailwind)
│   ├── src/
│   └── package.json
│
├── kiosk/               # Kiosk display app (React + Tailwind)
│   ├── src/
│   └── package.json
│
│
├── .gitignore
├── README.md
└── ...

Technologies Used
Frontend: 1. React (Vite)
          2. Tailwind CSS
          3. Heroicons
          4. Web Speech API (Text-to-Speech)

Backend:  1. Supabase
          2. PostgreSQL database
          3. Realtime subscriptions (WebSockets)
          4. Authentication
          5. Storage (media files)
          6. Row Level Security (RLS)


CMS (Admin Dashboard)
Features: 1. Secure email/password authentication
          2. Sticky dashboard header with user info & logout
          3. Upload images and videos for kiosks
          4. Create, activate, and deactivate live announcements
          5. View assistant avatar sessions
          6. Inspect full chat logs per session
          7. Manage kiosk settings (e.g. image rotation duration)

Key Components: 1. Login – secure admin authentication
                2. Dashboard – main CMS layout
                3. AnnouncementPanel – create & manage announcements
                4. MediaUploadPanel – upload kiosk media
                5. AvatarSessionsPanel – view assistant interaction logs
                6. ProtectedRoute – route protection for authenticated users          
Kiosk App (Display)
Features: 1. Fullscreen media playback (images + videos)
          2. Database-controlled image rotation timing
          3. Live announcement display (updates instantly)
          4. Text-to-Speech announcement playback
          5. Floating Assistant Avatar
          6. Interactive chat UI
          7. Automatic session creation & closure
          8. Realtime updates via Supabase subscriptions

Avatar Assistant: 1. Clicking the assistant starts a new session
                  2. Closing the assistant ends the session
                  3. Each message (user & assistant) is logged
                  4. Sessions are visible in the CMS dashboard
                  5. Clear notice shown: “Session will be closed when you exit the assistant.”

Realtime Functionality

The system uses Supabase Realtime (WebSockets) for: 1. Announcement updates
                                                    2. Media updates
                                                    3. Kiosk settings changes
                                                    4. Assistant session & message logging

This allows: 1. CMS and Kiosk to run in separate browsers
             2. Changes to appear instantly without refresh    

Database Design (Simplified)
Core Tables: 1. kiosks
             2. media_items
             3. announcements
             4. kiosk_settings

Assistant Tables: 1. avatar_sessions
                  2. avatar_messages

Each assistant session is tied to: 1. A specific kiosk
                                   2. Start time
                                   3. End time
                                   4. Full message history  

Security: 1. Supabase Row Level Security (RLS) enabled
          2. Public (anon) access limited to kiosk-safe operations
          3. Admin-only access for CMS operations
          4. Auth state handled via Supabase GoTrue   

Known Limitations & Browser Constraints
Text-to-Speech Autoplay Restrictions

Modern browsers restrict automatic audio playback.

Observed behavior: 1. Some browsers require a page refresh or user interaction before speech plays
                   2. Warning: speechSynthesis.speak() without user activation is deprecated


Cause: 1. Browser security policies (Chrome, Safari, Edge)
       2. Not a bug in application logic

Current Handling: 1. TTS works in many cases but may require refresh depending on browser
                  2. Documented as a known limitation

Future Improvement: 1. Add explicit “Enable Audio” interaction
                    2. Or CMS-controlled TTS toggle

Other Limitations: 1. Assistant logic is rule-based (no AI/NLP API)
                   2. Single kiosk ID currently hardcoded (multi-kiosk expansion planned)
                   3. No analytics charts yet (data is available)

Future Enhancements: 1. Multi-kiosk selector in CMS
                     2. Advanced assistant (AI-powered responses)
                     3. Analytics dashboard (session count, message stats)
                     4. Scheduled announcements
                     5. Offline fallback mode for kiosks

Author
Daniel Iheukwumere                     
