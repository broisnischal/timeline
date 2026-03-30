"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

import { useTheme } from "@/components/theme-provider";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-center"
      expand={false}
      gap={8}
      offset={12}
      mobileOffset={12}
      closeButton={false}
      swipeDirections={["top", "bottom", "left", "right"]}
      icons={{
        success: <CircleCheckIcon className="size-3.5 shrink-0" />,
        info: <InfoIcon className="size-3.5 shrink-0" />,
        warning: <TriangleAlertIcon className="size-3.5 shrink-0" />,
        error: <OctagonXIcon className="size-3.5 shrink-0" />,
        loading: <Loader2Icon className="size-3.5 shrink-0 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "9999px",
          "--width": "min(22rem, calc(100vw - 1.5rem))",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
          title: "cn-toast-title",
          description: "cn-toast-description",
          content: "cn-toast-content",
          icon: "cn-toast-icon",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
