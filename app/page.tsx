"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export default function SyntheticV0PageForDeployment() {
  const [query, setQuery] = useState("")
  const [answer, setAnswer] = useState("")
  const [phone, setPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`)
      }

      const data = await response.json()
      setAnswer(data.answer)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSms = async () => {
    try {
      await fetch("/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, message: answer }),
      })
      alert("SMS sent successfully!")
    } catch (err) {
      alert("Failed to send SMS.")
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Bharat Sanchar AI</CardTitle>
          <p className="text-center text-gray-500 dark:text-gray-400">
            Your AI-powered guide to Indian government schemes.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid w-full gap-2">
              <Textarea
                placeholder="Ask your question in English or Hindi..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-h-[100px]"
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Thinking..." : "Ask"}
              </Button>
            </div>
          </form>
          {error && <p className="text-red-500 mt-4">{error}</p>}
          {answer && (
            <div className="mt-6">
              <h3 className="font-semibold">Answer:</h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{answer}</p>
              <div className="flex gap-2 mt-4">
                <Input
                  type="tel"
                  placeholder="Enter phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <Button onClick={handleSms}>Send as SMS</Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="text-center text-xs text-gray-500">
          <p>Powered by AI. Information may not always be accurate.</p>
        </CardFooter>
      </Card>
    </div>
  )
}