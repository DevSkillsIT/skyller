"use client";

import { Bell, HelpCircle, Settings } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppHeaderProps {
  onOpenPanel: (content: "artifact" | "knowledge" | "settings") => void;
}

export function AppHeader({ onOpenPanel }: AppHeaderProps) {
  const { data: session } = useSession();

  // Extrair dados do usuário da sessão do NextAuth
  const user = session?.user;
  const userName = user?.name || "Usuário";
  const userEmail = user?.email || "usuario@exemplo.com";
  const userImage = user?.image;

  // Gerar iniciais para avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="flex h-11 items-center justify-end bg-background px-4">
      {/* Right Section - Clean icons only */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Bell className="h-4 w-4" />
        </Button>

        {/* Help */}
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <HelpCircle className="h-4 w-4" />
        </Button>

        {/* Settings - Link to settings page */}
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href="/settings">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>

        {/* User Avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 rounded-full p-0 ml-1">
              <Avatar className="h-8 w-8">
                {userImage ? <AvatarImage src={userImage} alt={userName} /> : null}
                <AvatarFallback className="bg-accent text-accent-foreground text-sm">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName}</p>
                <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">Configurações</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <SignOutButton />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
