'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaPhoneAlt, FaUsers, FaBuilding, FaCog, FaSignOutAlt, FaChartLine } from 'react-icons/fa';

const Navbar = () => {
  const pathname = usePathname();

  return (
    <nav className="bg-opacity-95 backdrop-blur-xl shadow-2xl border-b border-[#C742A8]/20 px-8 py-4 sticky top-0 z-50 bg-gradient-to-r from-[#0D0A2C] via-[#1A1A3A] to-[#2A1B4A]">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Left side links */}
        <div className="flex space-x-8">
          <NavLink href="/caller" icon={<FaPhoneAlt />} text="Caller " active={pathname === '/caller'} />
          <NavLink href="/crm" icon={<FaUsers />} text="CRM " active={pathname === '/crm'} />
          <NavLink href="/analytics" icon={<FaChartLine />} text="Analytics " active={pathname === '/analytics'} />
          <NavLink href="/lead-generator" icon={<FaBuilding />} text="Leads " active={pathname === '/lead-generator'} />
          <NavLink href="/settings" icon={<FaCog />} text="Settings " active={pathname === '/settings'} />
        </div>

        {/* Logout Button */}
        <NavLink href="/logout" icon={<FaSignOutAlt />} text="Logout ✧" active={false} isLogout />
      </div>
    </nav>
  );
};

const NavLink = ({ href, icon, text, active, isLogout = false }: { href: string; icon: React.ReactNode; text: string; active: boolean; isLogout?: boolean }) => {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-5 py-2.5 rounded-xl text-lg font-semibold transition-all duration-300 
        relative overflow-hidden group backdrop-blur-md
        ${active 
          ? 'bg-gradient-to-r from-[#C742A8] to-[#8E2CFF] text-white shadow-lg shadow-[#C742A8]/20' 
          : 'hover:bg-gradient-to-r hover:from-[#C742A8]/10 hover:to-[#8E2CFF]/10 hover:scale-105'}
        ${isLogout 
          ? 'text-red-400 hover:text-red-300 hover:bg-gradient-to-r hover:from-red-500/10 hover:to-red-600/10' 
          : 'text-white/90 hover:text-white'}`}
    >
      <span className="relative z-10 flex items-center gap-3">
        <span className="text-xl transform group-hover:scale-110 transition-transform duration-300">{icon}</span>
        <span className="transform group-hover:translate-x-1 transition-transform duration-300">{text}</span>
      </span>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-[#C742A8]/5 to-[#8E2CFF]/5 blur-xl"></div>
      </div>
    </Link>
  );
};

export default Navbar;