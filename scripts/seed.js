import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const DATA_DIR = path.join(process.cwd(), "data");

const REAL_QUESTIONS = {
  "Mathematics": {
    "7": [
      { text: "Solve: 45 + 27 = ?", marks: 2, answer: "72", options: ["62", "70", "72", "82"] },
      { text: "A farmer has 36 eggs and sells 18. How many eggs are left?", marks: 3, answer: "18", options: ["12", "18", "20", "24"] },
      { text: "Convert 1/2 to a decimal.", marks: 2, answer: "0.5", options: ["0.2", "0.5", "0.05", "5.0"] },
      { text: "Find the area of a rectangle that is 8 cm long and 5 cm wide.", marks: 3, answer: "40 cm²", options: ["13 cm²", "26 cm²", "40 cm²", "80 cm²"] },
      { text: "What is the next number in the sequence: 2, 4, 8, 16, ___", marks: 2, answer: "32", options: ["24", "28", "32", "64"] },
      { text: "A packet of sweets costs K5. How much do 7 packets cost?", marks: 3, answer: "K35", options: ["K25", "K30", "K35", "K40"] },
      { text: "Write 3/4 as a fraction out of 100 (percent).", marks: 3, answer: "75%", options: ["25%", "50%", "75%", "100%"] },
      { text: "Round 378 to the nearest 10.", marks: 2, answer: "380", options: ["370", "380", "390", "400"] },
      { text: "A bag has 12 oranges. 5 are eaten. What fraction is left?", marks: 3, answer: "7/12", options: ["5/12", "7/12", "12/5", "12/7"] },
      { text: "If 6 books cost K42, how much does 1 book cost?", marks: 3, answer: "K7", options: ["K6", "K7", "K8", "K9"] },
      { text: "Add 453 729 to 295 674.", marks: 2, answer: "749 403", options: ["748 303", "748 403", "749 403", "749 493"] },
      { text: "Find the sum of 742 318 and 180 275.", marks: 2, answer: "922 593", options: ["822 593", "822 583", "922 593", "922 583"] },
      { text: "The sum of 42.34 and 6.78 is", marks: 2, answer: "49.12", options: ["49.12", "49.02", "48.12", "48.02"] },
      { text: "The number 6 453 can be written in words as", marks: 2, answer: "six thousand four hundred fifty three", options: ["sixty four thousand fifty three", "sixty four hundred fifty three", "six thousand forty five hundred three", "six thousand four hundred fifty three"] },
      { text: "The Roman numeral DCCLIII can be written in Arabic numerals as", marks: 2, answer: "753", options: ["652", "653", "753", "752"] },
      { text: "What is the value of 3 in the number 930 867?", marks: 2, answer: "300 000", options: ["300 000", "30 000", "3 000", "300"] },
      { text: "Subtract 749 040 from 851 204.", marks: 2, answer: "102 164", options: ["102 164", "207 040", "373 164", "749 040"] },
      { text: "Express the ratio 6:12:18 in its lowest terms.", marks: 2, answer: "1:2:3", options: ["2:1:3", "3:2:1", "3:1:2", "1:2:3"] },
      { text: "Mr Phiri retired in 2010 at the age of 55 years. When was Mr Phiri born?", marks: 2, answer: "1955", options: ["1945", "1955", "1965", "1975"] },
      { text: "Subtract K758 650.00 from K971 340.00.", marks: 2, answer: "K212 690.00", options: ["K212 690.00", "K212 790.00", "K213 690.00", "K213 790.00"] },
      { text: "Find the average of 209g, 350g and 650g.", marks: 2, answer: "403g", options: ["401g", "402g", "403g", "4 003g"] },
      { text: "There were 900 oranges in a basket. If 270 oranges were sold, what percentage of the oranges were sold?", marks: 2, answer: "30%", options: ["3%", "30%", "33.3%", "40%"] },
      { text: "The average of 6 items is 225 grams. Find the sum of the items.", marks: 2, answer: "1 350 grams", options: ["1 150 grams", "1 250 grams", "1 350 grams", "1 450 grams"] },
      { text: "The product of 2 137 and 21 is", marks: 2, answer: "44 877", options: ["234", "2 116", "6 411", "44 877"] },
      { text: "A bus covered a distance of 720km at an average speed of 120km/h. Find the time taken.", marks: 2, answer: "6 hours", options: ["6 hours", "10 hours", "12 hours", "30 hours"] },
      { text: "Chola, Kalaba and Mutale shared K270.00 in the ratio 4:3:2. How much did Kalaba get?", marks: 2, answer: "K90.00", options: ["K60.00", "K90.00", "K100.00", "K120.00"] },
      { text: "116 seconds is equal to", marks: 2, answer: "1 minute 56 seconds", options: ["1 minute 56 seconds", "2 minutes 16 seconds", "3 minutes 26 seconds", "11 minutes 6 seconds"] },
      { text: "Mr Phiri had K1 500.00 in his account. He withdrew some money leaving a balance of K800.00. How much did he withdraw?", marks: 2, answer: "K700.00", options: ["K500.00", "K600.00", "K700.00", "K800.00"] },
      { text: "Divide 150 in the ratio 2:3.", marks: 2, answer: "60 and 90", options: ["50 and 100", "60 and 90", "50 and 75", "36 and 54"] },
      { text: "Divide 561 126 by 123.", marks: 2, answer: "4 562", options: ["5 562", "4 562", "4 502", "3 562"] },
      { text: "An angle equal to 32° is", marks: 2, answer: "an acute angle", options: ["a right angle", "an acute angle", "a straight angle", "an obtuse angle"] },
      { text: "What is 40% of 1 250 000?", marks: 2, answer: "500 000", options: ["5 000", "50 000", "250 000", "500 000"] },
      { text: "Convert 4m to centimetres.", marks: 2, answer: "400cm", options: ["0.04cm", "4.0cm", "40cm", "400cm"] },
      { text: "The volume of a cuboid measuring 15cm long, 10cm wide and 5cm high is", marks: 2, answer: "750cm³", options: ["750cm³", "550cm³", "150cm³", "30cm³"] },
    ],
    "6": [
      { text: "What is 15 + 8?", marks: 2, answer: "23" },
      { text: "How many sides does a triangle have?", marks: 2, answer: "3" },
      { text: "What is 5 × 6?", marks: 2, answer: "30" },
      { text: "Which is bigger: 1/2 or 1/4?", marks: 2, answer: "1/2" },
      { text: "Count in twos: 2, 4, 6, ___, 10", marks: 2, answer: "8" },
      { text: "What is 20 - 9?", marks: 2, answer: "11", options: ["11", "12", "9", "29"] },
      { text: "What is 7 × 8?", marks: 2, answer: "56", options: ["54", "56", "64", "48"] },
      { text: "What is 12 ÷ 3?", marks: 2, answer: "4", options: ["4", "3", "6", "9"] },
      { text: "How many sides does a square have?", marks: 2, answer: "4", options: ["3", "4", "5", "6"] },
      { text: "What comes next: 10, 20, 30, ___?", marks: 2, answer: "40", options: ["35", "40", "50", "25"] },
      { text: "Which number is the smallest: 12, 21, 9, 17?", marks: 2, answer: "9", options: ["12", "21", "9", "17"] },
      { text: "What is 100 - 37?", marks: 2, answer: "63", options: ["63", "73", "137", "67"] },
      { text: "How many minutes are in one hour?", marks: 2, answer: "60", options: ["60", "30", "100", "24"] },
      { text: "What is the sum of 6 and 7?", marks: 2, answer: "13", options: ["13", "12", "14", "11"] },
      { text: "What is half of 50?", marks: 2, answer: "25", options: ["25", "20", "50", "5"] },
    ],
    "12": [
      { text: "Solve the quadratic equation 3x² - 5x - 2 = 0", marks: 5, answer: "x = 2 or x = -1/3" },
      { text: "A car travels 120 km at a speed of 60 km/h and returns at 40 km/h. Calculate the average speed for the whole journey.", marks: 4, answer: "Average speed = total distance/total time = 240/5 = 48 km/h" },
      { text: "Find the gradient of the curve y = 2x³ - 3x² + 5 at the point where x = 1.", marks: 4, answer: "dy/dx = 6x² - 6x, at x=1: gradient = 0" },
      { text: "In a triangle ABC, AB = 8 cm, BC = 10 cm, and angle ABC = 60°. Calculate the length of AC.", marks: 5, answer: "Using cosine rule: AC² = 8² + 10² - 2(8)(10)cos60° = 164 - 80 = 84, AC = 9.17 cm" },
      { text: "A bag contains 5 red balls, 3 blue balls, and 2 green balls. What is the probability of drawing a red ball followed by a blue ball without replacement?", marks: 4, answer: "P(red then blue) = 5/10 × 3/9 = 15/90 = 1/6" },
      { text: "Solve the simultaneous equations: 2x + y = 7 and 3x - 2y = 0", marks: 5, answer: "x = 2, y = 3" },
      { text: "A cylinder has radius 7 cm and height 10 cm. Calculate its volume. (Take π = 22/7)", marks: 3, answer: "V = πr²h = 22/7 × 49 × 10 = 1540 cm³" },
      { text: "Find the nth term of the sequence: 3, 7, 11, 15, 19, ...", marks: 3, answer: "4n - 1" },
      { text: "Simplify: (3x²y³)/(9xy⁵)", marks: 3, answer: "x/(3y²)" },
      { text: "If log₁₀ 2 = 0.3010 and log₁₀ 3 = 0.4771, find log₁₀ 12.", marks: 4, answer: "log₁₀ 12 = log₁₀(3×4) = log₁₀ 3 + 2log₁₀ 2 = 0.4771 + 0.6020 = 1.0791" },
    ],
    "10": [
      { text: "Factorise: x² - 16", marks: 3, answer: "(x-4)(x+4)" },
      { text: "If 3x + 7 = 22, find the value of x.", marks: 2, answer: "x = 5" },
      { text: "Calculate the area of a triangle with base 12 cm and height 8 cm.", marks: 3, answer: "Area = ½ × 12 × 8 = 48 cm²" },
    ],
    "9": [
      { text: "Evaluate: 15 - 3 × 4 + 6 ÷ 2", marks: 3, answer: "15 - 12 + 3 = 6" },
      { text: "Find the perimeter of a rectangle measuring 12 cm by 8 cm.", marks: 2, answer: "Perimeter = 2(12 + 8) = 40 cm" },
      { text: "Convert 0.75 to a fraction in its simplest form.", marks: 2, answer: "3/4" },
    ],
  },
  "Physics": {
    "6": [
      { text: "What force pulls things towards the ground?", marks: 2, answer: "Gravity", options: ["Gravity", "Friction", "Magnetism", "Wind"] },
      { text: "Which of these is a source of light?", marks: 2, answer: "The sun", options: ["The sun", "The moon", "A stone", "Water"] },
      { text: "What happens to ice when you put it in the sun?", marks: 2, answer: "It melts", options: ["It melts", "It freezes", "It turns to stone", "It gets bigger"] },
      { text: "Which of these is a gas?", marks: 2, answer: "Air", options: ["Air", "Water", "Wood", "Stone"] },
      { text: "What do we call the energy of a moving object?", marks: 3, answer: "Kinetic energy", options: ["Kinetic energy", "Heat energy", "Light energy", "Sound energy"] },
      { text: "Which of these can you hear with your ears?", marks: 2, answer: "Sound", options: ["Sound", "Light", "Colour", "Taste"] },
      { text: "What is the unit used to measure force?", marks: 3, answer: "Newton", options: ["Newton", "Litres", "Kilograms", "Metres"] },
      { text: "What happens to water when it is heated?", marks: 2, answer: "It turns to steam", options: ["It turns to steam", "It freezes", "It turns solid", "Nothing"] },
      { text: "Which of these is a form of energy?", marks: 2, answer: "Heat", options: ["Heat", "Chair", "Water", "Stone"] },
      { text: "What do we call the space an object takes up?", marks: 3, answer: "Volume", options: ["Volume", "Weight", "Speed", "Force"] },
      { text: "Which instrument do we use to measure temperature?", marks: 2, answer: "Thermometer", options: ["Thermometer", "Ruler", "Scale", "Barometer"] },
      { text: "What pulls a magnet towards iron?", marks: 3, answer: "Magnetic force", options: ["Magnetic force", "Gravity only", "Wind", "Friction"] },
    ],
    "7": [
      { text: "What is sound produced by?", marks: 3, answer: "Vibrations", options: ["Vibrations", "Light", "Water", "Air only"] },
      { text: "Which of these is a good conductor of electricity?", marks: 3, answer: "Copper wire", options: ["Copper wire", "Rubber", "Wood", "Plastic"] },
      { text: "What is a magnet used for?", marks: 3, answer: "Attracting iron and steel", options: ["Attracting iron and steel", "Cutting wood", "Measuring distance", "Boiling water"] },
      { text: "What is energy?", marks: 3, answer: "The ability to do work", options: ["The ability to do work", "A type of food", "A measure of weight", "A kind of sound"] },
      { text: "What is the speed of light?", marks: 3, answer: "About 300 000 km per second", options: ["About 300 000 km per second", "About 300 km per hour", "About 30 km per second", "About 3 000 km per hour"] },
      { text: "What do we call materials that do not allow electricity to pass through?", marks: 3, answer: "Insulators", options: ["Insulators", "Conductors", "Magnets", "Metals"] },
      { text: "What happens when two poles of a magnet that are the same are brought together?", marks: 3, answer: "They repel each other", options: ["They repel each other", "They attract each other", "Nothing", "They melt"] },
      { text: "What is the unit of electric current?", marks: 3, answer: "Ampere (amp)", options: ["Ampere (amp)", "Volt", "Newton", "Watt"] },
      { text: "Which form of energy do we get from the sun?", marks: 2, answer: "Light and heat energy", options: ["Light and heat energy", "Sound energy", "Chemical energy only", "Magnetic energy"] },
      { text: "What is friction?", marks: 3, answer: "A force that slows things down when surfaces rub", options: ["A force that slows things down when surfaces rub", "A force that speeds things up", "A type of light", "A kind of liquid"] },
      { text: "What does a lever do?", marks: 3, answer: "Makes work easier by using a pivot", options: ["Makes work easier by using a pivot", "Stores electrical energy", "Measures weight", "Creates sound"] },
      { text: "What is the unit used to measure electrical power?", marks: 3, answer: "Watt", options: ["Watt", "Litre", "Metre", "Kilogram"] },
    ],
  },
  "Chemistry": {
    "6": [
      { text: "Which of these is a liquid at room temperature?", marks: 2, answer: "Water", options: ["Water", "Ice", "Steam", "Stone"] },
      { text: "What happens when you mix salt and water?", marks: 2, answer: "The salt dissolves", options: ["The salt dissolves", "The water turns to ice", "The salt sinks forever", "Nothing happens"] },
      { text: "Which of these is a solid?", marks: 2, answer: "Wood", options: ["Wood", "Milk", "Air", "Rain"] },
      { text: "Which of these is a gas?", marks: 2, answer: "Oxygen", options: ["Oxygen", "Water", "Sand", "Sugar"] },
      { text: "What do we call the change of water into steam?", marks: 3, answer: "Evaporation", options: ["Evaporation", "Condensation", "Freezing", "Melting"] },
      { text: "What is sugar?", marks: 2, answer: "A sweet substance that dissolves in water", options: ["A sweet substance that dissolves in water", "A type of metal", "A gas", "A liquid metal"] },
      { text: "Which of these dissolves in water?", marks: 2, answer: "Salt", options: ["Salt", "Sand", "Stones", "Iron"] },
      { text: "What do we call the process of a liquid turning into a solid?", marks: 3, answer: "Freezing", options: ["Freezing", "Evaporation", "Boiling", "Melting"] },
      { text: "Which of these is used to put out a fire?", marks: 2, answer: "Water", options: ["Water", "Kerosene", "Petrol", "Air"] },
      { text: "What is the colour of pure water?", marks: 2, answer: "Colourless", options: ["Colourless", "Blue", "Green", "Yellow"] },
      { text: "What happens when you boil water?", marks: 2, answer: "It turns to steam", options: ["It turns to steam", "It freezes", "It turns to ice", "It disappears completely"] },
      { text: "Which of these is a state of matter?", marks: 2, answer: "Liquid", options: ["Liquid", "Heavy", "White", "Cold"] },
    ],
    "7": [
      { text: "What is the chemical symbol for water?", marks: 3, answer: "H2O", options: ["H2O", "CO2", "O2", "NaCl"] },
      { text: "Which gas do plants use to make food?", marks: 3, answer: "Carbon dioxide", options: ["Carbon dioxide", "Oxygen", "Nitrogen", "Hydrogen"] },
      { text: "What happens when iron is left in water and air?", marks: 3, answer: "It rusts", options: ["It rusts", "It turns to gold", "It melts", "It disappears"] },
      { text: "What is the name for water in the form of gas?", marks: 3, answer: "Water vapour", options: ["Water vapour", "Ice", "Liquid water", "Rust"] },
      { text: "What is the chemical symbol for common salt?", marks: 3, answer: "NaCl", options: ["NaCl", "H2O", "CO2", "O2"] },
      { text: "What is the chemical symbol for oxygen?", marks: 2, answer: "O2", options: ["O2", "H2O", "CO2", "N2"] },
      { text: "What is the chemical symbol for carbon dioxide?", marks: 3, answer: "CO2", options: ["CO2", "H2O", "O2", "NaCl"] },
      { text: "Which of these is a mixture?", marks: 3, answer: "Sand and water", options: ["Sand and water", "Pure gold", "Pure water", "Oxygen"] },
      { text: "What is rust?", marks: 3, answer: "Iron oxide formed when iron reacts with air and water", options: ["Iron oxide formed when iron reacts with air and water", "A type of metal", "A gas", "A kind of plastic"] },
      { text: "What do we call the process of steam turning back to water?", marks: 3, answer: "Condensation", options: ["Condensation", "Evaporation", "Freezing", "Melting"] },
      { text: "Which gas do we need for burning?", marks: 2, answer: "Oxygen", options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"] },
      { text: "What is the chemical symbol for gold?", marks: 3, answer: "Au", options: ["Au", "Ag", "Go", "Gd"] },
    ],
  },
  "Biology": {
    "6": [
      { text: "Which animal lives in water and breathes with gills?", marks: 2, answer: "Fish", options: ["Fish", "Bird", "Dog", "Cow"] },
      { text: "What do plants need to make their own food?", marks: 3, answer: "Sunlight and water", options: ["Sunlight and water", "Only soil", "Only air", "Only darkness"] },
      { text: "Which part of the body pumps blood?", marks: 2, answer: "Heart", options: ["Heart", "Lungs", "Stomach", "Brain"] },
      { text: "What do we call a baby dog?", marks: 2, answer: "A puppy", options: ["A puppy", "A calf", "A chick", "A lamb"] },
      { text: "Which of these is a living thing?", marks: 2, answer: "A tree", options: ["A tree", "A stone", "Water", "Sand"] },
      { text: "What do we call the food that comes from a cow?", marks: 2, answer: "Milk", options: ["Milk", "Eggs", "Honey", "Sugar"] },
      { text: "How many legs does a spider have?", marks: 2, answer: "8", options: ["8", "6", "4", "10"] },
      { text: "Which part of a plant is under the ground?", marks: 2, answer: "The root", options: ["The root", "The leaf", "The flower", "The stem"] },
      { text: "What do we call animals that give birth to live young and feed them milk?", marks: 3, answer: "Mammals", options: ["Mammals", "Birds", "Fish", "Reptiles"] },
      { text: "Which sense organ do we use to taste?", marks: 2, answer: "The tongue", options: ["The tongue", "The eye", "The ear", "The nose"] },
      { text: "What do plants give off during the day?", marks: 2, answer: "Oxygen", options: ["Oxygen", "Carbon dioxide only", "Nitrogen", "Smoke"] },
      { text: "What do we call the green part of a plant that makes food?", marks: 2, answer: "The leaf", options: ["The leaf", "The root", "The flower", "The seed"] },
    ],
    "7": [
      { text: "What do we call animals that eat only plants?", marks: 3, answer: "Herbivores", options: ["Herbivores", "Carnivores", "Omnivores", "Predators"] },
      { text: "Which organ do we use to breathe?", marks: 3, answer: "Lungs", options: ["Lungs", "Heart", "Kidneys", "Stomach"] },
      { text: "What is the process by which plants make food called?", marks: 3, answer: "Photosynthesis", options: ["Photosynthesis", "Respiration", "Digestion", "Germination"] },
      { text: "What do we call a baby frog?", marks: 3, answer: "Tadpole", options: ["Tadpole", "Pup", "Cub", "Calf"] },
      { text: "What is the largest organ in the human body?", marks: 3, answer: "The skin", options: ["The skin", "The liver", "The brain", "The heart"] },
      { text: "What do we call animals that eat both plants and animals?", marks: 3, answer: "Omnivores", options: ["Omnivores", "Herbivores", "Carnivores", "Decomposers"] },
      { text: "What does the skeleton do for the body?", marks: 3, answer: "Gives support and shape", options: ["Gives support and shape", "Pumps blood", "Digests food", "Breathes"] },
      { text: "What is the name of the green substance in leaves?", marks: 2, answer: "Chlorophyll", options: ["Chlorophyll", "Haemoglobin", "Plasma", "Pollen"] },
      { text: "Which of these carries blood around the body?", marks: 3, answer: "The blood vessels", options: ["The blood vessels", "The bones", "The muscles", "The nerves"] },
      { text: "What do we call the study of living things?", marks: 2, answer: "Biology", options: ["Biology", "Chemistry", "Physics", "Geography"] },
      { text: "What do we call animals that eat only meat?", marks: 3, answer: "Carnivores", options: ["Carnivores", "Herbivores", "Omnivores", "Vegans"] },
      { text: "What is the basic unit of life?", marks: 3, answer: "The cell", options: ["The cell", "The heart", "The brain", "The atom"] },
    ],
  },
  "Geography": {
    "6": [
      { text: "Which is the largest ocean?", marks: 2, answer: "Pacific Ocean", options: ["Pacific Ocean", "Atlantic Ocean", "Indian Ocean", "Arctic Ocean"] },
      { text: "What is the capital city of Zambia?", marks: 2, answer: "Lusaka", options: ["Lusaka", "Ndola", "Kitwe", "Livingstone"] },
      { text: "Which river flows through the Victoria Falls?", marks: 3, answer: "Zambezi River", options: ["Zambezi River", "Kafue River", "Luangwa River", "Congo River"] },
      { text: "Which continent is Zambia in?", marks: 2, answer: "Africa", options: ["Africa", "Asia", "Europe", "Australia"] },
      { text: "What is the longest river in the world?", marks: 2, answer: "Nile", options: ["Amazon", "Nile", "Zambezi", "Congo"] },
      { text: "Which is the largest lake in Africa?", marks: 2, answer: "Lake Victoria", options: ["Lake Victoria", "Lake Tanganyika", "Lake Bangweulu", "Lake Kariba"] },
      { text: "What is the biggest planet in our solar system?", marks: 2, answer: "Jupiter", options: ["Jupiter", "Saturn", "Mars", "Earth"] },
      { text: "Which direction does the sun set in?", marks: 2, answer: "West", options: ["West", "East", "North", "South"] },
      { text: "Which country is found to the east of Zambia?", marks: 2, answer: "Malawi", options: ["Malawi", "Angola", "Namibia", "Botswana"] },
      { text: "What is the name of the lake formed by the Kariba Dam?", marks: 2, answer: "Lake Kariba", options: ["Lake Kariba", "Lake Tanganyika", "Lake Bangweulu", "Lake Mweru"] },
      { text: "Which is the coldest place on Earth?", marks: 2, answer: "Antarctica", options: ["Antarctica", "Sahara Desert", "Zambia", "India"] },
      { text: "What does a compass show us?", marks: 2, answer: "Directions", options: ["Directions", "Time", "Weather", "Distance in kilometres"] },
    ],
    "7": [
      { text: "What is a map used for?", marks: 3, answer: "Finding places and directions", options: ["Finding places and directions", "Cooking food", "Building houses", "Measuring weight"] },
      { text: "Which of these is a lake in Zambia?", marks: 3, answer: "Lake Bangweulu", options: ["Lake Bangweulu", "Lake Malawi only", "Lake Victoria", "Lake Tanganyika in Tanzania only"] },
      { text: "What direction does the sun rise in?", marks: 3, answer: "East", options: ["East", "West", "North", "South"] },
      { text: "What is the weather?", marks: 3, answer: "The condition of the atmosphere at a place and time", options: ["The condition of the atmosphere at a place and time", "The number of rivers", "The height of mountains", "The size of a country"] },
      { text: "What is the capital city of Zambia?", marks: 2, answer: "Lusaka", options: ["Lusaka", "Ndola", "Kitwe", "Livingstone"] },
      { text: "Which river flows through the Victoria Falls?", marks: 3, answer: "Zambezi River", options: ["Zambezi River", "Kafue River", "Luangwa River", "Congo River"] },
      { text: "Which of these is a province of Zambia?", marks: 3, answer: "Southern", options: ["Southern", "Northern Rhodesia", "Nairobi", "Lagos"] },
      { text: "What is the largest ocean in the world?", marks: 3, answer: "Pacific Ocean", options: ["Pacific Ocean", "Atlantic Ocean", "Indian Ocean", "Arctic Ocean"] },
      { text: "What do we call the height of a place above sea level?", marks: 3, answer: "Altitude", options: ["Altitude", "Latitude", "Longitude", "Slope"] },
      { text: "Which country borders Zambia to the south?", marks: 2, answer: "Zimbabwe", options: ["Zimbabwe", "Tanzania", "Congo DRC", "Malawi"] },
      { text: "What is the line that divides the earth into north and south?", marks: 3, answer: "The Equator", options: ["The Equator", "The Prime Meridian", "The Tropic of Cancer", "The North Pole"] },
      { text: "What is the main cash crop grown in Zambia?", marks: 3, answer: "Maize", options: ["Maize", "Rice", "Coffee only", "Bananas"] },
    ],
  },
  "History": {
    "6": [
      { text: "Who was the first President of Zambia?", marks: 2, answer: "Kenneth Kaunda", options: ["Kenneth Kaunda", "Levy Mwanawasa", "Michael Sata", "Rupiah Banda"] },
      { text: "In which year did Zambia get independence?", marks: 2, answer: "1964", options: ["1964", "1960", "1970", "1954"] },
      { text: "Who discovered the Victoria Falls for the Western world?", marks: 3, answer: "David Livingstone", options: ["David Livingstone", "Cecil Rhodes", "Harry Johnston", "Mungo Park"] },
      { text: "What was Zambia called before independence?", marks: 3, answer: "Northern Rhodesia", options: ["Northern Rhodesia", "Southern Rhodesia", "Nyasaland", "Tanganyika"] },
      { text: "Who was Zambia's first Prime Minister before independence?", marks: 3, answer: "Kenneth Kaunda", options: ["Kenneth Kaunda", "Hastings Banda", "Julius Nyerere", "Cecil Rhodes"] },
      { text: "What do we call the journey David Livingstone made to explore Africa?", marks: 3, answer: "An expedition", options: ["An expedition", "A holiday", "A war", "A trade"] },
      { text: "On which date does Zambia celebrate its independence?", marks: 2, answer: "24th October", options: ["24th October", "1st July", "14th March", "6th September"] },
      { text: "Who was the famous female freedom fighter who opposed British rule?", marks: 3, answer: "Alice Lenshina", options: ["Alice Lenshina", "Margaret Thatcher", "Queen Elizabeth II", "Angela Merkel"] },
      { text: "Which people first lived in the area that is now Zambia?", marks: 3, answer: "The Khoisan", options: ["The Khoisan", "The British", "The Portuguese", "The Americans"] },
      { text: "What is a chief?", marks: 2, answer: "A traditional leader of a community", options: ["A traditional leader of a community", "A type of food", "A school teacher", "A policeman"] },
      { text: "What was the main job of the colonisers in Northern Rhodesia?", marks: 3, answer: "To mine copper", options: ["To mine copper", "To fish", "To farm tomatoes only", "To build schools for everyone"] },
      { text: "Which explorer is known as the 'Father of the Victoria Falls' for Europe?", marks: 3, answer: "David Livingstone", options: ["David Livingstone", "Vasco da Gama", "Cecil Rhodes", "Henry Stanley"] },
    ],
    "7": [
      { text: "What was Zambia called before independence?", marks: 3, answer: "Northern Rhodesia", options: ["Northern Rhodesia", "Southern Rhodesia", "Nyasaland", "Tanganyika"] },
      { text: "Why do we celebrate Independence Day on 24th October?", marks: 3, answer: "Zambia became independent on that day in 1964", options: ["Zambia became independent on that day in 1964", "It is harvest time", "It is the rainy season", "It is the President's birthday"] },
      { text: "What is the national flag colour that stands for Zambia's land?", marks: 3, answer: "Green", options: ["Green", "Red", "Orange", "Black"] },
      { text: "What is oral history?", marks: 3, answer: "History passed down by word of mouth", options: ["History passed down by word of mouth", "History written in books only", "A type of music", "A kind of food"] },
      { text: "Who was the first President of Zambia?", marks: 2, answer: "Kenneth Kaunda", options: ["Kenneth Kaunda", "Levy Mwanawasa", "Michael Sata", "Rupiah Banda"] },
      { text: "In which year did Zambia become independent?", marks: 2, answer: "1964", options: ["1964", "1960", "1970", "1954"] },
      { text: "Who discovered the Victoria Falls for the Western world?", marks: 3, answer: "David Livingstone", options: ["David Livingstone", "Cecil Rhodes", "Harry Johnston", "Mungo Park"] },
      { text: "What is a traditional ceremony?", marks: 3, answer: "A cultural celebration of a community", options: ["A cultural celebration of a community", "A type of exam", "A football match", "A school holiday"] },
      { text: "What do historians study?", marks: 3, answer: "The past", options: ["The past", "The future", "Animals only", "Stars only"] },
      { text: "Which country colonised Zambia?", marks: 3, answer: "Britain", options: ["Britain", "France", "Germany", "Portugal"] },
      { text: "What is the national anthem of Zambia called?", marks: 3, answer: "Stand and Sing of Zambia, Proud and Free", options: ["Stand and Sing of Zambia, Proud and Free", "God Save the King", "Lusaka Luyando", "Nkosi Sikelel' iAfrika"] },
      { text: "What do we call a leader of a chiefdom?", marks: 3, answer: "A chief", options: ["A chief", "A minister", "A senator", "A mayor"] },
    ],
  },
  "Civic Education": {
    "6": [
      { text: "What is the name of Zambia's national anthem?", marks: 2, answer: "Stand and Sing of Zambia, Proud and Free", options: ["Stand and Sing of Zambia, Proud and Free", "God Save the King", "The Star-Spangled Banner", "Nkosi Sikelel' iAfrika"] },
      { text: "Who is the head of state in Zambia?", marks: 2, answer: "The President", options: ["The President", "The Chief Justice", "The Speaker", "The Mayor"] },
      { text: "What do we call the bird on Zambia's flag?", marks: 2, answer: "African Fish Eagle", options: ["African Fish Eagle", "Ostrich", "Vulture", "Crane"] },
    ],
    "7": [
      { text: "What is democracy?", marks: 3, answer: "Government by the people", options: ["Government by the people", "Government by one person forever", "Government by the army", "Government by foreigners"] },
      { text: "What does voting allow citizens to do?", marks: 3, answer: "Choose their leaders", options: ["Choose their leaders", "Pay no taxes", "Skip school", "Break the law"] },
      { text: "Name one responsibility of a citizen.", marks: 3, answer: "Obeying the law", options: ["Obeying the law", "Littering", "Stealing", "Fighting"] },
      { text: "What are the colours on the Zambian flag?", marks: 3, answer: "Green, red, black and orange", options: ["Green, red, black and orange", "Blue, white and yellow", "Purple and pink", "Only green"] },
    ],
  },
  "Computer Studies": {
    "6": [
      { text: "What do we use a computer for?", marks: 2, answer: "Typing and storing information", options: ["Typing and storing information", "Cooking food", "Watering plants", "Cutting grass"] },
      { text: "Which part of the computer do we use to type?", marks: 2, answer: "Keyboard", options: ["Keyboard", "Mouse", "Screen", "Printer"] },
      { text: "What shows information on a computer?", marks: 2, answer: "Monitor", options: ["Monitor", "Keyboard", "CPU", "Speaker"] },
    ],
    "7": [
      { text: "What is a mouse used for?", marks: 3, answer: "Moving the cursor on the screen", options: ["Moving the cursor on the screen", "Typing letters", "Printing paper", "Storing files"] },
      { text: "Which of these is a storage device?", marks: 3, answer: "Flash drive", options: ["Flash drive", "Mouse", "Keyboard", "Monitor"] },
      { text: "What is the brain of the computer called?", marks: 3, answer: "CPU", options: ["CPU", "Monitor", "Mouse", "Speaker"] },
      { text: "What does the internet allow us to do?", marks: 3, answer: "Access information and communicate", options: ["Access information and communicate", "Only play music", "Only print", "Only draw"] },
    ],
  },
  "Additional Mathematics": {
    "6": [
      { text: "What is 10 + 5?", marks: 2, answer: "15", options: ["15", "5", "105", "50"] },
      { text: "What is the missing number: 3, 6, 9, ___?", marks: 2, answer: "12", options: ["12", "10", "11", "15"] },
      { text: "How many sides does a square have?", marks: 2, answer: "4", options: ["4", "3", "5", "6"] },
    ],
    "7": [
      { text: "What is 7 × 8?", marks: 2, answer: "56", options: ["56", "54", "64", "48"] },
      { text: "What is the square of 6?", marks: 3, answer: "36", options: ["36", "12", "66", "6"] },
      { text: "What is the value of x if x + 5 = 12?", marks: 3, answer: "7", options: ["7", "17", "5", "12"] },
      { text: "What is 1/2 of 20?", marks: 3, answer: "10", options: ["10", "20", "5", "2"] },
    ],
  },
  "English Language": {
    "7": [
      { text: "Fill in the blank: The boy ___ to school every day.", marks: 2, answer: "goes", options: ["go", "goes", "going", "gone"] },
      { text: "Write the plural form of: child", marks: 2, answer: "children", options: ["childs", "childes", "children", "childrens"] },
      { text: "Give the opposite of: big", marks: 2, answer: "small", options: ["large", "small", "huge", "giant"] },
      { text: "Complete: I ___ my homework last night.", marks: 2, answer: "did", options: ["do", "did", "does", "doing"] },
      { text: "What is the capital city of Zambia?", marks: 3, answer: "Lusaka", options: ["Ndola", "Kitwe", "Lusaka", "Livingstone"] },
      { text: "Choose the correct word: They ___ playing football. (is/are)", marks: 2, answer: "are", options: ["is", "are", "am", "be"] },
      { text: "Write the opposite of 'tall'.", marks: 2, answer: "short", options: ["short", "long", "big", "high"] },
      { text: "What is a verb?", marks: 3, answer: "A doing word", options: ["A doing word", "A naming word", "A describing word", "A joining word"] },
      { text: "Complete the sentence with the correct word: She ___ very fast. (runs/run)", marks: 2, answer: "runs", options: ["runs", "run", "running", "ran"] },
      { text: "Give the plural form of 'goose'.", marks: 2, answer: "geese", options: ["geese", "gooses", "goosies", "goose"] },
      { text: "Which word is an adjective? (beautiful, walk, table, quickly)", marks: 2, answer: "beautiful", options: ["beautiful", "walk", "table", "quickly"] },
      { text: "Choose the correct word: There are many ___ in the field. (sheep/sheeps)", marks: 2, answer: "sheep", options: ["sheep", "sheeps", "sheepes", "sheepies"] },
    ],
    "6": [
      { text: "Choose the correct word: She ___ a teacher. (is/are)", marks: 2, answer: "is" },
      { text: "What is the first letter of the alphabet?", marks: 2, answer: "A" },
      { text: "Complete the sentence: The cat is ___ the table. (on/at)", marks: 2, answer: "on" },
      { text: "Choose the correct word: They ___ playing football now. (is/are)", marks: 2, answer: "are", options: ["is", "are", "am", "be"] },
      { text: "Choose the correct word: He ___ to school by bus. (go/goes)", marks: 2, answer: "goes", options: ["go", "goes", "going", "gone"] },
      { text: "What is the plural of 'book'?", marks: 2, answer: "books", options: ["bookes", "books", "book", "bookies"] },
      { text: "Which word is a noun? (run, happy, table, quickly)", marks: 2, answer: "table", options: ["run", "happy", "table", "quickly"] },
      { text: "Choose the opposite of 'hot'.", marks: 2, answer: "cold", options: ["warm", "cold", "wet", "dry"] },
      { text: "Complete the sentence: Yesterday, we ___ to the market. (go/went)", marks: 2, answer: "went", options: ["go", "went", "gone", "goes"] },
      { text: "What is the last letter of the word 'Zambia'?", marks: 2, answer: "a", options: ["b", "i", "a", "n"] },
      { text: "Choose the correct word: I ___ my teeth every morning. (brush/brushes)", marks: 2, answer: "brush", options: ["brush", "brushes", "brushing", "brushed"] },
      { text: "Which one is a month of the year?", marks: 2, answer: "May", options: ["Monday", "May", "Morning", "Mango"] },
    ],
    "12": [
      { text: "Write a composition of about 350 words on the topic: 'The role of young people in promoting national unity in Zambia.'", marks: 20, answer: "A well-structured essay with introduction, body paragraphs discussing youth roles in national unity, and conclusion." },
      { text: "Read the passage below and answer the questions that follow: 'Climate change is one of the greatest challenges facing our generation...' [Passage provided]. Summarise the effects of climate change mentioned in the passage.", marks: 10, answer: "Rising temperatures, extreme weather events, melting ice caps, threat to biodiversity, and food security issues." },
      { text: "Rewrite the following sentence in reported speech: 'I will visit Lusaka next week,' said John.", marks: 3, answer: "John said that he would visit Lusaka the following week." },
      { text: "Identify the figures of speech in: 'The wind whispered through the trees.'", marks: 2, answer: "Personification" },
      { text: "Write a formal letter to your Member of Parliament complaining about the poor state of roads in your area.", marks: 15, answer: "Formal letter format with sender's address, date, MP's address, salutation, body outlining road issues, and closing." },
    ],
    "10": [
      { text: "Use the word 'light' in three different sentences to show three different meanings.", marks: 3, answer: "The room was filled with light. The bag is very light. Please light the candle." },
      { text: "Identify the parts of speech in: 'The beautiful girl walked slowly to school.'", marks: 4, answer: "The=article, beautiful=adjective, girl=noun, walked=verb, slowly=adverb, to=preposition, school=noun" },
    ],
    "9": [
      { text: "Write five sentences describing your best friend.", marks: 5, answer: "Sentences describing physical appearance, personality, and friendship qualities." },
      { text: "Give the plural forms of: child, sheep, tooth, man, ox", marks: 5, answer: "children, sheep, teeth, men, oxen" },
    ],
  },
  "Civic Education": {
    "12": [
      { text: "Explain the characteristics of a good constitution.", marks: 5, answer: "Supremacy, flexibility, clarity, protects human rights, separation of powers, independence of judiciary." },
      { text: "Describe the functions of the three branches of government in Zambia.", marks: 6, answer: "Executive (cabinet enforces laws), Legislature (Parliament makes laws), Judiciary (courts interpret laws) - checks and balances." },
      { text: "What are human rights? Explain five fundamental human rights enshrined in the Zambian constitution.", marks: 5, answer: "Human rights are basic entitlements. Rights: life, education, health, freedom of speech, freedom of assembly, equality before law, protection from discrimination." },
      { text: "Explain the importance of voting in a democratic society.", marks: 4, answer: "Citizens choose leaders, express will, hold government accountable, prevent tyranny, ensure representation." },
      { text: "Describe the qualities of a responsible citizen in Zambia.", marks: 5, answer: "Paying taxes, obeying laws, voting, participating in community development, respecting national symbols, protecting the environment." },
    ],
    "10": [
      { text: "Define 'democracy' and name the type of democracy practiced in Zambia.", marks: 3, answer: "Democracy is government by the people. Zambia practices representative/liberal democracy." },
      { text: "What are the national symbols of Zambia?", marks: 3, answer: "National flag (green, orange, red, black, eagle), national anthem (Stand and Sing of Zambia), national seal, national bird (African fish eagle)" },
    ],
    "9": [
      { text: "What is the difference between a right and a responsibility?", marks: 2, answer: "A right is what you are entitled to, a responsibility is what you should do as a citizen." },
      { text: "Name three ways you can show patriotism to your country.", marks: 3, answer: "Respecting national flag/anthem, obeying laws, participating in national events" },
    ],
  },
  "Religious Education": {
    "7": [
      { text: "What is prayer?", marks: 3, answer: "Talking to God", options: ["Talking to God", "Singing songs", "Cooking food", "Playing football"] },
      { text: "Name the three major world religions.", marks: 3, answer: "Christianity, Islam and Hinduism", options: ["Christianity, Islam and Hinduism", "Only Christianity", "Only Islam", "Only traditional beliefs"] },
      { text: "What do Christians celebrate at Easter?", marks: 3, answer: "The resurrection of Jesus", options: ["The resurrection of Jesus", "The birth of Jesus", "The end of fasting", "Harvest"] },
      { text: "Why is the Bible important to Christians?", marks: 3, answer: "It teaches them about God and how to live", options: ["It teaches them about God and how to live", "It is a maths book", "It is a story for fun", "It is a history of animals"] },
      { text: "What is the holy book of Christians called?", marks: 2, answer: "The Bible", options: ["The Bible", "The Quran", "The Torah", "The Vedas"] },
      { text: "What is the holy book of Muslims called?", marks: 2, answer: "The Quran", options: ["The Quran", "The Bible", "The Torah", "The Vedas"] },
      { text: "Who is the founder of Islam?", marks: 2, answer: "Prophet Muhammad", options: ["Prophet Muhammad", "Jesus", "Moses", "Abraham"] },
      { text: "What do we call the day Muslims fast from dawn to sunset?", marks: 3, answer: "Ramadan", options: ["Ramadan", "Easter", "Diwali", "Christmas"] },
      { text: "Who is the founder of Christianity?", marks: 2, answer: "Jesus Christ", options: ["Jesus Christ", "Prophet Muhammad", "Moses", "Buddha"] },
      { text: "What is a place of worship for Muslims called?", marks: 2, answer: "Mosque", options: ["Mosque", "Church", "Temple", "Synagogue"] },
      { text: "What do Christians celebrate at Christmas?", marks: 2, answer: "The birth of Jesus", options: ["The birth of Jesus", "The death of Jesus", "Harvest", "New Year"] },
      { text: "What is the Jewish place of worship called?", marks: 3, answer: "A synagogue", options: ["A synagogue", "A mosque", "A church", "A temple"] },
      { text: "What is the Torah?", marks: 3, answer: "The Jewish holy book", options: ["The Jewish holy book", "A Hindu temple", "A Muslim festival", "A Christian song"] },
      { text: "What is the message of the Golden Rule in religion?", marks: 3, answer: "Treat others as you would like to be treated", options: ["Treat others as you would like to be treated", "Only look after yourself", "Take what you can", "Never help others"] },
      { text: "Name the place where Jesus was born.", marks: 2, answer: "Bethlehem", options: ["Bethlehem", "Nazareth", "Jerusalem", "Capernaum"] },
      { text: "What do Hindus call their place of worship?", marks: 3, answer: "A temple", options: ["A temple", "A mosque", "A synagogue", "A church"] },
    ],
    "6": [
      { text: "What is the holy book of Christians called?", marks: 2, answer: "The Bible", options: ["The Bible", "The Quran", "The Torah", "The Vedas"] },
      { text: "Who is the founder of Islam?", marks: 2, answer: "Prophet Muhammad", options: ["Prophet Muhammad", "Jesus", "Moses", "Abraham"] },
      { text: "What is a place of worship for Muslims called?", marks: 2, answer: "Mosque", options: ["Mosque", "Church", "Temple", "Synagogue"] },
      { text: "What is prayer?", marks: 3, answer: "Talking to God", options: ["Talking to God", "Singing songs", "Cooking food", "Playing football"] },
      { text: "Who was Jesus Christ?", marks: 3, answer: "The Son of God in Christianity", options: ["The Son of God in Christianity", "A king of Egypt", "A Roman soldier", "A prophet of Hindus"] },
      { text: "What is the holy book of Muslims called?", marks: 2, answer: "The Quran", options: ["The Quran", "The Bible", "The Torah", "The Vedas"] },
      { text: "Where do Christians go to worship?", marks: 2, answer: "A church", options: ["A church", "A mosque", "A temple", "A shrine"] },
      { text: "What do we call a person who follows Islam?", marks: 2, answer: "A Muslim", options: ["A Muslim", "A Christian", "A Hindu", "A Buddhist"] },
      { text: "Who is the founder of Christianity?", marks: 2, answer: "Jesus Christ", options: ["Jesus Christ", "Prophet Muhammad", "Moses", "Buddha"] },
      { text: "What is the Jewish holy book called?", marks: 2, answer: "The Torah", options: ["The Torah", "The Quran", "The Bible", "The Vedas"] },
      { text: "What should we do to show love to our neighbours?", marks: 3, answer: "Help and care for them", options: ["Help and care for them", "Ignore them", "Fight them", "Take their things"] },
      { text: "What is the message of peace in religions?", marks: 3, answer: "People should live together in harmony", options: ["People should live together in harmony", "Only one person should rule", "Everyone must fight", "We should not share"] },
    ],
    "12": [
      { text: "Describe the events of the crucifixion and resurrection of Jesus Christ according to the Gospel of Luke.", marks: 6, answer: "Jesus was arrested, tried by Pilate, crucified at Golgotha, died and was buried. On third day, women found empty tomb, angels announced resurrection." },
      { text: "Explain the importance of the Ten Commandments in Christian living today.", marks: 5, answer: "Moral foundation, guides ethical behavior, relationship with God and others, still relevant for Christian conduct." },
      { text: "Discuss the concept of Ubuntu in African traditional religion and its relevance in modern Zambian society.", marks: 5, answer: "Ubuntu means 'I am because we are' - community, sharing, compassion, respect for elders, collective responsibility." },
      { text: "Compare the role of ancestors in African Traditional Religion with the role of saints in Christianity.", marks: 4, answer: "Ancestors are intermediaries between living and God (ATR). Saints are holy people who intercede for believers (Christianity)." },
      { text: "What does Islam teach about the Five Pillars of Faith? Explain each.", marks: 5, answer: "Shahada (faith declaration), Salat (prayer 5x daily), Zakat (charity), Sawm (fasting Ramadan), Hajj (pilgrimage to Mecca)." },
    ],
    "10": [
      { text: "Name the four Gospels of the New Testament.", marks: 2, answer: "Matthew, Mark, Luke, John" },
      { text: "Why do Christians celebrate Easter and Christmas?", marks: 4, answer: "Easter celebrates resurrection of Jesus. Christmas celebrates birth of Jesus." },
    ],
    "9": [
      { text: "Name the three major world religions.", marks: 3, answer: "Christianity, Islam, Hinduism (or Buddhism/Judaism)" },
      { text: "What is prayer and why is it important in religious life?", marks: 3, answer: "Prayer is communicating with God. Important for worship, guidance, thanksgiving, confession, and spiritual growth." },
    ],
  },
  "Computer Studies": {
    "12": [
      { text: "Explain the difference between hardware and software, giving two examples of each.", marks: 4, answer: "Hardware: physical parts (monitor, CPU, keyboard, mouse). Software: programs (Windows, Word, Chrome, Python)." },
      { text: "Convert the binary number 11011010 to decimal. Show your working.", marks: 4, answer: "128+64+0+16+8+0+2+0 = 218" },
      { text: "What is the function of the following in a computer: (a) CPU (b) RAM (c) Hard Drive", marks: 3, answer: "(a) CPU: processes instructions (b) RAM: temporary memory for running programs (c) Hard Drive: permanent storage" },
      { text: "Define the term 'algorithm' and write a pseudocode algorithm to find the largest of three numbers.", marks: 5, answer: "Algorithm = step-by-step problem solving. Pseudocode: INPUT a,b,c, IF a>b AND a>c THEN PRINT a, ELSE IF b>c THEN PRINT b, ELSE PRINT c" },
      { text: "Explain what the Internet is and describe three services provided by the Internet.", marks: 5, answer: "Internet = global network of computers. Services: email (communication), World Wide Web (information), social media (networking), e-commerce (shopping), streaming (entertainment)." },
    ],
    "10": [
      { text: "Name five input devices and five output devices.", marks: 5, answer: "Input: keyboard, mouse, scanner, microphone, webcam. Output: monitor, printer, speakers, headphones, projector." },
      { text: "What is the difference between system software and application software?", marks: 3, answer: "System software runs the computer (OS). Application software performs tasks for users (Word, Excel)." },
    ],
    "9": [
      { text: "What is a computer? List four main parts of a computer.", marks: 3, answer: "A computer is an electronic device that processes data. Parts: Monitor, CPU, Keyboard, Mouse." },
      { text: "What is the importance of computers in education?", marks: 3, answer: "Research, online learning, document preparation, access to educational resources, communication." },
    ],
  },
  "Additional Mathematics": {
    "12": [
      { text: "Differentiate: y = (2x² + 3)⁵", marks: 4, answer: "dy/dx = 5(2x²+3)⁴ × 4x = 20x(2x²+3)⁴" },
      { text: "Find ∫(3x² - 4x + 1) dx", marks: 3, answer: "x³ - 2x² + x + C" },
      { text: "Given that A = [2 3; 1 -1], find the determinant and inverse of matrix A.", marks: 5, answer: "det = 2(-1) - 3(1) = -5. A⁻¹ = (1/5)[1 3; 1 -2]" },
      { text: "Solve the equation 2^(x+1) = 32", marks: 3, answer: "2^(x+1) = 2⁵, so x+1 = 5, x = 4" },
      { text: "Prove the identity: sin²θ + cos²θ = 1", marks: 3, answer: "Using Pythagoras: In a right triangle, opposite² + adjacent² = hypotenuse², dividing by hypotenuse² gives sin²θ + cos²θ = 1" },
    ],
  },
  "Science": {
    "7": [
      { text: "Name the largest planet in our solar system.", marks: 2, answer: "Jupiter", options: ["Earth", "Mars", "Jupiter", "Saturn"] },
      { text: "Which sense organ do we use to see?", marks: 2, answer: "The eye", options: ["The ear", "The eye", "The nose", "The tongue"] },
      { text: "What do plants need to make food?", marks: 3, answer: "Sunlight, water, and carbon dioxide", options: ["Only water", "Only sunlight", "Sunlight, water, and carbon dioxide", "Soil and air"] },
      { text: "What is water made of?", marks: 3, answer: "Hydrogen and oxygen", options: ["Hydrogen and oxygen", "Oxygen and nitrogen", "Carbon and oxygen", "Hydrogen and carbon"] },
      { text: "Name one source of light.", marks: 2, answer: "The sun", options: ["The moon", "The sun", "A stone", "Water"] },
      { text: "Which gas do we breathe out?", marks: 2, answer: "Carbon dioxide", options: ["Carbon dioxide", "Oxygen", "Hydrogen", "Nitrogen"] },
      { text: "What is the force that pulls objects towards the earth?", marks: 2, answer: "Gravity", options: ["Gravity", "Friction", "Magnetism", "Wind"] },
      { text: "How many planets are in our solar system?", marks: 2, answer: "Eight", options: ["Eight", "Nine", "Seven", "Ten"] },
      { text: "What is the main source of energy for the earth?", marks: 2, answer: "The sun", options: ["The sun", "The moon", "Stars", "The wind"] },
      { text: "What is the process of a liquid changing into a gas called?", marks: 3, answer: "Evaporation", options: ["Evaporation", "Condensation", "Freezing", "Melting"] },
      { text: "What do we call the movement of air?", marks: 2, answer: "Wind", options: ["Wind", "Rain", "Clouds", "Thunder"] },
      { text: "Which of these is a renewable source of energy?", marks: 3, answer: "Solar power", options: ["Solar power", "Coal", "Petrol", "Diesel"] },
    ],
    "6": [
      { text: "Name the process by which plants make their own food.", marks: 2, answer: "Photosynthesis" },
      { text: "How many legs does an insect have?", marks: 2, answer: "6" },
      { text: "Name the gas we breathe in.", marks: 2, answer: "Oxygen" },
      { text: "What is water made of?", marks: 3, answer: "Hydrogen and oxygen", options: ["Hydrogen and oxygen", "Oxygen and nitrogen", "Carbon and oxygen", "Hydrogen and carbon"] },
      { text: "Which sense organ do we use to hear?", marks: 2, answer: "The ear", options: ["The ear", "The eye", "The nose", "The tongue"] },
      { text: "Name one source of light.", marks: 2, answer: "The sun", options: ["The moon", "The sun", "A stone", "Water"] },
      { text: "What is the largest planet in our solar system?", marks: 2, answer: "Jupiter", options: ["Earth", "Mars", "Jupiter", "Saturn"] },
      { text: "Name one thing living things need to survive.", marks: 2, answer: "Water", options: ["Water", "Money", "Sand", "Stone"] },
      { text: "Which gas do plants use to make food?", marks: 2, answer: "Carbon dioxide", options: ["Carbon dioxide", "Oxygen", "Nitrogen", "Helium"] },
      { text: "What do we call animals that eat only plants?", marks: 2, answer: "Herbivores", options: ["Herbivores", "Carnivores", "Omnivores", "Predators"] },
      { text: "How many bones make up the adult human body?", marks: 3, answer: "206", options: ["206", "106", "306", "56"] },
      { text: "Name the gas we breathe out.", marks: 2, answer: "Carbon dioxide", options: ["Carbon dioxide", "Oxygen", "Hydrogen", "Nitrogen"] },
    ],
    "9": [
      { text: "What is the difference between a physical change and a chemical change? Give one example of each.", marks: 3, answer: "Physical: no new substance (melting ice). Chemical: new substance formed (burning wood)." },
      { text: "Name the organs of the respiratory system in humans.", marks: 3, answer: "Nose, trachea, bronchi, lungs, alveoli, diaphragm" },
      { text: "What is energy? Name three forms of energy.", marks: 3, answer: "Energy is the ability to do work. Forms: kinetic, potential, thermal, chemical, electrical, light, sound." },
    ],
  },
  "Social Studies": {
    "7": [
      { text: "Which country borders Zambia to the south?", marks: 2, answer: "Zimbabwe", options: ["Tanzania", "Zimbabwe", "Congo DRC", "Malawi"] },
      { text: "What is the capital city of Zambia?", marks: 2, answer: "Lusaka", options: ["Copperbelt", "Lusaka", "Livingstone", "Kitwe"] },
      { text: "Name the three national colours on the Zambian flag.", marks: 3, answer: "Green, orange, red", options: ["Green, blue, white", "Green, orange, red", "Red, white, blue", "Black, yellow, green"] },
      { text: "What is the national bird of Zambia?", marks: 2, answer: "African Fish Eagle", options: ["Ostrich", "African Fish Eagle", "Vulture", "Crane"] },
      { text: "What is the name of Zambia's currency?", marks: 2, answer: "Kwacha", options: ["Shilling", "Rand", "Kwacha", "Naira"] },
      { text: "Who is the head of state in Zambia?", marks: 2, answer: "The President", options: ["The President", "The Chief Justice", "The Speaker", "The Mayor"] },
      { text: "What is the name of the Zambian parliament building?", marks: 3, answer: "The National Assembly", options: ["The National Assembly", "State House", "The High Court", "The Senate"] },
      { text: "Which province has the capital city Chipata?", marks: 3, answer: "Eastern Province", options: ["Eastern Province", "Southern Province", "Northern Province", "Western Province"] },
      { text: "What is the name of the big waterfall on the Zambezi River?", marks: 2, answer: "Victoria Falls", options: ["Chisimba Falls", "Victoria Falls", "Ntumbachushi", "Lumangwe"] },
      { text: "What is the name of Zambia's longest river?", marks: 3, answer: "Zambezi", options: ["Luapula", "Zambezi", "Kafue", "Chambeshi"] },
      { text: "What does the eagle on the Zambian flag represent?", marks: 3, answer: "Freedom and the ability to rise above problems", options: ["Freedom and the ability to rise above problems", "Farming", "Mining", "Fishing"] },
      { text: "How many provinces does Zambia have?", marks: 3, answer: "Ten", options: ["Ten", "Eight", "Nine", "Eleven"] },
    ],
    "6": [
      { text: "What is the name of Zambia's currency?", marks: 2, answer: "Kwacha" },
      { text: "Name one traditional ceremony in Zambia.", marks: 2, answer: "Kuomboka (or Ncwala, Kulamba)" },
      { text: "What is the capital city of Zambia?", marks: 2, answer: "Lusaka", options: ["Kitwe", "Lusaka", "Ndola", "Livingstone"] },
      { text: "Which country shares a border with Zambia to the north?", marks: 2, answer: "Congo DRC", options: ["South Africa", "Congo DRC", "Egypt", "Kenya"] },
      { text: "What is the name of the big waterfall on the Zambezi River?", marks: 2, answer: "Victoria Falls", options: ["Chisimba Falls", "Victoria Falls", "Ntumbachushi", "Lumangwe"] },
      { text: "What is the national bird of Zambia?", marks: 2, answer: "African Fish Eagle", options: ["Ostrich", "African Fish Eagle", "Vulture", "Dove"] },
      { text: "How many colours are on the Zambian flag?", marks: 2, answer: "Four", options: ["Three", "Four", "Two", "Five"] },
      { text: "Name one language spoken in Zambia.", marks: 2, answer: "Bemba", options: ["Bemba", "Swahili", "Zulu", "Xhosa"] },
      { text: "What is the name of the river that flows through the capital city Lusaka?", marks: 2, answer: "Kafue", options: ["Zambezi", "Luangwa", "Kafue", "Congo"] },
      { text: "In which province is the Copperbelt?", marks: 2, answer: "Copperbelt", options: ["Southern", "Copperbelt", "Eastern", "Western"] },
      { text: "What do we call a place where wild animals are protected?", marks: 2, answer: "A national park", options: ["A farm", "A national park", "A market", "A mine"] },
      { text: "What is the name of Zambia's longest river?", marks: 2, answer: "Zambezi", options: ["Luapula", "Zambezi", "Kafue", "Chambeshi"] },
    ],
    "9": [
      { text: "Define culture and list three elements of Zambian culture.", marks: 4, answer: "Culture is the way of life of a people. Elements: language, traditional ceremonies, food, clothing, music/dance." },
      { text: "Explain the importance of education in national development.", marks: 4, answer: "Education creates skilled workforce, reduces poverty, promotes innovation, improves health outcomes, builds civic responsibility." },
      { text: "What are the effects of HIV/AIDS on Zambian society?", marks: 4, answer: "Loss of productive population, orphaned children, increased healthcare costs, reduced life expectancy, stigma." },
    ],
  },
  "Principles of Accounts": {
    "6": [
      { text: "What is money used for?", marks: 2, answer: "To buy goods and services", options: ["To buy goods and services", "To decorate the house", "To make paper", "To clean the floor"] },
      { text: "Which of these is a way to save money?", marks: 2, answer: "Putting money in a bank account", options: ["Putting money in a bank account", "Spending all money on sweets", "Throwing money away", "Lending money and forgetting"] },
      { text: "What is the name of Zambia's currency?", marks: 2, answer: "Kwacha", options: ["Kwacha", "Shilling", "Rand", "Dollar"] },
      { text: "What do we call money you receive for work you do?", marks: 2, answer: "Income", options: ["Income", "Debt", "Tax", "Interest"] },
      { text: "What is the smallest unit of Zambian money?", marks: 2, answer: "Ngwee", options: ["Ngwee", "Kwacha", "Pesa", "Shilling"] },
      { text: "If a sweet costs K2 and you have K10, how many sweets can you buy?", marks: 2, answer: "Five", options: ["Five", "Two", "Ten", "Eight"] },
      { text: "Which of these is a need?", marks: 2, answer: "Food", options: ["Food", "Toys", "Jewellery", "Video games"] },
      { text: "What do we call a place where money is kept safely?", marks: 2, answer: "A bank", options: ["A bank", "A shop", "A school", "A farm"] },
      { text: "What is a want?", marks: 2, answer: "Something you would like but can live without", options: ["Something you would like but can live without", "Something you must have to survive", "A type of food", "A kind of work"] },
      { text: "Which of these is the best way to look after money?", marks: 2, answer: "Keeping a record and spending carefully", options: ["Keeping a record and spending carefully", "Spending it all at once", "Giving it all away", "Burying it and forgetting where"] },
      { text: "What is saving?", marks: 2, answer: "Keeping some money for later use", options: ["Keeping some money for later use", "Spending all money quickly", "Borrowing from a friend", "Throwing money away"] },
      { text: "If your pocket money is K20 and you save K5, how much do you spend?", marks: 2, answer: "K15", options: ["K15", "K25", "K5", "K20"] },
    ],
    "7": [
      { text: "What is a budget?", marks: 3, answer: "A plan for how to spend and save money", options: ["A plan for how to spend and save money", "A type of food", "A school subject", "A kind of car"] },
      { text: "If you earn K50 and spend K30, how much do you save?", marks: 3, answer: "K20", options: ["K80", "K20", "K30", "K50"] },
      { text: "Why do people keep money in a bank?", marks: 3, answer: "To keep it safe and earn interest", options: ["To keep it safe and earn interest", "To lose it", "To burn it", "To bury it in the ground"] },
      { text: "What is income?", marks: 3, answer: "Money received from work or investments", options: ["Money received from work or investments", "Money spent on food", "Money borrowed", "Money lost"] },
      { text: "What is an expense?", marks: 3, answer: "Money you spend", options: ["Money you spend", "Money you earn", "Money you save", "Money you lend"] },
      { text: "What does a receipt show?", marks: 3, answer: "Proof that you paid for something", options: ["Proof that you paid for something", "How much you earn", "Your exam results", "The weather"] },
      { text: "If you borrow K100 and pay back K120, the extra K20 is called what?", marks: 3, answer: "Interest", options: ["Interest", "Profit", "Salary", "Tax"] },
      { text: "What is a bank account used for?", marks: 3, answer: "Keeping and managing money", options: ["Keeping and managing money", "Cooking food", "Storing clothes", "Growing plants"] },
      { text: "Which of these is a fixed expense?", marks: 3, answer: "Rent", options: ["Rent", "Pocket money for snacks", "Bus fare for trips", "Gifts"] },
      { text: "What is a loan?", marks: 3, answer: "Money borrowed that must be paid back", options: ["Money borrowed that must be paid back", "Money given as a gift", "Money earned from work", "Money found on the road"] },
      { text: "What does a bank statement show?", marks: 3, answer: "All the money that went in and out of your account", options: ["All the money that went in and out of your account", "Your exam timetable", "The price of maize", "Your school subjects"] },
      { text: "Why is it important to keep records of money?", marks: 3, answer: "To know what you earned and spent", options: ["To know what you earned and spent", "To throw away old paper", "To decorate the classroom", "To make noise"] },
    ],
    "12": [
      { text: "What is the difference between a debit and a credit in double-entry bookkeeping?", marks: 3, answer: "Debit: left side (assets/expenses increase). Credit: right side (liabilities/income increase). Every transaction has equal debits and credits." },
      { text: "Prepare a trial balance from the following balances: Capital K10,000, Sales K5,000, Purchases K3,000, Rent K500, Cash K2,000, Creditors K1,500, Debtors K1,000.", marks: 5, answer: "Total debits = K6,500, Total credits = K16,500. Needs balancing/correction." },
      { text: "Explain the purpose of a profit and loss account and a balance sheet.", marks: 4, answer: "P&L shows profit/loss over a period. Balance sheet shows assets, liabilities, and capital at a specific date." },
    ],
  },
  "Commerce": {
    "6": [
      { text: "What is a shop?", marks: 2, answer: "A place where goods are bought and sold", options: ["A place where goods are bought and sold", "A place to sleep", "A type of tree", "A school"] },
      { text: "What do we call a person who buys goods?", marks: 2, answer: "A customer", options: ["A customer", "A farmer", "A teacher", "A doctor"] },
      { text: "Which is the smallest unit of Zambian money?", marks: 2, answer: "Ngwee", options: ["Ngwee", "Kwacha", "Shilling", "Cedi"] },
      { text: "What do we call a person who sells goods?", marks: 2, answer: "A seller", options: ["A seller", "A buyer", "A farmer", "A nurse"] },
      { text: "Which of these is sold in a shop?", marks: 2, answer: "Bread", options: ["Bread", "A mountain", "A river", "The sky"] },
      { text: "What is money?", marks: 2, answer: "Something we use to buy goods and services", options: ["Something we use to buy goods and services", "A type of food", "A kind of tree", "A sport"] },
      { text: "Where do farmers sell their maize?", marks: 2, answer: "At the market", options: ["At the market", "In a classroom", "At a hospital", "In a library"] },
      { text: "What do we call a big shop with many departments?", marks: 3, answer: "A supermarket", options: ["A supermarket", "A school", "A farm", "A clinic"] },
      { text: "Which of these is a service?", marks: 2, answer: "Getting a haircut", options: ["Getting a haircut", "Buying a chair", "Eating an apple", "Wearing a shirt"] },
      { text: "What is the name of the biggest market in Lusaka?", marks: 3, answer: "Soweto Market", options: ["Soweto Market", "State House", "UNZA", "Airport"] },
      { text: "If a shopkeeper buys an item for K10 and sells it for K15, what does she make?", marks: 2, answer: "A profit of K5", options: ["A profit of K5", "A loss of K5", "Nothing", "A debt of K5"] },
      { text: "What is the currency of Zambia?", marks: 2, answer: "Kwacha", options: ["Kwacha", "Rand", "Dollar", "Naira"] },
    ],
    "7": [
      { text: "What is trade?", marks: 3, answer: "The buying and selling of goods and services", options: ["The buying and selling of goods and services", "Cooking food", "Playing football", "Planting trees"] },
      { text: "Which of these is a market?", marks: 3, answer: "Soweto Market", options: ["Soweto Market", "A school", "A hospital", "A police station"] },
      { text: "What do we call the money a shopkeeper makes after selling?", marks: 3, answer: "Profit", options: ["Profit", "Loss", "Tax", "Debt"] },
      { text: "What do we call money a business loses?", marks: 3, answer: "Loss", options: ["Loss", "Profit", "Salary", "Interest"] },
      { text: "What is a producer?", marks: 3, answer: "A person who makes goods", options: ["A person who makes goods", "A person who buys goods", "A person who delivers goods", "A person who eats goods"] },
      { text: "What is a consumer?", marks: 3, answer: "A person who uses goods and services", options: ["A person who uses goods and services", "A person who makes goods", "A farmer", "A bank"] },
      { text: "Which of these is an example of import?", marks: 3, answer: "Buying goods from another country", options: ["Buying goods from another country", "Selling goods to another country", "Growing maize locally", "Fishing in the Kafue"] },
      { text: "What is an export?", marks: 3, answer: "Goods sold to another country", options: ["Goods sold to another country", "Goods bought from another country", "Goods made at home", "Goods thrown away"] },
      { text: "What is a wholesaler?", marks: 3, answer: "Someone who buys goods in bulk and sells to retailers", options: ["Someone who buys goods in bulk and sells to retailers", "Someone who sells one item at a time", "A farmer", "A teacher"] },
      { text: "What is a retailer?", marks: 3, answer: "Someone who sells goods directly to customers", options: ["Someone who sells goods directly to customers", "Someone who makes goods", "A truck driver", "A miner"] },
      { text: "What is Zambia's main export?", marks: 3, answer: "Copper", options: ["Copper", "Petrol", "Wheat", "Bananas"] },
      { text: "Why do we need money in trade?", marks: 3, answer: "To buy and sell goods easily", options: ["To buy and sell goods easily", "To decorate the shop", "To make paper", "To weigh goods"] },
    ],
    "12": [
      { text: "Define 'commerce' and explain its role in economic development.", marks: 4, answer: "Commerce is the exchange of goods and services. It facilitates trade, creates employment, generates revenue, connects producers to consumers." },
      { text: "Describe the functions of a commercial bank in Zambia.", marks: 5, answer: "Accepting deposits, granting loans, facilitating payments, issuing cheques, foreign exchange, safe custody, money transfer." },
      { text: "What is insurance? Explain the principles of insurance.", marks: 5, answer: "Insurance protects against financial loss. Principles: utmost good faith, insurable interest, indemnity, contribution, subrogation, proximate cause." },
    ],
  },
  "Agricultural Science": {
    "6": [
      { text: "Which animal is kept on a farm for its milk?", marks: 2, answer: "Cow", options: ["Cow", "Lion", "Eagle", "Snake"] },
      { text: "What do plants need to grow?", marks: 3, answer: "Water, sunlight and soil", options: ["Water, sunlight and soil", "Only stones", "Only darkness", "Only sand"] },
      { text: "What is a vegetable garden for?", marks: 2, answer: "Growing vegetables for food", options: ["Growing vegetables for food", "Keeping cars", "Building houses", "Swimming"] },
      { text: "Which animal gives us eggs?", marks: 2, answer: "Chicken", options: ["Chicken", "Cow", "Goat", "Pig"] },
      { text: "What tool do we use to dig the ground?", marks: 2, answer: "Hoe", options: ["Hoe", "Pencil", "Plate", "Ball"] },
      { text: "Which of these is a fruit?", marks: 2, answer: "Mango", options: ["Mango", "Maize", "Beans", "Groundnuts"] },
      { text: "What do we call a person who grows crops?", marks: 2, answer: "A farmer", options: ["A farmer", "A doctor", "A teacher", "A pilot"] },
      { text: "Which of these is a cereal crop?", marks: 2, answer: "Maize", options: ["Maize", "Onion", "Tomato", "Pumpkin"] },
      { text: "What do goats give us?", marks: 2, answer: "Milk and meat", options: ["Milk and meat", "Eggs", "Wool", "Honey"] },
      { text: "What is soil?", marks: 2, answer: "The top layer of the earth where plants grow", options: ["The top layer of the earth where plants grow", "A type of water", "A kind of seed", "A farm animal"] },
      { text: "Which of these is a farm animal?", marks: 2, answer: "Pig", options: ["Pig", "Lion", "Fish in the sea", "Bird in the sky"] },
      { text: "What do we use to water plants?", marks: 2, answer: "A watering can", options: ["A watering can", "A television", "A broom", "A spoon"] },
    ],
    "7": [
      { text: "Which of these is a farm tool?", marks: 2, answer: "Hoe", options: ["Hoe", "Pencil", "Plate", "Ball"] },
      { text: "Why do farmers rear chickens?", marks: 3, answer: "For eggs and meat", options: ["For eggs and meat", "For milk", "For wool", "For transport"] },
      { text: "What is the best soil for growing most crops?", marks: 3, answer: "Loam soil", options: ["Loam soil", "Clay soil", "Sandy soil", "Stony soil"] },
      { text: "What is crop rotation?", marks: 3, answer: "Growing different crops in the same field in different seasons", options: ["Growing different crops in the same field in different seasons", "Planting only maize every year", "Burning crops", "Watering crops at night"] },
      { text: "Why do farmers add manure to the soil?", marks: 3, answer: "To make it fertile for plants", options: ["To make it fertile for plants", "To make it heavy", "To remove water", "To attract animals"] },
      { text: "What do we call the process of putting seeds in the ground?", marks: 2, answer: "Sowing", options: ["Sowing", "Harvesting", "Threshing", "Weeding"] },
      { text: "Which of these is a legume crop?", marks: 3, answer: "Groundnuts", options: ["Groundnuts", "Maize", "Rice", "Sugar cane"] },
      { text: "What do we call the animals kept on a farm?", marks: 2, answer: "Livestock", options: ["Livestock", "Crops", "Tools", "Seeds"] },
      { text: "Why is weeding important?", marks: 3, answer: "Weeds compete with crops for water and nutrients", options: ["Weeds compete with crops for water and nutrients", "Weeds make crops grow faster", "Weeds are eaten by cows", "Weeds keep soil dry"] },
      { text: "What is the process of cutting mature crops called?", marks: 2, answer: "Harvesting", options: ["Harvesting", "Sowing", "Irrigating", "Ploughing"] },
      { text: "Which disease affects maize plants?", marks: 3, answer: "Maize streak virus", options: ["Maize streak virus", "Malaria", "Cough", "Cholera"] },
      { text: "What do we call water that is taken to crops by channels?", marks: 3, answer: "Irrigation", options: ["Irrigation", "Drainage", "Flooding", "Evaporation"] },
    ],
    "12": [
      { text: "Explain the importance of agriculture in the Zambian economy.", marks: 4, answer: "Provides food, raw materials, employment, export earnings, contributes to GDP, livelihood for majority." },
      { text: "Describe the process of soil formation.", marks: 4, answer: "Weathering of parent rock, addition of organic matter, leaching, mixing by organisms, horizon formation over thousands of years." },
      { text: "What are the methods of crop propagation? Give examples.", marks: 4, answer: "Sexual (seeds: maize, beans) and asexual (cuttings: cassava, grafting: citrus, bulbs: onions)." },
    ],
  },
  "Integrated Science": {
    "6": [
      { text: "What do we use our eyes for?", marks: 2, answer: "Seeing", options: ["Seeing", "Hearing", "Smelling", "Tasting"] },
      { text: "Which part of the plant takes in water?", marks: 2, answer: "Roots", options: ["Roots", "Leaves", "Flowers", "Fruits"] },
      { text: "What is the gas we breathe out?", marks: 2, answer: "Carbon dioxide", options: ["Carbon dioxide", "Oxygen", "Hydrogen", "Nitrogen"] },
      { text: "Which part of the body pumps blood?", marks: 2, answer: "The heart", options: ["The heart", "The brain", "The stomach", "The lungs"] },
      { text: "What do plants need to make food?", marks: 3, answer: "Sunlight, water and carbon dioxide", options: ["Sunlight, water and carbon dioxide", "Only stones", "Only darkness", "Only sand"] },
      { text: "How many legs does an insect have?", marks: 2, answer: "Six", options: ["Six", "Eight", "Four", "Ten"] },
      { text: "Which of these is a living thing?", marks: 2, answer: "A tree", options: ["A tree", "A stone", "Water", "Sand"] },
      { text: "What do we use our ears for?", marks: 2, answer: "Hearing", options: ["Hearing", "Seeing", "Tasting", "Smelling"] },
      { text: "What is water?", marks: 2, answer: "A liquid we drink and use to clean", options: ["A liquid we drink and use to clean", "A type of stone", "A gas only", "A kind of plant"] },
      { text: "Which gas do plants give off during the day?", marks: 2, answer: "Oxygen", options: ["Oxygen", "Carbon dioxide only", "Nitrogen", "Smoke"] },
      { text: "What do we use our nose for?", marks: 2, answer: "Smelling", options: ["Smelling", "Hearing", "Seeing", "Tasting"] },
      { text: "Which of these can we see in the sky at night?", marks: 2, answer: "The moon and stars", options: ["The moon and stars", "Fish", "Trees", "Rivers"] },
    ],
    "7": [
      { text: "Which of these floats on water?", marks: 3, answer: "Wood", options: ["Wood", "Iron nail", "Stone", "Coin"] },
      { text: "What happens when ice is heated?", marks: 3, answer: "It melts into water", options: ["It melts into water", "It becomes gas", "It turns to stone", "It disappears"] },
      { text: "Name one renewable source of energy.", marks: 3, answer: "Solar energy", options: ["Solar energy", "Coal", "Petrol", "Diesel"] },
      { text: "What is the process of a caterpillar turning into a butterfly called?", marks: 3, answer: "Metamorphosis", options: ["Metamorphosis", "Photosynthesis", "Evaporation", "Germination"] },
      { text: "What is the process of plants making food called?", marks: 3, answer: "Photosynthesis", options: ["Photosynthesis", "Respiration", "Digestion", "Evaporation"] },
      { text: "Which of these is a good conductor of electricity?", marks: 3, answer: "Copper", options: ["Copper", "Rubber", "Wood", "Plastic"] },
      { text: "What is the force that pulls objects to the ground?", marks: 3, answer: "Gravity", options: ["Gravity", "Friction", "Magnetism", "Wind"] },
      { text: "What is the water cycle?", marks: 3, answer: "The continuous movement of water between the sky and the ground", options: ["The continuous movement of water between the sky and the ground", "A type of plant", "A kind of fish", "The flow of a river only"] },
      { text: "Which of these is a non-renewable source of energy?", marks: 3, answer: "Coal", options: ["Coal", "Solar", "Wind", "Hydro"] },
      { text: "What happens to water when it is cooled to 0°C?", marks: 3, answer: "It freezes into ice", options: ["It freezes into ice", "It boils", "It turns to steam", "It evaporates"] },
      { text: "What do we call the change of water into vapour?", marks: 3, answer: "Evaporation", options: ["Evaporation", "Condensation", "Freezing", "Melting"] },
      { text: "Which organ do we use to breathe?", marks: 2, answer: "The lungs", options: ["The lungs", "The heart", "The stomach", "The eyes"] },
    ],
    "9": [
      { text: "Name the main sources of water in Zambia.", marks: 3, answer: "Rivers (Zambezi, Kafue), lakes (Tanganyika, Bangweulu), groundwater, rainfall." },
      { text: "What is the water cycle? Explain the main processes involved.", marks: 4, answer: "Continuous movement of water. Processes: evaporation (water to vapor), condensation (vapor to clouds), precipitation (rain), collection (rivers/lakes)." },
      { text: "List three ways of conserving water at home.", marks: 3, answer: "Fix leaking taps, turn off tap while brushing, collect rainwater, use water-saving devices." },
    ],
  },
  "Creative and Technology Studies": {
    "6": [
      { text: "What are the three primary colours?", marks: 3, answer: "Red, blue and yellow", options: ["Red, blue and yellow", "Green, orange and purple", "Black and white", "Pink and brown"] },
      { text: "What do we use a ruler for?", marks: 2, answer: "Measuring length", options: ["Measuring length", "Cutting paper", "Painting", "Carving wood"] },
      { text: "Which material is best for making a raincoat?", marks: 2, answer: "Plastic", options: ["Plastic", "Paper", "Cotton cloth", "Wood"] },
      { text: "Which of these is used for drawing?", marks: 2, answer: "Pencil", options: ["Pencil", "Hammer", "Saw", "Spade"] },
      { text: "What colour do we get when we mix red and white?", marks: 3, answer: "Pink", options: ["Pink", "Black", "Green", "Orange"] },
      { text: "Which tool is used for cutting paper?", marks: 2, answer: "Scissors", options: ["Scissors", "Hammer", "Ruler", "Brush"] },
      { text: "What do we use clay for?", marks: 3, answer: "Making pots and models", options: ["Making pots and models", "Cooking food", "Building a house roof", "Writing"] },
      { text: "Which of these is a drawing tool?", marks: 2, answer: "Crayon", options: ["Crayon", "Hammer", "Screwdriver", "Spade"] },
      { text: "What is the opposite of hard?", marks: 2, answer: "Soft", options: ["Soft", "Big", "Wet", "Long"] },
      { text: "Which material is used to make a chalkboard?", marks: 3, answer: "Slate", options: ["Slate", "Paper", "Plastic", "Rubber"] },
      { text: "What do we use to measure and draw straight lines?", marks: 2, answer: "Ruler", options: ["Ruler", "Scissors", "Hammer", "Brush"] },
      { text: "Which of these can we use to join pieces of paper?", marks: 2, answer: "Glue", options: ["Glue", "Sand", "Water", "Stones"] },
    ],
    "7": [
      { text: "What is the primary colour that cannot be made by mixing other colours?", marks: 2, answer: "Red", options: ["Red", "Orange", "Green", "Purple"] },
      { text: "Which tool is used to cut wood in the workshop?", marks: 2, answer: "Saw", options: ["Hammer", "Saw", "Pliers", "File"] },
      { text: "What is the safe way to hold scissors when passing them to someone?", marks: 2, answer: "Handle first", options: ["Blades first", "Handle first", "Thrown", "Open blades"] },
      { text: "Name one way to conserve energy at home.", marks: 3, answer: "Switch off lights when not in use", options: ["Switch off lights when not in use", "Leave taps running", "Keep lights on all day", "Use more electricity"] },
      { text: "What material is commonly used to make a simple drawing pencil?", marks: 3, answer: "Graphite", options: ["Graphite", "Iron", "Plastic", "Rubber"] },
      { text: "Which tool is used to hammer nails?", marks: 2, answer: "Hammer", options: ["Hammer", "Saw", "File", "Plane"] },
      { text: "What is the secondary colour made by mixing blue and red?", marks: 3, answer: "Purple", options: ["Purple", "Green", "Orange", "Brown"] },
      { text: "Why do we use safety goggles in the workshop?", marks: 3, answer: "To protect our eyes", options: ["To protect our eyes", "To see better in the dark", "To keep dust out of hair", "To look smart"] },
      { text: "Which material is a good insulator for an oven glove?", marks: 3, answer: "Cotton", options: ["Cotton", "Copper", "Iron", "Silver"] },
      { text: "What is recycling?", marks: 3, answer: "Reusing waste materials to make new products", options: ["Reusing waste materials to make new products", "Throwing waste in the river", "Burning waste", "Burying waste"] },
      { text: "Which of these is used to make a woven mat?", marks: 3, answer: "Reeds", options: ["Reeds", "Iron", "Plastic bags only", "Wood planks"] },
      { text: "What does 'design' mean in Creative and Technology Studies?", marks: 3, answer: "Planning how to make something before you build it", options: ["Planning how to make something before you build it", "Breaking things", "Painting only", "Measuring length"] },
    ],
  },
  "English Literature": {
    "6": [
      { text: "In a story, who is the main character called?", marks: 2, answer: "The protagonist", options: ["The protagonist", "The villain", "The narrator", "The author"] },
      { text: "What is a fairy tale?", marks: 2, answer: "A story with magic and make-believe", options: ["A story with magic and make-believe", "A true news report", "A cooking recipe", "A history textbook"] },
      { text: "What do we call the person who writes a poem?", marks: 2, answer: "A poet", options: ["A poet", "A pilot", "A painter", "A plumber"] },
      { text: "What do we call the person who writes a book?", marks: 2, answer: "An author", options: ["An author", "A reader", "A teacher", "A publisher"] },
      { text: "What is a story that teaches a lesson with animals as characters?", marks: 3, answer: "A fable", options: ["A fable", "A poem", "A recipe", "A letter"] },
      { text: "What is the beginning of a story called?", marks: 2, answer: "The introduction", options: ["The introduction", "The conclusion", "The title page", "The cover"] },
      { text: "Who tells a story to the reader?", marks: 2, answer: "The narrator", options: ["The narrator", "The painter", "The builder", "The cook"] },
      { text: "What is a rhyme?", marks: 2, answer: "Words that sound the same at the end", options: ["Words that sound the same at the end", "Words that are long", "Words that are difficult", "Words with capital letters"] },
      { text: "What is a character in a story?", marks: 2, answer: "A person (or animal) in the story", options: ["A person (or animal) in the story", "The writer", "The reader", "The page number"] },
      { text: "Which of these is an example of a folk tale?", marks: 3, answer: "The Hare and the Tortoise", options: ["The Hare and the Tortoise", "A maths problem", "A news report", "A recipe book"] },
      { text: "What do we call a short funny story?", marks: 3, answer: "A joke", options: ["A joke", "A novel", "An essay", "A poem"] },
      { text: "What is the title of a book?", marks: 2, answer: "The name of the book", options: ["The name of the book", "The writer", "The last page", "The price"] },
    ],
    "7": [
      { text: "What is a fable?", marks: 3, answer: "A short story with animals that teaches a moral lesson", options: ["A short story with animals that teaches a moral lesson", "A long novel", "A science experiment", "A newspaper"] },
      { text: "What is the 'moral' of a story?", marks: 3, answer: "The lesson the story teaches", options: ["The lesson the story teaches", "The name of the author", "The number of pages", "The setting"] },
      { text: "What is a proverb?", marks: 3, answer: "A wise saying that gives advice", options: ["A wise saying that gives advice", "A type of dance", "A cooking method", "A school subject"] },
      { text: "What does 'setting' mean in a story?", marks: 3, answer: "Where and when the story takes place", options: ["Where and when the story takes place", "The main character", "The ending", "The title"] },
      { text: "What is a simile?", marks: 3, answer: "A comparison using 'like' or 'as'", options: ["A comparison using 'like' or 'as'", "A comparison without 'like'", "A type of poem", "A long speech"] },
      { text: "What is a metaphor?", marks: 3, answer: "A comparison that says something IS something else", options: ["A comparison that says something IS something else", "A comparison using 'like'", "A type of dance", "A dialogue"] },
      { text: "What is a plot?", marks: 3, answer: "The sequence of events in a story", options: ["The sequence of events in a story", "The main character", "The cover of the book", "The writer's name"] },
      { text: "What is a stanza in a poem?", marks: 3, answer: "A group of lines in a poem", options: ["A group of lines in a poem", "A single word", "The title", "The poet"] },
      { text: "What is dialogue in a story?", marks: 3, answer: "Words spoken by characters", options: ["Words spoken by characters", "The description of a place", "The moral", "The cover"] },
      { text: "What does 'theme' mean in literature?", marks: 3, answer: "The main idea or message of a story", options: ["The main idea or message of a story", "The number of pages", "The setting only", "The author's age"] },
      { text: "Which of these is an example of personification?", marks: 3, answer: "The wind whispered", options: ["The wind whispered", "The sun is hot", "The boy ran fast", "Water is wet"] },
      { text: "What is the climax of a story?", marks: 3, answer: "The most exciting part of the story", options: ["The most exciting part of the story", "The ending", "The title", "The first sentence"] },
    ],
    "12": [
      { text: "Write an essay on the theme of love in Shakespeare's 'Romeo and Juliet'.", marks: 15, answer: "Essay discussing romantic love, family love, friendship, and how love leads to both joy and tragedy." },
      { text: "Analyze the character of Okonkwo in Chinua Achebe's 'Things Fall Apart'.", marks: 10, answer: "Okonkwo is a tragic hero driven by fear of weakness, his inflexibility leads to his downfall in changing society." },
      { text: "Comment on the use of irony in any poem you have studied.", marks: 8, answer: "Analysis of situational/dramatic/verbal irony in a specific poem with textual evidence." },
    ],
  },
};

const subjects = [
  { id: "sub-01", name: "Mathematics", code: "4024", description: "ECZ Mathematics" },
  { id: "sub-02", name: "English Language", code: "1120", description: "ECZ English Language" },
  { id: "sub-03", name: "Physics", code: "5054", description: "ECZ Physics" },
  { id: "sub-04", name: "Chemistry", code: "5070", description: "ECZ Chemistry" },
  { id: "sub-05", name: "Biology", code: "5090", description: "ECZ Biology" },
  { id: "sub-06", name: "Geography", code: "2217", description: "ECZ Geography" },
  { id: "sub-07", name: "History", code: "2167", description: "ECZ History" },
  { id: "sub-08", name: "Civic Education", code: "2223", description: "ECZ Civic Education" },
  { id: "sub-09", name: "Religious Education", code: "2046", description: "ECZ Religious Education" },
  { id: "sub-10", name: "Computer Studies", code: "2259", description: "ECZ Computer Studies" },
  { id: "sub-11", name: "Commerce", code: "7080", description: "ECZ Commerce" },
  { id: "sub-12", name: "Additional Mathematics", code: "4030", description: "ECZ Additional Mathematics" },
  { id: "sub-13", name: "Science", code: "5124", description: "ECZ Science (Junior)" },
  { id: "sub-14", name: "Social Studies", code: "8330", description: "ECZ Social Studies" },
  { id: "sub-15", name: "Principles of Accounts", code: "7110", description: "ECZ Principles of Accounts" },
  { id: "sub-16", name: "Agricultural Science", code: "5010", description: "ECZ Agricultural Science" },
  { id: "sub-17", name: "English Literature", code: "2010", description: "ECZ English Literature" },
  { id: "sub-18", name: "Integrated Science", code: "5120", description: "ECZ Integrated Science" },
  { id: "sub-19", name: "Creative and Technology Studies", code: "4500", description: "ECZ Creative and Technology Studies" },
];

const grades = ["6", "7"];
const years = [2020, 2021, 2022, 2023, 2024];
const examTypes = ["internal", "external"];

// Deterministic PRNG (mulberry32) so re-seeding is reproducible and
// memory-light — no heavy allocations.
function seededShuffle(arr, seedStr) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let s = h >>> 0;
  const rand = () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const papers = [];
const questions = [];
let paperCounter = 1;
let questionCounter = 1;

subjects.forEach((sub) => {
  grades.forEach((grade) => {
    const numPapers = grade === "7" ? 2 : 1;
    const relevantYears = years.filter((y) => y >= 2022);
    relevantYears.forEach((year) => {
      for (let p = 1; p <= numPapers; p++) {
        const realQuestions = REAL_QUESTIONS[sub.name]?.[grade];
        const hasReal = realQuestions && realQuestions.length > 0;
        // Skip papers that would have no real questions (no placeholder content)
        if (!hasReal) { paperCounter++; continue; }
        const paperId = `paper-${String(paperCounter).padStart(3, "0")}`;
        paperCounter++;
        const examType = "external";
        const titlePrefix = grade === "7" ? `G7 ECZ ${sub.name}` : `G${grade} ECZ ${sub.name}`;
        papers.push({
          id: paperId,
          subjectId: sub.id,
          title: `${titlePrefix} ${year}${p > 1 ? ` P${p}` : ""}`,
          year,
          grade,
          examType,
          description: `ECZ Grade ${grade} ${sub.name} ${year}${p > 1 ? ` Paper ${p}` : ""}`,
          createdAt: `${year}-06-01`,
        });
        const numQ = 10;
        papers[papers.length - 1].source = "real";
        // Per-paper deterministic shuffle so no two papers mirror each other.
        const pool = seededShuffle(realQuestions, `${sub.id}|${grade}|${year}|${p}`);
        // Rotate the starting point per paper+year so overlapping content is spread out.
        const offset = (((p - 1) * 7) + (year * 13)) % pool.length;
        for (let q = 1; q <= numQ; q++) {
          // cycle through the shuffled pool so no placeholder text is used,
          // but each paper gets a unique ordering
          const real = pool[(offset + q - 1) % pool.length];
          const questionType = real?.options ? "mcq" : "open";
          questions.push({
            id: `q-${String(questionCounter).padStart(3, "0")}`,
            paperId,
            questionNumber: q,
            text: real.text,
            marks: real.marks,
            modelAnswer: real.answer,
            type: questionType,
            options: real.options || [],
          });
          questionCounter++;
        }
      }
    });
  });
});

const defaultAdmins = [
  {
    id: "admin-trjohnx",
    name: "Tr-John-X",
    email: "shimbacc@hotmail.com",
    password: "$2a$10$AcY0s/U3dvcZgih4lt8huuUPe8btK9xYvcZQ1ojDY7pnHAVLQc/YO",
    role: "super_admin",
    subscription: "k200",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "superadmin-silungwe",
    name: "Silungwe John",
    email: "silungwejohn24@gmail.com",
    password: "$2a$10$lz5Eq7bJxnBS3sBQvsqINOcVZ2dHJYDMVhvxqaB2cMtXv8vqy3Dce",
    role: "super_admin",
    subscription: "k200",
    createdAt: "2026-08-02T12:35:00.000Z",
  },
];

function seed() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, "subjects.json"), JSON.stringify(subjects, null, 2));
  fs.writeFileSync(path.join(DATA_DIR, "papers.json"), JSON.stringify(papers, null, 2));
  fs.writeFileSync(path.join(DATA_DIR, "questions.json"), JSON.stringify(questions, null, 2));
  fs.writeFileSync(path.join(DATA_DIR, "users.json"), JSON.stringify(defaultAdmins, null, 2));
  fs.writeFileSync(path.join(DATA_DIR, "answers.json"), JSON.stringify([], null, 2));
  console.log(`Seeded: ${subjects.length} subjects, ${papers.length} papers, ${questions.length} questions`);
  console.log(`Default admins: Tr-John-X (shimbacc@hotmail.com), Silungwe John (silungwejohn24@gmail.com)`);
}

seed();
