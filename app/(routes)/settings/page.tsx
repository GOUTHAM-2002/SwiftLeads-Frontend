"use client";

import axios from "axios";
import { useState, useEffect } from "react";
import BASE_URL from "@/app/urls/urls";
import BaseLayout from "@/app/components/layout/BaseLayout";

interface PhoneNumber {
  id: string;
  name: string;
  phone_number_id: string;
  phone_number: string;
  status: "ACTIVE" | "INACTIVE";
  created_at: string;
  updated_at: string;
}

interface Settings {
  vapi_api_key: string;
  assistant_id: string | null;
  phone_number_id: string | null;
  model: string;
  provider: string;
  first_message: string;
  system_prompt: string;
  voice_id: string;
  voice_provider: string;
  stability: number;
  similarity_boost: number;
  voice_filler_injection_enabled: boolean;
  backchanneling_enabled: boolean;
  background_denoising_enabled: boolean;
  phone_numbers: PhoneNumber[] | null;  
}

export default function Settings() {
  const [settings, setSettings] = useState<Settings>({
    vapi_api_key: "",
    assistant_id: null,
    phone_number_id: null,
    model: "",
    provider: "",
    first_message: "",
    system_prompt: "",
    voice_id: "",
    voice_provider: "",
    stability: 0,
    similarity_boost: 0,
    voice_filler_injection_enabled: false,
    backchanneling_enabled: false,
    background_denoising_enabled: false,
    phone_numbers: null,
  });

  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });

  // Fetch settings from backend
  const fetchSettings = async () => {
    try {
      // Get user_id from localStorage
      const userId = localStorage.getItem("user_id");
      console.log(localStorage.getItem("jwt_token"));

      const response = await axios.get(`${BASE_URL}/api/getSettings`, {
        params: { user_id: userId },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt_token")}`,
        },
      });

      setSettings(response.data);
    } catch (error) {
      showAlert("Error fetching settings", "error");
      console.error(error);
    }
  };

  const fetchPhoneNumbers = async () => {
    try {
      // Get user_id from localStorage
      const userId = localStorage.getItem("user_id");

      // Get JWT token from localStorage
      const token = localStorage.getItem("jwt_token");

      // Make the axios request with dynamic user ID and Authorization header
      const response = await axios.get(`${BASE_URL}/api/getUsersPhoneNums`, {
        params: { user_id: userId }, // Use params to pass user_id
        headers: {
          Authorization: `Bearer ${token}`, // Add Authorization header
        },
      });

      const data = response.data.data;
      setPhoneNumbers(data);
    } catch (error) {
      showAlert("Error fetching phone numbers", "error");
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Get user_id from localStorage
      const userId = localStorage.getItem("user_id");

      // Get JWT token from localStorage
      const token = localStorage.getItem("jwt_token");

      const response = await axios.post(
        `${BASE_URL}/api/editSettings`,
        {
          vapi_api_key: settings.vapi_api_key,
          assistant_id: settings.assistant_id,
          phone_number_id: settings.phone_number_id,
          model: settings.model,
          provider: settings.provider,
          first_message: settings.first_message,
          system_prompt: settings.system_prompt,
          voice_id: settings.voice_id,
          voice_provider: settings.voice_provider,
          stability: settings.stability,
          similarity_boost: settings.similarity_boost,
          voice_filler_injection_enabled:
            settings.voice_filler_injection_enabled,
          backchanneling_enabled: settings.backchanneling_enabled,
          background_denoising_enabled: settings.background_denoising_enabled,
          phone_numbers: settings.phone_numbers,
        },
        {
          params: {
            user_id: userId, // Use user_id from localStorage
          },
          headers: {
            Authorization: `Bearer ${token}`, // Add Authorization header
          },
        }
      );

      if (response.status === 200) {
        showAlert("Settings saved successfully", "success");
      } else {
        showAlert("Failed to save settings", "error");
      }
    } catch (error) {
      showAlert("Error saving settings", "error");
      console.error(error);
    }
  };
  const addPhoneNumber = async (toSend: any) => {
    try {
      // Get user_id from localStorage
      const userId = localStorage.getItem("user_id");

      // Get JWT token from localStorage
      const token = localStorage.getItem("jwt_token");

      // Add user_id from localStorage instead of hardcoding
      toSend["user_id"] = userId;

      console.log(toSend);

      const response = await axios.post(
        `${BASE_URL}/api/addPhoneNumberSettings`,
        toSend,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Add Authorization header
          },
        }
      );

      const newNumber = response.data;
      setPhoneNumbers((prev) => [...prev, newNumber]);
      setShowAddModal(false);
      showAlert("Phone number added successfully", "success");
    } catch (error) {
      showAlert("Error adding phone number", "error");
      console.error(error);
    }
  };
  const importPhoneNumbers = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      await fetch("/api/phone-numbers/import", {
        method: "POST",
        body: formData,
      });
      fetchPhoneNumbers();
      setShowImportModal(false);
      showAlert("Phone numbers imported successfully", "success");
    } catch (error) {
      showAlert("Error importing phone numbers", "error");
    }
  };

  const togglePhoneStatus = async (
    id: string,
    status: "ACTIVE" | "INACTIVE"
  ) => {
    try {
      await axios.post(`${BASE_URL}/api/changePhoneStatus`, {
        id: parseInt(id),
        status: status,
      });

      setPhoneNumbers(
        phoneNumbers.map((phone) =>
          phone.id === id ? { ...phone, status } : phone
        )
      );

      showAlert("Phone status updated successfully", "success");
    } catch (error) {
      showAlert("Error updating phone status", "error");
    }
  };

  const deletePhoneNumber = async (id: string) => {
    if (!confirm("Are you sure you want to delete this phone number?")) return;
    try {
      await axios.get(`${BASE_URL}/api/delPhoneNumberSettings`, {
        params: { id },
      });
      setPhoneNumbers(phoneNumbers.filter((phone) => phone.id !== id));
      showAlert("Phone number deleted successfully", "success");
    } catch (error) {
      showAlert("Error deleting phone number", "error");
    }
  };

  const showAlert = (message: string, type: "success" | "error") => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: "", type: "" }), 3000);
  };

  useEffect(() => {
    fetchSettings();
    fetchPhoneNumbers();
  }, []);

  return (
    <BaseLayout isLoggedIn={true}>
      <div className="settings-container p-12 bg-gradient-to-br from-[#0D0A2C] via-[#1A1A3A] to-[#2A1B4A] text-white flex flex-col items-center shadow-[0_0_50px_rgba(199,66,168,0.15)] rounded-2xl backdrop-blur-sm border border-opacity-20 border-[#C742A8]">
        {/* Enhanced user info section with glass morphism and animation */}
        <div className="user-info-section mb-8 flex items-center p-4 bg-white/5 rounded-xl backdrop-blur-md border border-white/10 transform hover:scale-105 transition-all duration-300">
          <div className="relative">
            <div className="absolute inset-0 bg-[#C742A8] blur-md opacity-20 rounded-full"></div>
            <i className="fas fa-user text-3xl relative z-10 mr-4 text-transparent bg-clip-text bg-gradient-to-r from-[#C742A8] to-[#8E2CFF]"></i>
          </div>
          <span className="text-xl font-light tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
            {localStorage.getItem("email")}
          </span>
        </div>

        {/* Enhanced heading with animation and gradient */}
        <h2 className="text-5xl font-black mb-12 text-transparent bg-clip-text bg-gradient-to-r from-[#C742A8] via-[#8E2CFF] to-[#C742A8] animate-gradient-x tracking-tight">
          Settings
          <div className="h-1 w-24 bg-gradient-to-r from-[#C742A8] to-[#8E2CFF] rounded-full mx-auto mt-4 animate-pulse"></div>
        </h2>
        {/* enhancement done uptill here */}
        <form onSubmit={handleSubmit} className="space-y-10 w-full max-w-4xl">
          {/* API Keys Section */}
          <div className="form-section relative overflow-hidden bg-gradient-to-br from-[#1A1A3A] via-[#2A1B4A] to-[#1A1A3A] rounded-2xl p-8 shadow-[0_8px_32px_rgba(199,66,168,0.15)] border border-opacity-20 border-[#C742A8] backdrop-blur-lg">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#C742A8] opacity-10 blur-[100px] rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#8E2CFF] opacity-10 blur-[100px] rounded-full"></div>
            
            <h3 className="relative text-3xl font-bold mb-8 text-center">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C742A8] to-[#8E2CFF]">
                API Keys
              </span>
              <div className="h-0.5 w-16 bg-gradient-to-r from-[#C742A8] to-[#8E2CFF] rounded-full mx-auto mt-3"></div>
            </h3>

            <div className="form-group relative mb-8 transform transition-all duration-300 hover:scale-[1.02]">
              <label htmlFor="vapiApiKey" className="block text-sm mb-3 text-white/80 font-medium tracking-wide">
                VAPI API Key
              </label>
              <div className="input-group flex items-center justify-center bg-[#0D0A2C]/50 p-1 rounded-xl backdrop-blur-sm border border-[#C742A8]/20 hover:border-[#C742A8]/40 transition-all duration-300">
                <input
                  type={showApiKey ? "text" : "password"}
                  id="vapiApiKey"
                  className="flex-1 p-4 bg-transparent rounded-lg text-white/90 focus:outline-none focus:ring-2 focus:ring-[#C742A8]/30 transition-all duration-300"
                  value={settings.vapi_api_key}
                  onChange={(e) =>
                    setSettings({ ...settings, vapi_api_key: e.target.value })
                  }
                  required
                />
                <button
                  type="button"
                  className="ml-3 px-4 py-2 rounded-lg bg-[#C742A8]/10 hover:bg-[#C742A8]/20 text-white/80 hover:text-white transition-all duration-300"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  <i className={`fas fa-${showApiKey ? "eye-slash" : "eye"} mr-2`}></i>
                  {showApiKey ? "Hide" : "View"}
                </button>
                <button
                  type="button"
                  className="ml-2 px-4 py-2 rounded-lg bg-[#C742A8]/10 hover:bg-[#C742A8]/20 text-white/80 hover:text-white transition-all duration-300"
                  onClick={() => navigator.clipboard.writeText(settings.vapi_api_key)}
                >
                  <i className="fas fa-copy"></i>
                </button>
              </div>
            </div>

            <div className="form-group relative mb-8 transform transition-all duration-300 hover:scale-[1.02]">
              <label htmlFor="assistantId" className="block text-sm mb-3 text-white/80 font-medium tracking-wide">
                Assistant ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="assistantId"
                  className="w-full p-4 bg-[#0D0A2C]/50 rounded-xl text-white/90 border border-[#C742A8]/20 hover:border-[#C742A8]/40 focus:outline-none focus:ring-2 focus:ring-[#C742A8]/30 transition-all duration-300"
                  value={settings.assistant_id || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, assistant_id: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="form-group relative mb-8 transform transition-all duration-300 hover:scale-[1.02]">
              <label htmlFor="phoneNumberId" className="block text-sm mb-3 text-white/80 font-medium tracking-wide">
                Phone Number ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="phoneNumberId"
                  className="w-full p-4 bg-[#0D0A2C]/50 rounded-xl text-white/90 border border-[#C742A8]/20 cursor-not-allowed opacity-80"
                  value={settings.phone_number_id || "No active phone numbers available"}
                  readOnly
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <i className="fas fa-lock text-[#C742A8]/40"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Model Settings */}
          <div className="form-section relative overflow-hidden bg-gradient-to-br from-[#1A1A3A] via-[#2A1B4A] to-[#1A1A3A] rounded-2xl p-8 shadow-[0_8px_32px_rgba(199,66,168,0.15)] border border-opacity-20 border-[#C742A8] backdrop-blur-lg">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#C742A8] opacity-10 blur-[100px] rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#8E2CFF] opacity-10 blur-[100px] rounded-full"></div>
            
            <h3 className="relative text-3xl font-bold mb-8 text-center">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C742A8] to-[#8E2CFF]">
                Model Settings
              </span>
              <div className="h-0.5 w-16 bg-gradient-to-r from-[#C742A8] to-[#8E2CFF] rounded-full mx-auto mt-3"></div>
            </h3>

            <div className="form-group relative mb-8 transform transition-all duration-300 hover:scale-[1.02]">
              <label htmlFor="model" className="block text-sm mb-3 text-white/80 font-medium tracking-wide">
                Model
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="model"
                  className="w-full p-4 bg-[#0D0A2C]/50 rounded-xl text-white/90 border border-[#C742A8]/20 hover:border-[#C742A8]/40 focus:outline-none focus:ring-2 focus:ring-[#C742A8]/30 transition-all duration-300"
                  value={settings.model}
                  onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <i className="fas fa-code text-[#C742A8]/40"></i>
                </div>
              </div>
            </div>

            <div className="form-group relative mb-8 transform transition-all duration-300 hover:scale-[1.02]">
              <label htmlFor="provider" className="block text-sm mb-3 text-white/80 font-medium tracking-wide">
                Provider
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="provider"
                  className="w-full p-4 bg-[#0D0A2C]/50 rounded-xl text-white/90 border border-[#C742A8]/20 hover:border-[#C742A8]/40 focus:outline-none focus:ring-2 focus:ring-[#C742A8]/30 transition-all duration-300"
                  value={settings.provider}
                  onChange={(e) => setSettings({ ...settings, provider: e.target.value })}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <i className="fas fa-server text-[#C742A8]/40"></i>
                </div>
              </div>
            </div>

            <div className="form-group relative mb-8 transform transition-all duration-300 hover:scale-[1.02]">
              <label htmlFor="firstMessage" className="block text-sm mb-3 text-white/80 font-medium tracking-wide">
                First Message
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="firstMessage"
                  className="w-full p-4 bg-[#0D0A2C]/50 rounded-xl text-white/90 border border-[#C742A8]/20 hover:border-[#C742A8]/40 focus:outline-none focus:ring-2 focus:ring-[#C742A8]/30 transition-all duration-300"
                  value={settings.first_message}
                  onChange={(e) => setSettings({ ...settings, first_message: e.target.value })}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <i className="fas fa-comment text-[#C742A8]/40"></i>
                </div>
              </div>
            </div>

            <div className="form-group relative mb-8 transform transition-all duration-300 hover:scale-[1.02]">
              <label htmlFor="systemPrompt" className="block text-sm mb-3 text-white/80 font-medium tracking-wide">
                System Prompt
              </label>
              <div className="relative">
                <textarea
                  id="systemPrompt"
                  className="w-full p-4 bg-[#0D0A2C]/50 rounded-xl text-white/90 border border-[#C742A8]/20 hover:border-[#C742A8]/40 focus:outline-none focus:ring-2 focus:ring-[#C742A8]/30 transition-all duration-300 min-h-[120px] resize-y"
                  value={settings.system_prompt}
                  onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })}
                />
                <div className="absolute right-4 top-4">
                  <i className="fas fa-terminal text-[#C742A8]/40"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Voice Settings */}
          <div className="form-section relative overflow-hidden bg-gradient-to-br from-[#1A1A3A] via-[#2A1B4A] to-[#1A1A3A] rounded-2xl p-8 shadow-[0_8px_32px_rgba(199,66,168,0.15)] border border-opacity-20 border-[#C742A8] backdrop-blur-lg">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#C742A8] opacity-10 blur-[100px] rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#8E2CFF] opacity-10 blur-[100px] rounded-full"></div>
            
            <h3 className="relative text-3xl font-bold mb-8 text-center">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C742A8] to-[#8E2CFF]">
                Voice Settings
              </span>
              <div className="h-0.5 w-16 bg-gradient-to-r from-[#C742A8] to-[#8E2CFF] rounded-full mx-auto mt-3"></div>
            </h3>

            <div className="grid grid-cols-2 gap-8">
              <div className="form-group relative transform transition-all duration-300 hover:scale-[1.02]">
                <label htmlFor="voiceId" className="block text-sm mb-3 text-white/80 font-medium tracking-wide">
                  Voice ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="voiceId"
                    className="w-full p-4 bg-[#0D0A2C]/50 rounded-xl text-white/90 border border-[#C742A8]/20 hover:border-[#C742A8]/40 focus:outline-none focus:ring-2 focus:ring-[#C742A8]/30 transition-all duration-300"
                    value={settings.voice_id}
                    onChange={(e) => setSettings({ ...settings, voice_id: e.target.value })}
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <i className="fas fa-microphone text-[#C742A8]/40"></i>
                  </div>
                </div>
              </div>

              <div className="form-group relative transform transition-all duration-300 hover:scale-[1.02]">
                <label htmlFor="voiceProvider" className="block text-sm mb-3 text-white/80 font-medium tracking-wide">
                  Voice Provider
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="voiceProvider"
                    className="w-full p-4 bg-[#0D0A2C]/50 rounded-xl text-white/90 border border-[#C742A8]/20 hover:border-[#C742A8]/40 focus:outline-none focus:ring-2 focus:ring-[#C742A8]/30 transition-all duration-300"
                    value={settings.voice_provider}
                    onChange={(e) => setSettings({ ...settings, voice_provider: e.target.value })}
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <i className="fas fa-cloud text-[#C742A8]/40"></i>
                  </div>
                </div>
              </div>

              <div className="form-group relative transform transition-all duration-300 hover:scale-[1.02]">
                <label htmlFor="stability" className="block text-sm mb-3 text-white/80 font-medium tracking-wide">
                  Voice Stability
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    id="stability"
                    className="w-full p-4 bg-[#0D0A2C]/50 rounded-xl text-white/90 border border-[#C742A8]/20 hover:border-[#C742A8]/40 focus:outline-none focus:ring-2 focus:ring-[#C742A8]/30 transition-all duration-300"
                    value={settings.stability}
                    onChange={(e) => setSettings({ ...settings, stability: parseFloat(e.target.value) })}
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <i className="fas fa-wave-square text-[#C742A8]/40"></i>
                  </div>
                </div>
              </div>

              <div className="form-group relative transform transition-all duration-300 hover:scale-[1.02]">
                <label htmlFor="similarityBoost" className="block text-sm mb-3 text-white/80 font-medium tracking-wide">
                  Similarity Boost
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    id="similarityBoost"
                    className="w-full p-4 bg-[#0D0A2C]/50 rounded-xl text-white/90 border border-[#C742A8]/20 hover:border-[#C742A8]/40 focus:outline-none focus:ring-2 focus:ring-[#C742A8]/30 transition-all duration-300"
                    value={settings.similarity_boost}
                    onChange={(e) => setSettings({ ...settings, similarity_boost: parseFloat(e.target.value) })}
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <i className="fas fa-chart-line text-[#C742A8]/40"></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-6">
              <div className="form-group relative transform transition-all duration-300 hover:scale-[1.02] flex items-center p-4 bg-[#0D0A2C]/30 rounded-xl border border-[#C742A8]/20 hover:border-[#C742A8]/40">
                <input
                  type="checkbox"
                  id="fillerInjectionEnabled"
                  className="w-5 h-5 rounded border-[#C742A8]/40 text-[#C742A8] focus:ring-[#C742A8]/30"
                  checked={settings.voice_filler_injection_enabled}
                  onChange={(e) => setSettings({ ...settings, voice_filler_injection_enabled: e.target.checked })}
                />
                <label htmlFor="fillerInjectionEnabled" className="ml-3 text-white/90 font-medium">
                  Filler Injection Enabled
                </label>
                <i className="fas fa-magic ml-auto text-[#C742A8]/40"></i>
              </div>

              <div className="form-group relative transform transition-all duration-300 hover:scale-[1.02] flex items-center p-4 bg-[#0D0A2C]/30 rounded-xl border border-[#C742A8]/20 hover:border-[#C742A8]/40">
                <input
                  type="checkbox"
                  id="backchannelingEnabled"
                  className="w-5 h-5 rounded border-[#C742A8]/40 text-[#C742A8] focus:ring-[#C742A8]/30"
                  checked={settings.backchanneling_enabled}
                  onChange={(e) => setSettings({ ...settings, backchanneling_enabled: e.target.checked })}
                />
                <label htmlFor="backchannelingEnabled" className="ml-3 text-white/90 font-medium">
                  Backchanneling Enabled
                </label>
                <i className="fas fa-exchange-alt ml-auto text-[#C742A8]/40"></i>
              </div>

              <div className="form-group relative transform transition-all duration-300 hover:scale-[1.02] flex items-center p-4 bg-[#0D0A2C]/30 rounded-xl border border-[#C742A8]/20 hover:border-[#C742A8]/40">
                <input
                  type="checkbox"
                  id="backgroundDenoisingEnabled"
                  className="w-5 h-5 rounded border-[#C742A8]/40 text-[#C742A8] focus:ring-[#C742A8]/30"
                  checked={settings.background_denoising_enabled}
                  onChange={(e) => setSettings({ ...settings, background_denoising_enabled: e.target.checked })}
                />
                <label htmlFor="backgroundDenoisingEnabled" className="ml-3 text-white/90 font-medium">
                  Background Denoising Enabled
                </label>
                <i className="fas fa-filter ml-auto text-[#C742A8]/40"></i>
              </div>
            </div>
          </div>
          {/* Phone Numbers Section */}
          <div className="form-section relative overflow-hidden bg-gradient-to-br from-[#1A1A3A] via-[#2A1B4A] to-[#1A1A3A] rounded-2xl p-8 shadow-[0_8px_32px_rgba(199,66,168,0.15)] border border-opacity-20 border-[#C742A8] backdrop-blur-lg">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#C742A8] opacity-10 blur-[100px] rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#8E2CFF] opacity-10 blur-[100px] rounded-full"></div>

            <div className="flex justify-between items-center mb-8">
              <h3 className="relative text-3xl font-bold text-center">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C742A8] to-[#8E2CFF]">
                  Phone Numbers
                </span>
                <div className="h-0.5 w-16 bg-gradient-to-r from-[#C742A8] to-[#8E2CFF] rounded-full mt-3"></div>
              </h3>
              <div className="flex space-x-4">
                <button
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-[#C742A8] to-[#8E2CFF] text-white rounded-xl hover:opacity-90 transform hover:scale-105 transition-all duration-300 shadow-lg shadow-[#C742A8]/20"
                  onClick={() => setShowAddModal(true)}
                >
                  <i className="fas fa-plus-circle mr-2"></i>
                  Add Phone Number
                </button>
                <button
                  className="flex items-center px-6 py-3 bg-[#0D0A2C]/60 text-white rounded-xl border border-[#C742A8]/20 hover:border-[#C742A8]/40 transform hover:scale-105 transition-all duration-300"
                  onClick={() => setShowImportModal(true)}
                >
                  <i className="fas fa-file-import mr-2"></i>
                  Import Numbers
                </button>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-[#C742A8]/20">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-[#1A1A3A] to-[#2A1B4A]">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white/90 tracking-wider border-b border-[#C742A8]/20">
                      Phone Number ID
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white/90 tracking-wider border-b border-[#C742A8]/20">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white/90 tracking-wider border-b border-[#C742A8]/20">
                      Phone Number
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white/90 tracking-wider border-b border-[#C742A8]/20">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white/90 tracking-wider border-b border-[#C742A8]/20">
                      Created At
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white/90 tracking-wider border-b border-[#C742A8]/20">
                      Updated At
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white/90 tracking-wider border-b border-[#C742A8]/20">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C742A8]/10">
                  {phoneNumbers.map((phone: PhoneNumber) => (
                    <tr key={phone.id} className="hover:bg-[#C742A8]/5 transition-colors">
                      <td className="px-6 py-4 text-sm text-white/80">
                        {phone.phone_number_id}
                      </td>
                      <td className="px-6 py-4 text-sm text-white/80">
                        {phone.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-white/80">
                        {phone.phone_number}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <select
                          value={phone.status}
                          onChange={(e) =>
                            togglePhoneStatus(
                              phone.id.toString(),
                              e.target.value as "ACTIVE" | "INACTIVE"
                            )
                          }
                          className="px-3 py-1.5 bg-[#0D0A2C]/50 text-white/80 rounded-lg border border-[#C742A8]/20 hover:border-[#C742A8]/40 focus:outline-none focus:ring-2 focus:ring-[#C742A8]/30 transition-all duration-300"
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="INACTIVE">INACTIVE</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-white/80">
                        {phone.created_at}
                      </td>
                      <td className="px-6 py-4 text-sm text-white/80">
                        {phone.updated_at}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => deletePhoneNumber(phone.id.toString())}
                          className="text-[#C742A8] hover:text-[#C742A8]/80 transition-colors flex items-center"
                        >
                          <i className="fas fa-trash-alt mr-1"></i>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end mt-12">
            <button
              type="submit"
              className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#C742A8] to-[#8E2CFF] text-white text-lg font-semibold rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(199,66,168,0.25)] hover:shadow-[0_8px_32px_rgba(199,66,168,0.5)] transform hover:scale-105 transition-all duration-300"
            >
              <span className="relative z-10 flex items-center">
                <i className="fas fa-save mr-2 group-hover:scale-110 transition-transform duration-300"></i>
                Save Changes
                <div className="ml-2 group-hover:translate-x-1 transition-transform duration-300">
                  <i className="fas fa-arrow-right"></i>
                </div>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#8E2CFF] to-[#C742A8] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </form>

        {showAddModal && (
          <div className="modal">
            <div className="modal-content">
              <div
                className="form-section"
                style={{ width: "100%", margin: 0 }}
              >
                <h3 className="text-pink-500">Add Phone Number</h3>
                <div>
                  <div className="form-group mb-4">
                    <label
                      htmlFor="newPhoneNumberId"
                      className="block text-sm mb-1"
                    >
                      Phone Number ID:
                    </label>
                    <input
                      type="text"
                      id="newPhoneNumberId"
                      className="p-2 bg-[#0D0A2C] border border-[#C742A8] rounded-lg w-full"
                      required
                      placeholder="Enter phone number ID"
                    />
                  </div>
                  <div className="form-group mb-4">
                    <label htmlFor="phoneNumber" className="block text-sm mb-1">
                      Phone Number:
                    </label>
                    <input
                      type="text"
                      id="phoneNumber"
                      className="p-2 bg-[#0D0A2C] border border-[#C742A8] rounded-lg w-full"
                      required
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="form-group mb-4">
                    <label
                      htmlFor="phoneNewName"
                      className="block text-sm mb-1"
                    >
                      Name:
                    </label>
                    <input
                      type="text"
                      id="phoneNewName"
                      className="p-2 bg-[#0D0A2C] border border-[#C742A8] rounded-lg w-full"
                      required
                      placeholder="Enter name for this phone number"
                    />
                  </div>
                  <div className="form-actions flex justify-end">
                    <button
                      type="button"
                      className="btn btn-secondary mr-2"
                      onClick={() => setShowAddModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const newPhoneNumber: Partial<PhoneNumber> = {
                          phone_number_id: (
                            document.getElementById(
                              "newPhoneNumberId"
                            ) as HTMLInputElement
                          ).value,
                          phone_number: (
                            document.getElementById(
                              "phoneNumber"
                            ) as HTMLInputElement
                          ).value,
                          name: (
                            document.getElementById(
                              "phoneNewName"
                            ) as HTMLInputElement
                          ).value, // Corrected ID
                          status: "ACTIVE",
                        };

                        addPhoneNumber(newPhoneNumber);
                      }}
                      className="bg-[#C742A8] text-white px-4 py-2 rounded-lg hover:bg-[#C742A8]/90 transition-colors"
                    >
                      Add Number
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Import Numbers Modal */}
        {showImportModal && (
          <div className="modal">
            <div className="modal-content">
              <span className="close" onClick={() => setShowImportModal(false)}>
                &times;
              </span>
              <h2 className="text-xl font-semibold text-[#C742A8] mb-4">
                Import Phone Numbers
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  // Add your logic to handle file import
                }}
              >
                <input type="file" accept=".csv" required className="mb-4" />
                <div className="form-actions flex justify-end">
                  <button
                    type="button"
                    className="btn btn-secondary mr-2"
                    onClick={() => setShowImportModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#C742A8] text-white px-4 py-2 rounded-lg hover:bg-[#C742A8]/90 transition-colors"
                  >
                    Import
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Alert */}
        {alert.show && (
          <div
            className={`alert alert-${alert.type} bg-[#C742A8] text-white p-4 rounded-lg mb-4`}
          >
            <span
              className="closebtn cursor-pointer"
              onClick={() => setAlert({ show: false, message: "", type: "" })}
            >
              &times;
            </span>
            {alert.message}
          </div>
        )}
      </div>
    </BaseLayout>
  );
}
