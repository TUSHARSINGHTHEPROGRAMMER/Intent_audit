const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "for",
  "from",
  "has",
  "have",
  "how",
  "i",
  "in",
  "is",
  "it",
  "me",
  "my",
  "of",
  "on",
  "or",
  "our",
  "please",
  "that",
  "the",
  "their",
  "this",
  "to",
  "us",
  "we",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "with",
  "you",
  "your",
]);

const similarityCache = new Map();
const POSSESSIVE_TOKENS = new Set(["my", "mera", "meri", "mere", "apna", "apni", "apne"]);
const BALANCE_LOOKUP_CUES = [
  "balance",
  "usage",
  "remaining",
  "left",
  "validity",
  "expire",
  "expiry",
  "deduction",
  "check",
  "bacha",
  "bacha",
  "kitna",
  "kitne",
  "kitni",
];
const TROUBLESHOOTING_CUES = [
  "issue",
  "problem",
  "working",
  "not",
  "nahi",
  "nahin",
  "fix",
  "repair",
  "restore",
  "solve",
  "slow",
  "chalu",
  "start",
  "band",
];

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[_/.-]+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value = "") {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token && !STOP_WORDS.has(token));
}

function splitIntentName(intentName = "") {
  return normalizeText(intentName).split(" ").filter(Boolean);
}

function tokenFrequency(tokens) {
  return tokens.reduce((acc, token) => {
    acc[token] = (acc[token] || 0) + 1;
    return acc;
  }, {});
}

function levenshteinDistance(a = "", b = "") {
  const left = a.length;
  const right = b.length;

  if (left === 0) return right;
  if (right === 0) return left;

  const matrix = Array.from({ length: left + 1 }, () => new Array(right + 1).fill(0));

  for (let i = 0; i <= left; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= right; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= left; i += 1) {
    for (let j = 1; j <= right; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[left][right];
}

function fuzzySimilarity(a = "", b = "") {
  if (!a || !b) return 0;
  if (a === b) return 1;

  const cacheKey = a < b ? `${a}:${b}` : `${b}:${a}`;
  if (similarityCache.has(cacheKey)) {
    return similarityCache.get(cacheKey);
  }

  if (a.length <= 2 || b.length <= 2) {
    const shortScore = 0;
    similarityCache.set(cacheKey, shortScore);
    return shortScore;
  }

  if (Math.abs(a.length - b.length) > 3) {
    const lengthScore = 0;
    similarityCache.set(cacheKey, lengthScore);
    return lengthScore;
  }

  if (a[0] !== b[0] && a.length > 4 && b.length > 4) {
    const prefixScore = 0;
    similarityCache.set(cacheKey, prefixScore);
    return prefixScore;
  }

  const maxLength = Math.max(a.length, b.length);
  if (!maxLength) return 0;
  const distance = levenshteinDistance(a, b);
  const score = Math.max(0, 1 - distance / maxLength);
  similarityCache.set(cacheKey, score);
  return score;
}

function buildIntentDocument(intentName, descriptionObject = {}) {
  const fields = Object.entries(descriptionObject)
    .filter(([, value]) => typeof value === "string" && value.trim())
    .map(([key, value]) => ({
      key,
      text: value.trim(),
    }));

  const combinedText = [intentName, ...fields.map((field) => field.text)].join(" ");
  const definitionText = fields.map((field) => field.text).join(" ");
  const tokens = [...tokenize(combinedText), ...splitIntentName(intentName)];
  const definitionTokens = tokenize(definitionText);

  return {
    intent: intentName,
    fields,
    combinedText,
    definitionText,
    tokens,
    definitionTokens,
    uniqueTokens: [...new Set(tokens)],
    uniqueDefinitionTokens: [...new Set(definitionTokens)],
    tokenCounts: tokenFrequency(tokens),
    definitionTokenCounts: tokenFrequency(definitionTokens),
    totalTokens: tokens.length,
    definitionTokenLength: definitionTokens.length,
    normalizedText: normalizeText(combinedText),
    normalizedDefinitionText: normalizeText(definitionText),
    nameTokens: splitIntentName(intentName),
  };
}

function buildCorpusStatistics(documents) {
  const docFrequency = {};

  documents.forEach((doc) => {
    const uniqueTokens = new Set(doc.tokens);
    uniqueTokens.forEach((token) => {
      docFrequency[token] = (docFrequency[token] || 0) + 1;
    });
  });

  const docCount = documents.length || 1;
  const averageDocumentLength =
    documents.reduce((sum, doc) => sum + doc.totalTokens, 0) / docCount || 1;

  return { docFrequency, docCount, averageDocumentLength };
}

function computeBm25Score(queryTokens, document, corpus) {
  if (!queryTokens.length || !document.totalTokens) return 0;

  const k1 = 1.2;
  const b = 0.75;
  let score = 0;

  queryTokens.forEach((token) => {
    const tf = document.tokenCounts[token] || 0;
    if (!tf) return;

    const df = corpus.docFrequency[token] || 0;
    const idf = Math.log(1 + (corpus.docCount - df + 0.5) / (df + 0.5));
    const denominator = tf + k1 * (1 - b + b * (document.totalTokens / corpus.averageDocumentLength));
    score += idf * ((tf * (k1 + 1)) / denominator);
  });

  return score;
}

function computeFuzzyCoverage(queryTokens, docTokens) {
  if (!queryTokens.length || !docTokens.length) return { score: 0, evidence: [] };

  const evidence = [];
  let score = 0;

  queryTokens.forEach((queryToken) => {
    let bestMatch = { token: "", score: 0 };

    docTokens.forEach((docToken) => {
      const similarity = fuzzySimilarity(queryToken, docToken);
      if (similarity > bestMatch.score) {
        bestMatch = { token: docToken, score: similarity };
      }
    });

    if (bestMatch.score >= 0.72) {
      score += bestMatch.score;
      evidence.push({
        query: queryToken,
        match: bestMatch.token,
        score: bestMatch.score,
      });
    }
  });

  return {
    score: score / queryTokens.length,
    evidence: evidence.sort((a, b) => b.score - a.score).slice(0, 5),
  };
}

function computePhraseCoverage(messageText, fields) {
  const normalizedMessage = normalizeText(messageText);
  const phrases = fields
    .flatMap((field) => field.text.split(/[,\n]/))
    .map((phrase) => normalizeText(phrase))
    .filter((phrase) => phrase.length >= 4);

  const matchedPhrases = phrases.filter(
    (phrase) => normalizedMessage.includes(phrase) || phrase.includes(normalizedMessage)
  );

  return {
    score: phrases.length ? matchedPhrases.length / phrases.length : 0,
    phrases: matchedPhrases.slice(0, 4),
  };
}

function computeIntentNameBoost(messageTokens, nameTokens) {
  if (!messageTokens.length || !nameTokens.length) return 0;
  const matches = nameTokens.filter((token) => messageTokens.includes(token));
  return matches.length / nameTokens.length;
}

function clampScore(value) {
  return Math.max(0, Math.min(1, value));
}

function includesAny(text = "", keywords = []) {
  return keywords.some((keyword) => text.includes(keyword));
}

function computeShortQueryIntentBonus(message, doc) {
  const rawTokens = normalizeText(message).split(" ").filter(Boolean);
  if (!rawTokens.length) return 0;

  const hasPossessive = rawTokens.some((token) => POSSESSIVE_TOKENS.has(token));
  const hasBalanceCue = rawTokens.some((token) => includesAny(token, BALANCE_LOOKUP_CUES));
  const hasTroubleshootingCue = rawTokens.some((token) => includesAny(token, TROUBLESHOOTING_CUES));
  const hasDataLikeToken = rawTokens.some(
    (token) => fuzzySimilarity(token, "data") >= 0.74 || fuzzySimilarity(token, "internet") >= 0.74
  );

  if (!hasDataLikeToken) return 0;

  const docText = doc.normalizedText;
  const docLooksLikeBalance = includesAny(docText, [
    "check the balance",
    "balance deduction",
    "data balance",
    "usage",
    "validity",
    "expire",
    "remaining",
    "left",
    "balance",
  ]);
  const docLooksLikeTroubleshooting = includesAny(docText, [
    "not working",
    "restore",
    "repair",
    "fix",
    "solve",
    "issue",
    "troubleshooting",
    "internet service",
  ]);

  let bonus = 0;

  if (rawTokens.length <= 3 && hasPossessive) {
    if (docLooksLikeBalance) bonus += 0.16;
    if (docLooksLikeTroubleshooting) bonus -= 0.1;
  }


  if (hasBalanceCue) {
    if (docLooksLikeBalance) bonus += 0.12;
    if (docLooksLikeTroubleshooting) bonus -= 0.08;
  }

  if (hasTroubleshootingCue) {
    if (docLooksLikeTroubleshooting) bonus += 0.16;
    if (docLooksLikeBalance) bonus -= 0.08;
  }

  return Math.max(-0.2, Math.min(0.25, bonus));
}

function detectInvalidMessage(message = "") {
  const rawMessage = String(message || "").trim();
  if (!rawMessage) {
    return true;
  }

  const urlMatches = rawMessage.match(/((https?:\/\/|www\.)\S+|\b\S+\.(com|in|org|net|io|co|ai|ly|me|app|dev)(\/\S*)?)/gi) || [];
  const tokens = rawMessage.split(/\s+/).filter(Boolean);
  const nonUrlTokens = tokens.filter(
    (token) => !/^((https?:\/\/|www\.)\S+|\S+\.(com|in|org|net|io|co|ai|ly|me|app|dev)(\/\S*)?)$/i.test(token)
  );

  const normalizedWithoutUrls = rawMessage
    .replace(/((https?:\/\/|www\.)\S+|\b\S+\.(com|in|org|net|io|co|ai|ly|me|app|dev)(\/\S*)?)/gi, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return (
    urlMatches.length > 0 &&
    (nonUrlTokens.length === 0 ||
      normalizedWithoutUrls.length < 4 ||
      urlMatches.length / Math.max(tokens.length, 1) >= 0.6)
  );
}

function baseSignalsForDocument(queryTokens, message, doc, corpus) {
  const bm25 = computeBm25Score(queryTokens, doc, corpus);
  const phrase = computePhraseCoverage(message, doc.fields);
  const intentNameBoost = computeIntentNameBoost(queryTokens, doc.nameTokens);
  const baseScore = clampScore(
    Math.min(1.5, bm25) / 1.5 * 0.65 +
    phrase.score * 0.2 +
    intentNameBoost * 0.15
  );

  return {
    bm25,
    phrase,
    intentNameBoost,
    baseScore,
  };
}

function computeDefinitionAlignment(queryTokens, message, doc, corpus) {
  if (!doc.definitionTokenLength) {
    return {
      bm25: 0,
      phrase: 0,
      fuzzy: 0,
      score: 0,
    };
  }

  const definitionDoc = {
    tokenCounts: doc.definitionTokenCounts,
    totalTokens: doc.definitionTokenLength,
  };
  const bm25 = computeBm25Score(queryTokens, definitionDoc, corpus);
  const phrase = computePhraseCoverage(message, doc.fields);
  const fuzzy = computeFuzzyCoverage(queryTokens, doc.uniqueDefinitionTokens);
  const score = clampScore(
    Math.min(1.5, bm25) / 1.5 * 0.45 +
    fuzzy.score * 0.35 +
    phrase.score * 0.2
  );

  return {
    bm25,
    phrase: phrase.score,
    fuzzy: fuzzy.score,
    score,
  };
}

export function analyzeIntentMessage(message, intentDescriptions = {}, options = {}) {
  const documents = Object.entries(intentDescriptions)
    .map(([intentName, descriptionObject]) => buildIntentDocument(intentName, descriptionObject))
    .filter((doc) => doc.totalTokens > 0);

  if (!message || documents.length === 0) {
    return {
      rankings: [],
      summary: {
        topIntent: null,
        confidence: "low",
        confidenceGap: 0,
      },
    };
  }

  const corpus = buildCorpusStatistics(documents);
  const queryTokens = tokenize(message);
  const prioritizedIntents = new Set(options.prioritizedIntents || []);
  const shortlistSize = options.shortlistSize || 12;

  const seededRankings = documents.map((doc) => {
    const baseSignals = baseSignalsForDocument(queryTokens, message, doc, corpus);

    return {
      intent: doc.intent,
      doc,
      baseScore: baseSignals.baseScore,
      signals: {
        bm25: baseSignals.bm25,
        fuzzy: 0,
        phrase: baseSignals.phrase.score,
        intentNameBoost: baseSignals.intentNameBoost,
      },
      phrases: baseSignals.phrase.phrases,
    };
  });

  const fuzzyEligible = new Set(
    seededRankings
      .slice()
      .sort((a, b) => b.baseScore - a.baseScore)
      .slice(0, shortlistSize)
      .map((entry) => entry.intent)
  );

  prioritizedIntents.forEach((intent) => fuzzyEligible.add(intent));

  const rawRankings = seededRankings.map((entry) => {
    const fuzzy = fuzzyEligible.has(entry.intent)
      ? computeFuzzyCoverage(queryTokens, entry.doc.uniqueTokens)
      : { score: 0, evidence: [] };
    const definitionAlignment = computeDefinitionAlignment(queryTokens, message, entry.doc, corpus);
    const shortQueryBonus = computeShortQueryIntentBonus(message, entry.doc);

    const blendedScore = clampScore(
      entry.baseScore * 0.56 +
      fuzzy.score * 0.18 +
      definitionAlignment.score * 0.2 +
      shortQueryBonus
    );

    return {
      intent: entry.intent,
      score: blendedScore,
      scorePercent: Math.round(blendedScore * 100),
      signals: {
        ...entry.signals,
        fuzzy: fuzzy.score,
        definitionAlignment: definitionAlignment.score,
        definitionBm25: definitionAlignment.bm25,
        definitionPhrase: definitionAlignment.phrase,
        definitionFuzzy: definitionAlignment.fuzzy,
        shortQueryBonus,
      },
      evidence: fuzzy.evidence,
      phrases: entry.phrases,
      descriptions: entry.doc.fields,
    };
  });

  const rankings = rawRankings.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if ((b.signals.shortQueryBonus || 0) !== (a.signals.shortQueryBonus || 0)) {
      return (b.signals.shortQueryBonus || 0) - (a.signals.shortQueryBonus || 0);
    }
    return (b.signals.fuzzy || 0) - (a.signals.fuzzy || 0);
  });
  const topIntent = rankings[0] || null;
  const secondIntent = rankings[1] || null;
  const confidenceGap = topIntent && secondIntent ? topIntent.score - secondIntent.score : topIntent?.score || 0;

  let confidence = "low";
  if (confidenceGap >= 0.2 && (topIntent?.score || 0) >= 0.6) {
    confidence = "high";
  } else if (confidenceGap >= 0.08 && (topIntent?.score || 0) >= 0.45) {
    confidence = "medium";
  }

  return {
    rankings,
    summary: {
      topIntent,
      secondIntent,
      confidence,
      confidenceGap,
    },
  };
}

export function compareIntentChoices(message, intentDescriptions, intentsToCompare = []) {
  const analysis = analyzeIntentMessage(message, intentDescriptions, {
    prioritizedIntents: intentsToCompare,
  });
  const comparison = intentsToCompare
    .filter(Boolean)
    .map((intent) => analysis.rankings.find((entry) => entry.intent === intent))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  return {
    ...analysis,
    comparison,
  };
}

function getLlmIntent(result = {}) {
  return result.llmIntent ?? result.dbIntent ?? "";
}

function getNlpIntent(result = {}) {
  return result.nlpIntent ?? result.newIntent ?? "";
}

function getTrainingTargetIntent(result = {}) {
  return getNlpIntent(result) || getLlmIntent(result);
}

function emptyClassification(baseResult = {}) {
  const llmIntent = getLlmIntent(baseResult);
  const nlpIntent = getNlpIntent(baseResult);
  const matchStatus = llmIntent === nlpIntent ? "MATCH" : "UPDATION";

  return {
    ...baseResult,
    llmIntent,
    nlpIntent,
    status: matchStatus,
    legacyMatch: matchStatus === "MATCH" ? "MATCH" : "MISMATCH",
    recommendedIntent: matchStatus === "MATCH" ? llmIntent : llmIntent || nlpIntent || "",
    confidence: "low",
    confidenceGap: 0,
    decisionScore: 0,
  };
}

export function isNoneIntent(intent = "") {
  const normalizedIntent = String(intent || "").trim().toLowerCase();
  return ["", "none", "no_intent", "no intent", "null", "nil", "na", "n/a", "unknown"].includes(normalizedIntent);
}

export function isAccurateAuditResult(result = {}) {
  if (result.status === "MATCH" || result.status === "LLM_HANDLED" || result.status === "GENERATIVE_HANDLED") {
    return true;
  }

  if (result.status === "INVALID_MESSAGE") {
    return isNoneIntent(getNlpIntent(result));
  }

  return false;
}

function uniqueStrings(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function cleanSentence(value = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function sentenceToClause(value = "") {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!?]+$/, "");
}

function humanizeIntentName(intentName = "") {
  return String(intentName || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatKeywordList(keywords = [], limit = 4) {
  const shortlisted = uniqueStrings(keywords)
    .filter((keyword) => keyword && keyword.length >= 3)
    .slice(0, limit);

  if (shortlisted.length === 0) return "";
  if (shortlisted.length === 1) return shortlisted[0];
  if (shortlisted.length === 2) return `${shortlisted[0]} and ${shortlisted[1]}`;

  return `${shortlisted.slice(0, -1).join(", ")}, and ${shortlisted[shortlisted.length - 1]}`;
}

function stripExampleSections(value = "") {
  return String(value || "")
    .replace(/<eg>[\s\S]*/i, "")
    .replace(/\bdo not use for\b[\s\S]*/i, "")
    .replace(/\bwith coverage for equivalent user phrasing[\s\S]*/i, "")
    .replace(/\bprioritize natural variations[\s\S]*/i, "")
    .replace(/\bexclude neighboring intents[\s\S]*/i, "")
    .replace(/\bkeep the description focused[\s\S]*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function joinDefinitionSentences(parts = []) {
  return parts
    .filter(Boolean)
    .map(cleanSentence)
    .join(" ");
}

const DESCRIPTION_NOISE_WORDS = new Set([
  ...STOP_WORDS,
  "app",
  "analytics",
  "also",
  "anyone",
  "asap",
  "bro",
  "handle",
  "handling",
  "handles",
  "hello",
  "help",
  "hey",
  "hi",
  "user",
  "users",
  "request",
  "requests",
  "intent",
  "issue",
  "issues",
  "kindly",
  "minute",
  "minutes",
  "please",
  "plz",
  "related",
  "clear",
  "clearly",
  "every",
  "few",
  "need",
  "number",
  "since",
  "team",
  "thanks",
  "today",
  "tomorrow",
  "urgent",
  "urgently",
  "yesterday",
  "same",
  "still",
  "then",
  "maps",
  "mapping",
]);

function descriptionTokens(value = "") {
  return tokenize(value).filter((token) => token.length >= 3 && !DESCRIPTION_NOISE_WORDS.has(token));
}

function extractPhraseCandidates(message = "") {
  const tokens = descriptionTokens(message);
  const phrases = [...tokens];

  for (let index = 0; index < tokens.length - 1; index += 1) {
    phrases.push(`${tokens[index]} ${tokens[index + 1]}`);
  }

  return uniqueStrings(phrases).filter((phrase) => {
    const phraseTokens = phrase.split(" ").filter(Boolean);
    return phraseTokens.length > 0 && phraseTokens.every((token) => !DESCRIPTION_NOISE_WORDS.has(token));
  });
}

function computePhraseDocumentStats(documents = []) {
  const stats = new Map();

  documents.forEach((document) => {
    const phrases = extractPhraseCandidates(document);
    phrases.forEach((phrase) => {
      stats.set(phrase, (stats.get(phrase) || 0) + 1);
    });
  });

  return stats;
}

function buildPhraseProfile(intentName, positiveMessages = [], negativeMessages = [], baselineDescription = "", limit = 6) {
  const positiveDocs = uniqueStrings([...positiveMessages, baselineDescription].filter(Boolean));
  const negativeDocs = uniqueStrings(negativeMessages);
  const allDocs = [...positiveDocs, ...negativeDocs];

  if (!positiveDocs.length) {
    return [];
  }

  const positiveStats = computePhraseDocumentStats(positiveDocs);
  const negativeStats = computePhraseDocumentStats(negativeDocs);
  const globalStats = computePhraseDocumentStats(allDocs);
  const normalizedIntentName = normalizeText(intentName);
  const totalDocCount = allDocs.length || 1;

  return [...positiveStats.entries()]
    .map(([phrase, positiveHits]) => {
      const negativeHits = negativeStats.get(phrase) || 0;
      const docFrequency = globalStats.get(phrase) || 1;
      const idf = Math.log(1 + totalDocCount / docFrequency);
      const phraseLengthBoost = phrase.includes(" ") ? 1.2 : 1;
      const intentPenalty =
        normalizedIntentName.includes(phrase) || phrase.includes(normalizedIntentName) ? 0.75 : 1;
      const score =
        ((positiveHits / positiveDocs.length) * 1.4 - (negativeHits / Math.max(negativeDocs.length, 1)) * 0.9) *
        idf *
        phraseLengthBoost *
        intentPenalty;

      return {
        phrase,
        score,
        positiveHits,
        negativeHits,
      };
    })
    .filter((entry) => entry.score > 0.08)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.phrase.split(" ").length !== a.phrase.split(" ").length) {
        return b.phrase.split(" ").length - a.phrase.split(" ").length;
      }
      return b.positiveHits - a.positiveHits;
    })
    .slice(0, limit);
}

function selectRepresentativeUtterances(messages = [], topPhrases = [], limit = 4) {
  const uniqueMessages = uniqueStrings(messages);
  if (!uniqueMessages.length) return [];

  const scored = uniqueMessages.map((message) => {
    const normalized = normalizeText(message);
    const tokens = descriptionTokens(message);
    const phraseCoverage = topPhrases.reduce((sum, phrase, index) => {
      if (!normalized.includes(phrase)) return sum;
      return sum + (topPhrases.length - index);
    }, 0);
    const lexicalRichness = uniqueStrings(tokens).length / Math.max(tokens.length, 1);
    const score = phraseCoverage * 2 + lexicalRichness + Math.min(message.length / 120, 1);

    return { message, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.message);
}

function topFrequentPhrases(messages = [], limit = 4) {
  const counts = new Map();

  messages.forEach((message) => {
    descriptionTokens(message).forEach((token) => {
      counts.set(token, (counts.get(token) || 0) + 1);
    });
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([token]) => token);
}

const DESCRIPTION_FILLER_PATTERNS = [
  /\b(?:hi|hello|hey|bro|please|plz|kindly)\b/gi,
  /\b(?:team|support|sir|madam)\b/gi,
  /\b(?:i|we)\s+(?:want|need|would like|am trying|was trying|have been trying)\s+(?:to\s+)?/gi,
  /\bcan you(?: please)?\b/gi,
  /\bcould you(?: please)?\b/gi,
  /\bhelp me(?: out)?\b/gi,
  /\bi(?: am|'m)\s+(?:facing|seeing|getting|having)\b/gi,
  /\b(?:because|since)\b/gi,
];

const CLAUSE_BREAK_PATTERN = /[,.!?;\n]+|\s+(?:but|and|because|so|after|while|although|however)\s+/i;
const ACTION_HINT_WORDS = new Set([
  "browse",
  "browsing",
  "activate",
  "buy",
  "cancel",
  "change",
  "check",
  "complaint",
  "deduction",
  "disconnect",
  "disconnecting",
  "disconnected",
  "disable",
  "drop",
  "dropping",
  "enable",
  "expire",
  "expired",
  "internet",
  "issue",
  "login",
  "network",
  "not",
  "payment",
  "plan",
  "port",
  "problem",
  "recharge",
  "refund",
  "renew",
  "restore",
  "service",
  "slow",
  "sms",
  "start",
  "status",
  "stop",
  "update",
  "usage",
  "validity",
  "working",
]);

function normalizeWhitespace(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function trimClauseNoise(value = "") {
  let text = normalizeWhitespace(value);
  DESCRIPTION_FILLER_PATTERNS.forEach((pattern) => {
    text = text.replace(pattern, " ");
  });

  return text
    .replace(/^[,\-: ]+/, "")
    .replace(/[,\-: ]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitMessageClauses(message = "") {
  return normalizeWhitespace(message)
    .split(CLAUSE_BREAK_PATTERN)
    .map((part) => trimClauseNoise(part))
    .filter((part) => part && part.length >= 12);
}

function scoreCoverageClause(clause = "", topKeywords = [], index = 0) {
  const normalizedClause = normalizeText(clause);
  const clauseTokens = descriptionTokens(clause);
  if (!clauseTokens.length) return 0;

  const keywordHits = topKeywords.reduce((count, keyword) => {
    return normalizedClause.includes(normalizeText(keyword)) ? count + 1 : count;
  }, 0);
  const actionHits = clauseTokens.filter((token) => ACTION_HINT_WORDS.has(token)).length;
  const lexicalRichness = uniqueStrings(clauseTokens).length / clauseTokens.length;
  const lengthScore = Math.min(clause.length / 90, 1);
  const positionBoost = index === 0 ? 0.2 : Math.max(0, 0.12 - index * 0.03);

  return keywordHits * 1.8 + actionHits * 0.4 + lexicalRichness + lengthScore + positionBoost;
}

function compressCoverageClause(clause = "", topKeywords = []) {
  const cleaned = trimClauseNoise(clause)
    .replace(/\b(?:my|our|his|her|their)\b/gi, " ")
    .replace(/\b(?:account|number|sim|connection)\b/gi, (match) => match.toLowerCase())
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "";

  const tokens = cleaned.split(" ");
  const normalizedKeywords = topKeywords.map((keyword) => normalizeText(keyword)).filter(Boolean);

  if (tokens.length <= 14) {
    return sentenceToClause(cleaned);
  }

  const shortenedTokens = [];
  for (const token of tokens) {
    shortenedTokens.push(token);
    const current = shortenedTokens.join(" ");
    const normalizedCurrent = normalizeText(current);
    const hasKeyword = normalizedKeywords.some((keyword) => normalizedCurrent.includes(keyword));
    const hasAction = descriptionTokens(current).some((item) => ACTION_HINT_WORDS.has(item));

    if (shortenedTokens.length >= 8 && (hasKeyword || hasAction)) {
      break;
    }

    if (shortenedTokens.length >= 14) {
      break;
    }
  }

  return sentenceToClause(shortenedTokens.join(" "));
}

function buildThemeFromClause(clause = "", topKeywords = []) {
  const clauseTokens = descriptionTokens(clause);
  const normalizedKeywords = topKeywords.map((keyword) => normalizeText(keyword)).filter(Boolean);
  const candidates = extractPhraseCandidates(clause)
    .map((phrase) => {
      const phraseTokens = phrase.split(" ").filter(Boolean);
      const actionHits = phraseTokens.filter((token) => ACTION_HINT_WORDS.has(token)).length;
      const keywordBoost = normalizedKeywords.includes(normalizeText(phrase)) ? 2.5 : 0;
      const multiWordBoost = phraseTokens.length > 1 ? 1.2 : 0;

      return {
        phrase,
        score: keywordBoost + actionHits * 1.3 + multiWordBoost + Math.min(phrase.length / 24, 1),
      };
    })
    .filter((entry) => entry.score >= 1.6)
    .sort((a, b) => b.score - a.score);

  const bestCandidate = candidates[0]?.phrase;
  if (bestCandidate) {
    const bestTokens = bestCandidate.split(" ").filter(Boolean);
    if (bestTokens.length <= 2) {
      const matchIndex = clauseTokens.findIndex((_, index) => {
        return clauseTokens.slice(index, index + bestTokens.length).join(" ") === bestCandidate;
      });

      if (matchIndex > 0) {
        const previousToken = clauseTokens[matchIndex - 1];
        if (previousToken && !DESCRIPTION_NOISE_WORDS.has(previousToken) && !ACTION_HINT_WORDS.has(previousToken)) {
          return sentenceToClause(`${previousToken} ${bestCandidate}`);
        }
      }
    }

    return sentenceToClause(bestCandidate);
  }

  return compressCoverageClause(clause, topKeywords);
}

function buildCoverageHighlights(messages = [], topKeywords = [], limit = 3) {
  const highlights = [];

  uniqueStrings(messages).forEach((message) => {
    const clauses = splitMessageClauses(message);
    const candidates = (clauses.length ? clauses : [message])
      .map((clause, index) => ({
        clause,
        score: scoreCoverageClause(clause, topKeywords, index),
      }))
      .sort((a, b) => b.score - a.score);

    const bestClause = candidates[0]?.clause || "";
    const compressed = buildThemeFromClause(bestClause, topKeywords);
    const normalizedCompressed = normalizeText(compressed);

    if (
      compressed &&
      normalizedCompressed &&
      !highlights.some((item) => item.normalized === normalizedCompressed)
    ) {
      highlights.push({
        text: compressed,
        normalized: normalizedCompressed,
        score: candidates[0]?.score || 0,
      });
    }
  });

  return highlights
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.text);
}

function buildDynamicCoverageClause(topKeywords = [], coverageHighlights = []) {
  const cleanHighlights = uniqueStrings(coverageHighlights)
    .map((item) => sentenceToClause(item))
    .filter(Boolean)
    .slice(0, 3);

  if (cleanHighlights.length) {
    return `Covers requests about ${formatKeywordList(cleanHighlights, 3)} and equivalent phrasings that express the same underlying need`;
  }

  const keywordList = formatKeywordList(topKeywords, 5);
  if (keywordList) {
    return `Covers requests related to ${keywordList} and equivalent phrasings that still map to this intent`;
  }

  return "Covers equivalent phrasings and longer user explanations that point to the same underlying need";
}

export function generateIntentDescriptionRecommendation(intentName, intentDescriptions = {}, auditResults = []) {
  const currentDescription = intentDescriptions[intentName] || {};
  const collaborativeDescription = currentDescription.appAnalytics || "";
  const baselineDescription =
    collaborativeDescription || currentDescription.updated || currentDescription.old || "";
  const readableIntentName = humanizeIntentName(intentName) || intentName;
  const supportiveResults = auditResults.filter(
    (result) =>
      getLlmIntent(result) === intentName ||
      getNlpIntent(result) === intentName ||
      result.recommendedIntent === intentName
  );

  const correctlyHandledMessages = supportiveResults
    .filter((result) => result.status === "MATCH" || result.status === "LLM_HANDLED")
    .map((result) => result.message);

  const conflictResults = supportiveResults.filter(
    (result) =>
      getLlmIntent(result) === intentName &&
      getNlpIntent(result) &&
      getNlpIntent(result) !== intentName &&
      result.status !== "MATCH"
  );

  const conflictIntents = uniqueStrings(conflictResults.map((result) => getNlpIntent(result))).slice(0, 4);
  const positiveMessages = uniqueStrings(
    correctlyHandledMessages.length ? correctlyHandledMessages : supportiveResults.map((result) => result.message)
  );
  const negativeMessages = uniqueStrings(conflictResults.map((result) => result.message));
  const phraseProfile = buildPhraseProfile(intentName, positiveMessages, negativeMessages, baselineDescription, 6);
  const topKeywords = phraseProfile.length
    ? phraseProfile.map((entry) => entry.phrase)
    : topFrequentPhrases(positiveMessages, 6);
  const representativeUtterances = selectRepresentativeUtterances(positiveMessages, topKeywords, 4);
  const coverageHighlights = buildCoverageHighlights(positiveMessages, topKeywords, 3);

  const cleanedBaselineDescription = stripExampleSections(baselineDescription);
  const baselineClause = sentenceToClause(cleanedBaselineDescription);
  const refinedBaseClause = baselineClause
    ? baselineClause
    : `User wants help with ${readableIntentName} for their Vi account`;

  const keywordList = formatKeywordList(topKeywords);
  const includeClause = buildDynamicCoverageClause(topKeywords, coverageHighlights);

  const excludeClause = conflictIntents.length
    ? `Does not apply when the user is actually asking for ${formatKeywordList(conflictIntents)}`
    : "Does not apply to neighboring intents that require a different action, workflow, or business outcome";

  const rewrittenDescription = joinDefinitionSentences([refinedBaseClause, includeClause, excludeClause]);

  const additiveNotes = [
    keywordList
      ? `Observed high-signal phrasing: ${keywordList}.`
      : "Expanded coverage from newly observed natural variations of the same intent.",
    coverageHighlights.length
      ? `Compressed long utterances into reusable coverage themes: ${formatKeywordList(coverageHighlights, 3)}.`
      : "",
    conflictIntents.length
      ? `Primary exclusions: ${formatKeywordList(conflictIntents)}.`
      : "Primary exclusions remain neighboring intents with different downstream actions.",
    representativeUtterances.length ? "Observed utterances are shown separately for review and training support." : "",
  ].filter(Boolean);

  const trainingPayload = {
    intent: intentName,
    oldDescription: baselineDescription,
    updatedDescription: rewrittenDescription,
    shouldHandleUtterances: representativeUtterances,
    shouldAvoidIntents: conflictIntents,
    supportingKeywords: topKeywords,
    coverageHighlights,
    phraseProfile,
  };

  return {
    intent: intentName,
    currentDescription,
    oldDescription: baselineDescription,
    collaborativeDescription,
    recommendation: rewrittenDescription,
    additiveNotes,
    topKeywords,
    phraseProfile,
    coverageHighlights,
    representativeUtterances,
    conflictingIntents: conflictIntents,
    usingSharedAppAnalyticsColumn: Boolean(collaborativeDescription),
    trainingPayload,
  };
}

export function generateBulkIntentRecommendations(auditResults = [], intentDescriptions = {}) {
  const intentsToUpdate = uniqueStrings(
    auditResults
      .filter(
        (result) =>
          result.status === "UPDATION" &&
          getTrainingTargetIntent(result) &&
          !isNoneIntent(getTrainingTargetIntent(result))
      )
      .map((result) => getTrainingTargetIntent(result))
  );

  return intentsToUpdate.map((intentName) => {
    const relatedResults = auditResults.filter((result) => getTrainingTargetIntent(result) === intentName);
    const recommendation = generateIntentDescriptionRecommendation(intentName, intentDescriptions, auditResults);

    return {
      ...recommendation,
      affectedCount: relatedResults.length,
      mismatchTargets: uniqueStrings(
        relatedResults
          .filter((result) => getLlmIntent(result) && getLlmIntent(result) !== intentName)
          .map((result) => getLlmIntent(result))
      ).slice(0, 6),
    };
  });
}

export function generateUnhandledIntentWatchlist(auditResults = []) {
  const grouped = new Map();

  auditResults
    .filter(
      (result) =>
        isNoneIntent(getLlmIntent(result)) &&
        result.status !== "LLM_HANDLED" &&
        result.status !== "GENERATIVE_HANDLED" &&
        !isNoneIntent(getNlpIntent(result))
    )
    .forEach((result) => {
      const nlpIntent = getNlpIntent(result);
      const current = grouped.get(nlpIntent) || {
        intent: nlpIntent,
        count: 0,
        samples: [],
      };

      current.count += 1;
      if (result.message && current.samples.length < 3) current.samples.push(result.message);
      grouped.set(nlpIntent, current);
    });

  return [...grouped.values()].sort((a, b) => b.count - a.count);
}

export function evaluateGenerativeHandling(result = {}, intentDescriptions = {}) {
  const llmIntent = getLlmIntent(result);
  const nlpIntent = getNlpIntent(result);
  const generateResponse = String(result.generateResponse || "").trim();

  if (!isNoneIntent(llmIntent) || isNoneIntent(nlpIntent) || !generateResponse) {
    return {
      handled: false,
      reason: "not_applicable",
      score: 0,
      confidence: "low",
    };
  }

  const lowValuePatterns = [
    "i do not know",
    "i don't know",
    "cannot help",
    "can't help",
    "contact customer care",
    "please contact customer care",
    "sorry",
    "unable to",
    "not able to",
  ];
  const normalizedResponse = normalizeText(generateResponse);
  const looksGenericFallback =
    generateResponse.length < 40 ||
    lowValuePatterns.some((pattern) => normalizedResponse.includes(pattern));

  const responseAnalysis = compareIntentChoices(
    `${result.message || ""} ${generateResponse}`,
    intentDescriptions,
    [nlpIntent]
  );
  const nlpEntry = responseAnalysis.rankings.find((entry) => entry.intent === nlpIntent);
  const nlpScore = nlpEntry?.score || 0;
  const definitionAlignment = nlpEntry?.signals?.definitionAlignment || 0;
  const handled = !looksGenericFallback && nlpScore >= 0.26 && definitionAlignment >= 0.1;

  return {
    handled,
    reason: handled ? "generative_response_aligned" : looksGenericFallback ? "generic_fallback_response" : "weak_intent_alignment",
    score: nlpScore,
    confidence: responseAnalysis.summary.confidence,
    analysis: responseAnalysis,
  };
}

export function evaluateInvalidMessageHandling(result = {}, intentDescriptions = {}) {
  const llmIntent = getLlmIntent(result);
  const nlpIntent = getNlpIntent(result);
  const generateResponse = String(result.generateResponse || "").trim();

  if (!detectInvalidMessage(result.message || "")) {
    return {
      accurate: false,
      reason: "not_invalid",
      score: 0,
    };
  }

  if (isNoneIntent(nlpIntent)) {
    return {
      accurate: true,
      reason: "nlp_returned_none",
      score: 1,
    };
  }

  if (!generateResponse) {
    return {
      accurate: false,
      reason: "no_session_response_available",
      score: 0,
    };
  }

  const responseAnalysis = compareIntentChoices(
    `${result.message || ""} ${generateResponse}`,
    intentDescriptions,
    [nlpIntent]
  );
  const nlpEntry = responseAnalysis.rankings.find((entry) => entry.intent === nlpIntent);
  const nlpScore = nlpEntry?.score || 0;
  const definitionAlignment = nlpEntry?.signals?.definitionAlignment || 0;

  // For invalid inputs, a weak alignment between what was actually shown and the routed intent
  // means the user did not really get pushed into that intent flow, which is acceptable.
  const accurate = nlpScore < 0.24 || definitionAlignment < 0.1;

  return {
    accurate,
    reason: accurate ? "shown_response_did_not_follow_wrong_intent" : "shown_response_aligned_with_wrong_intent",
    score: nlpScore,
    confidence: responseAnalysis.summary.confidence,
    analysis: responseAnalysis,
    llmIntent,
    nlpIntent,
  };
}

export function classifyAuditResult(baseResult, intentDescriptions = {}) {
  const llmIntent = getLlmIntent(baseResult);
  const nlpIntent = getNlpIntent(baseResult);

  if (!baseResult?.message) {
    return emptyClassification({ ...baseResult, llmIntent, nlpIntent });
  }

  if (detectInvalidMessage(baseResult.message)) {
    const invalidHandling = evaluateInvalidMessageHandling(
      {
        ...baseResult,
        llmIntent,
        nlpIntent,
      },
      intentDescriptions
    );

    return {
      ...baseResult,
      llmIntent,
      nlpIntent,
      status: "INVALID_MESSAGE",
      legacyMatch: "MISMATCH",
      recommendedIntent: "",
      confidence: "low",
      confidenceGap: 0,
      decisionScore: 0,
      llmScore: 0,
      nlpScore: 0,
      accurate: invalidHandling.accurate,
      invalidHandledReason: invalidHandling.reason,
      invalidHandlingAnalysis: invalidHandling.analysis,
    };
  }

  const generativeHandling = evaluateGenerativeHandling(
    {
      ...baseResult,
      llmIntent,
      nlpIntent,
    },
    intentDescriptions
  );

  if (generativeHandling.handled) {
    return {
      ...baseResult,
      llmIntent,
      nlpIntent,
      status: "GENERATIVE_HANDLED",
      legacyMatch: "MATCH",
      recommendedIntent: "",
      confidence: generativeHandling.confidence,
      confidenceGap: 0,
      decisionScore: generativeHandling.score,
      llmScore: 0,
      nlpScore: generativeHandling.score,
      llmDefinitionAlignment: 0,
      nlpDefinitionAlignment:
        generativeHandling.analysis?.rankings.find((entry) => entry.intent === nlpIntent)?.signals?.definitionAlignment || 0,
      accurate: true,
      generateHandledReason: generativeHandling.reason,
      generateHandlingAnalysis: generativeHandling.analysis,
    };
  }

  const analysis = compareIntentChoices(baseResult.message, intentDescriptions, [
    llmIntent,
    nlpIntent,
  ]);

  const llmEntry = analysis.rankings.find((entry) => entry.intent === llmIntent);
  const nlpEntry = analysis.rankings.find((entry) => entry.intent === nlpIntent);
  const llmScore = llmEntry?.score || 0;
  const nlpScore = nlpEntry?.score || 0;
  const llmDefinitionAlignment = llmEntry?.signals?.definitionAlignment || 0;
  const nlpDefinitionAlignment = nlpEntry?.signals?.definitionAlignment || 0;
  const scoreGap = llmScore - nlpScore;
  const definitionGap = llmDefinitionAlignment - nlpDefinitionAlignment;

  let status = "UPDATION";
  let recommendedIntent = analysis.summary.topIntent?.intent || llmIntent || nlpIntent || "";

  if (llmIntent === nlpIntent) {
    status = "MATCH";
    recommendedIntent = llmIntent;
  } else if (
    llmIntent &&
    llmScore >= 0.24 &&
    scoreGap >= 0.03 &&
    llmDefinitionAlignment >= 0.12 &&
    definitionGap >= 0.03 &&
    analysis.summary.topIntent?.intent === llmIntent
  ) {
    status = "LLM_HANDLED";
    recommendedIntent = llmIntent;
  } else if (llmIntent) {
    status = "UPDATION";
    recommendedIntent = llmIntent;
  }

  return {
    ...baseResult,
    llmIntent,
    nlpIntent,
    status,
    legacyMatch: status === "MATCH" ? "MATCH" : "MISMATCH",
    recommendedIntent,
    confidence: analysis.summary.confidence,
    confidenceGap: analysis.summary.confidenceGap,
    decisionScore: Math.max(llmScore, nlpScore),
    llmScore,
    nlpScore,
    llmDefinitionAlignment,
    nlpDefinitionAlignment,
    accurate: isAccurateAuditResult({ ...baseResult, status }),
    analysis,
  };
}
