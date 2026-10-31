import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(d: Date | string) {
  return new Date(d).toLocaleString("fr-FR", {
    timeZone: "Africa/Douala",
    dateStyle: "short",
    timeStyle: "short",
  });
}
