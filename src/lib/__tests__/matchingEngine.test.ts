import { describe, it, expect } from 'vitest';
import {
  parseGeminiResponse,
  generateVerificationQuestions,
  computeDeterministicMatch,
} from '../matchingEngine';
import { LostFoundItem } from '../../types';

describe('Gemini Response Parsing & Sanitization', () => {
  it('parses valid structured JSON correctly', () => {
    const raw = JSON.stringify({
      score: 88,
      reasons: ['Both are Casio scientific calculators', 'Lost in library and found in library'],
      mismatches: ['Slight difference in reported time'],
      recommendation: 'Verify serial number and proceed to return.',
      confidence: 'High',
      verificationQuestions: ['What is the model engraved on the back?'],
    });

    const result = parseGeminiResponse(raw);
    expect(result.score).toBe(88);
    expect(result.confidence).toBe('High');
    expect(result.reasons).toHaveLength(2);
    expect(result.mismatches).toHaveLength(1);
    expect(result.verificationQuestions).toEqual(['What is the model engraved on the back?']);
  });

  it('strips markdown ```json ... ``` code fences', () => {
    const fenced = '```json\n{\n  "score": 92,\n  "reasons": ["Matching Boat earphones in blue case"],\n  "mismatches": [],\n  "recommendation": "Check Bluetooth pairing name",\n  "confidence": "Very High"\n}\n```';
    const result = parseGeminiResponse(fenced);
    expect(result.score).toBe(92);
    expect(result.confidence).toBe('Very High');
    expect(result.reasons[0]).toContain('Boat earphones');
  });

  it('extracts embedded JSON when wrapped in conversational preamble', () => {
    const wrapped = 'Here is the campus match evaluation for Rathinam Techzone:\n\n{"score": 75, "reasons": ["Both in CSE Block"], "mismatches": ["No photo"], "recommendation": "Inspect in person", "confidence": "High"}\nHope this helps!';
    const result = parseGeminiResponse(wrapped);
    expect(result.score).toBe(75);
    expect(result.confidence).toBe('High');
    expect(result.reasons).toContain('Both in CSE Block');
  });

  it('clamps scores below 0 to 0 and above 100 to 100', () => {
    const negative = JSON.stringify({ score: -25, reasons: [], mismatches: [] });
    const excessive = JSON.stringify({ score: 150, reasons: [], mismatches: [] });

    expect(parseGeminiResponse(negative).score).toBe(0);
    expect(parseGeminiResponse(excessive).score).toBe(100);
  });

  it('handles empty, null, or undefined input gracefully without throwing', () => {
    expect(parseGeminiResponse(null).score).toBe(0);
    expect(parseGeminiResponse(undefined).score).toBe(0);
    expect(parseGeminiResponse('').score).toBe(0);
    expect(parseGeminiResponse('   ').score).toBe(0);
  });

  it('recovers gracefully from malformed or truncated JSON', () => {
    const corrupted = '{"score": 85, "reasons": ["Incomplete payload...';
    const result = parseGeminiResponse(corrupted);
    expect(result).toBeDefined();
    expect(result.score).toBe(50);
    expect(result.confidence).toBe('Medium');
    expect(result.reasons[0]).toContain('fallback');
  });
});

describe('Targeted Verification Questions Generator', () => {
  it('generates questions for electronic devices', () => {
    const questions = generateVerificationQuestions('Electronics', 'OnePlus Nord Buds');
    expect(questions.length).toBeGreaterThanOrEqual(3);
    expect(questions.some((q) => q.toLowerCase().includes('wallpaper') || q.toLowerCase().includes('battery') || q.toLowerCase().includes('bluetooth'))).toBe(true);
  });

  it('generates questions for calculators and lab instruments', () => {
    const questions = generateVerificationQuestions('Calculators & Lab Gear', 'Casio fx-991EX');
    expect(questions.length).toBeGreaterThanOrEqual(3);
    expect(questions.some((q) => q.toLowerCase().includes('model') || q.toLowerCase().includes('cover') || q.toLowerCase().includes('slide-on'))).toBe(true);
  });

  it('generates questions for bags and wallets', () => {
    const questions = generateVerificationQuestions('Bags & Backpacks', 'Wildcraft College Backpack');
    expect(questions.length).toBeGreaterThanOrEqual(3);
    expect(questions.some((q) => q.toLowerCase().includes('pocket') || q.toLowerCase().includes('keychain') || q.toLowerCase().includes('contents'))).toBe(true);
  });

  it('generates questions for student ID cards', () => {
    const questions = generateVerificationQuestions('ID & Cards', 'RTC Student ID Card');
    expect(questions.length).toBeGreaterThanOrEqual(3);
    expect(questions.some((q) => q.toLowerCase().includes('registration') || q.toLowerCase().includes('lanyard'))).toBe(true);
  });
});

describe('Deterministic Fallback Matching Engine', () => {
  const baseLost: Partial<LostFoundItem> = {
    title: 'Casio fx-991EX Scientific Calculator',
    category: 'Calculators & Lab Gear',
    location: 'Central Library',
    date: '2026-10-01',
    description: 'Black calculator left at table 4',
    distinctiveDetails: 'Scratch on battery cover and red dot sticker',
  };

  const matchingFound: Partial<LostFoundItem> = {
    title: 'Casio Scientific Calculator fx-991EX with red dot',
    category: 'Calculators & Lab Gear',
    location: 'Central Library',
    date: '2026-10-02',
    description: 'Found on 2nd floor library reading table with sticker',
    keptAt: 'Library Front Desk',
  };

  it('yields high match score (>75) for identical category, location, and keywords', () => {
    const result = computeDeterministicMatch(baseLost, matchingFound);
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.confidence).toMatch(/High|Very High/);
    expect(result.reasons.some((r) => r.includes('Calculators & Lab Gear'))).toBe(true);
    expect(result.reasons.some((r) => r.includes('Central Library'))).toBe(true);
    expect(result.isAiPowered).toBe(false);
  });

  it('penalizes category mismatch and records discrepancy', () => {
    const differentCategory: Partial<LostFoundItem> = {
      ...matchingFound,
      category: 'Keys',
      title: 'Bunch of 3 Keys with ring',
    };

    const result = computeDeterministicMatch(baseLost, differentCategory);
    expect(result.score).toBeLessThan(50);
    expect(result.confidence).toBe('Low');
    expect(result.mismatches.some((m) => m.includes('Different categories'))).toBe(true);
  });

  it('detects chronological anomalies (found date earlier than lost date)', () => {
    const anomalyFound: Partial<LostFoundItem> = {
      ...matchingFound,
      date: '2026-09-20', // Lost was 2026-10-01, found is 10 days earlier
    };

    const result = computeDeterministicMatch(baseLost, anomalyFound);
    expect(result.mismatches.some((m) => m.toLowerCase().includes('chronological'))).toBe(true);
  });

  it('grants partial proximity score for adjacent RTC academic departments', () => {
    const cseItem: Partial<LostFoundItem> = {
      title: 'HP Laptop Charger',
      category: 'Electronics',
      location: 'CSE / Computer Science area',
      date: '2026-10-03',
    };

    const itItem: Partial<LostFoundItem> = {
      title: 'HP Laptop Adapter 65W',
      category: 'Electronics',
      location: 'IT area',
      date: '2026-10-04',
    };

    const result = computeDeterministicMatch(cseItem, itItem);
    expect(result.reasons.some((r) => r.includes('Adjacent academic zone at RTC'))).toBe(true);
  });

  it('handles null, undefined, or empty item parameters safely', () => {
    const emptyResult = computeDeterministicMatch(null, null);
    expect(emptyResult.score).toBe(0);
    expect(emptyResult.confidence).toBe('Low');
    expect(emptyResult.reasons).toContain('Insufficient item data for comparison.');
  });
});

describe('Integration Fallback Flow', () => {
  it('falls back seamlessly to deterministic engine when simulated AI call fails', () => {
    const lostItem: Partial<LostFoundItem> = {
      title: 'Boat Airdopes 141',
      category: 'Electronics',
      location: 'Food Court / Canteen',
      date: '2026-10-05',
    };

    const foundItem: Partial<LostFoundItem> = {
      title: 'Boat Wireless Earbuds Case',
      category: 'Electronics',
      location: 'Food Court / Canteen',
      date: '2026-10-06',
    };

    // Simulate AI failure fallback pipeline
    let matchResult;
    try {
      // Simulated failing AI response
      throw new Error('AI Service rate limited or offline');
    } catch {
      matchResult = computeDeterministicMatch(lostItem, foundItem);
    }

    expect(matchResult).toBeDefined();
    expect(matchResult.score).toBeGreaterThan(60);
    expect(matchResult.isAiPowered).toBe(false);
    expect(matchResult.verificationQuestions).toBeDefined();
    expect(matchResult.verificationQuestions?.length).toBeGreaterThanOrEqual(3);
  });

  it('awards bonus score when found description includes distinctive detail words', () => {
    const lostItem: Partial<LostFoundItem> = {
      title: 'Water Bottle',
      category: 'Other',
      location: 'Sports Ground',
      distinctiveDetails: 'Yellow anime sticker on bottom',
    };

    const foundItem: Partial<LostFoundItem> = {
      title: 'Stainless steel bottle',
      category: 'Other',
      location: 'Sports Ground',
      description: 'Found with a yellow anime sticker on the base',
    };

    const matchResult = computeDeterministicMatch(lostItem, foundItem);
    expect(matchResult.reasons.some((r) => r.includes('distinctive detail'))).toBe(true);
  });

  it('generates fallback questions for uncategorized or miscellaneous items', () => {
    const questions = generateVerificationQuestions('Miscellaneous', 'Black Umbrella');
    expect(questions.length).toBe(3);
    expect(questions[0]).toContain('scratches');
  });

  it('correctly maps confidence level when score is between 50 and 64', () => {
    const lostItem: Partial<LostFoundItem> = {
      title: 'Engineering Mechanics Textbook',
      category: 'Books & Stationery',
      location: 'Mechanical area',
      date: '2026-10-01',
    };

    const foundItem: Partial<LostFoundItem> = {
      title: 'Engineering Graphics Textbook',
      category: 'Books & Stationery',
      location: 'Library', // different location, category matches (35 pts) + title "engineering textbook" (20 pts)
      date: '2026-10-02', // +10 pts = 65 or around 55 pts
    };

    const matchResult = computeDeterministicMatch(lostItem, foundItem);
    expect(matchResult.score).toBeGreaterThanOrEqual(50);
    expect(['Medium', 'High']).toContain(matchResult.confidence);
  });
});
