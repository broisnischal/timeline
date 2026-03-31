import { Fragment } from "react";

type LinkifiedTextProps = {
  readonly text: string;
  readonly className?: string;
};

const URL_REGEX = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;
const URL_PART_REGEX = /^(https?:\/\/[^\s<]+|www\.[^\s<]+)$/i;

function splitUrlSuffix(raw: string): { url: string; suffix: string } {
  const match = raw.match(/[),.;!?]+$/);
  if (!match) return { url: raw, suffix: "" };
  return {
    url: raw.slice(0, -match[0].length),
    suffix: match[0],
  };
}

function normalizeHref(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

export function toExternalHref(url: string) {
  return normalizeHref(url.trim());
}

export function isUrlOnlyText(text: string) {
  return URL_PART_REGEX.test(text.trim());
}

export function LinkifiedText({ text, className }: LinkifiedTextProps) {
  const parts = text.split(URL_REGEX);
  return (
    <span className={className}>
      {parts.map((part, idx) => {
        if (!part) return null;
        if (!URL_PART_REGEX.test(part)) {
          return <Fragment key={`txt-${idx}`}>{part}</Fragment>;
        }
        const { url, suffix } = splitUrlSuffix(part);
        return (
          <Fragment key={`url-${idx}`}>
            <a
              href={normalizeHref(url)}
              target="_blank"
              rel="noreferrer noopener"
              className="break-all underline decoration-border/70 underline-offset-2 hover:text-foreground"
            >
              {url}
            </a>
            {suffix}
          </Fragment>
        );
      })}
    </span>
  );
}
