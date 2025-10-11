import { CustomerRecord, mockRecords } from "./dataset";

export type LookupResult = {
  record: CustomerRecord | null;
  suggestions: CustomerRecord[];
};

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, "");

const fieldsToSearch = (record: CustomerRecord) => [
  record.plateNumber,
  record.fullName,
  record.cccd
];

export function lookup(term: string): LookupResult {
  if (!term.trim()) {
    return { record: null, suggestions: [] };
  }

  const normalized = normalize(term);

  const suggestions = mockRecords
    .filter((record) =>
      fieldsToSearch(record).some((field) => normalize(field).includes(normalized))
    )
    .slice(0, 5);

  const record = suggestions.find((item) =>
    fieldsToSearch(item).some((field) => normalize(field) === normalized)
  ) ?? null;

  return { record, suggestions };
}
