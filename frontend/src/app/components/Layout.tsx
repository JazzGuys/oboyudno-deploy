import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { motion } from "motion/react";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setIsLoggedIn(Boolean(localStorage.getItem("dealvid_token")));
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [location.pathname]);

  const isDashboardArea =
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/deal") ||
    location.pathname.startsWith("/profile");
  const isAuthPage = location.pathname === "/auth";

  const handleLogout = () => {
    localStorage.removeItem("dealvid_auth");
    localStorage.removeItem("dealvid_token");
    localStorage.removeItem("dealvid_user");
    setIsLoggedIn(false);
    navigate("/");
  };

  if (isDashboardArea) {
    return (
      <div className="min-h-screen bg-[#F7F8FA]">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {!isAuthPage && (
        <header
          className={`sticky top-0 z-50 transition-all duration-200 ${
            scrolled
              ? "bg-white/90 backdrop-blur-md shadow-[0_1px_0_0_#E8E9F0]"
              : "bg-transparent"
          }`}
        >
          <div className="max-w-6xl mx-auto px-6 h-[68px] flex items-center justify-between">
            {/* Логотип */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-[10px] bg-[#5048E5] flex items-center justify-center shadow-[0_2px_8px_rgba(80,72,229,0.35)]">
                <img src="/src/app/components/ui/logo.svg" alt="Логотип" className="w-full h-full object-contain" />
              </div>
              <span className="text-[#0D0D14] tracking-[-0.02em]" style={{ fontWeight: 600 }}>Обоюдно</span>
            </Link>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {[
                { href: "/", label: "Главная" },
                { href: "#how", label: "Как работает" },
                { href: "#features", label: "Возможности" },
                { href: "#pricing", label: "Тарифы" },
              ].map((item) => {
                const isActive = item.href.startsWith("#")
                    ? location.hash === item.href
                    : (location.pathname === item.href && (location.hash === "" || location.hash === "#"));

                return (
                    <a
                        key={item.label}
                        href={item.href}
                        className={`relative px-4 py-2 rounded-xl text-sm transition-colors ${
                            isActive
                                ? "text-[#0D0D14]"
                                : "text-[#6B7280] hover:text-[#0D0D14] hover:bg-white/60"
                        }`}
                    >
                      {isActive && (
                          <motion.div
                              layoutId="active-pill"
                              className="absolute inset-0 bg-white shadow-sm rounded-xl -z-10"
                              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                      )}
                      {item.label}
                    </a>
                );
              })}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {isLoggedIn ? (
                <>
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E8E9F0] rounded-xl text-sm text-[#0D0D14] hover:border-[#5048E5]/30 transition-colors shadow-sm"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#5048E5]/10 flex items-center justify-center">
                      <span className="text-[10px] text-[#5048E5]" style={{ fontWeight: 600 }}>А</span>
                    </div>
                    Кабинет
                    <ChevronDown size={12} className="text-[#8B8FA8]" />
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/auth"
                    className="px-4 py-2 text-sm text-[#6B7280] hover:text-[#0D0D14] transition-colors rounded-xl hover:bg-white/60"
                  >
                    Войти
                  </Link>
                  <Link
                    to="/auth?tab=register"
                    className="px-4 py-2 text-sm text-white bg-[#5048E5] rounded-xl hover:bg-[#4338CA] transition-colors shadow-[0_2px_8px_rgba(80,72,229,0.3)]"
                  >
                    Начать бесплатно
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>
      )}

      <Outlet />
    </div>
  );
}
