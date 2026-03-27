"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, CheckSquare, Square } from "lucide-react"
import { TableSkeleton } from "@/components/loading/table-skeleton"

export interface Column<T> {
  id: string
  header: string | React.ReactNode
  accessor?: keyof T | ((row: T) => React.ReactNode)
  cell?: (row: T) => React.ReactNode
  sortable?: boolean
  className?: string
  headerClassName?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  error?: string | null
  emptyMessage?: string
  onRowClick?: (row: T) => void
  className?: string
  rowClassName?: string | ((row: T) => string)
  sortable?: boolean
  defaultSort?: {
    column: string
    direction: "asc" | "desc"
  }
  onSort?: (column: string, direction: "asc" | "desc") => void
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
    onPageChange: (page: number) => void
  }
  selectable?: boolean
  selectedRows?: Set<string>
  onRowSelect?: (rowId: string, selected: boolean) => void
  onSelectAll?: (selected: boolean) => void
  getRowId?: (row: T) => string
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  error = null,
  emptyMessage = "No data available",
  onRowClick,
  className,
  rowClassName,
  sortable = false,
  defaultSort,
  onSort,
  pagination,
  selectable = false,
  selectedRows = new Set(),
  onRowSelect,
  onSelectAll,
  getRowId = (row) => row.id,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = React.useState<{
    column: string
    direction: "asc" | "desc"
  } | null>(defaultSort || null)

  const handleSort = (columnId: string) => {
    if (!sortable && !columns.find((col) => col.id === columnId)?.sortable) {
      return
    }

    const newDirection: "asc" | "desc" =
      sortConfig?.column === columnId && sortConfig.direction === "asc" ? "desc" : "asc"

    const newSortConfig = { column: columnId, direction: newDirection }
    setSortConfig(newSortConfig)

    if (onSort) {
      onSort(columnId, newDirection)
    }
  }

  const getCellContent = (column: Column<T>, row: T): React.ReactNode => {
    if (column.cell) {
      return column.cell(row)
    }
    if (column.accessor) {
      if (typeof column.accessor === "function") {
        return column.accessor(row)
      }
      return row[column.accessor] as React.ReactNode
    }
    return null
  }

  const getRowClass = (row: T): string => {
    if (typeof rowClassName === "function") {
      return rowClassName(row)
    }
    return rowClassName || ""
  }

  const allSelected = selectable && data.length > 0 && data.every((row) => selectedRows.has(getRowId(row)))
  const someSelected = selectable && data.some((row) => selectedRows.has(getRowId(row)))

  return (
    <div className={cn("space-y-4", className)}>
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-12">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onSelectAll && onSelectAll(!allSelected)}
                  >
                    {allSelected ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : someSelected ? (
                      <div className="h-4 w-4 rounded border-2 border-primary bg-primary/50" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
              )}
              {columns.map((column) => {
                const isSortable = sortable || column.sortable
                const isSorted = sortConfig?.column === column.id

                return (
                  <TableHead
                    key={column.id}
                    className={cn(
                      isSortable && "cursor-pointer hover:bg-accent",
                      column.headerClassName
                    )}
                    onClick={() => isSortable && handleSort(column.id)}
                  >
                    <div className="flex items-center gap-2">
                      {typeof column.header === "string" ? column.header : column.header}
                      {isSortable && (
                        <span className="inline-flex">
                          {isSorted ? (
                            sortConfig.direction === "asc" ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </span>
                      )}
                    </div>
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="h-24"
                >
                  <TableSkeleton rows={5} cols={columns.length} />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => {
                const rowId = getRowId(row)
                const isSelected = selectedRows.has(rowId)

                return (
                  <TableRow
                    key={rowId}
                    className={cn(
                      onRowClick && "cursor-pointer",
                      isSelected && "bg-accent",
                      getRowClass(row)
                    )}
                    onClick={() => onRowClick && onRowClick(row)}
                  >
                    {selectable && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRowSelect && onRowSelect(rowId, !isSelected)
                          }}
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell key={column.id} className={column.className}>
                        {getCellContent(column, row)}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrevPage}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1
                } else if (pagination.page <= 3) {
                  pageNum = i + 1
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i
                } else {
                  pageNum = pagination.page - 2 + i
                }
                return (
                  <Button
                    key={pageNum}
                    variant={pagination.page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => pagination.onPageChange(pageNum)}
                    className="w-10"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

