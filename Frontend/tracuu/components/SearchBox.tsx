"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { performLookup } from "../app/actions";
import { LookupResult } from "../lib/search";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "./command";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Loader2 } from "lucide-react";
import clsx from "clsx";

const INITIAL_STATE: LookupResult = { record: null, suggestions: [] };

type SearchBoxProps = {
  onResult: (result: LookupResult) => void;
};

export function SearchBox({ onResult }: SearchBoxProps) {
  const [term, setTerm] = useState("");
  const [state, formAction, isPending] = useActionState(async (_prev: LookupResult, formData: FormData) => {
    const value = String(formData.get("term") ?? "");
    const next = await performLookup(value);
    onResult(next);
    setTerm(value);
    return next;
  }, INITIAL_STATE);
  const [suggestions, setSuggestions] = useState(INITIAL_STATE.suggestions);
  const [isLoadingSuggestions, startTransition] = useTransition();

  useEffect(() => {
    setSuggestions(state.suggestions);
  }, [state]);

  useEffect(() => {
    if (!term) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      startTransition(async () => {
        const result = await performLookup(term);
        if (!controller.signal.aborted) {
          setSuggestions(result.suggestions);
        }
      });
    }, 200);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [term, startTransition]);

  const hasSuggestions = suggestions.length > 0 && term.length > 0;

  const suggestionItems = useMemo(
    () =>
      suggestions.map((suggestion) => (
        <CommandItem
          key={suggestion.plateNumber}
          value={suggestion.plateNumber}
          onSelect={(value) => {
            const match = suggestions.find((item) => item.plateNumber === value);
            if (match) {
              const result: LookupResult = { record: match, suggestions: suggestions.slice(0, 5) };
              onResult(result);
              setTerm(match.plateNumber);
            }
          }}
        >
          <div className="flex flex-col text-left">
            <span className="font-medium">{suggestion.plateNumber}</span>
            <span className="text-xs text-slate-400">{suggestion.fullName}</span>
          </div>
        </CommandItem>
      )),
    [suggestions, onResult]
  );

  return (
    <form action={formAction} className="w-full max-w-xl">
      <label htmlFor="term" className="sr-only">
        Tra cứu biển số hoặc CCCD
      </label>
      <div className="relative">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          id="term"
          name="term"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Nhập biển số, tên hoặc CCCD"
          autoComplete="off"
          className="w-full rounded-full border border-slate-700/60 bg-slate-900/80 py-4 pl-12 pr-14 text-base text-slate-100 shadow-inner placeholder:text-slate-500 focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          type="submit"
          className={clsx(
            "absolute right-2 top-1/2 flex h-10 -translate-y-1/2 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-white shadow-lg transition hover:bg-primary/90",
            (isPending || isLoadingSuggestions) && "pr-4"
          )}
        >
          {(isPending || isLoadingSuggestions) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Tra cứu
        </button>
      </div>
      <Command open={hasSuggestions} className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/90">
        <CommandInput
          aria-hidden
          className="hidden"
          value={term}
          onValueChange={setTerm}
          placeholder="Nhập biển số"
        />
        <CommandEmpty>Không có gợi ý phù hợp</CommandEmpty>
        <CommandGroup heading="Gợi ý">
          {suggestionItems}
        </CommandGroup>
      </Command>
    </form>
  );
}
