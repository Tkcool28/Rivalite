/* ============================================================================
   BREEDERS' CUP SHOWDOWN — RACE CARD DATA  (data.js)
   ----------------------------------------------------------------------------
   This is the ONLY file that needs to change when the official fields arrive.
   After the post-position draw on Monday Oct 26, 2026, replace the `horses`
   arrays below with the real fields (program number, name, morning line) and
   update `now` / `oddsUpdated` as odds snapshots come in. No app code changes.

   Horse object:  { n: <program number>, name: <string>,
                    ml: <morning line, e.g. "5/2", or null>,
                    now: <updated odds string, or null -> Now shows ML> }
   Race object:   { n, name, detail, bc (true = championship race),
                    postLabel ("4:55 PM ET"), postISO (lock time, ET offset),
                    note (optional), horses: [...] }
   ============================================================================ */
(function (g) {
  'use strict';

  // Placeholder field used until the Oct 26 draw. Clearly marked on purpose.
  function tbaField(count) {
    var out = [];
    for (var i = 1; i <= count; i++) {
      out.push({ n: i, name: 'TBA — field set at Oct 26 draw', ml: null, now: null });
    }
    return out;
  }

  var PLACEHOLDER_NOTE =
    'Placeholder field — official posts & morning lines arrive with the Oct 26 draw. ' +
    'Swap data.js only; the game code does not change. Use DEMO MODE (top of the page) to play-test now.';

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
        oddsUpdated: null, // e.g. "3:42 PM ET" once a snapshot is loaded in data
        races: [
          { n: 1, name: 'The Headley', detail: 'Undercard · Maiden', bc: false, postLabel: '11:55 AM ET', postISO: '2026-10-30T11:55:00-04:00', note: PLACEHOLDER_NOTE, horses: tbaField(10) },
          { n: 2, name: 'Thoroughbred Aftercare Alliance Stakes', detail: 'Undercard · Listed Stakes', bc: false, postLabel: '12:30 PM ET', postISO: '2026-10-30T12:30:00-04:00', note: PLACEHOLDER_NOTE, horses: tbaField(10) },
          { n: 3, name: 'The Bosque Bonita', detail: 'Undercard · Allowance', bc: false, postLabel: '1:05 PM ET', postISO: '2026-10-30T13:05:00-04:00', note: PLACEHOLDER_NOTE, horses: tbaField(10) },
          { n: 4, name: 'The Lanark', detail: 'Undercard · Allowance Optional Claiming', bc: false, postLabel: '1:40 PM ET', postISO: '2026-10-30T13:40:00-04:00', note: PLACEHOLDER_NOTE, horses: tbaField(10) },
          { n: 5, name: 'The Haggin', detail: 'Undercard · Allowance Optional Claiming', bc: false, postLabel: '2:15 PM ET', postISO: '2026-10-30T14:15:00-04:00', note: PLACEHOLDER_NOTE, horses: tbaField(10) },
          { n: 6, name: "Breeders' Cup Juvenile Turf Sprint", detail: 'Grade 1 · $1,000,000 · 5½ Furlongs · Turf · 2YO', bc: true, postLabel: '2:55 PM ET', postISO: '2026-10-30T14:55:00-04:00', note: PLACEHOLDER_NOTE, horses: tbaField(12) },
          { n: 7, name: "Breeders' Cup Juvenile Fillies", detail: 'Grade 1 · $2,000,000 · 1 1/16 Miles · Dirt · 2YO Fillies', bc: true, postLabel: '3:35 PM ET', postISO: '2026-10-30T15:35:00-04:00', note: PLACEHOLDER_NOTE, horses: tbaField(12) },
          { n: 8, name: "Breeders' Cup Juvenile Fillies Turf", detail: 'Grade 1 · $1,000,000 · 1 Mile · Turf · 2YO Fillies', bc: true, postLabel: '4:15 PM ET', postISO: '2026-10-30T16:15:00-04:00', note: PLACEHOLDER_NOTE, horses: tbaField(12) },
          {
            n: 9, name: "Breeders' Cup Juvenile", detail: 'Grade 1 · $2,000,000 · 1 1/16 Miles · Dirt · 2YO', bc: true, postLabel: '4:55 PM ET', postISO: '2026-10-30T16:55:00-04:00',
            note: 'Pre-entered (Oct 21): Hughes · American History · Coach Pope · Damavand · Earth Song · Gaudreau · He Is No Lie · Net Par · Salahudin. Posts & morning line at the Oct 26 draw. ' + PLACEHOLDER_NOTE,
            horses: tbaField(12)
          },
          { n: 10, name: "Breeders' Cup Juvenile Turf", detail: 'Grade 1 · $1,000,000 · 1 Mile · Turf · 2YO', bc: true, postLabel: '5:35 PM ET', postISO: '2026-10-30T17:35:00-04:00', note: PLACEHOLDER_NOTE, horses: tbaField(12) }
        ]
      },
      {
        id: 'sat',
        label: 'Saturday',
        title: 'Championship Saturday',
        dateLabel: 'Saturday, October 31, 2026',
        oddsUpdated: null,
        races: [
          { n: 1, name: 'The Keene Place', detail: 'Undercard · Maiden', bc: false, postLabel: '11:15 AM ET', postISO: '2026-10-31T11:15:00-04:00', note: PLACEHOLDER_NOTE, horses: tbaField(10) },
          { n: 2, name: 'The Maine Chance', detail: 'Undercard · Allowance Optional Claiming', bc: false, postLabel: '11:50 AM ET', postISO: '2026-10-31T11:50:00-04:00', note: PLACEHOLDER_NOTE, horses: tbaField(10) },
          { n: 3, name: 'The Fall Harvest', detail: 'Undercard · Allowance Optional Claiming', bc: false, postLabel: '12:25 PM ET', postISO: '2026-10-31T12:25:00-04:00', note: PLACEHOLDER_NOTE, horses: tbaField(10) },
          { n: 4, name: "Breeders' Cup Dirt Mile", detail: 'Grade 1 · $1,000,000 · 1 Mile · Dirt', bc: true, postLabel: '1:10 PM ET', postISO: '2026-10-31T13:10:00-04:00', note: PLACEHOLDER_NOTE, horses: tbaField(12) },
          { n: 5, name: "Breeders' Cup Turf Sprint", detail: 'Grade 1 · $1,000,000 · 5½ Furlongs · Turf', bc: true, postLabel: '1:48 PM ET', postISO: '2026-10-31T13:48:00-04:00', note: PLACEHOLDER_NOTE, horses: tbaField(12) },
          { n: 6, name: "Breeders' Cup Sprint", detail: 'Grade 1 · $2,000,000 · 6 Furlongs · Dirt', bc: true, postLabel: '2:26 PM ET', postISO: '2026-10-31T14:26:00-04:00', note: PLACEHOLDER_NOTE, horses: tbaField(12) },
          { n: 7, name: "Breeders' Cup Filly & Mare Turf", detail: 'Grade 1 · $2,000,000 · 1 3/16 Miles · Turf · Fillies & Mares', bc: true, postLabel: '3:04 PM ET', postISO: '2026-10-31T15:04:00-04:00', note: PLACEHOLDER_NOTE, horses: tbaField(12) },
          { n: 8, name: "Breeders' Cup Filly & Mare Sprint", detail: 'Grade 1 · $1,000,000 · 7 Furlongs · Dirt · Fillies & Mares', bc: true, postLabel: '3:42 PM ET', postISO: '2026-10-31T15:42:00-04:00', note: PLACEHOLDER_NOTE, horses: tbaField(12) },
          { n: 9, name: "Breeders' Cup Mile", detail: 'Grade 1 · $2,000,000 · 1 Mile · Turf', bc: true, postLabel: '4:20 PM ET', postISO: '2026-10-31T16:20:00-04:00', note: PLACEHOLDER_NOTE, horses: tbaField(12) },
          { n: 10, name: "Breeders' Cup Distaff", detail: 'Grade 1 · $2,000,000 · 1 1/8 Miles · Dirt · Fillies & Mares', bc: true, postLabel: '4:58 PM ET', postISO: '2026-10-31T16:58:00-04:00', note: PLACEHOLDER_NOTE, horses: tbaField(12) },
          { n: 11, name: "Breeders' Cup Turf", detail: 'Grade 1 · $5,000,000 · 1 1/2 Miles · Turf', bc: true, postLabel: '5:36 PM ET', postISO: '2026-10-31T17:36:00-04:00', note: PLACEHOLDER_NOTE, horses: tbaField(12) },
          { n: 12, name: "Breeders' Cup Classic", detail: 'Grade 1 · $7,000,000 · 1 1/4 Miles · Dirt', bc: true, postLabel: '6:16 PM ET', postISO: '2026-10-31T18:16:00-04:00', note: PLACEHOLDER_NOTE, horses: tbaField(14) }
        ]
      }
    ]
  };

  g.BC_DATA = BC_DATA;
})(typeof window !== 'undefined' ? window : globalThis);
