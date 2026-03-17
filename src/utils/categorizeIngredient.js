/**
 * Categorizes an ingredient by its name.
 * Returns one of the standard category keys used in shopping lists.
 */
export const categorizeIngredient = (ingredientName) => {
  if (!ingredientName) return 'altro';
  const name = ingredientName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (name.match(/(pollo|tacchino|manzo|maiale|vitello|agnello|salsiccia|salame|prosciutto|bresaola|speck|salmone|tonno|merluzzo|orata|branzino|gamberi|calamari|polpo|acciughe|sgombro|chicken|turkey|beef|pork|veal|lamb|sausage|salmon|tuna|cod|shrimp|octopus|poulet|dinde|boeuf|porc|saumon|thon|frango|peru|boi|porco|salmao|atum|huhn|truthahn|rindfleisch|schweinefleisch|lachs|carne|pescado|peixe|fleisch|fisch|viande|poisson)/)) return 'carne_pesce';

  if (name.match(/(latte|yogurt|formaggio|mozzarella|parmigiano|ricotta|burro|panna|uova|scamorza|gorgonzola|cheese|milk|butter|cream|egg|fromage|lait|beurre|oeuf|queijo|leite|manteiga|ovo|kase|milch|ei|queso|leche|huevo)/)) return 'latticini_uova';

  if (name.match(/(mela|banana|arancia|pera|kiwi|fragola|pesca|albicocca|uva|melone|anguria|limone|pompelmo|insalata|lattuga|pomodor|cetriolo|carota|zucchina|peperone|melanzana|broccoli|cavolfiore|spinaci|rucola|sedano|cipolla|aglio|patata|apple|banana|orange|pear|strawberry|peach|grape|melon|lemon|salad|lettuce|tomato|cucumber|carrot|zucchini|pepper|eggplant|cauliflower|spinach|celery|onion|garlic|potato|pomme|banane|fraise|tomate|carotte|poivron|oignon|maca|laranja|morango|cenoura|pimentao|cebola|apfel|zitrone|gurke|mohre|zwiebel|manzana|platano|naranja|fresa|zanahoria|pimiento|cebolla)/)) return 'frutta_verdura';

  if (name.match(/(riso|pasta|pane|farro|orzo|quinoa|couscous|avena|cereali|farina|crackers|rice|bread|flour|oats|cereal|riz|pain|farine|avoine|arroz|pao|farinha|reis|brot|mehl|hafer|pan|harina)/)) return 'cereali_pasta';

  if (name.match(/(fagioli|lenticchie|ceci|piselli|mandorle|noci|nocciole|pistacchi|anacardi|beans|lentils|chickpeas|peas|almonds|walnuts|hazelnuts|pistachios|cashews|haricots|lentilles|pois|chiches|amandes|noix|feijao|lentilhas|grao|amendoas|nozes|bohnen|linsen|erbsen|mandeln|nusse|frijoles|lentejas|garbanzos|almendras|nueces)/)) return 'legumi_frutta_secca';

  if (name.match(/(olio|aceto|sale|pepe|zucchero|miele|spezie|basilico|origano|rosmarino|salvia|timo|curry|paprika|oil|vinegar|salt|pepper|sugar|honey|spices|basil|oregano|rosemary|sage|thyme|huile|vinaigre|sel|poivre|sucre|miel|epices|basilic|azeite|vinagre|sal|pimenta|acucar|mel|temperos|essig|salz|pfeffer|zucker|honig|gewurze|aceite|azucar|especias)/)) return 'condimenti_spezie';

  if (name.match(/(acqua|te|caffe|succo|bevanda|water|tea|coffee|juice|drink|eau|the|cafe|jus|boisson|agua|cha|suco|bebida|wasser|tee|kaffee|saft|getrank|zumo)/)) return 'bevande';

  return 'altro';
};