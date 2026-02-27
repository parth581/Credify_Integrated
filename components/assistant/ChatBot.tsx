"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mic, MicOff, Send, ChevronDown, MessageCircle, Languages } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  role: "user" | "ai"
  text: string
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [lang, setLang] = useState<"en-IN" | "hi-IN">("en-IN") // Language State
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const speak = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      
      // Auto-detect Hindi characters to set the correct voice language
      const isHindi = /[\u0900-\u097F]/.test(text)
      utterance.lang = isHindi ? "hi-IN" : "en-US"
      
      utterance.rate = 1.0
      window.speechSynthesis.speak(utterance)
    }
  }

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return alert("Browser not supported")

    const recognition = new SpeechRecognition()
    recognition.lang = lang // Uses the selected language
    
    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      sendMessage(transcript)
    }
    recognition.start()
  }

  async function sendMessage(overrideInput?: string) {
    const textToSend = overrideInput || input
    if (!textToSend.trim()) return

    const userMsg: Message = { role: "user", text: textToSend }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: messages.map((m) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.text }],
          })),
        }),
      })

      const data = await res.json()
      const aiMsg: Message = { role: "ai", text: data.reply }
      setMessages((prev) => [...prev, aiMsg])
      speak(data.reply)
      processLoan(data.reply)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  function processLoan(text: string) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return
      const parsed = JSON.parse(jsonMatch[0])

      if (parsed.intent === "loan_request") {
        const old = JSON.parse(localStorage.getItem("loanApplications") || "[]")
        localStorage.setItem("loanApplications", JSON.stringify([...old, { id: Date.now(), ...parsed.data, status: "Pending", bids: [], createdAt: new Date().toISOString() }]))
        alert(lang === "hi-IN" ? "✅ ऋण अनुरोध सफलतापूर्वक बनाया गया!" : "✅ Loan Request Created Successfully!")
        window.location.reload()
      }
    } catch (e) {}
  }

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl transition-all hover:scale-110 z-50 bg-primary"
      >
        <MessageCircle size={30} />
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-6 right-6 w-[90vw] md:w-96 h-[500px] shadow-2xl z-50 flex flex-col border-none overflow-hidden animate-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 p-4 flex items-center justify-between text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">🤖</div>
          <div>
            <p className="font-bold text-sm leading-none">Credify Assistant</p>
            <button 
              onClick={() => setLang(lang === "en-IN" ? "hi-IN" : "en-IN")}
              className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full mt-1 flex items-center gap-1 hover:bg-white/30 transition-colors"
            >
              <Languages size={10} /> {lang === "en-IN" ? "English" : "हिंदी"}
            </button>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/10 rounded-full">
          <ChevronDown size={24} />
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.length === 0 && (
          <div className="text-center space-y-2 py-8">
            <p className="text-2xl">👋</p>
            <p className="text-sm font-medium text-slate-500">
              {lang === "hi-IN" ? "नमस्ते! मैं आपकी लोन में कैसे मदद कर सकता हूँ?" : "How can I help you with your loan today?"}
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn("p-3 rounded-2xl max-w-[85%] text-sm shadow-sm", m.role === "user" ? "bg-primary text-primary-foreground ml-auto rounded-tr-none" : "bg-white border text-slate-800 mr-auto rounded-tl-none")}>
            {m.text}
          </div>
        ))}
        {loading && <div className="flex gap-1 bg-white border w-fit p-3 rounded-2xl rounded-tl-none animate-pulse">...</div>}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t">
        <div className="flex gap-2 items-center">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={lang === "hi-IN" ? "पूछिए..." : "Type a message..."}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 bg-slate-100 border-none rounded-xl"
          />
          <Button 
            size="icon" 
            variant={isListening ? "destructive" : "outline"}
            onClick={startListening}
            className={cn("rounded-xl transition-all", isListening && "animate-pulse")}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </Button>
          <Button size="icon" onClick={() => sendMessage()} disabled={loading || !input.trim()} className="rounded-xl">
            <Send size={18} />
          </Button>
        </div>
      </div>
    </Card>
  )
}