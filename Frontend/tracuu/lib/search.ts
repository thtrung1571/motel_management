export type LookupSuggestion = {
  id: number;
  carNumber: string;
  rawCarNumber: string;
  fullName: string;
  cccd: string;
  visitCount: number;
  lastVisit: string | null;
};

export type RentalHistoryEntry = {
  id: number;
  date: string | null;
  checkOutTime: string | null;
  roomNumber: string | null;
  rentType: string | null;
  totalAmount: number | null;
  note: string;
};

export type CustomerRecord = {
  id: number;
  carNumber: string;
  rawCarNumber: string;
  fullName: string;
  cccd: string;
  visitCount: number;
  lastVisit: string | null;
  placeLiving: string;
  note: string;
  rentalHistory: RentalHistoryEntry[];
};

export type LookupResult = {
  record: CustomerRecord | null;
  suggestions: LookupSuggestion[];
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ||
  'http://localhost:5000/api/public';

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, '');

const toQueryString = (term: string) => encodeURIComponent(term.trim());

const uniqueValues = (suggestion: LookupSuggestion) => {
  const values = [
    suggestion.carNumber,
    suggestion.rawCarNumber,
    suggestion.fullName,
    suggestion.cccd
  ];
  return values.filter((value) => value && value.trim().length > 0);
};

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.headers || {})
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function fetchSuggestions(
  term: string,
  signal?: AbortSignal
): Promise<LookupSuggestion[]> {
  const trimmed = term.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const data = await fetchJson<{
      status: string;
      suggestions: LookupSuggestion[];
    }>(`${API_BASE}/lookup?query=${toQueryString(trimmed)}`, { signal });

    return Array.isArray(data.suggestions) ? data.suggestions : [];
  } catch (error) {
    console.error('Failed to load suggestions', error);
    return [];
  }
}

export async function fetchCustomerDetails(
  id: number
): Promise<CustomerRecord | null> {
  try {
    const data = await fetchJson<{
      status: string;
      customer?: CustomerRecord;
    }>(`${API_BASE}/lookup/${id}`);

    return data.customer ?? null;
  } catch (error) {
    console.error('Failed to load customer details', error);
    return null;
  }
}

export async function resolveLookup(term: string): Promise<LookupResult> {
  const suggestions = await fetchSuggestions(term);
  const normalizedTerm = normalize(term);

  const exactMatch = suggestions.find((suggestion) =>
    uniqueValues(suggestion).some((value) => normalize(value) === normalizedTerm)
  );

  const record = exactMatch ? await fetchCustomerDetails(exactMatch.id) : null;

  return {
    record,
    suggestions
  };
}
