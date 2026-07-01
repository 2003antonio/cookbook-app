// ── Seed / demo recipes ───────────────────────────────────────────────────────
// Shown when no user is signed in. Not part of the recipe model — just sample
// data. Update or remove these as the app matures; they never touch Supabase.

export const SEED_RECIPES = [
  {
    id: "1", name: "Southern Fried Chicken", category: "Main Dish",
    image:"https://i.postimg.cc/Pq7x4LQs/IMG-2796.jpg",
    prepTime: 30, cookTime: 40, baseServings: 4,
    color: "#C4956A", rating: 5,
    tags: ["American", "Southern", "Comfort Food"], favorite: true,
    notes: "Requires 24 hours advance preparation for the buttermilk marinade.",
    components: [
      {
        id: "comp-1a",
        name: "Buttermilk-Marinated Frying Chicken",
        yieldAmt: "4", yieldUnit: "(1¼-lb. half-chicken) main-course servings",
        notes: "Use small fryer/broiler chickens no larger than 2½ lb. Larger chickens will result in too-dark crust before cooking through.",
        ingredients: [
          { id: "i1a1", type: "ingredient", amount: 2,  unit: "whole", name: "2½-lb. young fryer/broiler chickens" },
          { id: "i1a2", type: "ingredient", amount: 1,  unit: "pinch", name: "kosher salt" },
          { id: "i1a3", type: "ingredient", amount: 1,  unit: "quart", name: "buttermilk" },
        ],
        steps: [
          {
            id: "s1a1", text: "Fabricate the chickens without removing the bones or skin from the pieces.",
            substeps: [
              { id: "s1a1a", text: "Remove the legs from the carcasses and cut each leg into thigh and drumstick. Chop the knuckles off the drumsticks." },
              { id: "s1a1b", text: "Remove the backbones from the carcasses and split the breasts in half without removing the wings." },
              { id: "s1a1c", text: "Cut each breast half into two pieces, one slightly smaller with the wing attached, the other slightly larger with no wing." },
              { id: "s1a1d", text: "Reserve the knuckles, backbones, and giblets for stock." },
            ],
          },
          {
            id: "s1a2", text: "Marinate the chicken pieces.",
            substeps: [
              { id: "s1a2a", text: "Season the chicken pieces with salt." },
              { id: "s1a2b", text: "Place in a freshly sanitized nonreactive container just big enough to hold the pieces snugly." },
              { id: "s1a2c", text: "Pour the buttermilk over the chicken, cover the container, and refrigerate at least 24 hours and up to 2 days." },
            ],
          },
        ],
      },
      {
        id: "comp-1b",
        name: "Down-Home Green Beans",
        yieldAmt: "1", yieldUnit: "qt.",
        notes: "",
        ingredients: [
          { id: "i1b1", type: "ingredient", amount: 1,    unit: "cup",   name: "water" },
          { id: "i1b2", type: "ingredient", amount: 0.25, unit: "cup",   name: "fine-diced country ham" },
          { id: "i1b3", type: "ingredient", amount: 2,    unit: "tbsp",  name: "bacon drippings" },
          { id: "i1b4", type: "ingredient", amount: 0.5,  unit: "cup",   name: "minced yellow onion" },
          { id: "i1b5", type: "ingredient", amount: 1.25, unit: "lb",    name: "pole beans or green beans, trimmed and stringed, cut into 2\" lengths" },
          { id: "i1b6", type: "ingredient", amount: 1,    unit: "pinch", name: "kosher salt" },
          { id: "i1b7", type: "ingredient", amount: 1,    unit: "pinch", name: "fresh-ground black pepper" },
        ],
        steps: [
          { id: "s1b1", text: "Place the water, ham, bacon drippings, and onion in a 2-qt. saucepan. Cover, bring to the simmer, and cook 10 minutes.", substeps: [] },
          { id: "s1b2", text: "Add the beans, cover, and simmer briskly, stirring occasionally, 15 minutes, or until the beans are tender.", substeps: [] },
          { id: "s1b3", text: "Remove the beans from the pan and bring the cooking liquid to a boil. Reduce to ½ cup.", substeps: [] },
          { id: "s1b4", text: "Return the beans to the pan and toss to coat with the cooking liquid.", substeps: [] },
          { id: "s1b5", text: "Correct the salt and season with pepper.", substeps: [] },
        ],
      },
      {
        id: "comp-1c",
        name: "Frying & Gravy",
        yieldAmt: "", yieldUnit: "",
        notes: "The master recipe — frying the chicken and making the pan gravy.",
        ingredients: [
          { id: "i1c1",  type: "ingredient", amount: 0.5,  unit: "cup",   name: "corn oil" },
          { id: "i1c2",  type: "ingredient", amount: 0.5,  unit: "cup",   name: "pork lard" },
          { id: "i1c4",  type: "ingredient", amount: 1,    unit: "pinch", name: "Southern Seasoning for Poultry" },
          { id: "i1c5",  type: "ingredient", amount: 1,    unit: "cup",   name: "flour for dredging" },
          { id: "i1c6",  type: "ingredient", amount: 0.5,  unit: "cup",   name: "hot poultry stock" },
          { id: "i1c7",  type: "ingredient", amount: 0.5,  unit: "cup",   name: "half-and-half" },
          { id: "i1c8",  type: "ingredient", amount: 1,    unit: "pinch", name: "kosher salt" },
          { id: "i1c9",  type: "ingredient", amount: 1,    unit: "pinch", name: "fresh-ground white pepper" },
        ],
        steps: [
          { id: "s1c1", text: "Preheat an oven to 200°F. Place a rack on a half-sheet tray.", substeps: [] },
          { id: "s1c2", text: "Heat a heavy 10\" cast-iron skillet over medium heat. Add the oil and lard, turn down the heat, and heat the fat to about 300°F.", substeps: [] },
          {
            id: "s1c3", text: "Fry the chicken.",
            substeps: [
              { id: "s1c3a", text: "Remove the Buttermilk-Marinated Frying Chicken pieces from the buttermilk, selecting one thigh, one drumstick, one winged breast quarter, and one wingless breast quarter for each serving. Sprinkle evenly with Southern Seasoning for Poultry." },
              { id: "s1c3b", text: "Dredge the chicken heavily in flour and then tap off any excess." },
              { id: "s1c3c", text: "Place the chicken pieces, skin side down, in the skillet; the fat should come halfway up the sides of the chicken." },
              { id: "s1c3d", text: "Increase the heat to high and turn the chicken pieces. Fry 30 seconds." },
              { id: "s1c3e", text: "Reduce the heat to low and pan-fry 4 to 5 minutes more. At this point all chicken pieces should be golden brown and cooked through." },
              { id: "s1c3f", text: "Remove the chicken to the rack and place in the oven." },
            ],
          },
          {
            id: "s1c4", text: "Make the gravy.",
            substeps: [
              { id: "s1c4a", text: "Pour off all but 2 Tbsp. fat from the skillet, leaving the deep brown pan glaze in the bottom of the skillet." },
              { id: "s1c4b", text: "Add 2 Tbsp. flour and stir over low heat for a few seconds to make a light brown roux." },
              { id: "s1c4c", text: "Stir in the poultry stock and then the half-and-half to make a smooth gravy." },
              { id: "s1c4d", text: "Increase the heat to medium and simmer briskly until the sauce reduces to nappé consistency." },
              { id: "s1c4e", text: "Season with salt and white pepper." },
            ],
          },
          {
            id: "s1c5", text: "Plate the dish.",
            substeps: [
              { id: "s1c5a", text: "Spoon the mashed potatoes onto the back right of a hot 12\" plate. Make a well in the center." },
              { id: "s1c5b", text: "Arrange the chicken pieces stacked together at the front of the plate." },
              { id: "s1c5c", text: "Spoon the Down-Home Green Beans into a ramekin or monkey dish and place on the back left of the plate." },
              { id: "s1c5d", text: "Ladle the gravy into the well in the mashed potatoes." },
            ],
          },
        ],
      },
    ],
    createdAt: Date.now() - 6000,
  },

  {
    id: "2", name: "Vermont Cheddar Cheese Soup", category: "Soup",
    image: "https://www.jocooks.com/wp-content/uploads/2020/03/bacon-and-beer-cheese-soup-1-17.jpg",
    prepTime: 15, cookTime: 30, baseServings: 4,
    color: "#F4A261", rating: 5, tags: ["Soup", "Cheddar", "Comfort Food"], favorite: false,
    notes: "Serve with New England Soda Bread. Ladle into a hot 10-fl.-oz. soup cup.",
    components: [
      {
        id: "comp-2", name: "", yieldAmt: "1", yieldUnit: "qt.",
        notes: "Do not let the soup exceed 160°F after adding cheese or it may separate.",
        ingredients: [
          { id: "i2-1",  type: "ingredient", amount: 3,    unit: "tbsp",  name: "butter" },
          { id: "i2-2",  type: "ingredient", amount: 0.75, unit: "cup",   name: "minced yellow onion" },
          { id: "i2-3",  type: "ingredient", amount: 0.25, unit: "cup",   name: "peeled, minced celery" },
          { id: "i2-4",  type: "ingredient", amount: 0.5,  unit: "cup",   name: "peeled, minced carrot" },
          { id: "i2-5",  type: "ingredient", amount: 0.5,  unit: "cup",   name: "peeled, chopped tart apple" },
          { id: "i2-6",  type: "ingredient", amount: 3,    unit: "cup",   name: "poultry stock" },
          { id: "i2-7",  type: "ingredient", amount: 1,    unit: "cup",   name: "peeled, medium-chopped russet potatoes" },
          { id: "i2-8",  type: "ingredient", amount: 1,    unit: "whole", name: "bay leaf" },
          { id: "i2-9",  type: "ingredient", amount: 1,    unit: "tsp",   name: "fresh thyme" },
          { id: "i2-10", type: "ingredient", amount: 1,    unit: "pinch", name: "kosher salt" },
          { id: "i2-11", type: "ingredient", amount: 1,    unit: "tsp",   name: "fresh lemon juice" },
          { id: "i2-12", type: "ingredient", amount: 1,    unit: "cup",   name: "grated extra-sharp Vermont cheddar cheese" },
        ],
        steps: [
          { id: "s2-1", text: "Melt butter in a 1½-qt. saucepan and sweat the onion, celery, carrot, and apple until soft.", substeps: [] },
          { id: "s2-2", text: "Add the stock, potatoes, bay leaf, thyme, and a little salt. Cover and simmer about 20 minutes, until vegetables are very soft.", substeps: [] },
          {
            id: "s2-3", text: "Remove and discard the herbs and purée the soup.",
            substeps: [
              { id: "s2-3a", text: "Use an immersion blender if available." },
              { id: "s2-3b", text: "If an immersion blender is not available: remove the herbs and transfer solids to a blender or food processor. Add a little of the liquid and purée the solids smooth. Return the purée to the pan and whisk in the remaining liquid." },
            ],
          },
          { id: "s2-4", text: "Return the soup to the simmer over low heat. Thin with additional stock if necessary.", substeps: [] },
          {
            id: "s2-5", text: "Add a few drops of lemon juice, then whisk in the cheese until smooth. Correct the seasoning.",
            substeps: [
              { id: "s2-5a", text: "Do not heat the soup to a temperature higher than 160°F after adding cheese." },
            ],
          },
        ],
      },
    ],
    createdAt: Date.now() - 500,
  },

  {
    id: "3", name: "Lemon Tart", category: "Dessert",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTR78reW0fV55eayetAueXg6CsUfO9zzJRxoJLl0BuWa1f_HHsVZmCYsWQ&s=10",
    prepTime: 60, cookTime: 30, baseServings: 8,
    color: "#F5C842", rating: 5, tags: ["French", "Citrus"], favorite: false,
    notes: "Chill the tart shell before filling for the crispest result.",
    components: [
      {
        id: "comp-3", name: "", yieldAmt: "", yieldUnit: "", notes: "",
        ingredients: [
          { id: "i3-1", type: "ingredient", amount: 1.5,  unit: "cup",   name: "all-purpose flour" },
          { id: "i3-2", type: "ingredient", amount: 0.5,  unit: "cup",   name: "icing sugar" },
          { id: "i3-3", type: "ingredient", amount: 0.67, unit: "cup",   name: "softened butter" },
          { id: "i3-4", type: "ingredient", amount: 1,    unit: "pinch", name: "salt" },
          { id: "i3-5", type: "ingredient", amount: 1,    unit: "whole", name: "egg yolk" },
          { id: "i3-6", type: "ingredient", amount: 6,    unit: "whole", name: "lemons, zested & juiced" },
          { id: "i3-7", type: "ingredient", amount: 6,    unit: "whole", name: "large eggs" },
          { id: "i3-8", type: "ingredient", amount: 1.5,  unit: "cup",   name: "caster sugar" },
        ],
        steps: [
          { id: "s3-1", text: "Mix flour, icing sugar, and salt. Cut in butter until crumbly.", substeps: [] },
          { id: "s3-2", text: "Add egg yolk and press into tart pan. Chill 30 min.", substeps: [] },
          { id: "s3-3", text: "Blind bake at 375°F for 15 min.", substeps: [] },
          { id: "s3-4", text: "Whisk lemon juice, eggs, and sugar. Pour into shell.", substeps: [] },
          { id: "s3-5", text: "Bake 25–30 min until just set. Cool before serving.", substeps: [] },
        ],
      },
    ],
    createdAt: Date.now() - 5000,
  },

  {
    id: "4", name: "Victoria Sponge", category: "Baking",
    image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT0B6kHwkQGVzOAAE72qScn3_wXT9KeQy5pnODwCVw90w&s=10",
    prepTime: 20, cookTime: 25, baseServings: 10,
    color: "#E8A87C", rating: 5, tags: ["British", "Classic"], favorite: false,
    notes: "Room temperature butter is key — take it out an hour early.",
    components: [
      {
        id: "comp-4", name: "", yieldAmt: "", yieldUnit: "", notes: "",
        ingredients: [
          { id: "i4-1", type: "ingredient", amount: 2,   unit: "cup",   name: "self-rising flour" },
          { id: "i4-2", type: "ingredient", amount: 1,   unit: "cup",   name: "unsalted butter" },
          { id: "i4-3", type: "ingredient", amount: 1,   unit: "cup",   name: "caster sugar" },
          { id: "i4-4", type: "ingredient", amount: 4,   unit: "whole", name: "large eggs" },
          { id: "i4-5", type: "ingredient", amount: 2,   unit: "tsp",   name: "vanilla extract" },
          { id: "i4-6", type: "ingredient", amount: 0.5, unit: "cup",   name: "strawberry jam" },
          { id: "i4-7", type: "ingredient", amount: 1,   unit: "cup",   name: "heavy cream, whipped" },
        ],
        steps: [
          { id: "s4-1", text: "Cream butter and sugar until pale and fluffy.", substeps: [] },
          { id: "s4-2", text: "Beat in eggs one at a time with vanilla.", substeps: [] },
          { id: "s4-3", text: "Fold in flour gently. Divide between two 8-inch pans.", substeps: [] },
          { id: "s4-4", text: "Bake at 350°F for 25 min. Cool completely.", substeps: [] },
          { id: "s4-5", text: "Sandwich with jam and whipped cream.", substeps: [] },
        ],
      },
    ],
    createdAt: Date.now() - 4000,
  },

  {
    id: "5", name: "Quiche Lorraine", category: "Main Dish",
    image: "https://www.jessicagavin.com/wp-content/uploads/2021/03/quiche-lorraine-33-1200.jpg",
    prepTime: 20, cookTime: 40, baseServings: 6,
    color: "#C4956A", rating: 4, tags: ["French", "Savory"], favorite: false,
    notes: "Don't over-bake — the center should still have a slight wobble.",
    components: [
      {
        id: "comp-5", name: "", yieldAmt: "", yieldUnit: "", notes: "",
        ingredients: [
          { id: "i5-1", type: "ingredient", amount: 1,    unit: "whole", name: "pie crust, pre-baked" },
          { id: "i5-2", type: "ingredient", amount: 6,    unit: "whole", name: "slices bacon, crumbled" },
          { id: "i5-3", type: "ingredient", amount: 1.5,  unit: "cup",   name: "Gruyère, grated" },
          { id: "i5-4", type: "ingredient", amount: 4,    unit: "whole", name: "large eggs" },
          { id: "i5-5", type: "ingredient", amount: 1.5,  unit: "cup",   name: "heavy cream" },
          { id: "i5-6", type: "ingredient", amount: 0.25, unit: "tsp",   name: "nutmeg" },
          { id: "i5-7", type: "ingredient", amount: 1,    unit: "pinch", name: "salt & pepper" },
        ],
        steps: [
          { id: "s5-1", text: "Scatter bacon and cheese over the pre-baked crust.", substeps: [] },
          { id: "s5-2", text: "Whisk eggs, cream, nutmeg, salt, and pepper.", substeps: [] },
          { id: "s5-3", text: "Pour custard over the filling.", substeps: [] },
          { id: "s5-4", text: "Bake at 375°F for 35–40 min until set.", substeps: [] },
          { id: "s5-5", text: "Rest 10 min before slicing.", substeps: [] },
        ],
      },
    ],
    createdAt: Date.now() - 1000,
  },

  {
    id: "6", name: "Pancakes", category: "Breakfast",
    image: "https://www.mostlyhomemademom.com/wp-content/uploads/2011/07/Homemade-Pancakes.jpg",
    prepTime: 10, cookTime: 15, baseServings: 4,
    color: "#D4956A", rating: 5, tags: ["American", "Quick"], favorite: true,
    notes: "Let the batter rest 5 min before cooking — makes them fluffier.",
    components: [
      {
        id: "comp-6", name: "", yieldAmt: "", yieldUnit: "", notes: "",
        ingredients: [
          { id: "i6-1", type: "ingredient", amount: 1.5, unit: "cup",   name: "all-purpose flour" },
          { id: "i6-2", type: "ingredient", amount: 2,   unit: "tbsp",  name: "sugar" },
          { id: "i6-3", type: "ingredient", amount: 1,   unit: "tsp",   name: "baking powder" },
          { id: "i6-4", type: "ingredient", amount: 0.5, unit: "tsp",   name: "baking soda" },
          { id: "i6-5", type: "ingredient", amount: 1,   unit: "cup",   name: "buttermilk" },
          { id: "i6-6", type: "ingredient", amount: 2,   unit: "whole", name: "large eggs" },
          { id: "i6-7", type: "ingredient", amount: 3,   unit: "tbsp",  name: "melted butter" },
        ],
        steps: [
          { id: "s6-1", text: "Whisk dry ingredients together.", substeps: [] },
          { id: "s6-2", text: "Mix wet ingredients separately.", substeps: [] },
          { id: "s6-3", text: "Combine gently — lumps are fine. Rest 5 min.", substeps: [] },
          { id: "s6-4", text: "Cook on a buttered griddle over medium heat.", substeps: [] },
          { id: "s6-5", text: "Flip when bubbles form. Serve with maple syrup.", substeps: [] },
        ],
      },
    ],
    createdAt: Date.now() - 2000,
  },

  {
    id: "7", name: "Chocolate Chip Cookies", category: "Baking",
    image: "https://mojo.generalmills.com/api/public/content/_pLFRXFETcuXWg_Z0MhZPw_gmi_hi_res_jpeg.jpeg?v=693b292b&t=466b54bb264e48b199fc8e83ef1136b4",
    prepTime: 15, cookTime: 11, baseServings: 24,
    color: "#8B6047", rating: 5, tags: ["American", "Classic"], favorite: true,
    notes: "Chill the dough 30 min for thicker, chewier cookies.",
    components: [
      {
        id: "comp-7", name: "", yieldAmt: "", yieldUnit: "", notes: "",
        ingredients: [
          { id: "i7-1", type: "ingredient", amount: 2.25, unit: "cup",   name: "all-purpose flour" },
          { id: "i7-2", type: "ingredient", amount: 1,    unit: "tsp",   name: "baking soda" },
          { id: "i7-3", type: "ingredient", amount: 1,    unit: "tsp",   name: "salt" },
          { id: "i7-4", type: "ingredient", amount: 1,    unit: "cup",   name: "unsalted butter" },
          { id: "i7-5", type: "ingredient", amount: 0.75, unit: "cup",   name: "granulated sugar" },
          { id: "i7-6", type: "ingredient", amount: 0.75, unit: "cup",   name: "brown sugar" },
          { id: "i7-7", type: "ingredient", amount: 2,    unit: "whole", name: "large eggs" },
          { id: "i7-8", type: "ingredient", amount: 2,    unit: "cup",   name: "chocolate chips" },
        ],
        steps: [
          { id: "s7-1", text: "Cream butter and both sugars until fluffy.", substeps: [] },
          { id: "s7-2", text: "Beat in eggs. Mix in flour, baking soda, and salt.", substeps: [] },
          { id: "s7-3", text: "Fold in chocolate chips.", substeps: [] },
          { id: "s7-4", text: "Drop rounded tablespoons onto baking sheet.", substeps: [] },
          { id: "s7-5", text: "Bake at 375°F for 9–11 min until golden.", substeps: [] },
        ],
      },
    ],
    createdAt: Date.now() - 3000,
  },

  {
    id: "8", name: "Shrimp and Tasso-Stuffed Mirliton", category: "Appetizer",
    image:"https://cdn.phototourl.com/free/2026-06-30-eb1859ab-8f52-48d9-84d1-b134a4fff526.jpg",
    prepTime: 45, cookTime: 30, baseServings: 4,
    color: "#E86038", rating: 5,
    tags: ["Creole", "Seafood", "Southern"], favorite: false,
    notes: "Serve with Seafood Sauce Aurore and Fresh Tomato Sauce. Make sure the two sauces are the same consistency. Holding: refrigerate stuffed mirlitons in one layer in a freshly sanitized, covered container up to 3 days.",
    components: [
      {
        id: "comp-8a",
        name: "Shrimp and Tasso-Stuffed Mirliton",
        yieldAmt: "4", yieldUnit: "(5-oz.) appetizer servings",
        notes: "Holding: refrigerate in one layer in a freshly sanitized, covered container up to 3 days.",
        ingredients: [
          { id: "i8a1",  type: "ingredient", amount: 2,    unit: "whole", name: "small mirlitons" },
          { id: "i8a2",  type: "ingredient", amount: 1,    unit: "tbsp",  name: "butter" },
          { id: "i8a3",  type: "ingredient", amount: 0.33, unit: "cup",   name: "medium-chopped red bell pepper" },
          { id: "i8a4",  type: "ingredient", amount: 0.25, unit: "cup",   name: "fine-chopped tasso ham" },
          { id: "i8a5",  type: "ingredient", amount: 1,    unit: "pinch", name: "kosher salt" },
          { id: "i8a6",  type: "ingredient", amount: 0.25, unit: "cup",   name: "fine-chopped scallion" },
          { id: "i8a7",  type: "ingredient", amount: 0.5,  unit: "cup",   name: "heavy cream" },
          { id: "i8a8",  type: "ingredient", amount: 1,    unit: "cup",   name: "Butter-Toasted Bread Crumbs" },
          { id: "i8a9",  type: "ingredient", amount: 6,    unit: "oz",    name: "coarse-chopped Creole Poached Gulf Shrimp" },
          { id: "i8a10", type: "ingredient", amount: 1,    unit: "tbsp",  name: "minced flat-leaf parsley" },
          { id: "i8a11", type: "ingredient", amount: 1,    unit: "pinch", name: "fresh-ground white pepper" },
          { id: "i8a12", type: "ingredient", amount: 0.5,  unit: "whole", name: "egg, beaten" },
        ],
        steps: [
          {
            id: "s8a1", text: "Cook and fabricate the mirlitons.",
            substeps: [
              { id: "s8a1a", text: "Cut the mirlitons in half lengthwise through the narrow width so that they form a deep cup when hollowed." },
              { id: "s8a1b", text: "Place the mirlitons in a steamer pan, cut side down. Steam until tender (about 5 minutes in a pressure steamer, about 15 minutes in a stovetop steamer)." },
              { id: "s8a1c", text: "Cool the mirlitons to room temperature." },
              { id: "s8a1d", text: "Remove the seeds from the mirliton halves and discard." },
              { id: "s8a1e", text: "Hollow out the mirlitons, leaving an even 3/8\" shell. If necessary, cut a slice off the bottoms so that they sit upright on a flat surface." },
              { id: "s8a1f", text: "Squeeze the scooped-out mirliton flesh between paper towels to dry it, and then chop the flesh fine." },
            ],
          },
          {
            id: "s8a2", text: "Make the stuffing.",
            substeps: [
              { id: "s8a2a", text: "Heat the butter in a 10\" nonstick sauté pan, add the red bell pepper and ham, and sauté over low heat about 1 minute, until softened." },
              { id: "s8a2b", text: "Add the mirliton flesh and a little salt, increase the heat to medium, and sauté until dry." },
              { id: "s8a2c", text: "Add the scallion and cream, bring to the boil, and reduce to nappé consistency." },
              { id: "s8a2d", text: "Cool the reduction to room temperature." },
              { id: "s8a2e", text: "Stir the Butter-Toasted Bread Crumbs, shrimp, and parsley into the reduction." },
              { id: "s8a2f", text: "Correct the salt and season with pepper." },
              { id: "s8a2g", text: "Mix in enough egg to bind the stuffing." },
            ],
          },
          {
            id: "s8a3", text: "Blot dry the inside of the mirliton cups and pack the stuffing into them, pressing gently to firm it. Smooth the tops into rounded mounds.",
            substeps: [],
          },
        ],
      },
      {
        id: "comp-8b",
        name: "Service Turnout",
        yieldAmt: "1", yieldUnit: "(5-oz.) appetizer serving",
        notes: "Make sure the Seafood Sauce Aurore and Fresh Tomato Sauce are the same consistency.",
        ingredients: [
          { id: "i8b1", type: "ingredient", amount: 1, unit: "tbsp",  name: "melted butter" },
          { id: "i8b3", type: "ingredient", amount: 4, unit: "oz",    name: "Seafood Sauce Aurore" },
          { id: "i8b4", type: "ingredient", amount: 1, unit: "whole", name: "Creole Poached Gulf Shrimp" },
          { id: "i8b5", type: "ingredient", amount: 2, unit: "tbsp",  name: "smooth Fresh Tomato Sauce, in squeeze bottle" },
        ],
        steps: [
          {
            id: "s8b1", text: "Bake the Shrimp and Tasso-Stuffed Mirliton.",
            substeps: [
              { id: "s8b1a", text: "Brush a sizzle pan with half of the melted butter." },
              { id: "s8b1b", text: "Place the mirliton on the pan and brush the top with the remaining butter." },
              { id: "s8b1c", text: "Bake in a 400°F oven 15 minutes, until heated through and browned on top." },
            ],
          },
          { id: "s8b2", text: "Ladle the Seafood Sauce Aurore into a small sauté pan, add a little water, and reheat it.", substeps: [] },
          {
            id: "s8b3", text: "Plate the dish.",
            substeps: [
              { id: "s8b3a", text: "Spoon the Seafood Sauce Aurore onto a hot 10\" plate." },
              { id: "s8b3b", text: "Squeeze evenly-spaced dots of Fresh Tomato Sauce on the Sauce Aurore about 1/2\" in from the edge of the plate well." },
              { id: "s8b3c", text: "Drag the tip of a small knife or toothpick through the dots to create a \"string of hearts\" pattern." },
              { id: "s8b3d", text: "Place the mirliton in the center of the plate." },
              { id: "s8b3e", text: "Press the shrimp into the top of the mirliton." },
            ],
          },
        ],
      },
    ],
    createdAt: Date.now(),
  },
];
