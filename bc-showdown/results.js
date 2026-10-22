/* ============================================================================
   BREEDERS' CUP SHOWDOWN — RESULTS SEED  (results.js)
   ----------------------------------------------------------------------------
   Official results live in the app's local storage once entered through the
   in-page "Results" tab (honor system — either player can enter them).
   This file is only the starting seed: no races are official yet.

   Result object per race (key: day id -> race number):
   {
     finish: [6, 1, 5, 4],                 // program numbers, in finish order
     win:    { 6: 17.70 },                 // $2 win price, winner only
     place:  { 6: 6.40, 1: 3.50 },         // $2 place prices, 1st & 2nd
     show:   { 6: 4.20, 1: 2.70, 5: 3.70 },// $2 show prices, top 3
     exacta: 67.40,                        // $2 exacta payout (official order)
     seq:    { double: 45.60,              // $2 payouts for sequences ENDING
               pick3: 210.40, pick4: 0,    //   at this race (omit if none)
               pick5: 0, pick6: 0 }
   }
   Settlement rule (track style): a points stake S on a bet whose official
   $2 payout is P returns S x P / 2.
   ============================================================================ */
(function (g) {
  'use strict';
  g.BC_RESULTS_SEED = { fri: {}, sat: {} };
})(typeof window !== 'undefined' ? window : globalThis);
