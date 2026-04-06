import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authenticateRequest } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

const optionSchema = z.object({
  text: z.string().min(1),
  isCorrect: z.boolean().default(false),
  order: z.number().int().default(0),
})

const questionSchema = z.object({
  type: z.enum(["mcq", "true_false", "short_answer", "long_answer"]),
  question: z.string().min(1, "Question text is required"),
  marks: z.number().int().min(1).default(1),
  order: z.number().int().default(0),
  required: z.boolean().default(true),
  explanation: z.string().optional().nullable(),
  options: z.array(optionSchema).optional(),
})

// GET /api/exams/[id]/questions
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.EXAM_READ)
    if (auth.error) return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })

    const exam = await prisma.exam.findFirst({
      where: { id: params.id, schoolId: auth.payload.schoolId!, deletedAt: null },
    })
    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 })

    const questions = await prisma.examQuestion.findMany({
      where: { examId: params.id },
      include: { options: { orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
    })

    return NextResponse.json({ questions })
  } catch (e) {
    console.error("[exam questions GET]", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/exams/[id]/questions — add a question
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.EXAM_CREATE)
    if (auth.error) return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })

    const exam = await prisma.exam.findFirst({
      where: { id: params.id, schoolId: auth.payload.schoolId!, deletedAt: null },
    })
    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 })

    const body = await request.json()
    const result = questionSchema.safeParse(body)
    if (!result.success) return NextResponse.json({ error: "Validation failed", details: result.error.errors }, { status: 400 })

    const data = result.data

    const question = await prisma.examQuestion.create({
      data: {
        examId: params.id,
        type: data.type,
        question: data.question,
        marks: data.marks,
        order: data.order,
        required: data.required,
        explanation: data.explanation ?? null,
        options: data.options?.length
          ? { create: data.options.map((o, i) => ({ text: o.text, isCorrect: o.isCorrect, order: i })) }
          : undefined,
      },
      include: { options: { orderBy: { order: "asc" } } },
    })

    // Update exam totalMarks
    const allQ = await prisma.examQuestion.findMany({ where: { examId: params.id }, select: { marks: true } })
    const total = allQ.reduce((s, q) => s + q.marks, 0)
    await prisma.exam.update({ where: { id: params.id }, data: { totalMarks: total } })

    return NextResponse.json({ question }, { status: 201 })
  } catch (e) {
    console.error("[exam questions POST]", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/exams/[id]/questions — bulk replace all questions
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.EXAM_UPDATE)
    if (auth.error) return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })

    const exam = await prisma.exam.findFirst({
      where: { id: params.id, schoolId: auth.payload.schoolId!, deletedAt: null },
    })
    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 })

    const body = await request.json()
    const questions: z.infer<typeof questionSchema>[] = body.questions ?? []

    // Delete all existing questions (cascade deletes options)
    await prisma.examQuestion.deleteMany({ where: { examId: params.id } })

    // Re-create
    const created = await Promise.all(
      questions.map((q, idx) =>
        prisma.examQuestion.create({
          data: {
            examId: params.id,
            type: q.type,
            question: q.question,
            marks: q.marks ?? 1,
            order: idx,
            required: q.required ?? true,
            explanation: q.explanation ?? null,
            options: q.options?.length
              ? { create: q.options.map((o, i) => ({ text: o.text, isCorrect: o.isCorrect, order: i })) }
              : undefined,
          },
          include: { options: { orderBy: { order: "asc" } } },
        })
      )
    )

    const total = created.reduce((s, q) => s + q.marks, 0)
    await prisma.exam.update({ where: { id: params.id }, data: { totalMarks: total } })

    return NextResponse.json({ questions: created })
  } catch (e) {
    console.error("[exam questions PUT]", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
