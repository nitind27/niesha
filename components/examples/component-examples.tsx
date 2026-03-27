"use client"

/**
 * Example usage of reusable UI components
 * This file demonstrates how to use Modal, DataCard, and DataTable components
 */

import { useState } from "react"
import { Modal, ConfirmModal } from "@/components/ui/modal"
import { DataCard, StatCard } from "@/components/ui/data-card"
import { DataTable, Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, GraduationCap, DollarSign, TrendingUp } from "lucide-react"

// Example: Modal Usage
export function ModalExample() {
  const [isOpen, setIsOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  return (
    <div className="space-y-4">
      {/* Basic Modal */}
      <Modal
        open={isOpen}
        onOpenChange={setIsOpen}
        trigger={<Button>Open Modal</Button>}
        title="Example Modal"
        description="This is a reusable modal component"
        size="lg"
      >
        <p>Modal content goes here</p>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmModal
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        message="Are you sure you want to delete this item?"
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={async () => {
          // Handle confirmation
          console.log("Confirmed")
        }}
      />
      <Button onClick={() => setIsConfirmOpen(true)}>Show Confirm</Button>
    </div>
  )
}

// Example: DataCard Usage
export function CardExample() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Basic Card */}
      <DataCard
        title="Student Information"
        description="View student details"
        variant="primary"
      >
        <p>Card content here</p>
      </DataCard>

      {/* Stat Card */}
      <StatCard
        value={150}
        label="Total Students"
        icon={Users}
        iconColor="text-blue-600"
        iconBgColor="bg-blue-100 dark:bg-blue-900/20"
        trend={{ value: 12, isPositive: true }}
      />

      <StatCard
        value={45}
        label="Active Classes"
        icon={GraduationCap}
        iconColor="text-green-600"
        iconBgColor="bg-green-100 dark:bg-green-900/20"
      />

      <StatCard
        value="$12,500"
        label="Total Revenue"
        icon={DollarSign}
        iconColor="text-yellow-600"
        iconBgColor="bg-yellow-100 dark:bg-yellow-900/20"
        trend={{ value: 5, isPositive: false }}
      />
    </div>
  )
}

// Example: DataTable Usage
interface ExampleData {
  id: string
  name: string
  email: string
  status: string
  role: string
}

export function TableExample() {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)

  const data: ExampleData[] = [
    { id: "1", name: "John Doe", email: "john@example.com", status: "active", role: "Student" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", status: "inactive", role: "Teacher" },
    { id: "3", name: "Bob Johnson", email: "bob@example.com", status: "active", role: "Admin" },
  ]

  const columns: Column<ExampleData>[] = [
    {
      id: "name",
      header: "Name",
      accessor: "name",
      sortable: true,
    },
    {
      id: "email",
      header: "Email",
      accessor: "email",
      sortable: true,
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <Badge variant={row.status === "active" ? "default" : "secondary"}>
          {row.status}
        </Badge>
      ),
    },
    {
      id: "role",
      header: "Role",
      accessor: "role",
    },
  ]

  const handleRowSelect = (rowId: string, selected: boolean) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(rowId)
      } else {
        newSet.delete(rowId)
      }
      return newSet
    })
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedRows(new Set(data.map((row) => row.id)))
    } else {
      setSelectedRows(new Set())
    }
  }

  return (
    <DataTable
      data={data}
      columns={columns}
      sortable
      selectable
      selectedRows={selectedRows}
      onRowSelect={handleRowSelect}
      onSelectAll={handleSelectAll}
      onRowClick={(row) => console.log("Row clicked:", row)}
      pagination={{
        page,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNextPage: page < 10,
        hasPrevPage: page > 1,
        onPageChange: setPage,
      }}
    />
  )
}

