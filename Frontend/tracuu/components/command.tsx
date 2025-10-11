"use client";

import * as React from "react";
import { Transition } from "@headlessui/react";
import clsx from "clsx";

export function Command(
  { children, open, className }: { children: React.ReactNode; open: boolean; className?: string }
) {
  return (
    <Transition
      show={open}
      enter="transition ease-out duration-150"
      enterFrom="opacity-0 -translate-y-2"
      enterTo="opacity-100 translate-y-0"
      leave="transition ease-in duration-100"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 -translate-y-2"
    >
      <div className={clsx("overflow-hidden", className)}>{children}</div>
    </Transition>
  );
}

export function CommandInput(
  { value, onValueChange }: { value: string; onValueChange: (next: string) => void; placeholder?: string; className?: string; "aria-hidden"?: boolean }
) {
  return (
    <input
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
      className="w-full border-none bg-transparent px-4 py-3 text-sm text-slate-100 outline-none"
    />
  );
}

export function CommandGroup({ children, heading }: { children: React.ReactNode; heading?: string }) {
  return (
    <div className="px-3 py-2">
      {heading && <p className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{heading}</p>}
      <div className="mt-2 space-y-1">{children}</div>
    </div>
  );
}

export function CommandItem({ children, onSelect, value }: { children: React.ReactNode; onSelect: (value: string) => void; value: string }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-slate-100 transition hover:bg-slate-800/70"
    >
      {children}
    </button>
  );
}

export function CommandEmpty({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-6 text-center text-sm text-slate-500">{children}</p>;
}
