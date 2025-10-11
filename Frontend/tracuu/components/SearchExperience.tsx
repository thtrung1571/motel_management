"use client";

import { useState } from "react";
import { LookupResult } from "../lib/search";
import { SearchBox } from "./SearchBox";
import { LookupResultCard } from "./LookupResultCard";

const INITIAL_STATE: LookupResult = { record: null, suggestions: [] };

export function SearchExperience() {
  const [result, setResult] = useState<LookupResult>(INITIAL_STATE);

  return (
    <div className="flex w-full flex-col items-center">
      <SearchBox onResult={setResult} />
      <LookupResultCard result={result} />
    </div>
  );
}
