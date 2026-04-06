"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/useAuth"
import api from "@/lib/api"
import {
  Plus, Trash2, GripVertical, ChevronDown, ChevronUp,
  Save, ArrowLeft, CheckCircle2, Circle, AlignLeft, AlignJustify, ToggleLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"

type QuestionType = "mcq" | "true_false" | "short_answer" | "long_answer"

interface Option { id?: string; text: string; isCorrect: boolean; order: number }
interface Question {
  id?: string
  type: QuestionType
  question: string
  marks: number
  required: boolean
  explanation: string
  options: Option[]
  order: number
}

const TYPE_LABELS: Record<QuestionType, { label: string; icon: any; color: string }> = {
  mcq: { label: "Multiple Choice", icon: CheckCircle2, color: "text-blue-500" },
  true_false: { label: "True / False", icon: ToggleLeft, color: "text-emerald-500" },
  short_answer: { label: "Short Answer", icon: AlignLeft, color: "text-violet-500" },
  long_answer: { label: "Long Answer", icon: AlignJustify, color: "text-amber-500" },
}

function newQuestion(order: number): Question {
  return { type: "mcq", question: "", marks: 1, required: true, explanation: "", order, options: [{ text: "", isCorrect: true, order: 0 }, { text: "", isCorrect: false, order: 1 }] }
}

export default function ExamBuilderPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  const [exam, setExam] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0)

  const canEdit = user?.role === "school_admin" || user?.role === "teacher" || user?.role === "principal"

  const load = useCallback(async () => {
    try {
      const [examRes, qRes] = await Promise.all([
        api.get(`/exams/${id}`),
        api.get(`/exams/${id}/questions`),
      ])
      setExam(examRes.data.exam)
      const qs: Question[] = (qRes.data.questions ?? []).map((q: any) => ({
        id: q.id,
        type: q.type as QuestionType,
        question: q.question,
        marks: q.marks,
        required: q.required,
        explanation: q.explanation ?? "",
        order: q.order,
        options: q.options ?? [],
      }))
      setQuestions(qs.length ? qs : [newQuestion(0)])
    } catch {
      toast({ title: "Error", description: "Failed to load exam", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const save = async () => {
    setIsSaving(true)
    try {
      await api.put(`/exams/${id}/questions`, { questions: questions.map((q, i) => ({ ...q, order: i })) })
      toast({ title: "Saved", description: "Questions saved successfully" })
      load()
    } catch {
      toast({ title: "Error", description: "Failed to save questions", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const addQuestion = () => {
    const q = newQuestion(questions.length)
    setQuestions([...questions, q])
    setExpandedIdx(questions.length)
  }

  const removeQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx))
    setExpandedIdx(null)
  }

  const updateQuestion = (idx: number, patch: Partial<Question>) => {
    setQuestions(questions.map((q, i) => i === idx ? { ...q, ...patch } : q))
  }

  const addOption = (qIdx: number) => {
    const q = questions[qIdx]
    updateQuestion(qIdx, { options: [...q.options, { text: "", isCorrect: false, order: q.options.length }] })
  }

  const removeOption = (qIdx: number, oIdx: number) => {
    const q = questions[qIdx]
    updateQuestion(qIdx, { options: q.options.filter((_, i) => i !== oIdx) })
  }

  const updateOption = (qIdx: number, oIdx: number, patch: Partial<Option>) => {
    const q = questions[qIdx]
    updateQuestion(qIdx, { options: q.options.map((o, i) => i === oIdx ? { ...o, ...patch } : o) })
  }

  const setCorrectOption = (qIdx: number, oIdx: number) => {
    const q = questions[qIdx]
    updateQuestion(qIdx, { options: q.options.map((o, i) => ({ ...o, isCorrect: i === oIdx })) })
  }

  const changeType = (qIdx: number, type: QuestionType) => {
    const q = questions[qIdx]
    let options = q.options
    if (type === "true_false") options = [{ text: "True", isCorrect: true, order: 0 }, { text: "False", isCorrect: false, order: 1 }]
    else if (type === "short_answer" || type === "long_answer") options = []
    else if (type === "mcq" && options.length === 0) options = [{ text: "", isCorrect: true, order: 0 }, { text: "", isCorrect: false, order: 1 }]
    updateQuestion(qIdx, { type, options })
  }

  const totalMarks = questions.reduce((s, q) => s + (q.marks || 0), 0)

  if (isLoading) return <div className="h-64 rounded-2xl bg-muted animate-pulse" />

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold">{exam?.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="capitalize">{exam?.type?.replace("_", " ")}</Badge>
              <Badge variant="outline">{exam?.class?.name}</Badge>
              <span className="text-xs text-muted-foreground">{questions.length} questions · {totalMarks} marks</span>
            </div>
          </div>
        </div>
        {canEdit && (
          <Button onClick={save} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving…" : "Save Questions"}
          </Button>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-3">
        {questions.map((q, idx) => {
          const isOpen = expandedIdx === idx
          const TypeIcon = TYPE_LABELS[q.type]?.icon ?? Circle
          return (
            <Card key={idx} className={cn("transition-all", isOpen && "ring-2 ring-primary/30")}>
              {/* Question header */}
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
                onClick={() => setExpandedIdx(isOpen ? null : idx)}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs font-bold text-muted-foreground w-6">{idx + 1}</span>
                <TypeIcon className={cn("h-4 w-4 flex-shrink-0", TYPE_LABELS[q.type]?.color)} />
                <p className="flex-1 text-sm font-medium truncate">{q.question || <span className="text-muted-foreground italic">Untitled question</span>}</p>
                <span className="text-xs text-muted-foreground">{q.marks} mark{q.marks !== 1 ? "s" : ""}</span>
                {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>

              {/* Expanded editor */}
              {isOpen && canEdit && (
                <CardContent className="pt-0 pb-4 space-y-4 border-t">
                  {/* Type + marks row */}
                  <div className="flex flex-wrap gap-3 pt-4">
                    <div className="space-y-1 flex-1 min-w-[160px]">
                      <Label className="text-xs">Question Type</Label>
                      <select
                        value={q.type}
                        onChange={(e) => changeType(idx, e.target.value as QuestionType)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      >
                        {Object.entries(TYPE_LABELS).map(([v, { label }]) => (
                          <option key={v} value={v}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1 w-24">
                      <Label className="text-xs">Marks</Label>
                      <Input type="number" min={1} value={q.marks} onChange={(e) => updateQuestion(idx, { marks: parseInt(e.target.value) || 1 })} className="h-9" />
                    </div>
                    <div className="flex items-end gap-2">
                      <label className="flex items-center gap-2 text-sm cursor-pointer pb-1">
                        <input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(idx, { required: e.target.checked })} className="rounded" />
                        Required
                      </label>
                    </div>
                  </div>

                  {/* Question text */}
                  <div className="space-y-1">
                    <Label className="text-xs">Question <span className="text-red-500">*</span></Label>
                    <textarea
                      value={q.question}
                      onChange={(e) => updateQuestion(idx, { question: e.target.value })}
                      placeholder="Enter your question here…"
                      rows={2}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* Options for MCQ / True-False */}
                  {(q.type === "mcq" || q.type === "true_false") && (
                    <div className="space-y-2">
                      <Label className="text-xs">Options (click circle to mark correct)</Label>
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setCorrectOption(idx, oIdx)}
                            className={cn("h-5 w-5 rounded-full border-2 flex-shrink-0 transition-colors",
                              opt.isCorrect ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground")}
                          />
                          <Input
                            value={opt.text}
                            onChange={(e) => updateOption(idx, oIdx, { text: e.target.value })}
                            placeholder={`Option ${oIdx + 1}`}
                            disabled={q.type === "true_false"}
                            className="h-8 text-sm"
                          />
                          {q.type === "mcq" && q.options.length > 2 && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => removeOption(idx, oIdx)}>
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {q.type === "mcq" && (
                        <Button variant="outline" size="sm" onClick={() => addOption(idx)} className="mt-1">
                          <Plus className="mr-1 h-3.5 w-3.5" /> Add Option
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Short/Long answer preview */}
                  {q.type === "short_answer" && (
                    <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">Student will type a short answer here</div>
                  )}
                  {q.type === "long_answer" && (
                    <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-6 text-sm text-muted-foreground">Student will type a detailed answer here</div>
                  )}

                  {/* Explanation */}
                  <div className="space-y-1">
                    <Label className="text-xs">Explanation (shown after submission, optional)</Label>
                    <Input value={q.explanation} onChange={(e) => updateQuestion(idx, { explanation: e.target.value })} placeholder="Explain the correct answer…" className="h-8 text-sm" />
                  </div>

                  {/* Delete question */}
                  <div className="flex justify-end pt-1">
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => removeQuestion(idx)}>
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remove question
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Add question */}
      {canEdit && (
        <Button variant="outline" className="w-full border-dashed" onClick={addQuestion}>
          <Plus className="mr-2 h-4 w-4" /> Add Question
        </Button>
      )}
    </div>
  )
}
