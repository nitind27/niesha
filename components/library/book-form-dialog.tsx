"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import api from "@/lib/api"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

const bookSchema = z.object({
  isbn: z.string().max(50).optional().or(z.literal("")),
  title: z.string().min(1, "Title is required").max(200),
  author: z.string().min(1, "Author is required").max(100),
  publisher: z.string().max(100).optional().or(z.literal("")),
  category: z.string().max(50).optional().or(z.literal("")),
  edition: z.string().max(50).optional().or(z.literal("")),
  totalCopies: z.string().min(1, "Total copies is required"),
  availableCopies: z.string().optional(),
  price: z.string().optional().or(z.literal("")),
  shelfNumber: z.string().max(50).optional().or(z.literal("")),
  status: z.enum(["available", "issued", "lost", "damaged"]),
  coverImage: z.string().max(500).optional().or(z.literal("")),
  description: z.string().max(1000).optional().or(z.literal("")),
})

type BookFormData = z.infer<typeof bookSchema>

interface BookFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  book?: any
  onSuccess: () => void
}

export function BookFormDialog({
  open,
  onOpenChange,
  book,
  onSuccess,
}: BookFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<BookFormData>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      status: "available",
    },
  })

  const totalCopies = watch("totalCopies")
  const availableCopies = watch("availableCopies")

  useEffect(() => {
    if (open) {
      if (book) {
        reset({
          isbn: book.isbn || "",
          title: book.title || "",
          author: book.author || "",
          publisher: book.publisher || "",
          category: book.category || "",
          edition: book.edition || "",
          totalCopies: book.totalCopies ? String(book.totalCopies) : "1",
          availableCopies: book.availableCopies ? String(book.availableCopies) : "",
          price: book.price ? String(book.price) : "",
          shelfNumber: book.shelfNumber || "",
          status: book.status || "available",
          coverImage: book.coverImage || "",
          description: book.description || "",
        })
      } else {
        reset({
          isbn: "",
          title: "",
          author: "",
          publisher: "",
          category: "",
          edition: "",
          totalCopies: "1",
          availableCopies: "",
          price: "",
          shelfNumber: "",
          status: "available",
          coverImage: "",
          description: "",
        })
      }
      setError(null)
    } else {
      reset()
      setError(null)
    }
  }, [open, book, reset])

  // Auto-set availableCopies when totalCopies changes (only for new books)
  useEffect(() => {
    if (!book && totalCopies && !availableCopies) {
      setValue("availableCopies", totalCopies)
    }
  }, [totalCopies, book, availableCopies, setValue])

  const onSubmit = async (data: BookFormData) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      const totalCopiesNum = parseInt(data.totalCopies)
      const availableCopiesNum = data.availableCopies 
        ? parseInt(data.availableCopies) 
        : totalCopiesNum

      if (isNaN(totalCopiesNum) || totalCopiesNum < 1) {
        setError("Please enter a valid number for total copies (minimum 1)")
        setIsSubmitting(false)
        return
      }

      if (availableCopiesNum > totalCopiesNum) {
        setError("Available copies cannot exceed total copies")
        setIsSubmitting(false)
        return
      }

      const cleanedData: any = {
        isbn: data.isbn?.trim() || undefined,
        title: data.title.trim(),
        author: data.author.trim(),
        publisher: data.publisher?.trim() || undefined,
        category: data.category?.trim() || undefined,
        edition: data.edition?.trim() || undefined,
        totalCopies: totalCopiesNum,
        availableCopies: availableCopiesNum,
        price: data.price ? parseFloat(data.price) : undefined,
        shelfNumber: data.shelfNumber?.trim() || undefined,
        status: data.status,
        coverImage: data.coverImage?.trim() || undefined,
        description: data.description?.trim() || undefined,
      }

      if (book) {
        await api.patch(`/library/books/${book.id}`, cleanedData)
        toast({
          variant: "success",
          title: "Book Updated",
          description: "Book has been updated successfully.",
        })
      } else {
        await api.post("/library/books", cleanedData)
        toast({
          variant: "success",
          title: "Book Created",
          description: "Book has been created successfully.",
        })
      }
      
      reset()
      setError(null)
      onOpenChange(false)
      setTimeout(() => {
        onSuccess()
      }, 100)
    } catch (error: any) {
      console.error("Error saving book:", error)
      let errorMessage = "Failed to save book. Please try again."
      
      if (error.response?.data) {
        const errorData = error.response.data
        if (errorData.details && Array.isArray(errorData.details)) {
          const validationErrors = errorData.details
            .map((err: any) => {
              const field = err.path?.join(".") || "field"
              return `${field}: ${err.message}`
            })
            .join(", ")
          errorMessage = `Validation errors: ${validationErrors}`
        } else if (errorData.error) {
          errorMessage = errorData.error
        }
      }
      
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: book ? "Update Failed" : "Creation Failed",
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalCopiesNum = totalCopies ? parseInt(totalCopies) : 0
  const availableCopiesNum = availableCopies ? parseInt(availableCopies) : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{book ? "Edit Book" : "Add New Book"}</DialogTitle>
          <DialogDescription>
            {book ? "Update book information." : "Fill in the details to add a new book to the library."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                {error}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="Enter book title"
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="author">
                  Author <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="author"
                  {...register("author")}
                  placeholder="Enter author name"
                />
                {errors.author && (
                  <p className="text-sm text-destructive">{errors.author.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="isbn">ISBN (Optional)</Label>
                <Input
                  id="isbn"
                  {...register("isbn")}
                  placeholder="Enter ISBN"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="publisher">Publisher (Optional)</Label>
                <Input
                  id="publisher"
                  {...register("publisher")}
                  placeholder="Enter publisher name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category (Optional)</Label>
                <Input
                  id="category"
                  {...register("category")}
                  placeholder="e.g., Fiction, Science, History"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edition">Edition (Optional)</Label>
                <Input
                  id="edition"
                  {...register("edition")}
                  placeholder="e.g., 1st Edition, 2nd Edition"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalCopies">
                  Total Copies <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="totalCopies"
                  type="number"
                  min="1"
                  {...register("totalCopies")}
                  placeholder="Enter total copies"
                />
                {errors.totalCopies && (
                  <p className="text-sm text-destructive">{errors.totalCopies.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="availableCopies">Available Copies (Optional)</Label>
                <Input
                  id="availableCopies"
                  type="number"
                  min="0"
                  max={totalCopiesNum || undefined}
                  {...register("availableCopies")}
                  placeholder="Auto-filled from total copies"
                />
                {availableCopiesNum > totalCopiesNum && totalCopiesNum > 0 && (
                  <p className="text-sm text-destructive">
                    Available copies cannot exceed total copies
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (Optional)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register("price")}
                  placeholder="Enter price"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shelfNumber">Shelf Number (Optional)</Label>
                <Input
                  id="shelfNumber"
                  {...register("shelfNumber")}
                  placeholder="Enter shelf number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">
                  Status <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch("status") || "available"}
                  onValueChange={(value) => setValue("status", value as "available" | "issued" | "lost" | "damaged")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="issued">Issued</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-destructive">{errors.status.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="coverImage">Cover Image URL (Optional)</Label>
                <Input
                  id="coverImage"
                  {...register("coverImage")}
                  placeholder="Enter cover image URL"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  {...register("description")}
                  placeholder="Enter book description"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {book ? "Update Book" : "Create Book"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

