"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import api from "@/lib/api"
import { ArrowLeft, Clock, CheckCircle2, AlertCircle, Send } from "lucide-react"
import { cn } from "@/lib/utils"

interface Option { id: string; text: string; order: number }
interface Question { id: string; type: string; question: string; marks: number; required: boolean; explanation: string; options: Option[] }

export default function StudentTakeExamPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()

  const [exam, setExam] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [existingSubmission, setExistingSubmission] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const load = useCallback(async () => {
    try {
      const [examRes, qRes, subRes] = await Promise.all([
        api.get(`/exams/${id}`),
        api.get(`/exams/${id}/questions`),
        api.get(`/exams/${id}/submit`).catch(() => ({ data: { submission: null } })),
      ])
      setExam(examRes.data.exam)
      setQuestions(qRes.data.questions ?? [])

      if (subRes.data.submission?.status === "submitted") {
        setExistingSubmission(subRes.data.submission)
        setSubmitted(true)
        setResult(subRes.data.submission)
      }

      if (examRes.data.exam?.duration) {
        setTimeLeft(examRes.data.exam.duration * 60)
      }
    } catch {
      toast({ title: "Error", description: "Failed to load exam", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null || submitted) return
    if (timeLeft <= 0) { handleSubmit(); return }
    timerRef.current = setTimeout(() => setTimeLeft((t) => (t ?? 1) - 1), 1000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [timeLeft, submitted])

  const setAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleSubmit = async () => {
    const unanswered = questions.filter((q) => q.required && !answers[q.id])
    if (unanswered.length > 0) {
      toast({ title: "Incomplete", description: `Please answer all required questions (${unanswered.length} remaining)`, variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const payload = { answers: questions.map((q) => ({ questionId: q.id, answer: answers[q.id] ?? null })) }
      const res = await api.post(`/exams/${id}/submit`, payload)
      setResult(res.data.submission)
      setSubmitted(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      toast({ title: "Submitted!", description: "Your exam has been submitted successfully." })
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.error ?? "Failed to submit", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0")
    const s = (secs % 60).toString().padStart(2, "0")
    return `${m}:${s}`
  }

  const answeredCount = questions.filter((q) => answers[q.id]).length

  if (isLoading) return <div className="h-64 rounded-2xl bg-muted animate-pulse" />

  if (!exam) return <div className="text-center py-20 text-muted-foreground">Exam not found.</div>

  // ── Result screen ──────────────────────────────────────────────────────────
  if (submitted && result) {
    const pct = result.percentage ?? 0
    const passed = exam.passingMarks ? result.score >= exam.passingMarks : pct >= 40
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>

        <Card className={cn("border-2", passed ? "border-emerald-500" : "border-rose-500")}>
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            {passed
              ? <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
              : <AlertCircle className="h-16 w-16 text-rose-500 mx-auto" />}
            <h2 className="text-2xl font-bold">{passed ? "Congratulations!" : "Better luck next time"}</h2>
            <p className="text-muted-foreground">{exam.name}</p>
            {exam.showResults && (
              <div className="flex justify-center gap-8 pt-2">
                <div>
                  <p className="text-3xl font-bold">{result.score ?? "—"}<span className="text-lg text-muted-foreground">/{result.totalMarks}</span></p>
                  <p className="text-xs text-muted-foreground">Score</p>
                </div>
                <div>
                  <p className={cn("text-3xl font-bold", passed ? "text-emerald-600" : "text-rose-500")}>{pct}%</p>
                  <p className="text-xs text-muted-foreground">Percentage</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Answer review */}
        {exam.showResults && existingSubmission?.answers && (
          <div className="space-y-3">
            <h3 className="font-semibold">Answer Review</h3>
            {questions.map((q, idx) => {
              const ans = existingSubmission.answers.find((a: any) => a.questionId === q.id)
              const isCorrect = ans?.isCorrect
              return (
                <Card key={q.id} className={cn("border", isCorrect === true ? "border-emerald-300" : isCorrect === false ? "border-rose-300" : "border-border")}>
                  <CardContent className="pt-4 pb-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold text-muted-foreground mt-0.5">{idx + 1}.</span>
                      <p className="text-sm font-medium flex-1">{q.question}</p>
                      {isCorrect === true && <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Correct</Badge>}
                      {isCorrect === false && <Badge className="bg-rose-100 text-rose-700 border-0 text-xs">Wrong</Badge>}
                      {isCorrect === null && <Badge variant="secondary" className="text-xs">Manual grading</Badge>}
                    </div>
                    {ans?.answer && (
                      <p className="text-sm text-muted-foreground pl-5">
                        Your answer: <span className="font-medium text-foreground">
                          {q.type === "mcq" || q.type === "true_false"
                            ? q.options.find((o) => o.id === ans.answer)?.text ?? ans.answer
                            : ans.answer}
                        </span>
                      </p>
                    )}
                    {q.explanation && <p className="text-xs text-blue-600 dark:text-blue-400 pl-5 italic">{q.explanation}</p>}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ── Exam not open ──────────────────────────────────────────────────────────
  if (exam.status !== "ongoing") {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold">{exam.name}</h2>
            <p className="text-muted-foreground mt-2">
              {exam.status === "scheduled" ? "This exam has not started yet." : exam.status === "completed" ? "This exam has ended." : "This exam is not available."}
            </p>
            <Badge className="mt-3 capitalize">{exam.status}</Badge>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Exam form ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-10">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b pb-3 pt-1">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">{exam.name}</h1>
            <p className="text-xs text-muted-foreground">{questions.length} questions · {exam.totalMarks ?? "?"} marks</p>
          </div>
          <div className="flex items-center gap-3">
            {timeLeft !== null && (
              <div className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-mono font-bold",
                timeLeft < 300 ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400" : "bg-muted text-foreground")}>
                <Clock className="h-3.5 w-3.5" />
                {formatTime(timeLeft)}
              </div>
            )}
            <span className="text-xs text-muted-foreground">{answeredCount}/{questions.length}</span>
          </div>
        </div>
        {exam.description && <p className="text-sm text-muted-foreground mt-1">{exam.description}</p>}
      </div>

      {/* Questions */}
      {questions.map((q, idx) => (
        <Card key={q.id} className={cn("transition-all", answers[q.id] ? "border-primary/30" : "")}>
          <CardContent className="pt-5 pb-5 space-y-4">
            <div className="flex items-start gap-2">
              <span className="text-sm font-bold text-muted-foreground mt-0.5 flex-shrink-0">{idx + 1}.</span>
              <div className="flex-1">
                <p className="text-sm font-medium leading-relaxed">{q.question}
                  {q.required && <span className="text-red-500 ml-1">*</span>}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{q.marks} mark{q.marks !== 1 ? "s" : ""}</p>
              </div>
            </div>

            {/* MCQ */}
            {q.type === "mcq" && (
              <div className="space-y-2 pl-5">
                {q.options.map((opt) => (
                  <label key={opt.id} className={cn(
                    "flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all",
                    answers[q.id] === opt.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  )}>
                    <div className={cn("h-4 w-4 rounded-full border-2 flex-shrink-0 transition-colors",
                      answers[q.id] === opt.id ? "border-primary bg-primary" : "border-muted-foreground")} />
                    <input type="radio" name={q.id} value={opt.id} checked={answers[q.id] === opt.id}
                      onChange={() => setAnswer(q.id, opt.id)} className="sr-only" />
                    <span className="text-sm">{opt.text}</span>
                  </label>
                ))}
              </div>
            )}

            {/* True/False */}
            {q.type === "true_false" && (
              <div className="flex gap-3 pl-5">
                {q.options.map((opt) => (
                  <label key={opt.id} className={cn(
                    "flex-1 flex items-center justify-center gap-2 rounded-xl border px-4 py-3 cursor-pointer transition-all",
                    answers[q.id] === opt.id ? "border-primary bg-primary/5 font-semibold" : "border-border hover:border-primary/40"
                  )}>
                    <input type="radio" name={q.id} value={opt.id} checked={answers[q.id] === opt.id}
                      onChange={() => setAnswer(q.id, opt.id)} className="sr-only" />
                    <span className="text-sm">{opt.text}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Short answer */}
            {q.type === "short_answer" && (
              <input
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                placeholder="Your answer…"
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ml-5 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            )}

            {/* Long answer */}
            {q.type === "long_answer" && (
              <textarea
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                placeholder="Write your detailed answer here…"
                rows={4}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ml-5 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            )}
          </CardContent>
        </Card>
      ))}

      {/* Submit */}
      <div className="sticky bottom-4">
        <Button
          className="w-full h-12 text-base shadow-lg"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          <Send className="mr-2 h-4 w-4" />
          {isSubmitting ? "Submitting…" : "Submit Exam"}
        </Button>
      </div>
    </div>
  )
}
