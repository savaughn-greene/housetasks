require('dotenv').config();
const db = require('../db');

const profile = [
  { key: 'name', value: 'Sav' },
  { key: 'phone', value: process.env.SAV_PHONE_NUMBER },
  { key: 'address', value: '22 McBride Ave, White Plains, NY' },
  { key: 'commute_days', value: 'tuesday,wednesday,thursday' },
  { key: 'train_home', value: '5:49pm from Grand Central, arrives North White Plains ~6:30pm' },
  { key: 'train_out', value: '7:57am from North White Plains' },
  { key: 'kids_dropoff_time', value: '7:30am' },
  { key: 'kids_school', value: 'YMCA near White Plains train station' },
  { key: 'bedtime_start', value: '7:00pm' },
  { key: 'bedtime_nights_sav', value: 'sunday,monday' },
  { key: 'wife_name', value: 'Nicole' },
  { key: 'kid1_name', value: 'Amare' },
  { key: 'kid1_age', value: '6' },
  { key: 'kid1_bday', value: '2019-02-01' },
  { key: 'kid2_name', value: 'Enzo' },
  { key: 'kid2_age', value: '3' },
  { key: 'kid2_bday', value: '2022-04-04' },
  { key: 'dog_name', value: 'Sally' },
  { key: 'dog_breed', value: '55lb hound mix' },
  { key: 'dog_age', value: '6' },
  { key: 'dog_food', value: 'Taste of the Wild salmon formula, 50lb bags' },
  { key: 'cat_name', value: 'Ajax' },
  { key: 'cat_age', value: '10' },
  { key: 'grocery_day', value: 'sunday' },
  { key: 'grocery_store_primary', value: 'Wegmans, White Plains' },
  { key: 'grocery_store_secondary', value: "Trader Joe's" },
  { key: 'cleaner_frequency', value: 'biweekly' },
  { key: 'lawn_service', value: 'hired out, Sav manages relationship' },
  { key: 'trash_days', value: 'monday,thursday' },
  { key: 'bulk_trash_day', value: 'thursday (second regular pickup day; furniture and mattresses curbside, mattresses wrapped in plastic and taped)' },
  { key: 'bulk_metal_electronics', value: 'appointment required with White Plains sanitation, 914-422-1217' },
  { key: 'wife_diet', value: 'gluten free' },
  { key: 'wife_interests', value: 'photography, serious and skilled' },
  { key: 'wife_bday', value: '11-12' },
  { key: 'wedding_anniversary', value: '11-03' },
  { key: 'kid1_school', value: 'Post Road Elementary School, 1st grade, Mrs. Maureen Sharkey class (class parent Leslie Navarro), updates via ParentSquare' },
  { key: 'kid1_bus', value: 'PR #11, pickup and dropoff at the YMCA on Hamilton Ave, 8:00am and 3:32pm' },
  { key: 'kids_pickup', value: 'YMCA on Hamilton Ave, 4:30pm. Nicole mon-thu, Sav fridays' },
  { key: 'kid2_school', value: 'UPK, White Plains school district, updates via ClassDojo' },
  { key: 'wife_nickname', value: 'Colie' },
  { key: 'wife_job', value: 'teacher in the White Plains school district' },
  { key: 'shared_calendar', value: 'Colie and Sav - joint calendar (Nicole adds school dates; stores times in Pacific, read in Eastern)' },
  { key: 'dismissal_changes', value: 'must reach school in writing by 2pm' },
  { key: 'employer', value: '73 Strings, North America sales team' },
  { key: 'workout_schedule', value: 'OUTDATED: calendar workouts are from an old August plan, current plan of record is training plan v2.2 (not the calendar). Old calendar slots were CrossFit mon/wed 8:30am, short run tue 6am, long run fri 7am, ride sat 8am, easy run sun 8am' },
  { key: 'workout_tracker', value: 'Strava (primary), Whoop secondary' },
  { key: 'barber', value: 'Mambru at Mambru & friends barbershop, 360 Mt Pleasant Ave, Mamaroneck (Sav + kids)' },
];

const cards = [
  // HOME
  { id: 'home_renovation', name: 'Home Renovation', category: 'home', frequency: 'ad_hoc' },
  { id: 'lawn_plants', name: 'Lawn & Plants', category: 'home', frequency: 'seasonal', notes: 'Lawn guy hired, Sav owns the relationship' },
  { id: 'mortgage_insurance', name: 'Home Purchase / Mortgage & Insurance', category: 'home', frequency: 'monthly' },
  { id: 'home_goods', name: 'Home Goods & Supplies', category: 'home', frequency: 'weekly', notes: 'Rolled into Sunday grocery run mostly' },
  { id: 'weekday_breakfast', name: 'Meals - Weekday Breakfast', category: 'home', frequency: 'daily', notes: 'Part of morning routine, Sav owns school days' },
  { id: 'home_maintenance', name: 'Home Maintenance', category: 'home', frequency: 'ad_hoc' },
  { id: 'storage_garage', name: 'Storage, Garage & Seasonal Items', category: 'home', frequency: 'seasonal' },
  { id: 'mail', name: 'Mail', category: 'home', frequency: 'daily', notes: 'Includes processing and acting on bills' },
  { id: 'garbage', name: 'Garbage', category: 'home', frequency: 'weekly', notes: 'Fully owned by Sav. Pickup Monday and Thursday on McBride Ave. Bulk items go curbside on the second pickup day (Thursday) - mattresses must be wrapped in plastic and taped. Metal and electronics need an appointment with White Plains sanitation, 914-422-1217.' },
  { id: 'groceries', name: 'Groceries', category: 'home', frequency: 'weekly', notes: 'Sunday Wegmans + Trader Joes. Includes knowing what is needed, meal planning for Mon/Tue dinners and weekly lunches. Nicole is gluten free, so keep GF options in the weekly list. Usual staples: Fairlife 2% lactose-free milk, Oatly original oat milk, Bonne Maman raspberry preserves' },
  { id: 'money_manager', name: 'Money Manager', category: 'home', frequency: 'monthly', notes: 'Mortgage, utilities, taxes, all major bills' },
  // OUT
  { id: 'social_plans', name: 'Social Plans (Couples)', category: 'out', frequency: 'ad_hoc' },
  { id: 'birthday_celebrations', name: 'Birthday Celebrations (Other Kids)', category: 'out', frequency: 'ad_hoc', notes: 'Responsible for gifts and cards' },
  { id: 'cash_bills', name: 'Cash & Bills', category: 'out', frequency: 'monthly' },
  { id: 'auto', name: 'Auto', category: 'out', frequency: 'ad_hoc', notes: 'Car maintenance, registration, etc.' },
  // CAREGIVING
  { id: 'morning_routine', name: 'Morning Routine (Kids)', category: 'caregiving', frequency: 'daily', notes: 'Always Sav. Wake 6:30am, drop 7:30am. Pack Enzo lunch night before (whoever cleans dinner does it). Amare needs water + snacks only. Amare takes bus PR #11 from the YMCA on Hamilton Ave at 8:00am, dropped back there 3:32pm. Dismissal changes go to school in writing by 2pm.' },
  { id: 'pets', name: 'Pets', category: 'caregiving', frequency: 'daily', notes: 'Sally (dog, 55lb hound, 6yo) and Ajax (cat, 10yo). Sally eats Taste of the Wild salmon, 50lb bags. Sally care provider: Paws and Play' },
  { id: 'health_insurance', name: 'Health Insurance', category: 'caregiving', frequency: 'annual', notes: 'Enrollment, management. Oct 2026: moving to coverage through Nicole\'s work, Sav cancelling his 73 Strings work plan (in progress)' },
  // MAGIC
  { id: 'marriage_romance', name: 'Marriage & Romance', category: 'magic', frequency: 'ad_hoc', notes: "Anniversary Nov 3, Nicole's birthday Nov 12. Nicole is gluten free and seriously into photography." },
  { id: 'adult_friendships', name: 'Adult Friendships (Player 1)', category: 'magic', frequency: 'ad_hoc' },
];

const reminders = [
  // Garbage — Sunday and Wednesday 8pm (for Monday and Thursday pickup)
  { card_id: 'garbage', message: "🗑️ Trash night — don't forget to put bins out before bed.", cron: '0 20 * * 0,3' },

  // Grocery planning nudge Saturday evening
  { card_id: 'groceries', message: "🛒 Tomorrow is grocery day. What do you need for the week? Reply to brainstorm the list.", cron: '0 19 * * 6' },

  // Lunch prep reminder Sunday afternoon
  { card_id: 'groceries', message: "🍱 Good time to pre-cook lunches for the week while you're in kitchen mode.", cron: '0 15 * * 0' },

  // Monday dinner reminder
  { card_id: 'groceries', message: "🍳 You're on dinner tonight (Monday). Cook enough for Tuesday leftovers!", cron: '0 16 * * 1' },

  // Bedtime reminder Sunday
  { card_id: 'morning_routine', message: "🌙 Your bedtime shift tonight. Routine starts upstairs at 6/6:15, TV off at 7, lights out ~7:30.", cron: '0 17 * * 0' },

  // Bedtime reminder Monday
  { card_id: 'morning_routine', message: "🌙 Your bedtime shift tonight. Routine starts upstairs at 6/6:15, TV off at 7, lights out ~7:30.", cron: '0 17 * * 1' },

  // Morning routine reminder weekdays 6am
  { card_id: 'morning_routine', message: "☀️ School day — wake the kids at 6:30, drop by 7:30. Don't forget Enzo's lunch if you packed it last night.", cron: '0 6 * * 1-5' },

  // Enzo lunch reminder Sun-Thu nights 7pm
  { card_id: 'morning_routine', message: "🥪 Pack Enzo's lunch tonight before bed — whoever cleans up dinner owns this.", cron: '0 19 * * 0-4' },

  // Mail processing nudge — Saturday 10am
  { card_id: 'mail', message: "📬 Weekly mail check — anything piling up that needs action?", cron: '0 10 * * 6' },

  // Bills check — 1st of month 9am
  { card_id: 'money_manager', message: "💰 Start of month — review bills, mortgage, utilities. Anything due this month?", cron: '0 9 1 * *' },

  // Cleaner heads-up (Sunday 8pm as placeholder — adjust to biweekly)
  { card_id: 'home_maintenance', message: "🧹 Cleaner comes tomorrow — do a quick tidy tonight so they can actually clean.", cron: '0 20 * * 0' },

  // Pet reminder — 1st of month 10am
  { card_id: 'pets', message: "🐾 Monthly pet check — Sally and Ajax due for anything? Flea/tick, heartworm, vet visit?", cron: '0 10 1 * *' },
];

function seed() {
  if (!db.isProfileEmpty()) {
    console.log('DB already seeded — skipping.');
    return;
  }

  console.log('Seeding database...');

  for (const item of profile) {
    db.setProfile(item.key, item.value);
  }
  console.log(`  ✓ ${profile.length} profile keys`);

  for (const card of cards) {
    db.insertCard(card);
  }
  console.log(`  ✓ ${cards.length} Fair Play cards`);

  for (const reminder of reminders) {
    db.insertReminder(reminder);
  }
  console.log(`  ✓ ${reminders.length} default reminders`);

  // Seed kids' birthdays as recurring annual events
  const thisYear = new Date().getFullYear();
  const birthdayEvents = [
    { title: "Amare's Birthday 🎂", date: `${thisYear}-02-01`, notes: 'Amare turns 7', reminder_days_before: 14 },
    { title: "Enzo's Birthday 🎂", date: `${thisYear}-04-04`, notes: 'Enzo turns 4', reminder_days_before: 14 },
  ];
  for (const event of birthdayEvents) {
    db.insertEvent(event);
  }
  console.log(`  ✓ ${birthdayEvents.length} birthday events`);

  console.log('Seeding complete.');
}

seed();
