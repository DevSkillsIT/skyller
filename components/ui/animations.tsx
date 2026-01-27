"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Variantes de animação para mensagens (baseadas em CSS)
export const messageVariants = {
  initial: "opacity-0 translate-y-5 scale-95",
  animate: "opacity-100 translate-y-0 scale-100 transition-all duration-300 ease-out",
  exit: "opacity-0 -translate-y-5 scale-95 transition-all duration-200 ease-in",
};

// Variantes para fade in
export const fadeInVariants = {
  initial: "opacity-0",
  animate: "opacity-100 transition-opacity duration-200 ease-out",
  exit: "opacity-0 transition-opacity duration-100 ease-in",
};

// Variantes para slide up
export const slideUpVariants = {
  initial: "opacity-0 translate-y-2.5",
  animate: "opacity-100 translate-y-0 transition-all duration-300 ease-out",
  exit: "opacity-0 translate-y-2.5 transition-all duration-200 ease-in",
};

// Componente wrapper para animações
interface AnimatedWrapperProps {
  children: ReactNode;
  className?: string;
  variant?: "message" | "fadeIn" | "slideUp" | "none";
  isAnimating?: boolean;
}

export function AnimatedWrapper({
  children,
  className = "",
  variant = "fadeIn",
  isAnimating = true,
}: AnimatedWrapperProps) {
  const getAnimationClasses = () => {
    if (!isAnimating) return "";

    switch (variant) {
      case "message":
        return messageVariants.animate;
      case "fadeIn":
        return fadeInVariants.animate;
      case "slideUp":
        return slideUpVariants.animate;
      default:
        return "";
    }
  };

  return <div className={cn(getAnimationClasses(), className)}>{children}</div>;
}

// Componente para animar lista de itens
interface AnimatedListProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: boolean;
}

export function AnimatedList({
  children,
  className = "",
  staggerDelay = false,
}: AnimatedListProps) {
  return (
    <div
      className={cn(
        "opacity-100 transition-opacity duration-200",
        staggerDelay && "animate-pulse",
        className
      )}
    >
      {children}
    </div>
  );
}

// Componente para animar item individual da lista
interface AnimatedListItemProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedListItem({ children, className = "", delay = 0 }: AnimatedListItemProps) {
  const delayStyle = delay > 0 ? { animationDelay: `${delay}ms` } : {};

  return (
    <div className={cn(slideUpVariants.animate, className)} style={delayStyle}>
      {children}
    </div>
  );
}

// Hook para animar entrada de componentes
export function useAnimatedMount() {
  return {
    className: "opacity-100 scale-100 transition-all duration-200 ease-out",
    initialClassName: "opacity-0 scale-95",
  };
}

// Utilitários para animações CSS
export const animations = {
  // Animações de entrada
  slideIn: "animate-slide-in",
  fadeIn: "animate-fade-in",
  scaleIn: "animate-scale-in",

  // Animações de saída
  slideOut: "animate-slide-out",
  fadeOut: "animate-fade-out",
  scaleOut: "animate-scale-out",

  // Animações de loading
  spin: "animate-spin",
  pulse: "animate-pulse",
  bounce: "animate-bounce",

  // Animações customizadas
  shimmer: "animate-shimmer",
  slideUp: "animate-slide-up",
  slideDown: "animate-slide-down",
};
