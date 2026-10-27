/* ============================================================================
   BREEDERS' CUP SHOWDOWN — RACE CARD DATA  (data.js)
   ----------------------------------------------------------------------------
   This is the ONLY file that needs to change when the official fields arrive.
   REAL FIELDS LOADED: post positions and morning lines from the official
   Oct 26, 2026 post-position draw (Equibase official entries for undercards;
   Courier-Journal / BloodHorse for championship races). Also-eligible horses
   are NOT listed — only the main body of each field runs unless scratched in.
   Update `now` / `oddsUpdated` as odds snapshots come in. No app code changes.

   Horse object:  { n: <program number>, name: <string>,
                    ml: <morning line, e.g. "5/2", or null>,
                    now: <updated odds string, or null -> Now shows ML> }
   Race object:   { n, name, detail, bc (true = championship race),
                    postLabel ("4:55 PM ET"), postISO (lock time, ET offset),
                    note (optional), horses: [...] }
   ============================================================================ */
(function (g) {
  'use strict';

  var BC_DATA = {
    title: "Breeders' Cup Showdown",
    venue: 'Keeneland · Lexington, Kentucky',
    bankPerDay: 1000,
    players: [
      { id: 'terry', name: 'Terry' },
      { id: 'chandra', name: 'Chandra' }
    ],
    days: [
      {
        id: 'fri',
        label: 'Friday',
        title: 'Future Stars Friday',
        dateLabel: 'Friday, October 30, 2026',
        oddsUpdated: 'Oct 26, 2026, 5:00 PM ET (draw)',
        races: [
          { n: 1, name: 'Allowance Optional Claiming', detail: 'Undercard · 1 1/16 Miles · Dirt · $175,000 · 3YO & Up', bc: false, postLabel: '11:55 AM ET', postISO: '2026-10-30T11:55:00-04:00', horses: [
            { n: 1, name: "Emerging Market", ml: "6/5", now: null },
            { n: 2, name: "Stowaway", ml: "6/1", now: null },
            { n: 3, name: "Gould's Gold", ml: "6/1", now: null },
            { n: 4, name: "Drake's Passage", ml: "30/1", now: null },
            { n: 5, name: "Admiral Dennis", ml: "5/1", now: null },
            { n: 6, name: "Memory", ml: "4/1", now: null },
            { n: 7, name: "Special Session", ml: "12/1", now: null },
            { n: 8, name: "Azam", ml: "15/1", now: null }
          ] },
          { n: 2, name: 'Maiden Special Weight', detail: 'Undercard · 7 Furlongs · Dirt · $150,000 · 2YO Fillies', bc: false, postLabel: '12:30 PM ET', postISO: '2026-10-30T12:30:00-04:00', horses: [
            { n: 1, name: "Ohana Lulu", ml: "8/1", now: null },
            { n: 2, name: "Golden Reveille", ml: "20/1", now: null },
            { n: 3, name: "Honor Is Mine", ml: "9/2", now: null },
            { n: 4, name: "Forgive Me", ml: "6/1", now: null },
            { n: 5, name: "At Full Sail", ml: "15/1", now: null },
            { n: 6, name: "Niosa", ml: "2/1", now: null },
            { n: 7, name: "Maitresse", ml: "10/1", now: null },
            { n: 8, name: "Holiday Pi", ml: "15/1", now: null },
            { n: 9, name: "Groves", ml: "4/1", now: null },
            { n: 10, name: "Maximum Capital", ml: "20/1", now: null }
          ] },
          { n: 3, name: 'Thoroughbred Aftercare Alliance S.', detail: 'Undercard · 1 Mile · Turf · $250,000 · 2YO', bc: false, postLabel: '1:05 PM ET', postISO: '2026-10-30T13:05:00-04:00', horses: [
            { n: 1, name: "Maxify", ml: "8/1", now: null },
            { n: 2, name: "Canada", ml: "6/1", now: null },
            { n: 3, name: "Real Goodbar", ml: "9/2", now: null },
            { n: 4, name: "Observed", ml: "8/1", now: null },
            { n: 5, name: "Nuit d'Eclair", ml: "6/1", now: null },
            { n: 6, name: "Majik Mooney", ml: "10/1", now: null },
            { n: 7, name: "Oscar Cheer", ml: "12/1", now: null },
            { n: 8, name: "Roscoe Goose", ml: "6/1", now: null },
            { n: 9, name: "Dee's Funny Girl", ml: "12/1", now: null },
            { n: 10, name: "Coast Highway", ml: "10/1", now: null },
            { n: 11, name: "Admiral's Order", ml: "15/1", now: null },
            { n: 12, name: "Mid American", ml: "12/1", now: null }
          ] },
          { n: 4, name: 'Allowance', detail: 'Undercard · 6½ Furlongs · Dirt · $165,000 · 3YO & Up', bc: false, postLabel: '1:40 PM ET', postISO: '2026-10-30T13:40:00-04:00', horses: [
            { n: 1, name: "High Camp", ml: "8/1", now: null },
            { n: 2, name: "Lincoln's Law", ml: "12/1", now: null },
            { n: 3, name: "Bob's Carrot", ml: "15/1", now: null },
            { n: 4, name: "Ghazaaly", ml: "6/1", now: null },
            { n: 5, name: "Send Cash", ml: "15/1", now: null },
            { n: 6, name: "Global Aviator", ml: "5/1", now: null },
            { n: 7, name: "Cornwall Boss", ml: "3/1", now: null },
            { n: 8, name: "Imagine John", ml: "20/1", now: null },
            { n: 9, name: "Big Apple Patrick", ml: "20/1", now: null },
            { n: 10, name: "Campobasso", ml: "2/1", now: null }
          ] },
          { n: 5, name: 'Allowance Optional Claiming', detail: 'Undercard · 7 Furlongs · Dirt · $165,000 · 2YO', bc: false, postLabel: '2:15 PM ET', postISO: '2026-10-30T14:15:00-04:00', horses: [
            { n: 1, name: "Yacht Master", ml: "4/1", now: null },
            { n: 2, name: "Kingside", ml: "9/2", now: null },
            { n: 3, name: "Bet On Silver", ml: "12/1", now: null },
            { n: 4, name: "Spicy Taco", ml: "30/1", now: null },
            { n: 5, name: "Merit Badge", ml: "10/1", now: null },
            { n: 6, name: "Sargent Bilko", ml: "20/1", now: null },
            { n: 7, name: "Fusta", ml: "12/1", now: null },
            { n: 8, name: "Mission Integrity", ml: "9/2", now: null },
            { n: 9, name: "Take a Picture", ml: "10/1", now: null },
            { n: 10, name: "Dormie", ml: "10/1", now: null },
            { n: 11, name: "McCoy", ml: "7/2", now: null }
          ] },
          { n: 6, name: "Breeders' Cup Juvenile Turf Sprint", detail: 'Grade 1 · $1,000,000 · 5½ Furlongs · Turf · 2YO', bc: true, postLabel: '2:55 PM ET', postISO: '2026-10-30T14:55:00-04:00', horses: [
            { n: 1, name: "Moonrise", ml: "12/1", now: null },
            { n: 2, name: "Good to Be King", ml: "12/1", now: null },
            { n: 3, name: "Libertango", ml: "5/2", now: null },
            { n: 4, name: "Brickyard Belle", ml: "3/1", now: null },
            { n: 5, name: "Mussab", ml: "15/1", now: null },
            { n: 6, name: "Velozee", ml: "20/1", now: null },
            { n: 7, name: "Crownbreaker", ml: "20/1", now: null },
            { n: 8, name: "Force Noir", ml: "8/1", now: null },
            { n: 9, name: "Final Objective", ml: "8/1", now: null },
            { n: 10, name: "Harper's Corner", ml: "8/1", now: null },
            { n: 11, name: "Hell of A Spin", ml: "15/1", now: null },
            { n: 12, name: "Primetime Emmy", ml: "15/1", now: null }
          ] },
          { n: 7, name: "Breeders' Cup Juvenile Fillies", detail: 'Grade 1 · $2,000,000 · 1 1/16 Miles · Dirt · 2YO Fillies', bc: true, postLabel: '3:35 PM ET', postISO: '2026-10-30T15:35:00-04:00', horses: [
            { n: 1, name: "Scarlett Begonia", ml: "20/1", now: null },
            { n: 2, name: "Domain Expansion", ml: "6/1", now: null },
            { n: 3, name: "Foxiest", ml: "15/1", now: null },
            { n: 4, name: "Rum Twist", ml: "15/1", now: null },
            { n: 5, name: "Miss Monica", ml: "5/2", now: null },
            { n: 6, name: "Revenge of the Sis", ml: "20/1", now: null },
            { n: 7, name: "Lexi's Charm", ml: "15/1", now: null },
            { n: 8, name: "Manuka Honey", ml: "10/1", now: null },
            { n: 9, name: "Badittude", ml: "30/1", now: null },
            { n: 10, name: "Emphatic", ml: "9/5", now: null },
            { n: 11, name: "Voyager", ml: "12/1", now: null },
            { n: 12, name: "Life Changing", ml: "30/1", now: null }
          ] },
          { n: 8, name: "Breeders' Cup Juvenile Fillies Turf", detail: 'Grade 1 · $1,000,000 · 1 Mile · Turf · 2YO Fillies', bc: true, postLabel: '4:15 PM ET', postISO: '2026-10-30T16:15:00-04:00', horses: [
            { n: 1, name: "Green Empress", ml: "10/1", now: null },
            { n: 2, name: "Go For Launch", ml: "30/1", now: null },
            { n: 3, name: "Curracloe", ml: "12/1", now: null },
            { n: 4, name: "Serenas Ghost", ml: "20/1", now: null },
            { n: 5, name: "De la Renta", ml: "30/1", now: null },
            { n: 6, name: "Alwaysanangel", ml: "15/1", now: null },
            { n: 7, name: "Vanta", ml: "20/1", now: null },
            { n: 8, name: "Citrus Springs", ml: "15/1", now: null },
            { n: 9, name: "Sun Goddess", ml: "6/5", now: null },
            { n: 10, name: "Amusingly", ml: "7/2", now: null },
            { n: 11, name: "Scommessa Sicura", ml: "30/1", now: null },
            { n: 12, name: "Domestic Agenda", ml: "8/1", now: null },
            { n: 13, name: "Seneca Park", ml: "30/1", now: null },
            { n: 14, name: "Ballinea Star", ml: "30/1", now: null }
          ] },
          { n: 9, name: "Breeders' Cup Juvenile", detail: 'Grade 1 · $2,000,000 · 1 1/16 Miles · Dirt · 2YO', bc: true, postLabel: '4:55 PM ET', postISO: '2026-10-30T16:55:00-04:00', horses: [
            { n: 1, name: "Damavand", ml: "20/1", now: null },
            { n: 2, name: "Gaudreau", ml: "8/1", now: null },
            { n: 3, name: "Salahudin", ml: "6/1", now: null },
            { n: 4, name: "Earth Song", ml: "20/1", now: null },
            { n: 5, name: "Hughes", ml: "1/1", now: null },
            { n: 6, name: "American History", ml: "9/2", now: null },
            { n: 7, name: "Coach Pope", ml: "4/1", now: null },
            { n: 8, name: "He Is No Lie", ml: "15/1", now: null }
          ] },
          { n: 10, name: "Breeders' Cup Juvenile Turf", detail: 'Grade 1 · $1,000,000 · 1 Mile · Turf · 2YO', bc: true, postLabel: '5:35 PM ET', postISO: '2026-10-30T17:35:00-04:00', horses: [
            { n: 1, name: "Induction", ml: "30/1", now: null },
            { n: 2, name: "Avec Toi", ml: "10/1", now: null },
            { n: 3, name: "Florida Bay", ml: "20/1", now: null },
            { n: 4, name: "Haffner", ml: "8/1", now: null },
            { n: 5, name: "How's Al Today", ml: "3/1", now: null },
            { n: 6, name: "Pikachu", ml: "30/1", now: null },
            { n: 7, name: "Let Em Know", ml: "20/1", now: null },
            { n: 8, name: "Liam's Law", ml: "20/1", now: null },
            { n: 9, name: "Sale Shark", ml: "30/1", now: null },
            { n: 10, name: "Folsom Blues", ml: "7/2", now: null },
            { n: 11, name: "Man's Best Friend", ml: "15/1", now: null },
            { n: 12, name: "Oscar", ml: "15/1", now: null },
            { n: 13, name: "Agate", ml: "10/1", now: null },
            { n: 14, name: "Great Barrier Reef", ml: "4/1", now: null }
          ] }
        ]
      },
      {
        id: 'sat',
        label: 'Saturday',
        title: 'Championship Saturday',
        dateLabel: 'Saturday, October 31, 2026',
        oddsUpdated: 'Oct 26, 2026, 5:00 PM ET (draw)',
        races: [
          { n: 1, name: 'Maiden Special Weight', detail: 'Undercard · 7 Furlongs · Dirt · $150,000 · 2YO', bc: false, postLabel: '11:15 AM ET', postISO: '2026-10-31T11:15:00-04:00', horses: [
            { n: 1, name: "Candor", ml: "20/1", now: null },
            { n: 2, name: "Highwaymen", ml: "6/1", now: null },
            { n: 3, name: "Tacamo", ml: "30/1", now: null },
            { n: 4, name: "Knicks Diamonds", ml: "10/1", now: null },
            { n: 5, name: "Powerline", ml: "8/5", now: null },
            { n: 6, name: "You Want Some", ml: "12/1", now: null },
            { n: 7, name: "Bourbon Neat", ml: "8/1", now: null },
            { n: 8, name: "Supreme Commander", ml: "5/1", now: null },
            { n: 9, name: "Mahogany Dream", ml: "20/1", now: null },
            { n: 10, name: "Baytown Thracian", ml: "30/1", now: null },
            { n: 11, name: "Overtime Bonus", ml: "12/1", now: null },
            { n: 12, name: "Shock Value", ml: "12/1", now: null }
          ] },
          { n: 2, name: 'Allowance Optional Claiming', detail: 'Undercard · 7 Furlongs · Dirt · $165,000 · 2YO Fillies', bc: false, postLabel: '11:50 AM ET', postISO: '2026-10-31T11:50:00-04:00', horses: [
            { n: 1, name: "Betty Sue", ml: "15/1", now: null },
            { n: 2, name: "Girls Wear Pearls", ml: "12/1", now: null },
            { n: 3, name: "Master Queen", ml: "8/1", now: null },
            { n: 4, name: "Harmoniously", ml: "5/1", now: null },
            { n: 5, name: "Virabhadrasana", ml: "7/2", now: null },
            { n: 6, name: "She's Toasty", ml: "9/2", now: null },
            { n: 7, name: "Fizzypopberrytwist", ml: "30/1", now: null },
            { n: 8, name: "Don't Tell Mom", ml: "6/1", now: null },
            { n: 9, name: "Right in Time", ml: "5/2", now: null }
          ] },
          { n: 3, name: 'Allowance Optional Claiming', detail: 'Undercard · 6½ Furlongs · Dirt · $185,000 · 3YO & Up', bc: false, postLabel: '12:25 PM ET', postISO: '2026-10-31T12:25:00-04:00', horses: [
            { n: 1, name: "Booth", ml: "4/1", now: null },
            { n: 2, name: "Steeze", ml: "8/1", now: null },
            { n: 3, name: "Jimmy Rules", ml: "30/1", now: null },
            { n: 4, name: "Lips Say Bliss", ml: "15/1", now: null },
            { n: 5, name: "Extra Anejo", ml: "8/1", now: null },
            { n: 6, name: "Will Take It", ml: "12/1", now: null },
            { n: 7, name: "Durante", ml: "20/1", now: null },
            { n: 8, name: "Tennessee Lamb", ml: "12/1", now: null },
            { n: 9, name: "Sir Greylind", ml: "8/1", now: null },
            { n: 10, name: "Floodlites", ml: "12/1", now: null },
            { n: 11, name: "Saudi Crown", ml: "5/2", now: null },
            { n: 12, name: "Here Mi Song", ml: "15/1", now: null },
            { n: 13, name: "Henro", ml: "20/1", now: null }
          ] },
          { n: 4, name: "Breeders' Cup Filly & Mare Sprint", detail: 'Grade 1 · $1,000,000 · 7 Furlongs · Dirt · Fillies & Mares', bc: true, postLabel: '1:10 PM ET', postISO: '2026-10-31T13:10:00-04:00', horses: [
            { n: 1, name: "Look Forward", ml: "20/1", now: null },
            { n: 2, name: "Ways and Means", ml: "7/5", now: null },
            { n: 3, name: "Praying", ml: "30/1", now: null },
            { n: 4, name: "R Disaster", ml: "8/1", now: null },
            { n: 5, name: "Foie Gras", ml: "20/1", now: null },
            { n: 6, name: "Majestic Oops", ml: "15/1", now: null },
            { n: 7, name: "Evanescence", ml: "15/1", now: null },
            { n: 8, name: "Kerry's Kiss", ml: "20/1", now: null },
            { n: 9, name: "Sweet Azteca", ml: "8/1", now: null },
            { n: 10, name: "Simply Joking", ml: "30/1", now: null },
            { n: 11, name: "Explora", ml: "4/1", now: null },
            { n: 12, name: "Kilwin", ml: "8/1", now: null },
            { n: 13, name: "Nooni", ml: "30/1", now: null }
          ] },
          { n: 5, name: "Breeders' Cup Turf Sprint", detail: 'Grade 1 · $1,000,000 · 5½ Furlongs · Turf', bc: true, postLabel: '1:48 PM ET', postISO: '2026-10-31T13:48:00-04:00', horses: [
            { n: 1, name: "John the Beer Man", ml: "30/1", now: null },
            { n: 2, name: "Shisospicy", ml: "15/1", now: null },
            { n: 3, name: "Bacio", ml: "5/2", now: null },
            { n: 4, name: "Roja", ml: "30/1", now: null },
            { n: 5, name: "Time to Dazzle", ml: "20/1", now: null },
            { n: 6, name: "Yellow Card", ml: "8/1", now: null },
            { n: 7, name: "Comanche Brave", ml: "3/1", now: null },
            { n: 8, name: "Possiblemente", ml: "12/1", now: null },
            { n: 9, name: "In Our Time", ml: "20/1", now: null },
            { n: 10, name: "Cy Fair", ml: "8/1", now: null },
            { n: 11, name: "Joe Shiesty", ml: "10/1", now: null },
            { n: 12, name: "Sorrento Sky", ml: "12/1", now: null },
            { n: 13, name: "Starlust", ml: "20/1", now: null },
            { n: 14, name: "Miss Yechance", ml: "15/1", now: null }
          ] },
          { n: 6, name: "Breeders' Cup Dirt Mile", detail: 'Grade 1 · $1,000,000 · 1 Mile · Dirt', bc: true, postLabel: '2:26 PM ET', postISO: '2026-10-31T14:26:00-04:00', horses: [
            { n: 1, name: "Further Ado", ml: "2/1", now: null },
            { n: 2, name: "T Kraft", ml: "15/1", now: null },
            { n: 3, name: "Full Serrano", ml: "10/1", now: null },
            { n: 4, name: "Chunk of Gold", ml: "8/1", now: null },
            { n: 5, name: "Coal Battle", ml: "6/1", now: null },
            { n: 6, name: "Lord Fons", ml: "15/1", now: null },
            { n: 7, name: "Bracket Buster", ml: "7/2", now: null },
            { n: 8, name: "Moonlight", ml: "15/1", now: null },
            { n: 9, name: "Forged Steel", ml: "15/1", now: null },
            { n: 10, name: "Owen Almighty", ml: "10/1", now: null },
            { n: 11, name: "Iron Man Cal", ml: "12/1", now: null }
          ] },
          { n: 7, name: "Breeders' Cup Filly & Mare Turf", detail: 'Grade 1 · $2,000,000 · 1 3/16 Miles · Turf · Fillies & Mares', bc: true, postLabel: '3:04 PM ET', postISO: '2026-10-31T15:04:00-04:00', horses: [
            { n: 1, name: "Gimme a Nother", ml: "10/1", now: null },
            { n: 2, name: "Evershed", ml: "30/1", now: null },
            { n: 3, name: "Classic Q", ml: "20/1", now: null },
            { n: 4, name: "Red Letter", ml: "12/1", now: null },
            { n: 5, name: "Kathynmarissa", ml: "5/1", now: null },
            { n: 6, name: "Thought Process", ml: "15/1", now: null },
            { n: 7, name: "Bless the Broken", ml: "20/1", now: null },
            { n: 8, name: "Jancis", ml: "20/1", now: null },
            { n: 9, name: "Eccentric", ml: "30/1", now: null },
            { n: 10, name: "Expensive Queen", ml: "15/1", now: null },
            { n: 11, name: "Precise", ml: "7/2", now: null },
            { n: 12, name: "Blue Bolt", ml: "5/2", now: null },
            { n: 13, name: "Lush Lips", ml: "12/1", now: null },
            { n: 14, name: "Stellify", ml: "12/1", now: null }
          ] },
          { n: 8, name: "Breeders' Cup Sprint", detail: 'Grade 1 · $2,000,000 · 6 Furlongs · Dirt', bc: true, postLabel: '3:42 PM ET', postISO: '2026-10-31T15:42:00-04:00', horses: [
            { n: 1, name: "Mad House", ml: "30/1", now: null },
            { n: 2, name: "Dark Saffron", ml: "20/1", now: null },
            { n: 3, name: "Liam Smith", ml: "20/1", now: null },
            { n: 4, name: "Hymn", ml: "15/1", now: null },
            { n: 5, name: "Listenupshance", ml: "12/1", now: null },
            { n: 6, name: "American Stage", ml: "30/1", now: null },
            { n: 7, name: "Built", ml: "10/1", now: null },
            { n: 8, name: "Little Thunder", ml: "30/1", now: null },
            { n: 9, name: "Nakatomi", ml: "12/1", now: null },
            { n: 10, name: "Roll On Big Joe", ml: "30/1", now: null },
            { n: 11, name: "T O Elvis", ml: "7/2", now: null },
            { n: 12, name: "Stradale", ml: "20/1", now: null },
            { n: 13, name: "Englishman", ml: "4/5", now: null }
          ] },
          { n: 9, name: "Breeders' Cup Mile", detail: 'Grade 1 · $2,000,000 · 1 Mile · Turf', bc: true, postLabel: '4:20 PM ET', postISO: '2026-10-31T16:20:00-04:00', horses: [
            { n: 1, name: "Deterministic", ml: "8/1", now: null },
            { n: 2, name: "Lake Forest", ml: "6/1", now: null },
            { n: 3, name: "Facteur Cheval", ml: "30/1", now: null },
            { n: 4, name: "Cabo Spirit", ml: "30/1", now: null },
            { n: 5, name: "Ask Ikigomi", ml: "20/1", now: null },
            { n: 6, name: "Zulu Kingdom", ml: "15/1", now: null },
            { n: 7, name: "Qirat", ml: "30/1", now: null },
            { n: 8, name: "Notable Speech", ml: "7/5", now: null },
            { n: 9, name: "Rhetorical", ml: "8/1", now: null },
            { n: 10, name: "Lugal", ml: "30/1", now: null },
            { n: 11, name: "Formidable Man", ml: "15/1", now: null },
            { n: 12, name: "True Love", ml: "8/1", now: null },
            { n: 13, name: "Brilliant Berti", ml: "30/1", now: null },
            { n: 14, name: "Puerto Rico", ml: "10/1", now: null }
          ] },
          { n: 10, name: "Breeders' Cup Distaff", detail: 'Grade 1 · $2,000,000 · 1 1/8 Miles · Dirt · Fillies & Mares', bc: true, postLabel: '4:58 PM ET', postISO: '2026-10-31T16:58:00-04:00', horses: [
            { n: 1, name: "Immersive", ml: "30/1", now: null },
            { n: 2, name: "Nitrogen", ml: "6/5", now: null },
            { n: 3, name: "Regaled", ml: "20/1", now: null },
            { n: 4, name: "Fully Subscribed", ml: "8/5", now: null },
            { n: 5, name: "Scottish Lassie", ml: "15/1", now: null },
            { n: 6, name: "Measure", ml: "20/1", now: null },
            { n: 7, name: "Super Corredora", ml: "15/1", now: null },
            { n: 8, name: "Splendora", ml: "9/2", now: null },
            { n: 9, name: "Eunomia", ml: "30/1", now: null }
          ] },
          { n: 11, name: "Breeders' Cup Turf", detail: 'Grade 1 · $5,000,000 · 1 1/2 Miles · Turf', bc: true, postLabel: '5:36 PM ET', postISO: '2026-10-31T17:36:00-04:00', horses: [
            { n: 1, name: "Ethical Diamond", ml: "10/1", now: null },
            { n: 2, name: "Benvenuto Cellini", ml: "6/1", now: null },
            { n: 3, name: "Minaret Station", ml: "15/1", now: null },
            { n: 4, name: "Far Bridge", ml: "20/1", now: null },
            { n: 5, name: "El Cordobes", ml: "15/1", now: null },
            { n: 6, name: "Burnham Square", ml: "8/1", now: null },
            { n: 7, name: "Hotazhell", ml: "15/1", now: null },
            { n: 8, name: "Test Score", ml: "30/1", now: null },
            { n: 9, name: "Johanna Walsh", ml: "12/1", now: null },
            { n: 10, name: "Tiffany", ml: "10/1", now: null },
            { n: 11, name: "Survie", ml: "15/1", now: null },
            { n: 12, name: "Diamond Necklace", ml: "3/1", now: null },
            { n: 13, name: "Bay City Roller", ml: "5/1", now: null },
            { n: 14, name: "Deep Monster", ml: "30/1", now: null }
          ] },
          { n: 12, name: "Breeders' Cup Classic", detail: 'Grade 1 · $7,000,000 · 1 1/4 Miles · Dirt', bc: true, postLabel: '6:16 PM ET', postISO: '2026-10-31T18:16:00-04:00', horses: [
            { n: 1, name: "T O Password", ml: "30/1", now: null },
            { n: 2, name: "Sovereignty", ml: "5/2", now: null },
            { n: 3, name: "Golden Tempo", ml: "5/1", now: null },
            { n: 4, name: "The Puma", ml: "10/1", now: null },
            { n: 5, name: "Forever Young", ml: "2/1", now: null },
            { n: 6, name: "Magnitude", ml: "6/1", now: null },
            { n: 7, name: "Knightsbridge", ml: "9/2", now: null },
            { n: 8, name: "Napoleon Solo", ml: "15/1", now: null }
          ] }
        ]
      }
    ]
  };

  g.BC_DATA = BC_DATA;
})(typeof window !== 'undefined' ? window : globalThis);
