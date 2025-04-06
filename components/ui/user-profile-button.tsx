"use client"

import type React from "react"

import { useState, useRef } from "react"
import { User, LogIn, Key, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function UserProfileButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate login - in a real app, this would call an API
    setTimeout(() => {
      setIsLoggedIn(true)
      setIsLoading(false)
    }, 1000)
  }

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate saving API key - in a real app, this would call an API
    setTimeout(() => {
      setIsLoading(false)
      setIsOpen(false)
    }, 1000)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setApiKey("")
  }

  return (
    <>
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-4 right-4 z-20 bg-black/80 border border-gray-800 rounded-full h-8 w-8"
      >
        <User className="h-4 w-4 text-gray-300" />
      </Button>

      {isOpen && (
        <div
          className="absolute top-14 right-4 z-50 bg-black border border-gray-800/50 rounded-sm p-4 shadow-lg w-72 font-mono text-white"
          style={{
            filter: "drop-shadow(0 0 8px rgba(0, 0, 0, 0.5))",
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium">{isLoggedIn ? "API Settings" : "Login"}</h3>
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
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
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
                  Logout
                </Button>
                <Button
                  type="submit"
                  disabled={!apiKey || isLoading}
                  className="bg-gray-800 hover:bg-gray-700 text-white text-xs h-8"
                >
                  {isLoading ? "Saving..." : "Save API Key"}
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
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-gray-300">
                  Email
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="bg-black border-gray-800 text-white text-xs h-8"
                    required
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-gray-300">
                  Password
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="bg-black border-gray-800 text-white text-xs h-8"
                    required
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={!email || !password || isLoading}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white text-xs h-8"
              >
                {isLoading ? "Logging in..." : "Login"}
                <LogIn className="ml-2 h-4 w-4" />
              </Button>
            </form>
          )}
        </div>
      )}
    </>
  )
}

