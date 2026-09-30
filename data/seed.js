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
  { key: 'cat_name', value: 'Ajax' },
  { key: 'cat_age', value: '10' },
  { key: 'grocery_day', value: 'sunday' },
  { key: 'grocery_store_primary', value: 'Wegmans, White Plains' },
  { key: 'grocery_store_secondary', value: "Trader Joe's" },
  { key: 'cleaner_frequency', value: 'biweekly' },
  { key: 'lawn_service', value: 'hired out, Sav manages relationship' },
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
  { id: 'garbage', name: 'Garbage', category: 'home', frequency: 'weekly', notes: 'Fully owned by Sav' },
  { id: 'groceries', name: 'Groceries', category: 'home', frequency: 'weekly', notes: 'Sunday Wegmans + Trader Joes. Includes knowing what is needed, meal planning for Mon/Tue dinners and weekly lunches' },
  { id: 'money_manager', name: 'Money Manager', category: 'home', frequency: 'monthly', notes: 'Mortgage, utilities, taxes, all major bills' },
  // OUT
  { id: 'social_plans', name: 'Social Plans (Couples)', category: 'out', frequency: 'ad_hoc' },
  { id: 'birthday_celebrations', name: 'Birthday Celebrations (Other Kids)', category: 'out', frequency: 'ad_hoc', notes: 'Responsible for gifts and cards' },
  { id: 'cash_bills', name: 'Cash & Bills', category: 'out', frequency: 'monthly' },
  { id: 'auto', name: 'Auto', category: 'out', frequency: 'ad_hoc', notes: 'Car maintenance, registration, etc.' },
  // CAREGIVING
  { id: 'morning_routine', name: 'Morning Routine (Kids)', category: 'caregiving', frequency: 'daily', notes: 'Always Sav. Wake 6:30am, drop 7:30am. Pack Enzo lunch night before (whoever cleans dinner does it). Amare needs water + snacks only.' },
  { id: 'pets', name: 'Pets', category: 'caregiving', frequency: 'daily', notes: 'Sally (dog, 55lb hound, 6yo) and Ajax (cat, 10yo)' },
  { id: 'health_insurance', name: 'Health Insurance', category: 'caregiving', frequency: 'annual', notes: 'Enrollment, management' },
  // MAGIC
  { id: 'marriage_romance', name: 'Marriage & Romance', category: 'magic', frequency: 'ad_hoc' },
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
