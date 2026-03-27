import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateRequest } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get("unreadOnly") === "true"
    const limit = parseInt(searchParams.get("limit") || "10")

    // Get announcements that are relevant to the user
    let announcements: any[] = []
    let payments: any[] = []
    let auditLogs: any[] = []

    if (payload.schoolId) {
      // Get published announcements for school
      announcements = await prisma.announcement.findMany({
        where: {
          schoolId: payload.schoolId,
          isPublished: true,
          deletedAt: null,
        },
        select: {
          id: true,
          title: true,
          content: true,
          type: true,
          priority: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      })

      // Get recent payments (if user has permission)
      payments = await prisma.payment.findMany({
        where: {
          schoolId: payload.schoolId,
          deletedAt: null,
          status: "pending",
        },
        select: {
          id: true,
          amount: true,
          paymentDate: true,
          status: true,
          student: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      })
    }

    // Get audit logs for super admin
    if (payload.role === "super_admin") {
      auditLogs = await prisma.auditLog.findMany({
        where: {
          action: { in: ["create", "update", "delete"] },
        },
        select: {
          id: true,
          action: true,
          entityType: true,
          createdAt: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      })
    }

    // Format notifications
    const notifications: any[] = []

    // Add announcements as notifications
    announcements.forEach((announcement) => {
      notifications.push({
        id: `announcement-${announcement.id}`,
        type: "announcement",
        title: announcement.title,
        message: announcement.content.substring(0, 100) + (announcement.content.length > 100 ? "..." : ""),
        priority: announcement.priority,
        category: announcement.type,
        createdAt: announcement.createdAt,
        read: false, // You can implement read status tracking
        icon: announcement.priority === "urgent" ? "alert" : announcement.type === "academic" ? "book" : "info",
      })
    })

    // Add pending payments as notifications
    payments.forEach((payment) => {
      notifications.push({
        id: `payment-${payment.id}`,
        type: "payment",
        title: "Pending Payment",
        message: `Payment of $${Number(payment.amount).toFixed(2)} pending for ${payment.student.firstName} ${payment.student.lastName}`,
        priority: "normal",
        category: "finance",
        createdAt: payment.paymentDate,
        read: false,
        icon: "dollar",
      })
    })

    // Add audit logs as notifications for super admin
    auditLogs.forEach((log) => {
      notifications.push({
        id: `audit-${log.id}`,
        type: "audit",
        title: `${log.action.charAt(0).toUpperCase() + log.action.slice(1)} ${log.entityType}`,
        message: `${log.user?.firstName || "System"} ${log.action} ${log.entityType}`,
        priority: "low",
        category: "system",
        createdAt: log.createdAt,
        read: false,
        icon: "activity",
      })
    })

    // Sort by date
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Filter unread only if requested
    const filteredNotifications = unreadOnly
      ? notifications.filter((n) => !n.read)
      : notifications

    // Limit results
    const limitedNotifications = filteredNotifications.slice(0, limit)

    // Count unread
    const unreadCount = notifications.filter((n) => !n.read).length

    return NextResponse.json({
      notifications: limitedNotifications,
      unreadCount,
      total: notifications.length,
    })
  } catch (error) {
    console.error("Notifications GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/notifications/[id]/read - Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    // In a real implementation, you would have a notifications table
    // For now, we'll just return success
    // You can implement read status tracking in a separate table

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Notifications PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

