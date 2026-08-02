import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const DATA_DIR = path.join(process.cwd(), "data");

const REAL_QUESTIONS = {
  "Mathematics": {
    "7": [
      { text: "Solve: 45 + 27 = ?", marks: 2, answer: "72", options: ["62", "70", "72", "82"] },
      { text: "A farmer has 36 eggs and sells 18. How many eggs are left?", marks: 3, answer: "18 eggs", options: ["12", "18", "20", "24"] },
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
  "Physics": {
    "12": [
      { text: "State Newton's three laws of motion and give an example of each.", marks: 6, answer: "1st: Inertia - a book stays on a table until moved. 2nd: F=ma - pushing a cart. 3rd: Action-reaction - rocket propulsion." },
      { text: "A stone is dropped from a height of 80 m. Calculate: (a) the time taken to reach the ground (b) the velocity just before impact. (g = 10 m/s²)", marks: 5, answer: "(a) t = √(2h/g) = √(160/10) = 4 s (b) v = gt = 40 m/s" },
      { text: "Explain the difference between a.c. and d.c. current. Give one source of each.", marks: 4, answer: "DC flows in one direction (battery), AC changes direction periodically (generator/household supply)." },
      { text: "A transformer has 200 turns in the primary coil and 50 turns in the secondary coil. If the input voltage is 240 V, calculate the output voltage.", marks: 3, answer: "Vs/Vp = Ns/Np, Vs = 240 × 50/200 = 60 V" },
      { text: "Define specific heat capacity and calculate the energy needed to heat 2 kg of water from 20°C to 100°C. (Specific heat capacity of water = 4200 J/kg°C)", marks: 5, answer: "Q = mcΔT = 2 × 4200 × 80 = 672,000 J" },
    ],
    "10": [
      { text: "Define the term 'force' and give its SI unit.", marks: 2, answer: "Force is a push or pull that can change the state of motion of an object. SI unit: Newton (N)" },
      { text: "A girl pushes a trolley with a force of 40 N over a distance of 5 m. Calculate the work done.", marks: 3, answer: "Work = Force × Distance = 40 × 5 = 200 J" },
    ],
    "9": [
      { text: "What is the difference between mass and weight?", marks: 3, answer: "Mass is the amount of matter (kg), weight is the force of gravity on the mass (N)." },
      { text: "A bulb is marked 60 W, 240 V. What does this mean?", marks: 2, answer: "The bulb uses 60 joules of electrical energy per second at 240 volts." },
    ],
  },
  "Chemistry": {
    "12": [
      { text: "Balance the following chemical equations: (a) Fe + O₂ → Fe₂O₃ (b) Mg + HCl → MgCl₂ + H₂", marks: 4, answer: "(a) 4Fe + 3O₂ → 2Fe₂O₃ (b) Mg + 2HCl → MgCl₂ + H₂" },
      { text: "Define an isotope. Give two examples of isotopes of carbon.", marks: 3, answer: "Isotopes are atoms of the same element with same number of protons but different number of neutrons. ¹²C and ¹⁴C." },
      { text: "Calculate the relative molecular mass of calcium carbonate (CaCO₃). (Ca=40, C=12, O=16)", marks: 3, answer: "RMM = 40 + 12 + 48 = 100" },
      { text: "What is the pH of a neutral solution? State the pH range for acids and alkalis.", marks: 3, answer: "pH 7 = neutral, acids 0-6, alkalis 8-14" },
      { text: "Describe how you would prepare a pure sample of copper(II) sulfate crystals from copper(II) oxide and sulfuric acid.", marks: 5, answer: "Add CuO to warm H₂SO₄ until in excess, filter, evaporate filtrate until saturated, cool to crystallize, filter and dry crystals." },
    ],
    "10": [
      { text: "Name three states of matter and give one property of each.", marks: 3, answer: "Solid (fixed shape), Liquid (flows, takes container shape), Gas (fills container)" },
      { text: "What is the chemical symbol for: sodium, potassium, iron, chlorine?", marks: 2, answer: "Na, K, Fe, Cl" },
    ],
    "9": [
      { text: "What is the difference between an element and a compound?", marks: 2, answer: "An element is made of one type of atom, a compound is made of two or more elements bonded together." },
      { text: "Name the process used to separate crude oil into its components.", marks: 2, answer: "Fractional distillation" },
    ],
  },
  "Biology": {
    "12": [
      { text: "Explain the process of photosynthesis, including the raw materials, conditions, and products.", marks: 5, answer: "Photosynthesis: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂. Requires sunlight, chlorophyll, CO₂ from air, H₂O from soil." },
      { text: "Draw and label a diagram of the human heart showing the four chambers and major blood vessels.", marks: 6, answer: "Diagram showing right/left atria, right/left ventricles, pulmonary artery/vein, aorta, vena cava." },
      { text: "Describe how the human digestive system breaks down proteins.", marks: 4, answer: "Proteins are broken down by pepsin in stomach (acidic), then trypsin in small intestine (alkaline), into amino acids for absorption." },
      { text: "What is the function of the following: (a) red blood cells (b) white blood cells (c) platelets", marks: 3, answer: "(a) Transport oxygen (b) Fight infection (c) Blood clotting" },
      { text: "Explain how the nervous system responds to a stimulus using a reflex arc.", marks: 5, answer: "Stimulus → receptor → sensory neuron → spinal cord → relay neuron → motor neuron → effector → response" },
    ],
    "10": [
      { text: "Name the seven characteristics of living things.", marks: 5, answer: "Movement, Respiration, Sensitivity, Growth, Reproduction, Excretion, Nutrition (MRS GREN)" },
      { text: "What is the function of the root hairs in plants?", marks: 2, answer: "To absorb water and mineral salts from the soil." },
    ],
    "9": [
      { text: "Name the parts of a microscope and state their functions.", marks: 4, answer: "Eyepiece (magnifies), objective lens (focuses), stage (holds slide), mirror (reflects light)" },
      { text: "What is the difference between a plant cell and an animal cell?", marks: 3, answer: "Plant cells have cell wall, chloroplasts, and large vacuole; animal cells do not." },
    ],
  },
  "Geography": {
    "12": [
      { text: "Define the term 'weathering' and explain the difference between physical and chemical weathering.", marks: 5, answer: "Weathering is the breakdown of rocks in situ. Physical: freeze-thaw action. Chemical: solution/carbonation." },
      { text: "Describe the formation of a meander and an ox-bow lake.", marks: 5, answer: "River erosion on outer bend (undercutting) and deposition on inner bend creates meander. When meander neck cuts through, ox-bow lake forms." },
      { text: "With reference to Zambia, explain the factors that influence the distribution of population.", marks: 6, answer: "Climate, soil fertility, mineral deposits (Copperbelt), infrastructure, employment opportunities, historical factors." },
      { text: "What is the difference between a primary, secondary, and tertiary industry? Give examples of each in Zambia.", marks: 4, answer: "Primary: mining/extraction (copper mining). Secondary: manufacturing (food processing). Tertiary: services (banking, tourism)." },
      { text: "Explain the causes and effects of deforestation in the Miombo woodlands of Zambia.", marks: 5, answer: "Causes: charcoal burning, agriculture, logging. Effects: soil erosion, loss of biodiversity, climate change, desertification." },
    ],
    "10": [
      { text: "Name the layers of the earth's atmosphere in order from the ground upwards.", marks: 3, answer: "Troposphere, Stratosphere, Mesosphere, Thermosphere, Exosphere" },
      { text: "What is the difference between weather and climate?", marks: 2, answer: "Weather is day-to-day conditions, climate is average weather over 30+ years." },
    ],
    "9": [
      { text: "Name the continents of the world and their oceans.", marks: 5, answer: "Africa, Asia, Europe, North America, South America, Australia, Antarctica. Oceans: Pacific, Atlantic, Indian, Arctic, Southern" },
      { text: "What is the capital city of Zambia? Name four neighbouring countries.", marks: 3, answer: "Lusaka. DRC, Tanzania, Malawi, Mozambique, Zimbabwe, Botswana, Namibia, Angola (any 4)" },
    ],
  },
  "History": {
    "12": [
      { text: "Describe the causes and effects of the Scramble for Africa in the late 19th century.", marks: 6, answer: "Causes: Industrial Revolution, raw materials, nationalism, missionary work. Effects: colonization, loss of land, cultural disruption, new borders." },
      { text: "Explain the role of the United Nations Independence Party (UNIP) in Zambia's struggle for independence.", marks: 5, answer: "UNIP led by Kenneth Kaunda used non-violent resistance, civil disobedience, and political mobilization to achieve independence in 1964." },
      { text: "What were the main causes of World War I?", marks: 5, answer: "Militarism, Alliances (Triple Entente/Alliance), Imperialism, Nationalism, and the assassination of Archduke Franz Ferdinand." },
      { text: "Describe the effects of the Trans-Atlantic Slave Trade on Africa.", marks: 5, answer: "Population loss, economic disruption, political instability, introduction of firearms, spread of diseases, diaspora." },
      { text: "Explain the significance of the Berlin Conference of 1884-1885.", marks: 4, answer: "European powers divided Africa without African input, established colonial borders, led to colonization of entire continent." },
    ],
    "10": [
      { text: "Name three early European explorers who visited Zambia and state what they explored.", marks: 3, answer: "David Livingstone (Victoria Falls, Zambezi), Harry Johnston (Nyasa region), Cecil Rhodes (Mashonaland)" },
      { text: "What is oral tradition and why is it important in African history?", marks: 3, answer: "Oral tradition is passing history through spoken word. Important because much African history was not written down." },
    ],
    "9": [
      { text: "Define the term 'colonialism' and give one example in Africa.", marks: 2, answer: "Colonialism is when a powerful country controls a weaker territory. Example: British colonization of Zambia (Northern Rhodesia)." },
      { text: "Name the first President of Zambia and the year independence was achieved.", marks: 2, answer: "Kenneth Kaunda, 1964" },
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
      { text: "Name one source of light.", marks: 2, answer: "Sun (or bulb/candle)", options: ["The moon", "The sun", "A stone", "Water"] },
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
      { text: "Which country borders Zambia to the south?", marks: 2, answer: "Zimbabwe (or Botswana/Namibia)", options: ["Tanzania", "Zimbabwe", "Congo DRC", "Malawi"] },
      { text: "What is the capital city of Zambia?", marks: 2, answer: "Lusaka", options: ["Copperbelt", "Lusaka", "Livingstone", "Kitwe"] },
      { text: "Name the three national colours on the Zambian flag.", marks: 3, answer: "Green, orange, red (with black and eagle)", options: ["Green, blue, white", "Green, orange, red", "Red, white, blue", "Black, yellow, green"] },
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
    "12": [
      { text: "What is the difference between a debit and a credit in double-entry bookkeeping?", marks: 3, answer: "Debit: left side (assets/expenses increase). Credit: right side (liabilities/income increase). Every transaction has equal debits and credits." },
      { text: "Prepare a trial balance from the following balances: Capital K10,000, Sales K5,000, Purchases K3,000, Rent K500, Cash K2,000, Creditors K1,500, Debtors K1,000.", marks: 5, answer: "Total debits = K6,500, Total credits = K16,500. Needs balancing/correction." },
      { text: "Explain the purpose of a profit and loss account and a balance sheet.", marks: 4, answer: "P&L shows profit/loss over a period. Balance sheet shows assets, liabilities, and capital at a specific date." },
    ],
  },
  "Commerce": {
    "12": [
      { text: "Define 'commerce' and explain its role in economic development.", marks: 4, answer: "Commerce is the exchange of goods and services. It facilitates trade, creates employment, generates revenue, connects producers to consumers." },
      { text: "Describe the functions of a commercial bank in Zambia.", marks: 5, answer: "Accepting deposits, granting loans, facilitating payments, issuing cheques, foreign exchange, safe custody, money transfer." },
      { text: "What is insurance? Explain the principles of insurance.", marks: 5, answer: "Insurance protects against financial loss. Principles: utmost good faith, insurable interest, indemnity, contribution, subrogation, proximate cause." },
    ],
  },
  "Agricultural Science": {
    "12": [
      { text: "Explain the importance of agriculture in the Zambian economy.", marks: 4, answer: "Provides food, raw materials, employment, export earnings, contributes to GDP, livelihood for majority." },
      { text: "Describe the process of soil formation.", marks: 4, answer: "Weathering of parent rock, addition of organic matter, leaching, mixing by organisms, horizon formation over thousands of years." },
      { text: "What are the methods of crop propagation? Give examples.", marks: 4, answer: "Sexual (seeds: maize, beans) and asexual (cuttings: cassava, grafting: citrus, bulbs: onions)." },
    ],
  },
  "Integrated Science": {
    "9": [
      { text: "Name the main sources of water in Zambia.", marks: 3, answer: "Rivers (Zambezi, Kafue), lakes (Tanganyika, Bangweulu), groundwater, rainfall." },
      { text: "What is the water cycle? Explain the main processes involved.", marks: 4, answer: "Continuous movement of water. Processes: evaporation (water to vapor), condensation (vapor to clouds), precipitation (rain), collection (rivers/lakes)." },
      { text: "List three ways of conserving water at home.", marks: 3, answer: "Fix leaking taps, turn off tap while brushing, collect rainwater, use water-saving devices." },
    ],
  },
  "Creative and Technology Studies": {
    "7": [
      { text: "What is the primary colour that cannot be made by mixing other colours?", marks: 2, answer: "Red (or blue/yellow)", options: ["Red", "Orange", "Green", "Purple"] },
      { text: "Which tool is used to cut wood in the workshop?", marks: 2, answer: "Saw", options: ["Hammer", "Saw", "Pliers", "File"] },
      { text: "What is the safe way to hold scissors when passing them to someone?", marks: 2, answer: "Handle first, blades pointing towards yourself", options: ["Blades first", "Handle first", "Thrown", "Open blades"] },
      { text: "Name one way to conserve energy at home.", marks: 3, answer: "Switch off lights when not in use", options: ["Switch off lights when not in use", "Leave taps running", "Keep lights on all day", "Use more electricity"] },
      { text: "What material is commonly used to make a simple drawing pencil?", marks: 3, answer: "Graphite (and wood)", options: ["Graphite", "Iron", "Plastic", "Rubber"] },
    ],
  },
  "English Literature": {
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
        const numQ = grade === "7" ? 5 : 3;
        const realQuestions = REAL_QUESTIONS[sub.name]?.[grade];
        for (let q = 1; q <= numQ; q++) {
          const idx = (p - 1) * numQ + (q - 1);
          const real = realQuestions?.[idx];
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

const defaultAdmin = {
  id: "admin-trjohnx",
  name: "Tr-John-X",
  email: "shimbacc@hotmail.com",
  password: "$2a$10$7UJW0rO.tUvLiKZXgWI2p.iXnUNWwWdVGvz4.CYx/.2mjsOkukLxW",
  role: "super_admin",
  createdAt: "2024-01-01T00:00:00.000Z",
};

function seed() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, "subjects.json"), JSON.stringify(subjects, null, 2));
  fs.writeFileSync(path.join(DATA_DIR, "papers.json"), JSON.stringify(papers, null, 2));
  fs.writeFileSync(path.join(DATA_DIR, "questions.json"), JSON.stringify(questions, null, 2));
  fs.writeFileSync(path.join(DATA_DIR, "users.json"), JSON.stringify([defaultAdmin], null, 2));
  fs.writeFileSync(path.join(DATA_DIR, "answers.json"), JSON.stringify([], null, 2));
  console.log(`Seeded: ${subjects.length} subjects, ${papers.length} papers, ${questions.length} questions`);
  console.log(`Default admin: Tr-John-X (shimbacc@hotmail.com / REDACTED)`);
}

seed();
