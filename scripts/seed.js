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
    ],
    "6": [
      { text: "What is 15 + 8?", marks: 2, answer: "23" },
      { text: "How many sides does a triangle have?", marks: 2, answer: "3" },
      { text: "What is 5 × 6?", marks: 2, answer: "30" },
      { text: "Which is bigger: 1/2 or 1/4?", marks: 2, answer: "1/2" },
      { text: "Count in twos: 2, 4, 6, ___, 10", marks: 2, answer: "8" },
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
    ],
    "7": [
      { text: "What is sound produced by?", marks: 3, answer: "Vibrations", options: ["Vibrations", "Light", "Water", "Air only"] },
      { text: "Which of these is a good conductor of electricity?", marks: 3, answer: "Copper wire", options: ["Copper wire", "Rubber", "Wood", "Plastic"] },
      { text: "What is a magnet used for?", marks: 3, answer: "Attracting iron and steel", options: ["Attracting iron and steel", "Cutting wood", "Measuring distance", "Boiling water"] },
      { text: "What is energy?", marks: 3, answer: "The ability to do work", options: ["The ability to do work", "A type of food", "A measure of weight", "A kind of sound"] },
    ],
  },
  "Chemistry": {
    "6": [
      { text: "Which of these is a liquid at room temperature?", marks: 2, answer: "Water", options: ["Water", "Ice", "Steam", "Stone"] },
      { text: "What happens when you mix salt and water?", marks: 2, answer: "The salt dissolves", options: ["The salt dissolves", "The water turns to ice", "The salt sinks forever", "Nothing happens"] },
      { text: "Which of these is a solid?", marks: 2, answer: "Wood", options: ["Wood", "Milk", "Air", "Rain"] },
    ],
    "7": [
      { text: "What is the chemical symbol for water?", marks: 3, answer: "H2O", options: ["H2O", "CO2", "O2", "NaCl"] },
      { text: "Which gas do plants use to make food?", marks: 3, answer: "Carbon dioxide", options: ["Carbon dioxide", "Oxygen", "Nitrogen", "Hydrogen"] },
      { text: "What happens when iron is left in water and air?", marks: 3, answer: "It rusts", options: ["It rusts", "It turns to gold", "It melts", "It disappears"] },
      { text: "What is the name for water in the form of gas?", marks: 3, answer: "Water vapour", options: ["Water vapour", "Ice", "Liquid water", "Rust"] },
    ],
  },
  "Biology": {
    "6": [
      { text: "Which animal lives in water and breathes with gills?", marks: 2, answer: "Fish", options: ["Fish", "Bird", "Dog", "Cow"] },
      { text: "What do plants need to make their own food?", marks: 3, answer: "Sunlight and water", options: ["Sunlight and water", "Only soil", "Only air", "Only darkness"] },
      { text: "Which part of the body pumps blood?", marks: 2, answer: "Heart", options: ["Heart", "Lungs", "Stomach", "Brain"] },
    ],
    "7": [
      { text: "What do we call animals that eat only plants?", marks: 3, answer: "Herbivores", options: ["Herbivores", "Carnivores", "Omnivores", "Predators"] },
      { text: "Which organ do we use to breathe?", marks: 3, answer: "Lungs", options: ["Lungs", "Heart", "Kidneys", "Stomach"] },
      { text: "What is the process by which plants make food called?", marks: 3, answer: "Photosynthesis", options: ["Photosynthesis", "Respiration", "Digestion", "Germination"] },
      { text: "What do we call a baby frog?", marks: 3, answer: "Tadpole", options: ["Tadpole", "Pup", "Cub", "Calf"] },
    ],
  },
  "Geography": {
    "6": [
      { text: "Which is the largest ocean?", marks: 2, answer: "Pacific Ocean", options: ["Pacific Ocean", "Atlantic Ocean", "Indian Ocean", "Arctic Ocean"] },
      { text: "What is the capital city of Zambia?", marks: 2, answer: "Lusaka", options: ["Lusaka", "Ndola", "Kitwe", "Livingstone"] },
      { text: "Which river flows through the Victoria Falls?", marks: 3, answer: "Zambezi River", options: ["Zambezi River", "Kafue River", "Luangwa River", "Congo River"] },
    ],
    "7": [
      { text: "What is a map used for?", marks: 3, answer: "Finding places and directions", options: ["Finding places and directions", "Cooking food", "Building houses", "Measuring weight"] },
      { text: "Which of these is a lake in Zambia?", marks: 3, answer: "Lake Bangweulu", options: ["Lake Bangweulu", "Lake Malawi only", "Lake Victoria", "Lake Tanganyika in Tanzania only"] },
      { text: "What direction does the sun rise in?", marks: 3, answer: "East", options: ["East", "West", "North", "South"] },
      { text: "What is the weather?", marks: 3, answer: "The condition of the atmosphere at a place and time", options: ["The condition of the atmosphere at a place and time", "The number of rivers", "The height of mountains", "The size of a country"] },
    ],
  },
  "History": {
    "6": [
      { text: "Who was the first President of Zambia?", marks: 2, answer: "Kenneth Kaunda", options: ["Kenneth Kaunda", "Levy Mwanawasa", "Michael Sata", "Rupiah Banda"] },
      { text: "In which year did Zambia get independence?", marks: 2, answer: "1964", options: ["1964", "1960", "1970", "1954"] },
      { text: "Who discovered the Victoria Falls for the Western world?", marks: 3, answer: "David Livingstone", options: ["David Livingstone", "Cecil Rhodes", "Harry Johnston", "Mungo Park"] },
    ],
    "7": [
      { text: "What was Zambia called before independence?", marks: 3, answer: "Northern Rhodesia", options: ["Northern Rhodesia", "Southern Rhodesia", "Nyasaland", "Tanganyika"] },
      { text: "Why do we celebrate Independence Day on 24th October?", marks: 3, answer: "Zambia became independent on that day in 1964", options: ["Zambia became independent on that day in 1964", "It is harvest time", "It is the rainy season", "It is the President's birthday"] },
      { text: "What is the national flag colour that stands for Zambia's land?", marks: 3, answer: "Green", options: ["Green", "Red", "Orange", "Black"] },
      { text: "What is oral history?", marks: 3, answer: "History passed down by word of mouth", options: ["History passed down by word of mouth", "History written in books only", "A type of music", "A kind of food"] },
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
  "Religious Education": {
    "6": [
      { text: "What is the holy book of Christians called?", marks: 2, answer: "The Bible", options: ["The Bible", "The Quran", "The Torah", "The Vedas"] },
      { text: "Who is the founder of Islam?", marks: 2, answer: "Prophet Muhammad", options: ["Prophet Muhammad", "Jesus", "Moses", "Abraham"] },
      { text: "What is a place of worship for Muslims called?", marks: 2, answer: "Mosque", options: ["Mosque", "Church", "Temple", "Synagogue"] },
    ],
    "7": [
      { text: "What is prayer?", marks: 3, answer: "Talking to God", options: ["Talking to God", "Singing songs", "Cooking food", "Playing football"] },
      { text: "Name the three major world religions.", marks: 3, answer: "Christianity, Islam and Hinduism", options: ["Christianity, Islam and Hinduism", "Only Christianity", "Only Islam", "Only traditional beliefs"] },
      { text: "What do Christians celebrate at Easter?", marks: 3, answer: "The resurrection of Jesus", options: ["The resurrection of Jesus", "The birth of Jesus", "The end of fasting", "Harvest"] },
      { text: "Why is the Bible important to Christians?", marks: 3, answer: "It teaches them about God and how to live", options: ["It teaches them about God and how to live", "It is a maths book", "It is a story for fun", "It is a history of animals"] },
    ],
  },
  "English Language": {
    "7": [
      { text: "Fill in the blank: The boy ___ to school every day.", marks: 2, answer: "goes", options: ["go", "goes", "going", "gone"] },
      { text: "Write the plural form of: child", marks: 2, answer: "children", options: ["childs", "childes", "children", "childrens"] },
      { text: "Give the opposite of: big", marks: 2, answer: "small", options: ["large", "small", "huge", "giant"] },
      { text: "Complete: I ___ my homework last night.", marks: 2, answer: "did", options: ["do", "did", "does", "doing"] },
      { text: "What is the capital city of Zambia?", marks: 3, answer: "Lusaka", options: ["Ndola", "Kitwe", "Lusaka", "Livingstone"] },
    ],
    "6": [
      { text: "Choose the correct word: She ___ a teacher. (is/are)", marks: 2, answer: "is" },
      { text: "What is the first letter of the alphabet?", marks: 2, answer: "A" },
      { text: "Complete the sentence: The cat is ___ the table. (on/at)", marks: 2, answer: "on" },
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
      { text: "Name the three major world religions.", marks: 3, answer: "Christianity, Islam, Hinduism" },
      { text: "What is the holy book of Christians called?", marks: 2, answer: "The Bible" },
      { text: "Name the place where Jesus was born.", marks: 2, answer: "Bethlehem" },
    ],
    "6": [
      { text: "Who is the founder of Christianity?", marks: 2, answer: "Jesus Christ" },
      { text: "What is the holy book of Muslims called?", marks: 2, answer: "The Quran" },
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
    ],
    "6": [
      { text: "Name the process by which plants make their own food.", marks: 2, answer: "Photosynthesis" },
      { text: "How many legs does an insect have?", marks: 2, answer: "6" },
      { text: "Name the gas we breathe in.", marks: 2, answer: "Oxygen" },
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
    ],
    "6": [
      { text: "What is the name of Zambia's currency?", marks: 2, answer: "Kwacha" },
      { text: "Name one traditional ceremony in Zambia.", marks: 2, answer: "Kuomboka (or Ncwala, Kulamba)" },
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
    ],
    "7": [
      { text: "What is a budget?", marks: 3, answer: "A plan for how to spend and save money", options: ["A plan for how to spend and save money", "A type of food", "A school subject", "A kind of car"] },
      { text: "If you earn K50 and spend K30, how much do you save?", marks: 3, answer: "K20", options: ["K80", "K20", "K30", "K50"] },
      { text: "Why do people keep money in a bank?", marks: 3, answer: "To keep it safe and earn interest", options: ["To keep it safe and earn interest", "To lose it", "To burn it", "To bury it in the ground"] },
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
    ],
    "7": [
      { text: "What is trade?", marks: 3, answer: "The buying and selling of goods and services", options: ["The buying and selling of goods and services", "Cooking food", "Playing football", "Planting trees"] },
      { text: "Which of these is a market?", marks: 3, answer: "Soweto Market", options: ["Soweto Market", "A school", "A hospital", "A police station"] },
      { text: "What do we call the money a shopkeeper makes after selling?", marks: 3, answer: "Profit", options: ["Profit", "Loss", "Tax", "Debt"] },
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
    ],
    "7": [
      { text: "Which of these is a farm tool?", marks: 2, answer: "Hoe", options: ["Hoe", "Pencil", "Plate", "Ball"] },
      { text: "Why do farmers rear chickens?", marks: 3, answer: "For eggs and meat", options: ["For eggs and meat", "For milk", "For wool", "For transport"] },
      { text: "What is the best soil for growing most crops?", marks: 3, answer: "Loam soil", options: ["Loam soil", "Clay soil", "Sandy soil", "Stony soil"] },
      { text: "What is crop rotation?", marks: 3, answer: "Growing different crops in the same field in different seasons", options: ["Growing different crops in the same field in different seasons", "Planting only maize every year", "Burning crops", "Watering crops at night"] },
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
    ],
    "7": [
      { text: "Which of these floats on water?", marks: 3, answer: "Wood", options: ["Wood", "Iron nail", "Stone", "Coin"] },
      { text: "What happens when ice is heated?", marks: 3, answer: "It melts into water", options: ["It melts into water", "It becomes gas", "It turns to stone", "It disappears"] },
      { text: "Name one renewable source of energy.", marks: 3, answer: "Solar energy", options: ["Solar energy", "Coal", "Petrol", "Diesel"] },
      { text: "What is the process of a caterpillar turning into a butterfly called?", marks: 3, answer: "Metamorphosis", options: ["Metamorphosis", "Photosynthesis", "Evaporation", "Germination"] },
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
    ],
    "7": [
      { text: "What is the primary colour that cannot be made by mixing other colours?", marks: 2, answer: "Red", options: ["Red", "Orange", "Green", "Purple"] },
      { text: "Which tool is used to cut wood in the workshop?", marks: 2, answer: "Saw", options: ["Hammer", "Saw", "Pliers", "File"] },
      { text: "What is the safe way to hold scissors when passing them to someone?", marks: 2, answer: "Handle first", options: ["Blades first", "Handle first", "Thrown", "Open blades"] },
      { text: "Name one way to conserve energy at home.", marks: 3, answer: "Switch off lights when not in use", options: ["Switch off lights when not in use", "Leave taps running", "Keep lights on all day", "Use more electricity"] },
      { text: "What material is commonly used to make a simple drawing pencil?", marks: 3, answer: "Graphite", options: ["Graphite", "Iron", "Plastic", "Rubber"] },
    ],
  },
  "English Literature": {
    "6": [
      { text: "In a story, who is the main character called?", marks: 2, answer: "The protagonist", options: ["The protagonist", "The villain", "The narrator", "The author"] },
      { text: "What is a fairy tale?", marks: 2, answer: "A story with magic and make-believe", options: ["A story with magic and make-believe", "A true news report", "A cooking recipe", "A history textbook"] },
      { text: "What do we call the person who writes a poem?", marks: 2, answer: "A poet", options: ["A poet", "A pilot", "A painter", "A plumber"] },
    ],
    "7": [
      { text: "What is a fable?", marks: 3, answer: "A short story with animals that teaches a moral lesson", options: ["A short story with animals that teaches a moral lesson", "A long novel", "A science experiment", "A newspaper"] },
      { text: "What is the 'moral' of a story?", marks: 3, answer: "The lesson the story teaches", options: ["The lesson the story teaches", "The name of the author", "The number of pages", "The setting"] },
      { text: "What is a proverb?", marks: 3, answer: "A wise saying that gives advice", options: ["A wise saying that gives advice", "A type of dance", "A cooking method", "A school subject"] },
      { text: "What does 'setting' mean in a story?", marks: 3, answer: "Where and when the story takes place", options: ["Where and when the story takes place", "The main character", "The ending", "The title"] },
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
        const realQuestions = REAL_QUESTIONS[sub.name]?.[grade];
        const hasReal = realQuestions && realQuestions.length > 0;
        papers[papers.length - 1].source = hasReal ? "real" : "generated";
        for (let q = 1; q <= numQ; q++) {
          // cycle through available real questions so no placeholder text is used
          const idx = hasReal ? ((p - 1) * numQ + (q - 1)) % realQuestions.length : 0;
          const real = hasReal ? realQuestions[idx] : undefined;
          const questionType = real?.options ? "mcq" : "open";
          questions.push({
            id: `q-${String(questionCounter).padStart(3, "0")}`,
            paperId,
            questionNumber: q,
            text: real?.text || `ECZ ${sub.name} ${grade} question ${q}`,
            marks: real?.marks || (q === 1 ? 4 : q === 2 ? 3 : q === 3 ? 5 : q === 4 ? 2 : 6),
            modelAnswer: real?.answer || "",
            type: questionType,
            options: real?.options || [],
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
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "superadmin-silungwe",
    name: "Silungwe John",
    email: "silungwejohn24@gmail.com",
    password: "$2a$10$lz5Eq7bJxnBS3sBQvsqINOcVZ2dHJYDMVhvxqaB2cMtXv8vqy3Dce",
    role: "super_admin",
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
