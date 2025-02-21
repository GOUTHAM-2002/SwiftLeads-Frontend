import { FC, ReactNode } from "react";
import Navbar from "./Navbar";

interface BaseLayoutProps {
  children: ReactNode;
  isLoggedIn?: boolean;
}

const BaseLayout: FC<BaseLayoutProps> = ({ children, isLoggedIn = false }) => {
  return (
    <div className="min-h-screen bg-[#1A1744]">
      {isLoggedIn && <Navbar />}
      <main className={`main-content ${!isLoggedIn ? "no-nav" : ""}`}>
        {children}
      </main>
    </div>
  );
};

export default BaseLayout;
