"use client";

import { type ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Hook para detectar tamanho de tela
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
}

// Hook para detectar se é mobile
export function useIsMobile() {
  const { width } = useWindowSize();
  return width < 768;
}

// Hook para detectar se é tablet
export function useIsTablet() {
  const { width } = useWindowSize();
  return width >= 768 && width < 1024;
}

// Hook para detectar se é desktop
export function useIsDesktop() {
  const { width } = useWindowSize();
  return width >= 1024;
}

// Componente responsivo que renderiza diferente por tamanho
interface ResponsiveProps {
  children: ReactNode;
  mobile?: ReactNode;
  tablet?: ReactNode;
  desktop?: ReactNode;
  className?: string;
}

export function Responsive({ children, mobile, tablet, desktop, className }: ResponsiveProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();

  const content =
    mobile && isMobile
      ? mobile
      : tablet && isTablet
        ? tablet
        : desktop && isDesktop
          ? desktop
          : children;

  return <div className={className}>{content}</div>;
}

// Componente que oculta em mobile
export function HiddenOnMobile({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const isMobile = useIsMobile();
  if (isMobile) return null;
  return <div className={className}>{children}</div>;
}

// Componente que mostra apenas em mobile
export function MobileOnly({ children, className }: { children: ReactNode; className?: string }) {
  const isMobile = useIsMobile();
  if (!isMobile) return null;
  return <div className={className}>{children}</div>;
}

// Componente que mostra apenas em desktop
export function DesktopOnly({ children, className }: { children: ReactNode; className?: string }) {
  const isDesktop = useIsDesktop();
  if (!isDesktop) return null;
  return <div className={className}>{children}</div>;
}

// Classes utilitárias para responsividade
export const responsive = {
  // Container
  container: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",

  // Grid
  grid: {
    responsive: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
    twoCols: "grid grid-cols-1 md:grid-cols-2 gap-4",
    threeCols: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
    fourCols: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
  },

  // Flex
  flex: {
    responsive: "flex flex-col md:flex-row gap-4",
    colMobile: "flex flex-col md:flex-row lg:flex-col xl:flex-row gap-4",
  },

  // Text
  text: {
    responsive: "text-sm md:text-base lg:text-lg",
    heading: "text-xl md:text-2xl lg:text-3xl",
    subheading: "text-lg md:text-xl lg:text-2xl",
  },

  // Spacing
  spacing: {
    responsive: "p-4 md:p-6 lg:p-8",
    compact: "p-2 md:p-3 lg:p-4",
    wide: "p-6 md:p-8 lg:p-10",
  },

  // Buttons
  button: {
    responsive: "h-10 px-4 py-2 text-sm md:h-11 md:px-6 md:text-base",
    small: "h-8 px-3 text-xs md:h-9 md:px-4 md:text-sm",
    large: "h-12 px-6 text-base md:h-14 md:px-8 md:text-lg",
  },
};

// Componente de container responsivo
export function ResponsiveContainer({
  children,
  className = "",
  size = "default",
}: {
  children: ReactNode;
  className?: string;
  size?: "compact" | "default" | "wide";
}) {
  const sizeClasses = {
    compact: "max-w-4xl mx-auto px-4 sm:px-6",
    default: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
    wide: "max-w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12",
  };

  return <div className={cn(sizeClasses[size], className)}>{children}</div>;
}

// Hook para orientação da tela
export function useScreenOrientation() {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? "portrait" : "landscape");
    };

    handleOrientationChange();
    window.addEventListener("resize", handleOrientationChange);
    return () => window.removeEventListener("resize", handleOrientationChange);
  }, []);

  return orientation;
}

// Componente que se ajusta à orientação
export function OrientationAware({
  children,
  portrait,
  landscape,
  className,
}: {
  children: ReactNode;
  portrait?: ReactNode;
  landscape?: ReactNode;
  className?: string;
}) {
  const orientation = useScreenOrientation();

  const content =
    portrait && orientation === "portrait"
      ? portrait
      : landscape && orientation === "landscape"
        ? landscape
        : children;

  return <div className={className}>{content}</div>;
}
