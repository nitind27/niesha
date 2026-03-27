"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft, Search } from "lucide-react"

export default function NotFound() {
  const router = useRouter()
  const [doorClosed, setDoorClosed] = useState(false)
  const [showBoy, setShowBoy] = useState(true)

  useEffect(() => {
    // Door closing animation sequence
    const timer1 = setTimeout(() => {
      setDoorClosed(true)
    }, 500)

    const timer2 = setTimeout(() => {
      setShowBoy(false)
    }, 2000)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [])

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-12">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-96 w-96 animate-blob rounded-full bg-blue-200/30 blur-3xl dark:bg-blue-900/20"></div>
        <div className="absolute -right-20 -bottom-20 h-96 w-96 animate-blob animation-delay-2000 rounded-full bg-indigo-200/30 blur-3xl dark:bg-indigo-900/20"></div>
        <div className="absolute left-1/2 top-1/2 h-96 w-96 animate-blob animation-delay-4000 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-200/20 blur-3xl dark:bg-purple-900/10"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        <div className="flex flex-col items-center justify-center space-y-8">
          {/* 404 Number with Animation */}
          <div className="relative">
            <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 animate-pulse">
              404
            </h1>
            <div className="absolute inset-0 text-9xl font-bold text-blue-600/20 dark:text-blue-400/10 blur-2xl animate-pulse">
              404
            </div>
          </div>

          {/* Door and Boy Animation Container */}
          <div className="relative w-80 h-96 flex items-center justify-center">
            {/* Door Frame */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-64 h-80 bg-gradient-to-b from-amber-800 to-amber-900 dark:from-amber-900 dark:to-amber-950 rounded-lg shadow-2xl border-4 border-amber-700 dark:border-amber-800">
                {/* Door */}
                <div
                  className={`absolute inset-0 bg-gradient-to-b from-amber-700 to-amber-800 dark:from-amber-800 dark:to-amber-900 rounded-lg transition-transform duration-1000 ease-in-out origin-left ${
                    doorClosed ? "rotate-y-90" : "rotate-y-0"
                  }`}
                  style={{
                    transform: doorClosed ? "perspective(1000px) rotateY(90deg)" : "perspective(1000px) rotateY(0deg)",
                    transformStyle: "preserve-3d",
                  }}
                >
                  {/* Door Handle */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-900 dark:bg-amber-950 shadow-lg"></div>
                  {/* Door Panels */}
                  <div className="absolute inset-4 border-2 border-amber-600/30 rounded"></div>
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-amber-600/30"></div>
                </div>

                {/* Boy Character - Shows before door closes */}
                {showBoy && (
                  <div
                    className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-1000 ${
                      doorClosed ? "opacity-0 scale-0 translate-y-10" : "opacity-100 scale-100 translate-y-0"
                    }`}
                  >
                    <div className="relative animate-head-shake">
                      {/* Head */}
                      <div className="w-16 h-16 bg-yellow-300 dark:bg-yellow-400 rounded-full mx-auto mb-2 shadow-lg relative transition-transform duration-500">
                        {/* Face */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          {/* Eyes - Sad */}
                          <div className="absolute left-4 top-6 w-2 h-2 bg-black rounded-full"></div>
                          <div className="absolute right-4 top-6 w-2 h-2 bg-black rounded-full"></div>
                          {/* Tears */}
                          <div className="absolute left-3 top-8 w-1 h-2 bg-blue-400 rounded-full opacity-70"></div>
                          <div className="absolute right-3 top-8 w-1 h-2 bg-blue-400 rounded-full opacity-70"></div>
                          {/* Mouth - Sad */}
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-6 h-3 border-2 border-black rounded-b-full border-t-0"></div>
                        </div>
                        {/* Hair */}
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-8 bg-black rounded-t-full"></div>
                      </div>
                      {/* Body */}
                      <div className="w-12 h-20 bg-blue-500 dark:bg-blue-600 rounded-lg mx-auto shadow-lg"></div>
                      {/* Arms - Down position (sad) */}
                      <div className="absolute left-2 top-8 w-3 h-12 bg-blue-500 dark:bg-blue-600 rounded-full rotate-12"></div>
                      <div className="absolute right-2 top-8 w-3 h-12 bg-blue-500 dark:bg-blue-600 rounded-full -rotate-12"></div>
                      {/* Legs */}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-2">
                        <div className="w-4 h-12 bg-gray-700 dark:bg-gray-600 rounded-b-full"></div>
                        <div className="w-4 h-12 bg-gray-700 dark:bg-gray-600 rounded-b-full"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="text-center space-y-4 animate-fade-in-up">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
              Oops! Page Not Found
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md">
              The page you&apos;re looking for seems to have disappeared. 
              <br />
              Maybe it went through that door?
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up animation-delay-200">
            <Button
              onClick={() => router.back()}
              variant="outline"
              size="lg"
              className="group"
            >
              <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Go Back
            </Button>
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="group"
            >
              <Link href="/dashboard">
                <Search className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform" />
                Explore Dashboard
              </Link>
            </Button>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-10 left-10 w-20 h-20 opacity-20 animate-bounce">
            <div className="w-full h-full border-4 border-blue-500 rounded-full"></div>
          </div>
          <div className="absolute bottom-10 right-10 w-16 h-16 opacity-20 animate-bounce animation-delay-1000">
            <div className="w-full h-full border-4 border-indigo-500 rounded-full"></div>
          </div>
        </div>
      </div>

    </div>
  )
}

