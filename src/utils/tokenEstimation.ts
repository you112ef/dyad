/**
 * Client-side token estimation utilities
 * Provides approximate token counts for various AI models without server dependencies
 */

// Common token patterns for different model families
const TOKEN_PATTERNS = {
  // OpenAI models (GPT-3.5, GPT-4, etc.)
  openai: {
    avgCharsPerToken: 4,
    punctuationWeight: 0.5,
    numberWeight: 1.2
  },
  // Anthropic models (Claude)
  anthropic: {
    avgCharsPerToken: 3.8,
    punctuationWeight: 0.6,
    numberWeight: 1.1
  },
  // Generic models (for other providers)
  generic: {
    avgCharsPerToken: 4.2,
    punctuationWeight: 0.7,
    numberWeight: 1.0
  }
};

export interface TokenEstimate {
  tokens: number;
  characters: number;
  words: number;
  method: 'estimated' | 'calculated';
}

/**
 * Estimate tokens for text using simple heuristics
 */
export function estimateTokens(text: string, modelFamily: 'openai' | 'anthropic' | 'generic' = 'generic'): TokenEstimate {
  if (!text || text.trim().length === 0) {
    return {
      tokens: 0,
      characters: 0,
      words: 0,
      method: 'calculated'
    };
  }

  const patterns = TOKEN_PATTERNS[modelFamily];
  const characters = text.length;
  const words = text.trim().split(/\s+/).length;
  
  // Count different types of content
  const punctuationCount = (text.match(/[^\w\s]/g) || []).length;
  const numberCount = (text.match(/\d+/g) || []).length;
  const whitespaceCount = (text.match(/\s/g) || []).length;
  
  // Base estimation using character count
  let estimatedTokens = characters / patterns.avgCharsPerToken;
  
  // Adjust for punctuation (often treated as separate tokens)
  estimatedTokens += punctuationCount * patterns.punctuationWeight;
  
  // Adjust for numbers (can be tokenized differently)
  estimatedTokens += numberCount * patterns.numberWeight;
  
  // Reduce for whitespace (usually not counted as separate tokens)
  estimatedTokens -= whitespaceCount * 0.8;
  
  // Apply minimum and rounding
  const finalTokens = Math.max(1, Math.round(estimatedTokens));
  
  return {
    tokens: finalTokens,
    characters,
    words,
    method: 'estimated'
  };
}

/**
 * Get model family from model name
 */
export function getModelFamily(modelName: string): 'openai' | 'anthropic' | 'generic' {
  const name = modelName.toLowerCase();
  
  if (name.includes('gpt') || name.includes('openai') || name.includes('davinci') || name.includes('ada')) {
    return 'openai';
  }
  
  if (name.includes('claude') || name.includes('anthropic')) {
    return 'anthropic';
  }
  
  return 'generic';
}

/**
 * Estimate tokens for a message array (chat format)
 */
export function estimateMessageTokens(
  messages: Array<{ role: string; content: string }>,
  modelName: string = 'generic'
): TokenEstimate {
  const modelFamily = getModelFamily(modelName);
  let totalTokens = 0;
  let totalCharacters = 0;
  let totalWords = 0;
  
  for (const message of messages) {
    const estimate = estimateTokens(message.content, modelFamily);
    totalTokens += estimate.tokens;
    totalCharacters += estimate.characters;
    totalWords += estimate.words;
    
    // Add tokens for role and message formatting (OpenAI format overhead)
    if (modelFamily === 'openai') {
      totalTokens += 4; // Approximate overhead per message
    } else {
      totalTokens += 3; // Generic overhead
    }
  }
  
  // Add conversation start tokens
  if (messages.length > 0) {
    totalTokens += modelFamily === 'openai' ? 3 : 2;
  }
  
  return {
    tokens: Math.round(totalTokens),
    characters: totalCharacters,
    words: totalWords,
    method: 'estimated'
  };
}

/**
 * Estimate tokens for code content
 */
export function estimateCodeTokens(code: string, language: string = ''): TokenEstimate {
  if (!code || code.trim().length === 0) {
    return {
      tokens: 0,
      characters: 0,
      words: 0,
      method: 'calculated'
    };
  }
  
  // Code tends to have more punctuation and special characters
  const characters = code.length;
  const lines = code.split('\n').length;
  
  // Code typically has more tokens per character due to syntax
  let estimatedTokens = characters / 3.5; // More tokens per character for code
  
  // Add tokens for line breaks and structure
  estimatedTokens += lines * 0.5;
  
  // Language-specific adjustments
  const lang = language.toLowerCase();
  if (lang.includes('python') || lang.includes('javascript') || lang.includes('typescript')) {
    estimatedTokens *= 1.1; // These languages tend to be more verbose
  } else if (lang.includes('json') || lang.includes('yaml')) {
    estimatedTokens *= 1.2; // Structured data has many tokens
  }
  
  const words = code.split(/\s+/).length;
  
  return {
    tokens: Math.round(Math.max(1, estimatedTokens)),
    characters,
    words,
    method: 'estimated'
  };
}

/**
 * Get context window size for common models
 */
export function getContextWindow(modelName: string): number {
  const name = modelName.toLowerCase();
  
  // OpenAI models
  if (name.includes('gpt-4o')) return 128000;
  if (name.includes('gpt-4-turbo')) return 128000;
  if (name.includes('gpt-4')) return 8192;
  if (name.includes('gpt-3.5-turbo')) return 16385;
  if (name.includes('gpt-3.5')) return 4096;
  
  // Anthropic models
  if (name.includes('claude-3.5-sonnet')) return 200000;
  if (name.includes('claude-3-opus')) return 200000;
  if (name.includes('claude-3-sonnet')) return 200000;
  if (name.includes('claude-3-haiku')) return 200000;
  if (name.includes('claude-2')) return 100000;
  
  // Google models
  if (name.includes('gemini-pro')) return 30720;
  if (name.includes('gemini-1.5-pro')) return 1048576; // 1M tokens
  
  // Mistral models  
  if (name.includes('mistral-large')) return 32000;
  if (name.includes('mistral-medium')) return 32000;
  if (name.includes('mistral-small')) return 32000;
  
  // Default fallback
  return 4096;
}

/**
 * Simple in-memory cache for token estimates
 */
class TokenCache {
  private cache = new Map<string, TokenEstimate>();
  private maxSize = 1000;
  
  get(key: string): TokenEstimate | undefined {
    return this.cache.get(key);
  }
  
  set(key: string, value: TokenEstimate): void {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }
  
  clear(): void {
    this.cache.clear();
  }
}

export const tokenCache = new TokenCache();