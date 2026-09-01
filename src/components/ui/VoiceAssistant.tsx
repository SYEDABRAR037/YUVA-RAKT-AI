"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Volume2, Sparkles, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function VoiceAssistant() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  const langLocales: Record<string, string> = {
    en: "en-IN",
    hi: "hi-IN",
    mr: "mr-IN",
    te: "te-IN",
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSupported(false);
      }
    }
  }, []);

  const speakResponse = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langLocales[language] || "en-IN";
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleVoiceCommand = (cmd: string) => {
    const query = cmd.toLowerCase().trim();
    setTranscript(cmd);

    // Navigation & action heuristics across languages
    if (
      query.includes("radar") ||
      query.includes("रडार") ||
      query.includes("राडార్") ||
      query.includes("emergency") ||
      query.includes("आपातकालीन") ||
      query.includes("आपत्कालीन")
    ) {
      const resp =
        language === "hi"
          ? "आपातकालीन रडार खोला जा रहा है।"
          : language === "mr"
          ? "आपत्कालीन रडार उघडत आहे."
          : language === "te"
          ? "అత్యవసర రాడార్ తెరవబడుతోంది."
          : "Navigating to Emergency Mobilization Radar.";
      setResponseMessage(resp);
      speakResponse(resp);
      setTimeout(() => {
        router.push("/government/emergency");
        setIsOpen(false);
      }, 1200);
      return;
    }

    if (
      query.includes("map") ||
      query.includes("मैप") ||
      query.includes("नकाशा") ||
      query.includes("మ్యాప్") ||
      query.includes("live") ||
      query.includes("लाइव") ||
      query.includes("थेट")
    ) {
      const resp =
        language === "hi"
          ? "राष्ट्रीय लाइव रक्त मानचित्र खोला जा रहा है।"
          : language === "mr"
          ? "राष्ट्रीय थेट रक्त नकाशा उघडत आहे."
          : language === "te"
          ? "జాతీయ లైవ్ రక్త నిఘా మ్యాప్ తెరవబడుతోంది."
          : "Opening National Live Blood Intelligence Map.";
      setResponseMessage(resp);
      speakResponse(resp);
      setTimeout(() => {
        router.push("/government/live-map");
        setIsOpen(false);
      }, 1200);
      return;
    }

    if (
      query.includes("forecast") ||
      query.includes("demand") ||
      query.includes("पूर्वानुमान") ||
      query.includes("अंदाज") ||
      query.includes("అంచనా")
    ) {
      const resp =
        language === "hi"
          ? "एआई रक्त मांग पूर्वानुमान खोला जा रहा है।"
          : language === "mr"
          ? "एआय रक्त मागणी अंदाज उघडत आहे."
          : language === "te"
          ? "AI రక్త డిమాండ్ అంచనా తెరవబడుతోంది."
          : "Opening AI Demand Forecasting & Shortage Models.";
      setResponseMessage(resp);
      speakResponse(resp);
      setTimeout(() => {
        router.push("/government/ai-forecast");
        setIsOpen(false);
      }, 1200);
      return;
    }

    if (
      query.includes("inventory") ||
      query.includes("stock") ||
      query.includes("इन्वेंटरी") ||
      query.includes("साठा") ||
      query.includes("నిల్వలు")
    ) {
      const resp =
        language === "hi"
          ? "रक्त बैंक इन्वेंटरी बहीखाता खोला जा रहा है।"
          : language === "mr"
          ? "रक्तपेढी साठा वही उघडत आहे."
          : language === "te"
          ? "బ్లడ్ బ్యాంక్ నిల్వల పోర్టల్ తెరవబడుతోంది."
          : "Opening Blood Centre Inventory Matrix.";
      setResponseMessage(resp);
      speakResponse(resp);
      setTimeout(() => {
        router.push("/blood-bank/inventory");
        setIsOpen(false);
      }, 1200);
      return;
    }

    if (
      query.includes("request") ||
      query.includes("अनुरोध") ||
      query.includes("विनंती") ||
      query.includes("అభ్యర్థన")
    ) {
      const resp =
        language === "hi"
          ? "अस्पताल रक्त मांग प्रबंधन खोला जा रहा है।"
          : language === "mr"
          ? "रुग्णालय रक्त मागणी व्यवस्थापन उघडत आहे."
          : language === "te"
          ? "ఆసుపత్రి రక్త అభ్యర్థనల విభాగం తెరవబడుతోంది."
          : "Navigating to Hospital Blood Requisitions.";
      setResponseMessage(resp);
      speakResponse(resp);
      setTimeout(() => {
        router.push("/hospital/requests");
        setIsOpen(false);
      }, 1200);
      return;
    }

    const defaultResp =
      language === "hi"
        ? `आदेश प्राप्त हुआ: "${cmd}". कृपया 'रडार', 'लाइव मैप', 'पूर्वानुमान', या 'इन्वेंटरी' बोलें।`
        : language === "mr"
        ? `आदेश मिळाला: "${cmd}". कृपया 'रडार', 'थेट नकाशा', 'अंदाज', किंवा 'साठा' बोला.`
        : language === "te"
        ? `కమాండ్ అందుకుంది: "${cmd}". దయచేసి 'రాడార్', 'లైవ్ మ్యాప్', 'అంచనా', లేదా 'నిల్వలు' అని చెప్పండి.`
        : `Command recognized: "${cmd}". Try saying 'Open Live Map', 'Emergency Radar', or 'Demand Forecast'.`;
    setResponseMessage(defaultResp);
    speakResponse(defaultResp);
  };

  const startListening = () => {
    if (!supported) {
      setResponseMessage(t.voice.notSupported);
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = langLocales[language] || "en-IN";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setResponseMessage(t.voice.listening);
      };

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setIsListening(false);
        handleVoiceCommand(text);
      };

      recognition.onerror = () => {
        setIsListening(false);
        const err =
          language === "hi"
            ? "आवाज़ पहचानने में असमर्थ। कृपया पुनः प्रयास करें।"
            : language === "mr"
            ? "आवाज ओळखता आला नाही. कृपया पुन्हा प्रयत्न करा."
            : language === "te"
            ? "వాయిస్ గుర్తించలేకపోయాము. దయచేసి మళ్ళీ ప్రయత్నించండి."
            : "Could not capture voice command. Please try again.";
        setResponseMessage(err);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      setResponseMessage(t.voice.notSupported);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setResponseMessage(t.voice.greeting);
          }}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white flex items-center justify-center shadow-2xl shadow-rose-600/50 border-2 border-rose-400/50 transition-all hover:scale-105 group cursor-pointer"
          title={t.voice.tapToSpeak}
          aria-label={t.voice.tapToSpeak}
        >
          <Mic className="w-6 h-6 text-white group-hover:animate-pulse" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-slate-950 animate-ping" />
        </button>
      )}

      {/* Voice Assistant Modal Card */}
      {isOpen && (
        <div className="w-80 sm:w-96 rounded-3xl bg-slate-900 border-2 border-rose-500/50 shadow-2xl p-5 text-white animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black tracking-wider uppercase text-rose-300">
                  {t.voice.assistantTitle}
                </h4>
                <p className="text-[10px] text-slate-400 font-bold">
                  {language.toUpperCase()} ({langLocales[language]})
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                stopListening();
                setIsOpen(false);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center mb-4 min-h-[100px] flex flex-col justify-center">
            {transcript && (
              <p className="text-xs font-medium text-slate-400 mb-1 italic">
                &ldquo;{transcript}&rdquo;
              </p>
            )}
            <p className="text-xs sm:text-sm font-bold text-slate-200">
              {responseMessage || t.voice.speakNow}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={isListening ? stopListening : startListening}
              className={`px-5 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 transition-all shadow-lg cursor-pointer ${
                isListening
                  ? "bg-amber-600 hover:bg-amber-500 text-white animate-pulse shadow-amber-600/40"
                  : "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/40"
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>Stop Listening</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>Start Voice Command</span>
                </>
              )}
            </button>

            {responseMessage && (
              <button
                onClick={() => speakResponse(responseMessage)}
                className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                title="Speak Response"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
