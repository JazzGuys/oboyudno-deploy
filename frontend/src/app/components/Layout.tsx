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
                <svg width="720" height="720" viewBox="0 0 720 720" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="720" height="720" transform="matrix(-1 0 0 1 720 0)" fill="#5048E5"/>
                  <path d="M480 353.723C480 334.393 464.33 318.723 445 318.723H275C255.67 318.723 240 334.393 240 353.723C240 373.053 255.67 388.723 275 388.723H445C464.33 388.723 480 373.053 480 353.723Z" fill="#D9D9D9"/>
                  <path d="M340.797 516.706C368.134 544.042 412.455 544.042 439.792 516.706L560 396.497C532.663 369.161 488.342 369.161 461.005 396.497L340.797 516.706Z" fill="#D9D9D9"/>
                  <path d="M153.797 310.706C181.134 338.042 225.455 338.042 252.792 310.706L373 190.497C345.663 163.161 301.342 163.161 274.005 190.497L153.797 310.706Z" fill="#D9D9D9"/>
                  <path d="M466.334 381.836C493.671 354.499 493.671 310.177 466.334 282.841L370.875 187.381C357.207 173.713 335.046 173.713 321.378 187.381C307.709 201.05 307.709 223.21 321.378 236.879L466.334 381.836Z" fill="#D9D9D9"/>
                  <path d="M397.083 523.087C410.752 509.419 410.752 487.258 397.083 473.589L252.126 328.633C224.79 355.969 224.79 400.291 252.126 427.628L347.586 523.087C361.254 536.755 383.415 536.755 397.083 523.087Z" fill="#D9D9D9"/>
                </svg>
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
