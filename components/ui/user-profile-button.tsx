"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { User, Key, X, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface UserProfileButtonProps {
  inToolbar?: boolean;
}

export default function UserProfileButton({ inToolbar = false }: UserProfileButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [loginError, setLoginError] = useState("")
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Check if user is already logged in
  useEffect(() => {
    const savedLoginState = localStorage.getItem("isLoggedIn")
    if (savedLoginState === "true") {
      setIsLoggedIn(true)
    }
    
    const savedApiKey = localStorage.getItem("fal_ai_key") || ""
    setApiKey(savedApiKey)
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setLoginError("")
    
    // For testing: Accept "test@test.com"/"test" or any email with "test" password
    setTimeout(() => {
      if (password === "test" && (email === "test@test.com" || email.includes("test"))) {
        setIsLoggedIn(true)
        localStorage.setItem("isLoggedIn", "true")
        setIsLoading(false)
      } else {
        setLoginError("Invalid credentials. Try test@test.com/test")
        setIsLoading(false)
      }
    }, 800)
  }

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSaveSuccess(false)

    try {
      // Save API key to localStorage
      localStorage.setItem("fal_ai_key", apiKey)
      
      // Show success feedback
      setIsLoading(false)
      setSaveSuccess(true)
      
      // Auto-hide success message and close panel after 1.5 seconds
      setTimeout(() => {
        setSaveSuccess(false)
        setIsOpen(false)
      }, 1500)
    } catch (error) {
      console.error("Error saving API key:", error)
      setIsLoading(false)
    }
  }

  const handleClearApiKey = () => {
    localStorage.removeItem("fal_ai_key")
    setApiKey("")
    setSaveSuccess(false)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    localStorage.removeItem("isLoggedIn")
    setEmail("")
    setPassword("")
    setIsOpen(false)
  }

  return (
    <>
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className={`${inToolbar ? "" : "absolute top-4 right-[calc(15px)]"} z-20 bg-gray-900 border border-gray-800 rounded-full h-10 w-10 shadow-md hover:bg-gray-800`}
      >
        <User className="h-5 w-5 text-gray-300" />
      </Button>

      {isOpen && (
        <div
          className={`${inToolbar ? "absolute top-[calc(100%+10px)] right-0" : "absolute top-14 right-[calc(15px)]"} z-50 bg-black border border-gray-800/50 rounded-sm p-4 shadow-lg w-72 font-mono text-white user-profile-dropdown`}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium">{isLoggedIn ? "API Settings" : "Sign In"}</h3>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {isLoggedIn ? (
            <form
              onSubmit={handleSaveApiKey}
              className="space-y-4"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-2">
                <Label htmlFor="apiKey" className="text-sm text-gray-300">
                  fal.ai API Key
                </Label>
                <div className="flex items-center space-x-2">
                  <Key className="h-4 w-4 text-gray-500" />
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your fal.ai API key"
                    className="bg-black border-gray-800 text-white text-xs h-8"
                  />
                </div>
                <p className="text-xs text-gray-500">Your API key is stored locally and never sent to our servers.</p>
              </div>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLogout}
                  className="bg-transparent border-gray-800 text-gray-300 hover:bg-gray-800 text-xs h-8"
                >
                  Sign Out
                </Button>
                <Button
                  type="submit"
                  disabled={!apiKey || isLoading}
                  className={`${
                    saveSuccess 
                      ? "bg-green-700 hover:bg-green-600" 
                      : "bg-gray-800 hover:bg-gray-700"
                  } text-white text-xs h-8`}
                >
                  {isLoading ? "Saving..." : saveSuccess ? "Saved!" : "Save API Key"}
                </Button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={handleLogin}
              className="space-y-4"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {loginError && (
                <div className="text-xs text-red-400 bg-red-900/20 border border-red-900/50 p-2 rounded-sm">
                  {loginError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-gray-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="test@test.com"
                  className="bg-black border-gray-800 text-white text-xs h-8"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-gray-300">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="test"
                  className="bg-black border-gray-800 text-white text-xs h-8"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={!email || !password || isLoading}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white text-xs h-8"
              >
                {isLoading ? "Signing in..." : "Sign In"}
                <LogIn className="ml-2 h-4 w-4" />
              </Button>
              
              <p className="text-xs text-gray-500 text-center">
                For testing, use: test@test.com / test
              </p>
            </form>
          )}
        </div>
      )}
    </>
  )
}

