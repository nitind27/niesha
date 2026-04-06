import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authenticateRequest } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

const submitSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string(),
    answer: z.string().nullable().optional(),
  })),
})

// POST /api/exams/[id]/submit — student submits exam
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.SETTINGS_READ)
    if (auth.error) return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })

    if (!auth.payload.schoolId) return NextResponse.json({ error: "No school" }, { status: 403 })

    // Find student record
    const student = await prisma.student.findFirst({
      where: { userId: auth.payload.userId, schoolId: auth.payload.schoolId, deletedAt: null },
    })
    if (!student) {
      // fallback by email
      const user = await prisma.user.findUnique({ where: { id: auth.payload.userId }, select: { email: true } })
      const byEmail = user?.email ? await prisma.student.findFirst({
        where: { email: { equals: user.email, mode: "insensitive" }, schoolId: auth.payload.schoolId, deletedAt: null },
      }) : null
      if (!byEmail) return NextResponse.json({ error: "Student profile not found" }, { status: 404 })
    }

    const studentRecord = student ?? await prisma.student.findFirst({
      where: { userId: auth.payload.userId, schoolId: auth.payload.schoolId, deletedAt: null },
    })
    if (!studentRecord) return NextResponse.json({ error: "Student not found" }, { status: 404 })

    const exam = await prisma.exam.findFirst({
      where: { id: params.id, schoolId: auth.payload.schoolId, deletedAt: null },
      include: { questions: { include: { options: true } } },
    })
    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 })

    if (exam.status !== "ongoing") {
      return NextResponse.json({ error: "Exam is not currently open for submissions" }, { status: 400 })
    }

    // Check already submitted
    const existing = await prisma.examSubmission.findUnique({
      where: { examId_studentId: { examId: params.id, studentId: studentRecord.id } },
    })
    if (existing?.status === "submitted") {
      return NextResponse.json({ error: "You have already submitted this exam" }, { status: 400 })
    }

    const body = await request.json()
    const parsed = submitSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: "Invalid submission" }, { status: 400 })

    const { answers } = parsed.data

    // Auto-grade MCQ and true/false
    let score = 0
    const totalMarks = exam.questions.reduce((s, q) => s + q.marks, 0)

    const gradedAnswers = answers.map((a) => {
      const question = exam.questions.find((q) => q.id === a.questionId)
      if (!question) return { ...a, isCorrect: null, marksAwarded: 0 }

      if (question.type === "mcq" || question.type === "true_false") {
        const correctOption = question.options.find((o) => o.isCorrect)
        const isCorrect = correctOption ? a.answer === correctOption.id : false
        const marksAwarded = isCorrect ? question.marks : 0
        score += marksAwarded
        return { questionId: a.questionId, answer: a.answer ?? null, isCorrect, marksAwarded }
      }

      // short/long answer — needs manual grading
      return { questionId: a.questionId, answer: a.answer ?? null, isCorrect: null, marksAwarded: null }
    })

    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0

    // Upsert submission
    const submission = await prisma.examSubmission.upsert({
      where: { examId_studentId: { examId: params.id, studentId: studentRecord.id } },
      create: {
        examId: params.id,
        studentId: studentRecord.id,
        submittedAt: new Date(),
        score,
        totalMarks,
        percentage,
        status: "submitted",
        answers: {
          create: gradedAnswers.map((a) => ({
            questionId: a.questionId,
            answer: a.answer,
            isCorrect: a.isCorrect,
            marksAwarded: a.marksAwarded,
          })),
        },
      },
      update: {
        submittedAt: new Date(),
        score,
        totalMarks,
        percentage,
        status: "submitted",
        answers: {
          deleteMany: {},
          create: gradedAnswers.map((a) => ({
            questionId: a.questionId,
            answer: a.answer,
            isCorrect: a.isCorrect,
            marksAwarded: a.marksAwarded,
          })),
        },
      },
      include: { answers: true },
    })

    return NextResponse.json({
      submission: {
        id: submission.id,
        score,
        totalMarks,
        percentage,
        status: submission.status,
        showResults: exam.showResults,
      },
    })
  } catch (e) {
    console.error("[exam submit]", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/exams/[id]/submit — get student's own submission
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.SETTINGS_READ)
    if (auth.error) return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })

    if (!auth.payload.schoolId) return NextResponse.json({ error: "No school" }, { status: 403 })

    const student = await prisma.student.findFirst({
      where: { userId: auth.payload.userId, schoolId: auth.payload.schoolId, deletedAt: null },
    })
    if (!student) return NextResponse.json({ submission: null })

    const submission = await prisma.examSubmission.findUnique({
      where: { examId_studentId: { examId: params.id, studentId: student.id } },
      include: {
        answers: {
          include: { question: { include: { options: true } } },
        },
      },
    })

    return NextResponse.json({ submission })
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
