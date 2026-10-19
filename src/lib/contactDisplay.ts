import { useQuery } from "@tanstack/react-query";
import { getContactSettings, type ContactSettingsResponse } from "@/lib/api";

export const DEFAULT_ADDRESS =
  "Slip Road Off Waiyaki Way after Westlands Roundabout, Nairobi City, Kenya";
export const DEFAULT_PHONE = "+254 710 767717";
export const DEFAULT_HOURS = [
  "Sunday: 9:00 AM – 9:30 PM",
  "Monday – Saturday: 9:00 AM – 10:00 PM",
];
export const DEFAULT_MAP_EMBED =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.818!2d36.812!3d-1.264!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMcKwMTUnNTAuNCJTIDM2wrA0OCc0My4yIkU!5e0!3m2!1sen!2ske!4v1700000000000!5m2!1sen!2ske";
export const DEFAULT_INSTAGRAM = "https://www.instagram.com/cafekaya254/";

function filled(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function phoneHref(phone: string): string {
  return `tel:${phone.replace(/\s+/g, "")}`;
}

export function httpsUrl(value: string | null | undefined): string | null {
  const trimmed = filled(value);
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" ? trimmed : null;
  } catch {
    return null;
  }
}

export function contactDisplay(settings?: ContactSettingsResponse) {
  const phone = filled(settings?.phone) ?? DEFAULT_PHONE;
  const hours = filled(settings?.hours);
  return {
    address: filled(settings?.address) ?? DEFAULT_ADDRESS,
    phone,
    phoneHref: phoneHref(phone),
    hoursLines: hours ? [hours] : DEFAULT_HOURS,
    mapEmbedUrl: httpsUrl(settings?.map_embed_url) ?? DEFAULT_MAP_EMBED,
    instagramUrl: filled(settings?.instagram_url) ?? DEFAULT_INSTAGRAM,
    facebookUrl: filled(settings?.facebook_url),
    twitterUrl: filled(settings?.twitter_url),
  };
}

export function useContactDisplay() {
  const { data } = useQuery({
    queryKey: ["contact-settings"],
    queryFn: getContactSettings,
    staleTime: 60 * 1000,
  });
  return contactDisplay(data);
}
