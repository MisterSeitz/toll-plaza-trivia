import type { CategoryKey, TriviaQuestion } from '../types/game'

type Q = [CategoryKey, string, [string, string, string, string], 'A' | 'B' | 'C' | 'D', string]

const RAW: Q[] = [
  // Mzansi Beats & Screen
  ['beats_screen', 'Which Kwaito group fronted by Lebo Mathosa and Thembi Seete popularized "It\'s About Time" in 1995?', ['Trompies', 'Boom Shaka', 'Bongo Maffin', 'TKZee'], 'B', 'Boom Shaka revolutionized SA pop in the mid-1990s by blending house beats with township rhythms.'],
  ['beats_screen', 'In the SABC1 soapie Generations, which ruthless media mogul was portrayed by Menzi Ngubane?', ['Archie Moroka', 'Sibusiso Dlomo', 'Paul Mashaba', 'Karabo Moroka'], 'B', 'Menzi Ngubane played the cunning villain Sibusiso Dlomo ("Ngamla") for over a decade.'],
  ['beats_screen', 'Which 2005 South African drama directed by Gavin Hood won the Oscar for Best Foreign Language Film?', ['Tsotsi', 'Yesterday', 'Sarafina!', 'District 9'], 'A', 'Based on Athol Fugard\'s novel, Tsotsi follows a young Soweto gang leader.'],
  ['beats_screen', 'Which township dance genre of the 1990s heavily influenced Amapiano?', ['Marabi', 'Kwaito', 'Mbaqanga', 'Maskandi'], 'B', 'Kwaito emerged in Soweto in the 1990s and laid the sonic foundation for Amapiano.'],
  ['beats_screen', 'What was the name of Joe Mafela\'s iconic character in the 1980s comedy \'Sgudi \'Snaysi?', ['Bra Wallace', 'Sdumo', 'Gagashe', 'Mfundisi'], 'B', 'Sdumo was an opportunistic lodger living with his aunt Sis May.'],
  // Diski, Bokke & Oval
  ['diski_bokke', 'Who kicked the winning drop goal in extra time of the 1995 Rugby World Cup final?', ['Percy Montgomery', 'Jannie de Beer', 'Joel Stransky', 'Chester Williams'], 'C', 'Joel Stransky slotted the drop goal at Ellis Park for a 15-12 victory over the All Blacks.'],
  ['diski_bokke', 'Which South African club won the 1995 CAF Champions League?', ['Kaizer Chiefs', 'Mamelodi Sundowns', 'Orlando Pirates', 'SuperSport United'], 'C', 'Orlando Pirates beat ASEC Mimosas, with Jerry Sikhosana scoring the decisive goal.'],
  ['diski_bokke', 'In which year did Bafana Bafana win the Africa Cup of Nations on home soil?', ['1994', '1996', '1998', '2002'], 'B', 'Coached by Clive Barker, Bafana beat Tunisia 2-0 at FNB Stadium.'],
  ['diski_bokke', 'Wayde van Niekerk broke the 400m world record at Rio 2016 from which lane?', ['Lane 1', 'Lane 4', 'Lane 6', 'Lane 8'], 'D', 'Running blind in lane 8, he clocked 43.03s, breaking Michael Johnson\'s record.'],
  ['diski_bokke', 'Who was the first Black African batsman to score a Test century for the Proteas?', ['Makhaya Ntini', 'Temba Bavuma', 'Hashim Amla', 'Kagiso Rabada'], 'B', 'Temba Bavuma scored an unbeaten 102 against England at Newlands in 2016.'],
  // Braai & Chow
  ['braai_chow', 'What is the dried, seasoned meat strip cured with vinegar, coriander, pepper and salt called?', ['Droëwors', 'Biltong', 'Chakalaka', 'Skilpadjies'], 'B', 'Biltong stems from preservation techniques adapted by settlers crossing the interior.'],
  ['braai_chow', 'Which spicy vegetable relish with carrots, peppers and baked beans is a braai staple?', ['Atchar', 'Morogo', 'Chakalaka', 'Sambal'], 'C', 'Chakalaka originated in Johannesburg\'s mining townships.'],
  ['braai_chow', 'What is traditionally used to serve a Durban Bunny Chow?', ['Sliced whole-wheat bread', 'Hollowed-out white loaf', 'Toasted pita', 'Steamed dumpling'], 'B', 'The bunny chow was a portable takeaway lunch for Indian workers in Durban.'],
  ['braai_chow', 'Which Cape Malay dish is spiced mince baked with an egg custard topping and bay leaves?', ['Denningvleis', 'Bobotie', 'Tomato Bredie', 'Sosatie'], 'B', 'Bobotie is a national culinary emblem with dried fruit, turmeric and baked custard.'],
  ['braai_chow', 'What are "Skilpadjies"?', ['Skewered gizzards', 'Lamb\'s liver wrapped in caul fat', 'Smoked marrow bones', 'Spicy pork riblets'], 'B', 'Literally "little tortoises", they are liver balls wrapped in netvet and grilled over coals.'],
  // History & Icons
  ['history_icons', 'On which island was Nelson Mandela imprisoned for 18 of his 27 years in detention?', ['Dassen Island', 'Robben Island', 'Seal Island', 'Marion Island'], 'B', 'Robben Island is now a UNESCO World Heritage Site.'],
  ['history_icons', 'Who performed the first human-to-human heart transplant at Groote Schuur in 1967?', ['Dr. Max Theiler', 'Dr. Christiaan Barnard', 'Dr. Allan Cormack', 'Dr. Aaron Klug'], 'B', 'Barnard transplanted Denise Darvall\'s heart into Louis Washkansky on 3 December 1967.'],
  ['history_icons', 'Who received the Nobel Peace Prize in 1960 for non-violent struggle against apartheid?', ['Oliver Tambo', 'Chief Albert Luthuli', 'Desmond Tutu', 'Walter Sisulu'], 'B', 'Luthuli was the first African recipient of any Nobel Prize.'],
  ['history_icons', 'In what year did the Soweto Uprising take place on June 16?', ['1960', '1973', '1976', '1982'], 'C', 'Students protested compulsory Afrikaans instruction; June 16 is now Youth Day.'],
  ['history_icons', 'The 13th-century golden rhinoceros was found at which pre-colonial kingdom site?', ['Great Zimbabwe', 'Mapungubwe', 'Kaditshwene', 'Thulamela'], 'B', 'Mapungubwe traded gold and ivory with Arabia, India and China.'],
  // Slang & Lingo
  ['slang_lingo', 'If someone says they will do it "now-now", what do they mean?', ['Immediately', 'Soon, but not this second', 'Tomorrow', 'Never'], 'B', '"Now" means eventually, "now-now" means fairly soon, "just now" can mean hours.'],
  ['slang_lingo', 'What does the exclamation "Hawu!" express?', ['Joy', 'Shock or disbelief', 'Hunger', 'Farewell'], 'B', 'From isiZulu, used everywhere in SA to show surprise or dismay.'],
  ['slang_lingo', 'In township slang, what is a "Gusheshe"?', ['A BMW 325iS (E30)', 'A fast minibus taxi', 'Italian shoes', 'A loud sound system'], 'A', 'Named for the sound of its inline-6, the E30 is central to spinning culture.'],
  ['slang_lingo', 'In slang, what does "kwaai" mean?', ['Angry', 'Cheap', 'Extremely cool', 'Strange'], 'C', 'Literally "angry" in Afrikaans, but in street slang it means awesome.'],
  ['slang_lingo', 'What is a "robot" in South African English?', ['A vacuum cleaner', 'A traffic light', 'A toll boom', 'A speed camera'], 'B', 'Traffic lights have been called robots in SA since the early 20th century.'],
  // Scenic Route
  ['scenic_route', 'Which Drakensberg pass links Underberg in KZN with Mokhotlong in Lesotho?', ['Swartberg Pass', 'Sani Pass', 'Outeniqua Pass', "Chapman's Peak"], 'B', 'Sani Pass reaches 2,876m and requires 4x4 vehicles.'],
  ['scenic_route', 'Blyde River Canyon, with the Three Rondavels, is in which province?', ['Limpopo', 'Mpumalanga', 'North West', 'KwaZulu-Natal'], 'B', 'It lies on the Panorama Route and is among Earth\'s largest green canyons.'],
  ['scenic_route', 'Which national park near Gqeberha shelters hundreds of elephants?', ['Addo Elephant National Park', 'Karoo National Park', 'Golden Gate Highlands', 'Mokala'], 'A', 'Addo was founded in 1931 when only 11 elephants remained.'],
  ['scenic_route', 'What is the cloud formation over Table Mountain called?', ['The Cape Doctor', 'The Tablecloth', 'The Roaring Forties', 'Bergwind Mist'], 'B', 'Moist south-easterly winds condense over the mountain into a flat cloud layer.'],
  ['scenic_route', 'In which biome does the Namaqualand spring wildflower bloom occur?', ['Fynbos', 'Succulent Karoo', 'Grassland', 'Savanna'], 'B', 'Winter rains turn the arid Succulent Karoo into carpets of daisies.'],
]

export const TRIVIA_QUESTIONS: TriviaQuestion[] = RAW.map(([category, prompt, opts, correctAnswer, explanation], i) => ({
  id: `q-${category}-${i}`,
  category,
  prompt,
  options: opts.map((label, idx) => ({ key: (['A', 'B', 'C', 'D'] as const)[idx], label })),
  correctAnswer,
  explanation,
}))

export function pickQuestion(category: CategoryKey, usedIds: Set<string>, extra: TriviaQuestion[] = []): TriviaQuestion {
  const pool = [...TRIVIA_QUESTIONS, ...extra].filter((q) => q.category === category)
  const fresh = pool.filter((q) => !usedIds.has(q.id))
  const source = fresh.length ? fresh : pool
  return source[Math.floor(Math.random() * source.length)]
}
