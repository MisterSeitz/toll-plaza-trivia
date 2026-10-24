import type { CategoryKey, TriviaQuestion } from '../types/game'
import { CATEGORY_META } from '../data/gameData'

const MODEL = 'gemini-2.5-flash'

async function generate(prompt: string, json = false): Promise<string> {
  const res = await fetch(`/api/gemini/v1beta/models/${MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: json ? { responseMimeType: 'application/json', temperature: 0.9 } : { temperature: 1 },
    }),
  })
  if (!res.ok) throw new Error(`Gemini ${res.status}`)
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (typeof text !== 'string') throw new Error('Empty Gemini response')
  return text
}

/** Generates fresh multiple-choice SA trivia for a category. Throws on failure; callers fall back to static data. */
export async function generateQuestions(category: CategoryKey, count = 3): Promise<TriviaQuestion[]> {
  const meta = CATEGORY_META[category]
  const text = await generate(
    `Create ${count} factually accurate South African trivia questions for the category "${meta.name}". ` +
      `Return ONLY a JSON array. Each item: {"prompt": string, "options": [4 strings], "correctIndex": 0-3, "explanation": string (1-2 sentences)}. ` +
      `Vary difficulty, avoid ambiguity, and make exactly one option correct.`,
    true,
  )
  const arr = JSON.parse(text) as { prompt: string; options: string[]; correctIndex: number; explanation: string }[]
  const keys = ['A', 'B', 'C', 'D'] as const
  return arr
    .filter((q) => q.options?.length === 4 && q.correctIndex >= 0 && q.correctIndex < 4)
    .map((q, i) => ({
      id: `ai-${category}-${Date.now()}-${i}`,
      category,
      prompt: q.prompt,
      options: q.options.map((label, idx) => ({ key: keys[idx], label })),
      correctAnswer: keys[q.correctIndex],
      explanation: q.explanation,
    }))
}

/** One-line local banter reacting to a trivia outcome. */
export async function generateBanter(playerName: string, correct: boolean, topic: string): Promise<string> {
  const text = await generate(
    `Write ONE short (max 14 words) playful South African slang commentary line about ${playerName} ` +
      `${correct ? 'nailing' : 'missing'} a "${topic}" trivia question. Use words like lekker, eish, sharp-sharp or hawu. No quotes.`,
  )
  return text.trim().replace(/^["']|["']$/g, '')
}
