// Detect common direct attempts to elevate uploaded source text into instructions.
export function containsSourceInjection(excerpt: string): boolean {
 return /\b(?:ignore|disregard|forget|override|bypass|replace)\b[\s\S]{0,100}\b(?:previous|prior|above|system|developer|instructions?|rules?|prompts?)\b|\b(?:system|developer)\s*(?:message|prompt|instructions?)\s*:/i.test(excerpt);
}
