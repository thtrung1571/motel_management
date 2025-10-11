"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition
} from "react";
import {
  LookupResult,
  LookupSuggestion,
  fetchCustomerDetails,
  fetchSuggestions,
  resolveLookup
} from "../lib/search";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem
} from "./command";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Loader2 } from "lucide-react";
import clsx from "clsx";

const INITIAL_STATE: LookupResult = { record: null, suggestions: [] };

type SearchBoxProps = {
  onResult: (result: LookupResult) => void;
};

export function SearchBox({ onResult }: SearchBoxProps) {
  const [term, setTerm] = useState("");
  const [suggestions, setSuggestions] = useState<LookupSuggestion[]>([]);
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [isLoadingSuggestions, startSuggestionTransition] = useTransition();

  const hasSuggestions = suggestions.length > 0 && term.trim().length > 0;

  useEffect(() => {
    if (!term.trim()) {
      setSuggestions([]);
      onResult(INITIAL_STATE);
      return;
    }

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      startSuggestionTransition(async () => {
        const nextSuggestions = await fetchSuggestions(term, controller.signal);
        if (!controller.signal.aborted) {
          setSuggestions(nextSuggestions);
        }
      });
    }, 200);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [term, startSuggestionTransition, onResult]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = term.trim();

    if (!value) {
      onResult(INITIAL_STATE);
      setSuggestions([]);
      return;
    }

    startSubmitTransition(async () => {
      const result = await resolveLookup(value);
      onResult(result);
      setSuggestions(result.suggestions);
    });
  };

  const handleSuggestionSelect = useCallback(
    (value: string) => {
      const selected = suggestions.find((item) => String(item.id) === value);
      if (!selected) {
        return;
      }

      setTerm(selected.carNumber);
      startSubmitTransition(async () => {
        const record = await fetchCustomerDetails(selected.id);
        onResult({
          record,
          suggestions
        });
      });
    },
    [onResult, suggestions, startSubmitTransition]
  );

  const suggestionItems = useMemo(
    () =>
      suggestions.map((suggestion) => (
        <CommandItem
          key={suggestion.id}
          value={String(suggestion.id)}
          onSelect={handleSuggestionSelect}
        >
          <div className="flex flex-col text-left">
            <span className="font-medium">{suggestion.carNumber}</span>
            <span className="text-xs text-slate-400">{suggestion.fullName}</span>
          </div>
        </CommandItem>
      )),
    [handleSuggestionSelect, suggestions]
  );

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl">
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
            (isSubmitting || isLoadingSuggestions) && "pr-4"
          )}
        >
          {(isSubmitting || isLoadingSuggestions) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
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
        <CommandGroup heading="Gợi ý">{suggestionItems}</CommandGroup>
      </Command>
    </form>
  );
}
