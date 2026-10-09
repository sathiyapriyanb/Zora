import { LostFoundItem } from '../types';

export interface GeminiMatchResult {
  score: number;
  reasons: string[];
  mismatches: string[];
  recommendation: string;
  confidence: 'Low' | 'Medium' | 'High' | 'Very High';
  verificationQuestions?: string[];
  isAiPowered?: boolean;
  note?: string;
}

/**
 * Safely parses and sanitizes Gemini AI responses.
 * Handles markdown formatting, raw JSON strings, and partial/malformed outputs.
 */
export function parseGeminiResponse(rawText: string | null | undefined): GeminiMatchResult {
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    return {
      score: 0,
      reasons: ['No response payload received from AI service.'],
      mismatches: ['Unprocessed evaluation.'],
      recommendation: 'Manual inspection required by campus authorities.',
      confidence: 'Low',
    };
  }

  let sanitized = rawText.trim();

  // Strip markdown code fences if present (e.g., ```json ... ``` or ``` ...)
  if (sanitized.startsWith('```')) {
    sanitized = sanitized.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  // Find the first '{' and last '}' to handle any conversational text wrapping
  const firstBrace = sanitized.indexOf('{');
  const lastBrace = sanitized.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    sanitized = sanitized.slice(firstBrace, lastBrace + 1);
  }

  try {
    const data = JSON.parse(sanitized);

    // Validate and clamp score
    let score = typeof data.score === 'number' ? Math.round(data.score) : 50;
    if (isNaN(score)) score = 50;
    score = Math.max(0, Math.min(100, score));

    // Sanitize reasons
    const reasons = Array.isArray(data.reasons) && data.reasons.length > 0
      ? data.reasons.map((r: any) => String(r).trim()).filter(Boolean)
      : ['Attributes show potential resemblance.'];

    // Sanitize mismatches
    const mismatches = Array.isArray(data.mismatches) && data.mismatches.length > 0
      ? data.mismatches.map((m: any) => String(m).trim()).filter(Boolean)
      : ['Physical verification required.'];

    // Validate recommendation
    const recommendation = typeof data.recommendation === 'string' && data.recommendation.trim()
      ? data.recommendation.trim()
      : score >= 70
        ? 'High probability match. Please submit a claim with private verification proof.'
        : 'Possible resemblance. Check physical custody location.';

    // Validate confidence
    let confidence: 'Low' | 'Medium' | 'High' | 'Very High' = 'Medium';
    const validConfidences = ['Low', 'Medium', 'High', 'Very High'];
    if (validConfidences.includes(data.confidence)) {
      confidence = data.confidence;
    } else {
      if (score >= 85) confidence = 'Very High';
      else if (score >= 70) confidence = 'High';
      else if (score >= 45) confidence = 'Medium';
      else confidence = 'Low';
    }

    // Sanitize verification questions if provided
    let verificationQuestions = Array.isArray(data.verificationQuestions)
      ? data.verificationQuestions.map((q: any) => String(q).trim()).filter(Boolean)
      : undefined;

    return {
      score,
      reasons,
      mismatches,
      recommendation,
      confidence,
      verificationQuestions,
    };
  } catch {
    // Graceful fallback on JSON parse failure
    return {
      score: 50,
      reasons: ['Response could not be parsed as structured JSON; fallback used.'],
      mismatches: ['Formatting anomaly in AI service response.'],
      recommendation: 'Please review item descriptions manually or re-run analysis.',
      confidence: 'Medium',
    };
  }
}

/**
 * Generates tailored ownership verification questions for security staff & custodians
 */
export function generateVerificationQuestions(
  category: string = '',
  title: string = '',
  details: string = ''
): string[] {
  const cat = (category || '').toLowerCase();
  const name = (title || '').toLowerCase();

  if (cat.includes('electronic') || name.includes('earbud') || name.includes('phone') || name.includes('laptop')) {
    return [
      'What is the lock screen wallpaper, case color, or unique sticker on the device?',
      'Can you unlock the device, specify the exact battery percentage, or connect it via Bluetooth?',
      'What are the brand markings, model number, or private scratches on the casing/hinge?'
    ];
  }

  if (cat.includes('calculator') || name.includes('scientific') || name.includes('casio')) {
    return [
      'What model number is engraved on the casing (e.g., fx-991EX vs fx-991MS)?',
      'Are there any specific name stickers, roll numbers, or handwritten formulas inside the slide-on cover?',
      'Which engineering mode or contrast setting was the calculator left on?'
    ];
  }

  if (cat.includes('bag') || name.includes('backpack') || name.includes('wallet') || name.includes('pouch')) {
    return [
      'What exact personal items or stationery are stored in the innermost zipped pocket?',
      'Can you describe the keychain, zipper pulls, or exterior brand badge?',
      'What specific identity cards, bills, or coin denominations are inside?'
    ];
  }

  if (cat.includes('card') || name.includes('id') || name.includes('license')) {
    return [
      'What is the exact student registration number or date of birth printed on the card?',
      'What color is the lanyard, badge holder, or department ribbon attached to it?',
      'What department and blood group are displayed on the card?'
    ];
  }

  if (cat.includes('key')) {
    return [
      'How many keys are on the ring, and what do the respective keys open?',
      'Describe the keychain ornament, bike brand logo, or attached mini tool.',
      'Are there any distinct cuts, colored plastic caps, or engravings on the key heads?'
    ];
  }

  return [
    'Can you describe any unique scratches, dents, or marks not visible in the public photo?',
    'What approximate date, time, and specific classroom or table was the item placed at?',
    'Do you have a purchase receipt, original packaging, or photo of you possessing this item?'
  ];
}

/**
 * Deterministic rule-based match calculation engine.
 * Used when Gemini API is unavailable, offline, or as a fast pre-filter.
 */
export function computeDeterministicMatch(
  lost: Partial<LostFoundItem> | null | undefined,
  found: Partial<LostFoundItem> | null | undefined
): GeminiMatchResult {
  if (!lost || !found) {
    return {
      score: 0,
      reasons: ['Insufficient item data for comparison.'],
      mismatches: ['Missing item parameters.'],
      recommendation: 'Please provide complete item information.',
      confidence: 'Low',
      verificationQuestions: generateVerificationQuestions(),
    };
  }

  let score = 0;
  const reasons: string[] = [];
  const mismatches: string[] = [];

  // 1. Category comparison (Weight: 35 points)
  const lostCat = (lost.category || '').toLowerCase().trim();
  const foundCat = (found.category || '').toLowerCase().trim();

  if (lostCat && foundCat && lostCat === foundCat) {
    score += 35;
    reasons.push(`Exact matching category: "${lost.category}"`);
  } else if (lostCat && foundCat) {
    // Partial cross-category checks
    if (
      (lostCat.includes('electronic') && foundCat.includes('calculator')) ||
      (lostCat.includes('calculator') && foundCat.includes('electronic'))
    ) {
      score += 20;
      reasons.push(`Related category family: (${lost.category} ~ ${found.category})`);
    } else {
      score -= 20;
      mismatches.push(`Different categories: "${lost.category}" vs "${found.category}"`);
    }
  }

  // 2. Title & keyword token overlap (Weight: Up to 30 points)
  const tokenize = (text: string) =>
    (text || '')
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !['the', 'and', 'with', 'for', 'item', 'lost', 'found'].includes(w));

  const lostWords = tokenize(`${lost.title || ''} ${lost.description || ''}`);
  const foundWords = tokenize(`${found.title || ''} ${found.description || ''}`);

  const commonWords = Array.from(new Set(lostWords.filter((w) => foundWords.includes(w))));

  if (commonWords.length > 0) {
    const keywordPoints = Math.min(30, commonWords.length * 10);
    score += keywordPoints;
    reasons.push(`Matching descriptive keywords: ${commonWords.slice(0, 4).join(', ')}`);
  } else {
    mismatches.push('No significant shared descriptive keywords in titles.');
  }

  // 3. Location proximity at Rathinam Technical Campus (Weight: 25 points)
  const lostLoc = (lost.location || '').toLowerCase().trim();
  const foundLoc = (found.location || '').toLowerCase().trim();

  if (lostLoc && foundLoc && lostLoc === foundLoc) {
    score += 25;
    reasons.push(`Identical campus location reported: "${lost.location}"`);
  } else if (lostLoc && foundLoc) {
    // Proximity groups within RTC Techzone
    const academicAreas = ['cse', 'it', 'ece', 'mech', 'bme', 'ai', 'admin', 'library'];
    const isLostAcademic = academicAreas.some((a) => lostLoc.includes(a));
    const isFoundAcademic = academicAreas.some((a) => foundLoc.includes(a));

    if (isLostAcademic && isFoundAcademic) {
      score += 12;
      reasons.push(`Adjacent academic zone at RTC: ${lost.location} ~ ${found.location}`);
    } else {
      mismatches.push(`Different campus zones: "${lost.location}" vs "${found.location}"`);
    }
  }

  // 4. Chronological sequence check (Weight: +10 / -25 points)
  if (lost.date && found.date) {
    const lostTime = new Date(lost.date).getTime();
    const foundTime = new Date(found.date).getTime();

    if (!isNaN(lostTime) && !isNaN(foundTime)) {
      if (foundTime >= lostTime) {
        score += 10;
        reasons.push('Found date logically follows the reported lost date.');
      } else {
        // Found before it was lost is chronologically impossible unless dates are misremembered
        score -= 25;
        mismatches.push('Chronological anomaly: Item reported found before the reported lost date.');
      }
    }
  }

  // 5. Distinctive detail bonus check (Weight: +10 points)
  if (lost.distinctiveDetails) {
    const detailWords = tokenize(lost.distinctiveDetails);
    const detailMatches = detailWords.filter((w) => foundWords.includes(w));
    if (detailMatches.length > 0) {
      score += 10;
      reasons.push(`Found report references distinctive detail: "${detailMatches.join(', ')}"`);
    }
  }

  // Score clamping between 5 and 95
  score = Math.max(5, Math.min(95, score));

  // Hard category mismatch guard: fundamentally different types cannot be High/Medium match
  const hasHardCategoryMismatch =
    lostCat &&
    foundCat &&
    lostCat !== foundCat &&
    !(
      (lostCat.includes('electronic') && foundCat.includes('calculator')) ||
      (lostCat.includes('calculator') && foundCat.includes('electronic'))
    );

  if (hasHardCategoryMismatch) {
    score = Math.min(score, 35);
  }

  // Determine confidence tier
  let confidence: 'Low' | 'Medium' | 'High' | 'Very High' = 'Low';
  if (hasHardCategoryMismatch) {
    confidence = 'Low';
  } else if (score >= 80) {
    confidence = 'Very High';
  } else if (score >= 65) {
    confidence = 'High';
  } else if (score >= 45) {
    confidence = 'Medium';
  } else {
    confidence = 'Low';
  }

  // Actionable recommendation
  const recommendation =
    score >= 75
      ? 'Strong match candidate. Proceed with ownership claim and verify secret details.'
      : score >= 50
        ? 'Moderate match probability. Recommend physically inspecting the item at the holding location.'
        : 'Low likelihood of matching. Items appear to be distinct based on current records.';

  // Targeted verification questions
  const verificationQuestions = generateVerificationQuestions(
    lost.category || found.category,
    lost.title || found.title,
    lost.distinctiveDetails || ''
  );

  return {
    score,
    reasons: reasons.length > 0 ? reasons : ['General category similarity'],
    mismatches: mismatches.length > 0 ? mismatches : ['Requires in-person verification with security staff'],
    recommendation,
    confidence,
    verificationQuestions,
    isAiPowered: false,
    note: 'Evaluated using RTC Deterministic Fallback Matching Engine',
  };
}
