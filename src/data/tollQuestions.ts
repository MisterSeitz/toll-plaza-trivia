import type { TollQuestion } from '../types/game'

const RAW: [string, boolean, string][] = [
  ['South Africa has three official capital cities.', true, 'Pretoria is executive, Cape Town legislative, Bloemfontein judicial.'],
  ['The King Protea is the official national animal of South Africa.', false, 'The King Protea is the national flower; the Springbok is the national animal.'],
  ['Table Mountain is older than the Himalayas.', true, 'Its sandstone is about 240–280 million years old.'],
  ['The Comrades Marathon runs between Johannesburg and Pretoria.', false, 'It runs between Durban and Pietermaritzburg.'],
  ['South Africa was the first African nation to host the FIFA World Cup.', true, 'It hosted in 2010.'],
  ['Rooibos grows naturally in every South African province.', false, 'It grows natively almost only in the Cederberg of the Western Cape.'],
  ['The blue crane is South Africa\'s national bird.', true, 'The blue crane is endemic to Southern Africa.'],
  ['Kruger National Park is roughly the size of Wales.', true, 'Kruger covers about 19,485 km².'],
  ['The Vredefort Dome is the world\'s largest verified impact crater.', true, 'It is over two billion years old and a UNESCO site.'],
  ['Malva Pudding originated as an indigenous Zulu dish.', false, 'It is of Cape Dutch origin.'],
  ['Blyde River Canyon is the largest green canyon on Earth.', true, 'Its subtropical foliage earns it that title.'],
  ['The Springboks have won the Rugby World Cup four times.', true, 'Winning in 1995, 2007, 2019 and 2023.'],
  ['Vilakazi Street in Soweto was home to two Nobel Peace laureates.', true, 'Both Mandela and Desmond Tutu lived there.'],
  ['The Karoo is a high-rainfall subtropical rainforest.', false, 'The Karoo is a vast semi-desert.'],
  ['The currency code ZAR stands for "Zululand African Rand".', false, 'ZAR comes from the Dutch "Zuid-Afrikaanse Rand".'],
]

export const TOLL_QUESTIONS: TollQuestion[] = RAW.map(([prompt, isTrue, explanation], i) => ({
  id: `tq-${i}`,
  prompt,
  isTrue,
  explanation,
}))
