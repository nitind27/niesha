# Reusable UI Components

This directory contains reusable UI components built with Radix UI, Tailwind CSS, and following Next.js 14 App Router best practices.

## Components

### Modal (`modal.tsx`)

A flexible modal/dialog component with multiple variants.

```tsx
import { Modal, ConfirmModal } from "@/components/ui/modal"

// Basic Modal
<Modal
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Edit Student"
  description="Update student information"
  size="lg"
>
  <p>Modal content here</p>
</Modal>

// With Trigger
<Modal
  trigger={<Button>Open Modal</Button>}
  title="Add Student"
>
  <p>Content</p>
</Modal>

// Confirmation Modal
<ConfirmModal
  open={isOpen}
  onOpenChange={setIsOpen}
  message="Are you sure you want to delete this student?"
  onConfirm={handleDelete}
  variant="destructive"
/>
```

### DataCard (`data-card.tsx`)

Enhanced card component with variants and stat card support.

```tsx
import { DataCard, StatCard } from "@/components/ui/data-card"

// Basic Card
<DataCard
  title="Student Information"
  description="View student details"
  variant="primary"
  size="md"
>
  <p>Card content</p>
</DataCard>

// Stat Card
<StatCard
  value={150}
  label="Total Students"
  icon={Users}
  trend={{ value: 12, isPositive: true }}
/>
```

### DataTable (`data-table.tsx`)

Feature-rich table component with sorting, pagination, and selection.

```tsx
import { DataTable, Column } from "@/components/ui/data-table"

const columns: Column<Student>[] = [
  {
    id: "name",
    header: "Name",
    accessor: (row) => `${row.firstName} ${row.lastName}`,
    sortable: true,
  },
  {
    id: "email",
    header: "Email",
    accessor: "email",
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => <Badge>{row.status}</Badge>,
  },
]

<DataTable
  data={students}
  columns={columns}
  loading={isLoading}
  sortable
  pagination={{
    page: 1,
    limit: 10,
    total: 100,
    totalPages: 10,
    hasNextPage: true,
    hasPrevPage: false,
    onPageChange: setPage,
  }}
  selectable
  selectedRows={selectedRows}
  onRowSelect={handleRowSelect}
  onRowClick={(row) => console.log(row)}
/>
```

## Features

- ✅ TypeScript support
- ✅ Fully accessible (ARIA compliant)
- ✅ Responsive design
- ✅ Dark mode support
- ✅ Customizable styling
- ✅ Loading states
- ✅ Error handling
- ✅ Keyboard navigation

