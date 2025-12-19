"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Typography,
  Divider,
  Badge,
  Paper,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  School as SchoolIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { menuItems, type MainMenuItem, type MenuItem } from "@/lib/menu-structure";
import { useThemeMode } from "@/components/providers/mui-theme-provider";
import { useNavigation } from "@/lib/navigation/navigation-context";
import { useAuth } from "@/lib/auth/auth-context";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { mode } = useThemeMode();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});
  const menuTimeoutRefs = useRef<{ [key: string]: NodeJS.Timeout | null }>({});
  
  // Refs for each menu's button and dropdown - initialize once
  const getMenuRefs = () => {
    const refs: { [key: string]: { buttonRef: React.RefObject<HTMLButtonElement>, dropdownRef: React.RefObject<HTMLDivElement> } } = {};
    menuItems.forEach((item) => {
      if (item.hasDropdown) {
        refs[item.label] = {
          buttonRef: React.createRef<HTMLButtonElement>(),
          dropdownRef: React.createRef<HTMLDivElement>(),
        };
      }
    });
    return refs;
  };
  
  const menuRefs = useRef<{ [key: string]: { buttonRef: React.RefObject<HTMLButtonElement>, dropdownRef: React.RefObject<HTMLDivElement> } }>(getMenuRefs());

  // Update dropdown positions
  const updateDropdownPositions = () => {
    Object.keys(openMenus).forEach((menuLabel) => {
      if (!openMenus[menuLabel]) return;
      
      const refs = menuRefs.current[menuLabel];
      if (!refs?.buttonRef.current || !refs?.dropdownRef.current) return;

      const buttonRect = refs.buttonRef.current.getBoundingClientRect();
      const dropdown = refs.dropdownRef.current;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const padding = 8;

      // Get dropdown dimensions
      const dropdownRect = dropdown.getBoundingClientRect();
      const dropdownWidth = dropdownRect.width || dropdown.offsetWidth || 0;
      const dropdownHeight = dropdownRect.height || dropdown.offsetHeight || 0;

      if (dropdownWidth === 0 || dropdownHeight === 0) {
        dropdown.style.top = `${buttonRect.bottom + 4}px`;
        dropdown.style.left = `${buttonRect.left}px`;
        return;
      }

      let top = buttonRect.bottom + 4;
      let left = buttonRect.left;

      // Check if dropdown would overflow bottom edge
      if (top + dropdownHeight > viewportHeight - padding) {
        const spaceAbove = buttonRect.top;
        const spaceBelow = viewportHeight - buttonRect.bottom;

        if (spaceAbove > spaceBelow && spaceAbove >= dropdownHeight) {
          top = buttonRect.top - dropdownHeight - 4;
        } else {
          top = viewportHeight - dropdownHeight - padding;
        }
      }

      // Check if dropdown would overflow right edge
      if (left + dropdownWidth > viewportWidth - padding) {
        left = viewportWidth - dropdownWidth - padding;
      }

      // Check if dropdown would overflow left edge
      if (left < padding) {
        left = padding;
      }

      dropdown.style.top = `${top}px`;
      dropdown.style.left = `${left}px`;
    });
  };

  // Update positions when menus open or on scroll/resize
  useEffect(() => {
    const hasOpenMenus = Object.values(openMenus).some(Boolean);
    if (hasOpenMenus) {
      updateDropdownPositions();
      
      const delayedUpdate = setTimeout(() => {
        updateDropdownPositions();
      }, 10);

      const handleScroll = () => updateDropdownPositions();
      const handleResize = () => updateDropdownPositions();

      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleResize);

      return () => {
        clearTimeout(delayedUpdate);
        window.removeEventListener("scroll", handleScroll, true);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [openMenus]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(menuTimeoutRefs.current).forEach((timeout) => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  const handleMenuEnter = (menuLabel: string) => {
    // Close all other menus first
    Object.keys(openMenus).forEach((key) => {
      if (key !== menuLabel && openMenus[key]) {
        setOpenMenus((prev) => ({ ...prev, [key]: false }));
      }
    });

    // Clear any pending close timeout for this menu
    if (menuTimeoutRefs.current[menuLabel]) {
      clearTimeout(menuTimeoutRefs.current[menuLabel]!);
      menuTimeoutRefs.current[menuLabel] = null;
    }

    // Clear all other menu timeouts
    Object.keys(menuTimeoutRefs.current).forEach((key) => {
      if (key !== menuLabel && menuTimeoutRefs.current[key]) {
        clearTimeout(menuTimeoutRefs.current[key]!);
        menuTimeoutRefs.current[key] = null;
      }
    });

    setOpenMenus((prev) => ({ ...prev, [menuLabel]: true }));

    // Update position immediately
    setTimeout(() => {
      updateDropdownPositions();
    }, 0);
  };

  const handleMenuLeave = (menuLabel: string) => {
    // Add a small delay before closing to allow moving to dropdown
    menuTimeoutRefs.current[menuLabel] = setTimeout(() => {
      setOpenMenus((prev) => ({ ...prev, [menuLabel]: false }));
      menuTimeoutRefs.current[menuLabel] = null;
    }, 100);
  };

  const handleDropdownEnter = (menuLabel: string) => {
    // Clear any pending close timeout when mouse enters dropdown
    if (menuTimeoutRefs.current[menuLabel]) {
      clearTimeout(menuTimeoutRefs.current[menuLabel]!);
      menuTimeoutRefs.current[menuLabel] = null;
    }
  };

  const handleDropdownLeave = (menuLabel: string) => {
    // Close when mouse leaves dropdown
    setOpenMenus((prev) => ({ ...prev, [menuLabel]: false }));
  };

  const { startNavigation } = useNavigation();

  const handleMenuItemClick = (path: string) => {
    startNavigation();
    router.push(path);
    setOpenMenus({});
    setMobileMenuOpen(false);
  };

  const renderDropdownMenu = (item: MainMenuItem) => {
    if (!item.hasDropdown || !item.menuItems) return null;

    const isOpen = openMenus[item.label] || false;
    const refs = menuRefs.current[item.label];

    return (
      <Box
        key={item.path}
        sx={{ position: "relative", display: "inline-block" }}
        onMouseEnter={() => handleMenuEnter(item.label)}
        onMouseLeave={() => handleMenuLeave(item.label)}
      >
        <Box
          component="button"
          ref={refs?.buttonRef}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            px: 1.5,
            py: 0.5,
            border: "none",
            background: "transparent",
            color: "text.primary",
            cursor: "pointer",
            borderRadius: 0.75,
            fontSize: "0.8125rem",
            fontWeight: 500,
            transition: "all 0.2s",
            "& svg": {
              fontSize: "1.125rem",
            },
            "&:hover": {
              backgroundColor: mode === "light" ? "action.hover" : "action.selected",
            },
          }}
        >
          {item.icon}
          <Typography variant="body2" sx={{ fontSize: "0.8125rem" }}>
            {item.label}
          </Typography>
        </Box>

        <Paper
          ref={refs?.dropdownRef}
          onMouseEnter={() => handleDropdownEnter(item.label)}
          onMouseLeave={() => handleDropdownLeave(item.label)}
          sx={{
            position: "fixed",
            display: isOpen ? "block" : "none",
            backgroundColor: "background.paper",
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
            boxShadow: 3,
            p: 1.25,
            zIndex: 100001,
            minWidth: 260,
            maxWidth: 360,
            maxHeight: 420,
            overflow: "auto",
            opacity: isOpen ? 1 : 0,
            visibility: isOpen ? "visible" : "hidden",
            transform: isOpen ? "translateY(0)" : "translateY(-6px)",
            transition: "all 0.2s ease",
            pointerEvents: isOpen ? "auto" : "none",
          }}
        >
          {item.menuItems.map((section, sectionIdx) => (
            <Box key={sectionIdx}>
              {sectionIdx > 0 && <Divider sx={{ my: 0.75 }} />}
              <Typography
                variant="caption"
                sx={{
                  px: 1.5,
                  py: 0.75,
                  fontWeight: 700,
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  color: "text.secondary",
                  display: "block",
                }}
              >
                {section.title}
              </Typography>
              {section.items.map((menuItem: MenuItem, itemIdx: number) => (
                <Box
                  key={itemIdx}
                  component="button"
                  onClick={() => handleMenuItemClick(menuItem.path)}
                  sx={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    py: 1,
                    px: 1.5,
                    border: "none",
                    background: "transparent",
                    color: "text.primary",
                    cursor: "pointer",
                    borderRadius: 1,
                    textAlign: "left",
                    transition: "all 0.2s",
                    "&:hover": {
                      backgroundColor: mode === "light" ? "action.hover" : "action.selected",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: 0.75,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: `${menuItem.color}20`,
                      color: menuItem.color,
                      flexShrink: 0,
                      "& svg": {
                        fontSize: "1rem",
                      },
                    }}
                  >
                    {menuItem.icon}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, fontSize: "0.8125rem", lineHeight: 1.3 }}
                    >
                      {menuItem.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontSize: "0.7rem",
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        lineHeight: 1.2,
                      }}
                    >
                      {menuItem.description}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          ))}
        </Paper>
      </Box>
    );
  };

  return (
    <>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          backgroundColor: "background.paper",
          color: "text.primary",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Toolbar sx={{ gap: 1, minHeight: "48px !important", py: 0.5 }}>
          {/* Mobile Menu Button */}
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={() => setMobileMenuOpen(true)}
            sx={{ display: { xs: "flex", md: "none" }, p: 0.75 }}
          >
            <MenuIcon sx={{ fontSize: "1.25rem" }} />
          </IconButton>

          {/* Logo */}
          <Box
            onClick={() => handleMenuItemClick("/")}
            title="Go to Dashboard"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              cursor: "pointer",
              flexShrink: 0,
              "&:hover": {
                opacity: 0.8,
              },
            }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                boxShadow: "0 2px 8px rgba(147, 51, 234, 0.3)",
              }}
            >
              <SchoolIcon sx={{ fontSize: 16 }} />
            </Box>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 700,
                fontSize: "0.95rem",
                display: { xs: "none", sm: "block" },
              }}
            >
              Grow More
            </Typography>
          </Box>

          {/* Navigation Menu - Desktop */}
          <Box
            sx={{
              flex: 1,
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 0.25,
            }}
          >
            {menuItems.map((item) => {
              if (item.hasDropdown) {
                return renderDropdownMenu(item);
              }
              return (
                <Box
                  key={item.path}
                  component="button"
                  onClick={() => handleMenuItemClick(item.path)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    px: 1.5,
                    py: 0.5,
                    border: "none",
                    background: pathname === item.path ? "primary.main" : "transparent",
                    color: pathname === item.path ? "primary.contrastText" : "text.primary",
                    cursor: "pointer",
                    borderRadius: 0.75,
                    fontSize: "0.8125rem",
                    fontWeight: pathname === item.path ? 600 : 500,
                    transition: "all 0.2s",
                    "& svg": {
                      fontSize: "1.125rem",
                    },
                    "&:hover": {
                      backgroundColor:
                        pathname === item.path
                          ? "primary.dark"
                          : mode === "light"
                          ? "action.hover"
                          : "action.selected",
                    },
                  }}
                >
                  {item.icon}
                  <Typography variant="body2" sx={{ fontSize: "0.8125rem" }}>
                    {item.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {/* Right Actions */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <IconButton color="inherit" size="small" sx={{ p: 0.75 }}>
              <Badge badgeContent={0} color="error">
                <NotificationsIcon sx={{ fontSize: "1.125rem" }} />
              </Badge>
            </IconButton>
            <IconButton color="inherit" size="small" title="Refresh" sx={{ p: 0.75 }}>
              <RefreshIcon sx={{ fontSize: "1.125rem" }} />
            </IconButton>
            <ThemeToggle />
            <IconButton
              color="inherit"
              size="small"
              sx={{ p: 0.75 }}
              title={user?.full_name || user?.username || "Account"}
            >
              <AccountCircleIcon sx={{ fontSize: "1.25rem" }} />
            </IconButton>
            <IconButton
              color="inherit"
              size="small"
              sx={{ p: 0.75 }}
              title="Logout"
              onClick={logout}
            >
              <LogoutIcon sx={{ fontSize: "1.125rem" }} />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Sidebar */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "85vw",
          maxWidth: 320,
          height: "100vh",
          backgroundColor: "background.paper",
          zIndex: 1300,
          transform: mobileMenuOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s ease",
          boxShadow: 2,
          display: { xs: "block", md: "none" },
        }}
      >
        <Box
          sx={{
            p: 1.5,
            borderBottom: 1,
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 700, fontSize: "0.95rem" }}>
            Menu
          </Typography>
          <IconButton onClick={() => setMobileMenuOpen(false)} size="small" sx={{ p: 0.75 }}>
            <CloseIcon sx={{ fontSize: "1.25rem" }} />
          </IconButton>
        </Box>
        <Box sx={{ overflow: "auto", height: "calc(100vh - 56px)" }}>
          {menuItems.map((item) => (
            <Box key={item.path}>
              <Box
                component="button"
                onClick={() => {
                  if (!item.hasDropdown) {
                    handleMenuItemClick(item.path);
                  } else {
                    setOpenMenus((prev) => ({
                      ...prev,
                      [item.label]: !prev[item.label],
                    }));
                  }
                }}
                sx={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 1.5,
                  py: 1,
                  border: "none",
                  background: "transparent",
                  color: "text.primary",
                  cursor: "pointer",
                  textAlign: "left",
                  "& svg": {
                    fontSize: "1.125rem",
                  },
                  "&:hover": {
                    backgroundColor: mode === "light" ? "action.hover" : "action.selected",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                  {item.icon}
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.8125rem" }}>
                    {item.label}
                  </Typography>
                </Box>
              </Box>
              {item.hasDropdown && openMenus[item.label] && item.menuItems && (
                <Box sx={{ pl: 4, backgroundColor: "background.default" }}>
                  {item.menuItems.map((section, sectionIdx) => (
                    <Box key={sectionIdx}>
                      <Typography
                        variant="caption"
                        sx={{
                          px: 1.5,
                          py: 0.75,
                          fontWeight: 700,
                          fontSize: "0.7rem",
                          textTransform: "uppercase",
                          color: "text.secondary",
                          display: "block",
                        }}
                      >
                        {section.title}
                      </Typography>
                      {section.items.map((menuItem: MenuItem, itemIdx: number) => (
                        <Box
                          key={itemIdx}
                          component="button"
                          onClick={() => handleMenuItemClick(menuItem.path)}
                          sx={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: 1.25,
                            px: 1.5,
                            py: 1,
                            border: "none",
                            background: "transparent",
                            color: "text.secondary",
                            cursor: "pointer",
                            textAlign: "left",
                            "&:hover": {
                              backgroundColor:
                                mode === "light" ? "action.hover" : "action.selected",
                              color: "text.primary",
                            },
                          }}
                        >
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: 0.5,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: `${menuItem.color}20`,
                              color: menuItem.color,
                              flexShrink: 0,
                              "& svg": {
                                fontSize: "0.875rem",
                              },
                            }}
                          >
                            {menuItem.icon}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 500, fontSize: "0.8125rem", lineHeight: 1.3 }}
                            >
                              {menuItem.title}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.secondary",
                                fontSize: "0.7rem",
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                lineHeight: 1.2,
                              }}
                            >
                              {menuItem.description}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <Box
          onClick={() => setMobileMenuOpen(false)}
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1299,
            display: { xs: "block", md: "none" },
          }}
        />
      )}
    </>
  );
}
