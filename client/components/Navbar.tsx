"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchPublicJson } from "@/lib/api";

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [navContent, setNavContent] = useState({
        title: "Viveka College",
        logoUrl: "/logo.png",
        ctaText: "Apply Now",
        ctaUrl: "/apply",
        menu1Label: "Home",
        menu1Url: "/",
        menu2Label: "About",
        menu2Url: "/about",
        menu3Label: "Courses",
        menu3Url: "/courses",
        menu4Label: "Gallery",
        menu4Url: "/gallery",
    });

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        fetchPublicJson<{ content?: Partial<typeof navContent> }>("/content/navbar").then((response) => {
            if (response?.content) setNavContent((current) => ({ ...current, ...response.content }));
        });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const menuLinks = [
        { label: navContent.menu1Label || "Home", href: navContent.menu1Url || "/" },
        { label: navContent.menu2Label || "About", href: navContent.menu2Url || "/about" },
        { label: navContent.menu3Label || "Courses", href: navContent.menu3Url || "/courses" },
        { label: navContent.menu4Label || "Gallery", href: navContent.menu4Url || "/gallery" },
        { label: "Contact", href: "/contact" },
    ];

    const closeMenu = () => setIsMenuOpen(false);

    return (
        <>
            <nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white shadow-md py-2" : "bg-transparent py-4 text-white"
                    }`}
            >
                <div className="container mx-auto px-6 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-4">
                        <img
                            src={navContent.logoUrl || "/logo.png"}
                            alt="Viveka College Logo"
                            className="w-14 h-14 object-contain"
                        />
                        <div>
                            <h1 className={`font-serif font-bold text-2xl tracking-tight leading-none ${isScrolled ? "text-navy" : "text-white"}`}>
                                {navContent.title || "Viveka College"}
                            </h1>
                            <p className={`text-[10px] tracking-[0.25em] font-sans font-bold mt-1 ${isScrolled ? "text-gray-text" : "text-cream/80"}`}>
                                Distance Education / Study Centre
                            </p>
                        </div>
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        {menuLinks.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`font-sans text-sm font-medium hover:text-maroon transition-colors ${isScrolled ? "text-navy" : "text-white"
                                    }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                        <Link
                            href={navContent.ctaUrl || "/apply"}
                            className="bg-maroon hover:bg-maroon-dark text-white px-6 py-2 rounded-sm text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
                        >
                            {navContent.ctaText || "Apply Now"}
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        suppressHydrationWarning
                        onClick={() => setIsMenuOpen((prev) => !prev)}
                        className="md:hidden text-navy bg-white rounded-sm p-1.5 shadow-sm relative z-[60]"
                        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={isMenuOpen}
                    >
                        {isMenuOpen ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                            </svg>
                        )}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[55] md:hidden"
                    onClick={closeMenu}
                    aria-hidden="true"
                />
            )}

            {/* Mobile Menu Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-72 bg-white z-[58] shadow-2xl transform transition-transform duration-300 md:hidden ${isMenuOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                <div className="pt-24 px-6 pb-6 flex flex-col h-full">
                    <nav className="flex flex-col gap-2 flex-1">
                        {menuLinks.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                onClick={closeMenu}
                                className="font-sans text-base font-medium text-navy hover:text-maroon transition-colors py-3 border-b border-cream-dark"
                            >
                                {item.label}
                            </Link>
                        ))}
                        <Link
                            href={navContent.ctaUrl || "/apply"}
                            onClick={closeMenu}
                            className="mt-6 bg-maroon hover:bg-maroon-dark text-white px-6 py-3 rounded-sm text-sm font-semibold transition-all text-center shadow-md"
                        >
                            {navContent.ctaText || "Apply Now"}
                        </Link>
                    </nav>
                </div>
            </div>
        </>
    );
};

export default Navbar;
