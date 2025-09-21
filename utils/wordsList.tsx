export function pickBestWord(candidates: string[]): string | undefined {
  if (candidates.length === 0) return undefined;

  // 1️⃣ Count letter frequencies across all candidates
  const freq: Record<string, number> = {};
  for (const word of candidates) {
    const seen = new Set<string>();
    for (const ch of word) {
      if (!seen.has(ch)) {
        freq[ch] = (freq[ch] || 0) + 1;
        seen.add(ch); // count each letter only once per word
      }
    }
  }

  // 2️⃣ Score each word by sum of its unique letters' frequencies
  let bestScore = -Infinity;
  const topWords: string[] = [];

  for (const word of candidates) {
    const seen = new Set<string>();
    let score = 0;

    for (const ch of word) {
      if (!seen.has(ch)) {
        score += freq[ch] || 0;
        seen.add(ch);
      }
    }

    if (score > bestScore) {
      bestScore = score;
      topWords.length = 0; // reset topWords array
      topWords.push(word);
    } else if (score === bestScore) {
      topWords.push(word);
    }
  }

  // 3️⃣ Pick randomly among top-scoring words
  const randomIndex = Math.floor(Math.random() * topWords.length);
  return topWords[randomIndex];
}
