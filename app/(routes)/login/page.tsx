"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

export default function LoginPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5001/login",
        credentials,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Decode the JWT token and handle response dynamically
      const decodedToken = jwtDecode(response.data.jwt_token);

      // Store token and user data from response
      localStorage.setItem("jwt_token", response.data.jwt_token);
      localStorage.setItem("email", (decodedToken as any).email);
      localStorage.setItem("user_id", (decodedToken as any).user_id);

      router.push("/crm");
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <h2 className="text-[#c742a8] text-[2.4rem] mb-4 text-shadow-[0_0_10px_rgba(199,66,168,0.3)] hover:text-shadow-[0_0_20px_rgba(199,66,168,0.5)] transition-all duration-300">
          Welcome to Swiftleads AI
        </h2>
        <p className="text-[#8892b0] text-[1.1rem] mb-8">Please log in to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full max-w-[300px] mx-auto">
        {error && (
          <div className="text-[#ff4d4d] bg-[rgba(255,77,77,0.1)] border border-[#ff4d4d] py-3 px-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        <div className="w-full">
          <input
            type="email"
            id="email"
            name="email"
            required
            className="w-full p-4 bg-[rgba(13,10,44,0.8)] border border-[#c742a8] text-white rounded-lg text-[1.1rem] transition-all duration-300 focus:outline-none focus:shadow-[0_4px_12px_rgba(199,66,168,0.3)] focus:-translate-y-0.5 placeholder:text-[#8892b0]"
            placeholder="Email"
            value={credentials.email}
            onChange={(e) =>
              setCredentials({ ...credentials, email: e.target.value })
            }
          />
        </div>

        <div className="w-full">
          <input
            type="password"
            id="password"
            name="password"
            required
            className="w-full p-4 bg-[rgba(13,10,44,0.8)] border border-[#c742a8] text-white rounded-lg text-[1.1rem] transition-all duration-300 focus:outline-none focus:shadow-[0_4px_12px_rgba(199,66,168,0.3)] focus:-translate-y-0.5 placeholder:text-[#8892b0]"
            placeholder="Password"
            value={credentials.password}
            onChange={(e) =>
              setCredentials({ ...credentials, password: e.target.value })
            }
          />
        </div>

        <button 
          type="submit" 
          className="w-full p-4 bg-[#c742a8] text-white border-none rounded-lg text-[1.1rem] cursor-pointer transition-all duration-300 hover:bg-[rgba(199,66,168,0.9)] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(199,66,168,0.3)] disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <style jsx>{`
        @keyframes fadeSlideIn {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .login-container {
          max-width: 400px;
          margin: 100px auto;
          padding: 3rem;
          background-color: rgba(13, 10, 44, 0.5);
          border-radius: 12px;
          border: 1px solid rgba(199, 66, 168, 0.2);
          text-align: center;
          box-sizing: border-box;
        }

        .login-header {
          margin-bottom: 3rem;
          animation: fadeSlideIn 0.8s ease-out forwards;
        }

        .subtitle {
          color: #8892b0;
          font-size: 1.1rem;
          margin-bottom: 2rem;
          opacity: 0;
          animation: fadeSlideIn 0.8s ease-out 0.2s forwards;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 100%;
          max-width: 300px;
          margin: 0 auto;
          opacity: 0;
          animation: fadeSlideIn 0.8s ease-out 0.4s forwards;
        }
      `}</style>
    </div>
  );
}
