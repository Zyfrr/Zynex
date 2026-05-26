const patterns = [
  { type: "EMAIL", regex: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi },
  { type: "PHONE", regex: /(?:\+91[-\s]?)?[6-9]\d{9}/g },
  { type: "AADHAAR", regex: /\b\d{4}\s?\d{4}\s?\d{4}\b/g }
];

export function redactPII(input: string) {
  return patterns.reduce((value, pattern) => value.replace(pattern.regex, `[REDACTED_${pattern.type}]`), input);
}

export function redactPIIWithEvents(input: string, fieldName = "preview") {
  const events: Array<{ fieldName: string; redactionType: string; count: number }> = [];
  let value = input;

  for (const pattern of patterns) {
    const matches = value.match(pattern.regex);
    if (!matches?.length) continue;
    events.push({ fieldName, redactionType: pattern.type, count: matches.length });
    value = value.replace(pattern.regex, `[REDACTED_${pattern.type}]`);
  }

  return { value, events };
}
