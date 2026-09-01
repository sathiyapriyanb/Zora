import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not found in environment');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    campus: 'Rathinam Technical Campus (RTC)',
    timestamp: new Date().toISOString(),
  });
});

// AI Lost ↔ Found Match Comparison Endpoint
app.post('/api/gemini/match', async (req, res) => {
  try {
    const { lostItem, foundItem } = req.body;

    if (!lostItem || !foundItem) {
      return res.status(400).json({
        error: 'Both lostItem and foundItem details are required for matching.',
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback algorithmic match if API key not set
      const score = computeRuleBasedMatch(lostItem, foundItem);
      return res.json({
        score: score.score,
        reasons: score.reasons,
        mismatches: score.mismatches,
        recommendation: score.recommendation,
        confidence: score.confidence,
        isAiPowered: false,
      });
    }

    const prompt = `You are the Lost & Found Intelligence Agent for Rathinam Technical Campus (RTC), Coimbatore.
Compare the following LOST item report against the FOUND item report to determine if they could refer to the exact same physical item.

LOST ITEM:
- Title: ${lostItem.title || 'N/A'}
- Category: ${lostItem.category || 'N/A'}
- Location Lost: ${lostItem.location || 'N/A'} (${lostItem.locationDetail || 'No extra detail'})
- Date Lost: ${lostItem.date || 'N/A'} (Time: ${lostItem.time || 'N/A'})
- Description: ${lostItem.description || 'N/A'}
- Distinctive identifying details: ${lostItem.distinctiveDetails || 'None listed'}
- Image URL: ${lostItem.imageUrl || 'None'}

FOUND ITEM:
- Title: ${foundItem.title || 'N/A'}
- Category: ${foundItem.category || 'N/A'}
- Location Found: ${foundItem.location || 'N/A'} (${foundItem.locationDetail || 'No extra detail'})
- Date Found: ${foundItem.date || 'N/A'} (Time: ${foundItem.time || 'N/A'})
- Description: ${foundItem.description || 'N/A'}
- Where Kept: ${foundItem.keptAt || 'N/A'}
- Image URL: ${foundItem.imageUrl || 'None'}

EVALUATION CRITERIA:
1. Category & Item Type (e.g. both are calculators, earbuds, laptops, IDs)
2. Brand, Color, Model, Physical Characteristics
3. Campus Location Proximity at Rathinam Technical Campus (e.g., CSE block vs Computer Labs vs Library)
4. Date/Time logical sequence (Found date must be on or after Lost date)
5. Distinctive features, stickers, scratches, case color

IMPORTANT:
- Score must be an integer from 0 to 100 representing probability of being the same item.
- Provide 2-4 bullet points for matching reasons.
- Provide 1-3 bullet points for possible mismatches or unverified aspects.
- Provide a brief 1-sentence recommendation for the student/admin.
- Remind that AI only suggests possible matches and does NOT confirm ownership.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an objective campus lost & found verification evaluator. Return structured JSON.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: {
              type: Type.INTEGER,
              description: 'Match score from 0 to 100',
            },
            reasons: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of reasons why this looks like a match',
            },
            mismatches: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of differences, timing discrepancies, or unverified points',
            },
            recommendation: {
              type: Type.STRING,
              description: 'Concise advice on whether to submit a claim or inspect in person',
            },
            confidence: {
              type: Type.STRING,
              description: 'Low, Medium, High, or Very High',
            },
          },
          required: ['score', 'reasons', 'mismatches', 'recommendation', 'confidence'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      ...parsed,
      isAiPowered: true,
    });
  } catch (err: any) {
    console.error('Error in /api/gemini/match:', err);
    // Fallback to rule-based comparison on error
    const fallback = computeRuleBasedMatch(req.body.lostItem, req.body.foundItem);
    return res.json({
      ...fallback,
      isAiPowered: false,
      note: 'Processed via rule matching engine (Gemini fallback)',
    });
  }
});

// Helper for rule-based match calculation fallback
function computeRuleBasedMatch(lost: any, found: any) {
  let score = 0;
  const reasons: string[] = [];
  const mismatches: string[] = [];

  if (!lost || !found) {
    return {
      score: 0,
      reasons: ['Insufficient item data'],
      mismatches: ['Missing item parameters'],
      recommendation: 'Please provide complete item information.',
      confidence: 'Low',
    };
  }

  // Category match
  if (lost.category && found.category && lost.category.toLowerCase() === found.category.toLowerCase()) {
    score += 35;
    reasons.push(`Matching category: ${lost.category}`);
  } else {
    mismatches.push(`Different categories (${lost.category} vs ${found.category})`);
  }

  // Location proximity
  if (lost.location && found.location && lost.location.toLowerCase() === found.location.toLowerCase()) {
    score += 25;
    reasons.push(`Reported in the same campus area: ${lost.location}`);
  } else if (lost.location && found.location) {
    mismatches.push(`Different locations (${lost.location} vs ${found.location})`);
  }

  // Title keyword overlap
  const lostWords = (lost.title || '').toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
  const foundWords = (found.title || '').toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
  const commonWords = lostWords.filter((w: string) => foundWords.includes(w));

  if (commonWords.length > 0) {
    score += Math.min(30, commonWords.length * 15);
    reasons.push(`Matching keywords in title: ${commonWords.join(', ')}`);
  }

  // Date check
  if (lost.date && found.date) {
    const lostTime = new Date(lost.date).getTime();
    const foundTime = new Date(found.date).getTime();
    if (!isNaN(lostTime) && !isNaN(foundTime)) {
      if (foundTime >= lostTime) {
        score += 10;
        reasons.push('Found date is on or after the reported lost date.');
      } else {
        score -= 20;
        mismatches.push('Item was reported found before the reported lost date.');
      }
    }
  }

  score = Math.max(5, Math.min(95, score));
  const confidence = score >= 75 ? 'High' : score >= 50 ? 'Medium' : 'Low';

  return {
    score,
    reasons: reasons.length > 0 ? reasons : ['General category similarity'],
    mismatches: mismatches.length > 0 ? mismatches : ['Verification needed with physical inspection'],
    recommendation:
      score >= 70
        ? 'High probability match. Please submit a claim with private verification proof.'
        : 'Possible match. Check the holding location or inquire with the finder.',
    confidence,
  };
}

// Vite middleware / static serve
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RTC Lost & Found Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
