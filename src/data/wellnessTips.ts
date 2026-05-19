export interface WellnessTip {
  id: string;
  text: string;
  dietTags: string[];
  category: 'tip' | 'recipe' | 'alternative';
}

export interface FoodAlternative {
  trigger: string;
  suggestion: string;
  tip: string;
}

export const DIET_KEYWORDS = [
  'keto', 'vegan', 'vegetarian', 'paleo', 'intermittent fasting',
  'low carb', 'mediterranean', 'whole30', 'carnivore', 'pescatarian',
] as const;

export const GUIDED_PROMPTS = [
  'How did you feel this week?',
  'What eating habit helped most?',
  'What was your biggest challenge?',
  'What will you do differently next week?',
  'What are you most proud of?',
];

export const TIPS: WellnessTip[] = [
  { id: 't1', text: 'Drink a full glass of water before every meal to reduce portion size.', dietTags: ['general'], category: 'tip' },
  { id: 't2', text: 'Try cauliflower rice as a low-carb substitute for white rice.', dietTags: ['keto', 'low carb'], category: 'tip' },
  { id: 't3', text: 'Prep meals on Sunday to avoid impulsive weekday food choices.', dietTags: ['general'], category: 'tip' },
  { id: 't4', text: 'Eat protein at every meal — it keeps you fuller longer.', dietTags: ['general', 'keto', 'paleo'], category: 'tip' },
  { id: 't5', text: 'Swap sugary drinks for herbal tea or infused water.', dietTags: ['general'], category: 'tip' },
  { id: 't6', text: 'Use smaller plates — visual cues help control portions.', dietTags: ['general'], category: 'tip' },
  { id: 't7', text: 'Avocados are a great source of healthy fats for keto dieters.', dietTags: ['keto'], category: 'tip' },
  { id: 't8', text: 'Take a 10-minute walk after meals to improve digestion and blood sugar.', dietTags: ['general'], category: 'tip' },
  { id: 't9', text: 'Prioritise sleep — poor sleep increases hunger hormones.', dietTags: ['general'], category: 'tip' },
  { id: 't10', text: 'Tofu scrambles make a filling vegan breakfast alternative.', dietTags: ['vegan', 'vegetarian'], category: 'tip' },
  { id: 't11', text: 'Add fibre-rich foods like lentils and oats to stay satisfied.', dietTags: ['general', 'vegetarian', 'vegan'], category: 'tip' },
  { id: 't12', text: 'Eating slowly gives your brain time to register fullness.', dietTags: ['general'], category: 'tip' },
  { id: 't13', text: 'Stock up on frozen vegetables — just as nutritious and always available.', dietTags: ['general'], category: 'tip' },
  { id: 't14', text: 'Try a 16:8 intermittent fasting window to reduce snacking.', dietTags: ['intermittent fasting'], category: 'tip' },
  { id: 't15', text: 'Pair carbs with protein or fat to slow glucose spikes.', dietTags: ['general', 'mediterranean'], category: 'tip' },
  { id: 't16', text: 'Nuts and seeds are calorie-dense — measure portions instead of eating from the bag.', dietTags: ['general', 'keto', 'paleo'], category: 'tip' },
  { id: 't17', text: 'Plan your meals around vegetables first, then add protein and grains.', dietTags: ['general', 'mediterranean'], category: 'tip' },
  { id: 't18', text: 'Greek yogurt with berries beats ice cream for a dessert craving.', dietTags: ['general', 'mediterranean'], category: 'tip' },
  { id: 't19', text: 'Read nutrition labels — focus on serving size, sugar, and fibre.', dietTags: ['general'], category: 'tip' },
  { id: 't20', text: 'Paleo-friendly snacks: hard-boiled eggs, jerky, fresh fruit.', dietTags: ['paleo'], category: 'tip' },
  { id: 't21', text: 'Track what you eat for one week — awareness alone changes behaviour.', dietTags: ['general'], category: 'tip' },
  { id: 't22', text: 'Replace butter with olive oil for heart-healthy cooking.', dietTags: ['mediterranean', 'general'], category: 'tip' },
  { id: 't23', text: 'Batch-cook grains like quinoa and brown rice for quick weeknight meals.', dietTags: ['general', 'vegetarian', 'vegan'], category: 'tip' },
  { id: 't24', text: 'Keep cut vegetables at eye level in the fridge for easy snacking.', dietTags: ['general'], category: 'tip' },
  { id: 't25', text: 'Drink black coffee or green tea — both boost metabolism slightly.', dietTags: ['general', 'intermittent fasting'], category: 'tip' },
  { id: 't26', text: 'Chew gum or brush teeth after dinner to signal "kitchen closed."', dietTags: ['general'], category: 'tip' },
  { id: 't27', text: 'Salmon, mackerel, and sardines provide omega-3s on a pescatarian diet.', dietTags: ['pescatarian', 'mediterranean'], category: 'tip' },
  { id: 't28', text: "Don't skip meals — it often leads to overeating later.", dietTags: ['general'], category: 'tip' },
  { id: 't29', text: 'Replace croutons with toasted almonds in salads for fewer carbs.', dietTags: ['keto', 'low carb'], category: 'tip' },
  { id: 't30', text: 'Celebrate non-scale victories: more energy, better sleep, looser clothes.', dietTags: ['general'], category: 'tip' },
  { id: 't31', text: 'Whole30 tip: read every ingredient list — hidden sugars are everywhere.', dietTags: ['whole30'], category: 'tip' },
  { id: 't32', text: 'A handful of mixed berries satisfies sweet cravings with minimal sugar.', dietTags: ['general', 'paleo'], category: 'tip' },
  { id: 't33', text: 'Use a food scale until you can eyeball portions accurately.', dietTags: ['general'], category: 'tip' },
  { id: 't34', text: 'Carnivore dieters: organ meats like liver are nutrient powerhouses.', dietTags: ['carnivore'], category: 'tip' },
  { id: 't35', text: 'Spiralized courgette (zoodles) makes a low-carb pasta replacement.', dietTags: ['keto', 'low carb', 'paleo'], category: 'tip' },
  { id: 't36', text: 'Include a source of healthy fat at each meal — it improves satiety.', dietTags: ['general', 'keto', 'mediterranean'], category: 'tip' },
  { id: 't37', text: 'Roast chickpeas for a crunchy, high-protein vegan snack.', dietTags: ['vegan', 'vegetarian', 'mediterranean'], category: 'tip' },
  { id: 't38', text: 'Limit alcohol — it adds empty calories and weakens resolve.', dietTags: ['general'], category: 'tip' },
  { id: 't39', text: 'Set a consistent eating schedule to regulate hunger hormones.', dietTags: ['general', 'intermittent fasting'], category: 'tip' },
  { id: 't40', text: 'Stress eating? Try a 5-minute breathing exercise before reaching for food.', dietTags: ['general'], category: 'tip' },
  { id: 't41', text: 'Eggs are a versatile, affordable protein source for most diets.', dietTags: ['general', 'keto', 'paleo', 'vegetarian'], category: 'tip' },
  { id: 't42', text: 'Replace white pasta with wholegrain or legume-based pasta.', dietTags: ['general', 'mediterranean', 'vegetarian'], category: 'tip' },
  { id: 't43', text: 'Cook at home more — restaurant meals average 50% more calories.', dietTags: ['general'], category: 'tip' },
  { id: 't44', text: 'Load up on leafy greens — high volume, very low calories.', dietTags: ['general', 'keto', 'vegan'], category: 'tip' },
  { id: 't45', text: "Progress isn't linear — a bad day doesn't undo a good week.", dietTags: ['general'], category: 'tip' },
];

export const RECIPES: WellnessTip[] = [
  { id: 'r1', text: 'Greek yogurt parfait: layer yogurt, berries, and a handful of granola for a 250-cal breakfast.', dietTags: ['general', 'mediterranean', 'vegetarian'], category: 'recipe' },
  { id: 'r2', text: 'Keto egg muffins: whisk eggs with spinach, cheese, and bacon, bake in muffin tin for 20 min.', dietTags: ['keto', 'low carb'], category: 'recipe' },
  { id: 'r3', text: 'Buddha bowl: quinoa, roasted sweet potato, chickpeas, avocado, and tahini dressing.', dietTags: ['vegan', 'vegetarian', 'general'], category: 'recipe' },
  { id: 'r4', text: 'Sheet-pan salmon: salmon fillets, broccoli, and cherry tomatoes roasted with olive oil at 200°C for 15 min.', dietTags: ['general', 'mediterranean', 'pescatarian', 'paleo'], category: 'recipe' },
  { id: 'r5', text: 'Chicken stir-fry: sliced chicken breast, mixed peppers, snap peas, soy sauce, and ginger over cauliflower rice.', dietTags: ['general', 'keto', 'low carb', 'paleo'], category: 'recipe' },
  { id: 'r6', text: 'Overnight oats: rolled oats, almond milk, chia seeds, and banana — prep in 5 min, eat cold.', dietTags: ['general', 'vegan', 'vegetarian'], category: 'recipe' },
  { id: 'r7', text: 'Turkey lettuce wraps: seasoned ground turkey, diced water chestnuts, and hoisin sauce in butter lettuce cups.', dietTags: ['general', 'paleo', 'low carb'], category: 'recipe' },
  { id: 'r8', text: 'Lentil soup: red lentils, carrots, onion, cumin, and lemon juice — one pot, 30 min.', dietTags: ['vegan', 'vegetarian', 'mediterranean', 'general'], category: 'recipe' },
  { id: 'r9', text: 'Zucchini noodle pad thai: spiralized zucchini, shrimp, egg, peanuts, and lime-tamari sauce.', dietTags: ['keto', 'low carb', 'pescatarian'], category: 'recipe' },
  { id: 'r10', text: 'Stuffed bell peppers: ground beef, cauliflower rice, tomato sauce, and mozzarella baked until bubbly.', dietTags: ['general', 'keto', 'low carb'], category: 'recipe' },
  { id: 'r11', text: 'Smoothie bowl: frozen acai, banana, spinach, topped with sliced almonds and coconut flakes.', dietTags: ['vegan', 'vegetarian', 'general'], category: 'recipe' },
  { id: 'r12', text: 'Grilled chicken Caesar salad: romaine, grilled chicken, parmesan, and homemade yogurt dressing.', dietTags: ['general', 'mediterranean'], category: 'recipe' },
  { id: 'r13', text: 'Black bean tacos: seasoned black beans, corn salsa, avocado, and lime crema on corn tortillas.', dietTags: ['vegetarian', 'vegan', 'general'], category: 'recipe' },
  { id: 'r14', text: 'Egg-drop soup: chicken broth, whisked eggs, green onions, and sesame oil — ready in 10 min.', dietTags: ['keto', 'low carb', 'paleo', 'general'], category: 'recipe' },
  { id: 'r15', text: 'Mediterranean plate: hummus, cucumber, cherry tomatoes, olives, and wholegrain pita.', dietTags: ['mediterranean', 'vegetarian', 'general'], category: 'recipe' },
  { id: 'r16', text: 'Beef and broccoli: thinly sliced beef, steamed broccoli, garlic-ginger sauce — 20 min.', dietTags: ['general', 'paleo', 'carnivore'], category: 'recipe' },
  { id: 'r17', text: 'Chia pudding: chia seeds soaked in coconut milk overnight with vanilla and mango chunks.', dietTags: ['vegan', 'vegetarian', 'general', 'whole30'], category: 'recipe' },
  { id: 'r18', text: 'Tuna poke bowl: sushi-grade tuna, edamame, cucumber, avocado, and ponzu over rice.', dietTags: ['pescatarian', 'general'], category: 'recipe' },
];

export const FOOD_ALTERNATIVES: FoodAlternative[] = [
  { trigger: 'pizza', suggestion: 'cauliflower-crust pizza', tip: 'Cuts carbs by ~60% per slice.' },
  { trigger: 'soda', suggestion: 'sparkling water with lemon', tip: 'Zero sugar, same fizz.' },
  { trigger: 'chips', suggestion: 'air-popped popcorn', tip: '90% fewer calories per cup.' },
  { trigger: 'ice cream', suggestion: 'frozen Greek yogurt bark', tip: 'Half the calories, triple the protein.' },
  { trigger: 'bread', suggestion: 'cloud bread or lettuce wraps', tip: 'Eliminates refined carbs from your meal.' },
  { trigger: 'pasta', suggestion: 'zucchini noodles or spaghetti squash', tip: '80% fewer carbs with similar texture.' },
  { trigger: 'fries', suggestion: 'baked sweet potato wedges', tip: 'More fibre, less oil, better nutrients.' },
  { trigger: 'candy', suggestion: 'frozen grapes or dark chocolate squares', tip: 'Satisfies sweet cravings with antioxidants.' },
  { trigger: 'burger', suggestion: 'lettuce-wrapped turkey burger', tip: 'Saves ~200 cal by dropping the bun and red meat.' },
  { trigger: 'cereal', suggestion: 'overnight oats with fruit', tip: 'Slower-digesting carbs keep you full until lunch.' },
  { trigger: 'muffin', suggestion: 'banana oat muffin (homemade)', tip: 'No refined sugar — sweetened naturally.' },
  { trigger: 'pancake', suggestion: 'banana-egg protein pancakes', tip: 'Two ingredients, no flour needed.' },
  { trigger: 'chocolate', suggestion: '85%+ dark chocolate', tip: 'Rich flavour, far less sugar per serving.' },
  { trigger: 'beer', suggestion: 'light beer or hard seltzer', tip: 'Cuts 50–100 calories per drink.' },
  { trigger: 'wine', suggestion: 'wine spritzer', tip: 'Same taste experience, half the alcohol and calories.' },
  { trigger: 'rice', suggestion: 'cauliflower rice or quinoa', tip: '75% fewer carbs (cauliflower) or more protein (quinoa).' },
  { trigger: 'tortilla', suggestion: 'low-carb tortilla or lettuce wrap', tip: 'Saves 100+ cal per wrap.' },
  { trigger: 'mayo', suggestion: 'mashed avocado or Greek yogurt', tip: 'Healthy fats or protein instead of empty calories.' },
  { trigger: 'cream cheese', suggestion: 'whipped cottage cheese', tip: 'Triple the protein, half the fat.' },
  { trigger: 'juice', suggestion: 'whole fruit + water', tip: 'Keeps the fibre, loses the sugar spike.' },
  { trigger: 'donut', suggestion: 'protein ball or energy bite', tip: 'Sustained energy, no sugar crash.' },
  { trigger: 'bagel', suggestion: 'English muffin or rice cake', tip: 'Half the calories with similar satisfaction.' },
  { trigger: 'milkshake', suggestion: 'protein smoothie with banana', tip: 'Fills you up with protein instead of sugar.' },
  { trigger: 'cake', suggestion: 'protein mug cake', tip: 'Microwave in 2 min — 150 cal vs 400+.' },
];

/** Deterministic tip-of-the-day index from day-of-year. */
export function getDayOfYearIndex(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86400000);
}
