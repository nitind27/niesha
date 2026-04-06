"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen } from "lucide-react"
import api from "@/lib/api"
import { formatDate } from "@/lib/utils"

export default function StudentLibraryPage() {
  const [books, setBooks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get("/library?limit=50")
      .then((r) => setBooks(r.data.books ?? r.data.bookIssues ?? []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Library</h1>
        <p className="text-muted-foreground text-sm">Books issued to you</p>
      </div>

      {isLoading && <div className="h-48 rounded-2xl bg-muted animate-pulse" />}
      {!isLoading && books.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          No books currently issued.
        </div>
      )}

      <div className="space-y-3">
        {books.map((b) => (
          <Card key={b.id}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{b.book?.title ?? b.title ?? "Book"}</p>
                  {b.book?.author && <p className="text-xs text-muted-foreground">{b.book.author}</p>}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    {b.issueDate && <span>Issued: {formatDate(b.issueDate)}</span>}
                    {b.dueDate && <span>Due: {formatDate(b.dueDate)}</span>}
                  </div>
                </div>
                {b.status && (
                  <Badge variant={b.status === "returned" ? "default" : "secondary"} className="capitalize text-xs">
                    {b.status}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
