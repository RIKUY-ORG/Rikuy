// src/components/navbar.tsx
import { Link } from "react-router-dom";
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@heroui/popover";
import { addToast } from "@heroui/toast";
import { User } from "@heroui/user";
import { UserCircle } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";

import { ThemeSwitch } from "@/components/theme-switch";
import { RikuyLogo } from "./rikuyLogo";
import { useAvatarContext } from "@/context/avatarContext";
import { useIdentityStatus } from "@/hooks/useIdentityStatus";

export const Navbar = () => {
  const { user, authenticated, login, logout, ready } = usePrivy();
  const { AvatarComp } = useAvatarContext();
  const { isVerified, isLoading: identityLoading } = useIdentityStatus();

  return (
    <HeroUINavbar maxWidth="xl" position="sticky">
      {/* Logo - siempre visible */}
      <NavbarContent justify="start">
        <NavbarBrand>
          <Link
            className="flex justify-start items-center gap-2"
            color="foreground"
            to="/"
          >
            <RikuyLogo size={32} title="Logo de RIKUY" />
            <p className="font-bold text-inherit text-xl">RIKUY</p>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      {/* Desktop: Theme switch + Perfil */}
      <NavbarContent className="hidden sm:flex" justify="end">
        <NavbarItem>
          <ThemeSwitch />
        </NavbarItem>
        <NavbarItem>
          {authenticated && user ? (
            <Popover showArrow placement="bottom-end">
              <PopoverTrigger>
                <User
                  as="button"
                  avatarProps={{
                    icon: authenticated && user ? (
                      <AvatarComp
                        size={28}
                        className="text-primary"
                        title="Avatar RIKUY"
                      />
                    ) : (
                      <UserCircle className="text-primary" size={28} />
                    ),
                    isBordered: true,
                    radius: "full",
                    className: "bg-default-100",
                  }}
                  className="transition-transform"
                  description="Usuario RIKUY"
                  name="Perfil"
                />
              </PopoverTrigger>
              <PopoverContent className="p-2">
                <div className="flex flex-col gap-2 min-w-[200px]">
                  <p className="text-sm text-default-600 px-2 py-1">
                    {user.wallet?.address?.slice(0, 6)}...
                    {user.wallet?.address?.slice(-4)}
                  </p>

                  {!identityLoading && !isVerified && (
                    <Button
                      as={Link}
                      href="/verificar-identidad"
                      color="warning"
                      radius="full"
                      size="sm"
                      variant="solid"
                      className="font-semibold"
                    >
                      Verificarme
                    </Button>
                  )}

                  <Button
                    as={Link}
                    href="/denunciar"
                    color="success"
                    radius="full"
                    size="sm"
                    variant="solid"
                  >
                    Denunciar
                  </Button>

                  <Button
                    as={Link}
                    href="/perfil"
                    color="primary"
                    radius="full"
                    size="sm"
                    variant="flat"
                  >
                    Mi perfil
                  </Button>

                  <Button
                    onClick={() => {
                      logout();
                      addToast({
                        title: "Sesión cerrada",
                        description: "Has cerrado sesión correctamente.",
                        color: "danger",
                      });
                    }}
                    color="danger"
                    radius="full"
                    size="sm"
                    variant="light"
                  >
                    Cerrar sesión
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <Button
              onClick={() => {
                login();
                addToast({
                  title: "Sesión iniciada",
                  description: "Bienvenido a RIKUY.",
                  color: "success",
                });
              }}
              disabled={!ready}
              color="success"
              radius="full"
              variant="solid"
            >
              Iniciar sesión
            </Button>
          )}
        </NavbarItem>
      </NavbarContent>

      {/* Mobile: Theme switch + Menu toggle */}
      <NavbarContent className="sm:hidden" justify="end">
        <ThemeSwitch />
        <NavbarMenuToggle />
      </NavbarContent>

      {/* Menú móvil */}
      <NavbarMenu>
        <div className="mx-4 mt-4 flex flex-col gap-3">
          {authenticated && user ? (
            <>
              <div className="flex items-center gap-3 p-3 bg-default-100 rounded-lg">
                <AvatarComp size={40} title="Avatar RIKUY" />
                <div>
                  <p className="font-semibold">Usuario RIKUY</p>
                  <p className="text-xs text-default-500">
                    {user.wallet?.address?.slice(0, 6)}...
                    {user.wallet?.address?.slice(-4)}
                  </p>
                </div>
              </div>

              {!identityLoading && !isVerified && (
                <NavbarMenuItem>
                  <Link
                    to="/verificar-identidad"
                    className="w-full text-warning"
                  >
                    ⚠️ Verificarme (requerido)
                  </Link>
                </NavbarMenuItem>
              )}

              <NavbarMenuItem>
                <Link to="/denunciar">
                  📝 Denunciar
                </Link>
              </NavbarMenuItem>

              <NavbarMenuItem>
                <Link to="/perfil">
                  👤 Mi perfil
                </Link>
              </NavbarMenuItem>

              <NavbarMenuItem>
                <button
                  onClick={() => {
                    logout();
                    addToast({
                      title: "Sesión cerrada",
                      description: "Tu sesión fue cerrada correctamente.",
                      color: "danger",
                    });
                  }}
                  className="text-danger text-left w-full py-2"
                >
                  🔓 Cerrar sesión
                </button>
              </NavbarMenuItem>
            </>
          ) : (
            <>
              <NavbarMenuItem>
                <button
                  onClick={() => {
                    login();
                    addToast({
                      title: "Sesión iniciada",
                      description: "Bienvenido a RIKUY.",
                      color: "success",
                    });
                  }}
                  disabled={!ready}
                  className="text-success text-left w-full py-2 font-semibold"
                >
                  🔐 Iniciar sesión
                </button>
              </NavbarMenuItem>
            </>
          )}

          <div className="h-px bg-default-200 my-2" />

          <NavbarMenuItem>
            <Link to="/como-funciona">
              📖 Cómo funciona
            </Link>
          </NavbarMenuItem>

          <NavbarMenuItem>
            <Link to="/comunidades">
              🌍 Comunidades
            </Link>
          </NavbarMenuItem>

          <NavbarMenuItem>
            <Link to="/aliados">
              🤝 Aliados
            </Link>
          </NavbarMenuItem>

          <NavbarMenuItem>
            <Link to="/mapa">
              🗺️ Mapa
            </Link>
          </NavbarMenuItem>

          <div className="h-px bg-default-200 my-2" />

          <NavbarMenuItem>
            <Link to="/sobre-nosotros">
              Sobre nosotros
            </Link>
          </NavbarMenuItem>

          <NavbarMenuItem>
            <Link to="/privacidad">
              Privacidad
            </Link>
          </NavbarMenuItem>

          <NavbarMenuItem>
            <Link to="/terminos">
              Términos
            </Link>
          </NavbarMenuItem>
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};