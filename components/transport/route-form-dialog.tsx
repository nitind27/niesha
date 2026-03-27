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
import { Loader2, Plus, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

const routeSchema = z.object({
  name: z.string().min(1, "Route name is required").max(100),
  routeNumber: z.string().min(1, "Route number is required").max(50),
  startPoint: z.string().min(1, "Start point is required").max(200),
  endPoint: z.string().min(1, "End point is required").max(200),
  stops: z.array(z.string()).optional(),
  distance: z.string().optional().or(z.literal("")),
  fare: z.string().optional().or(z.literal("")),
  vehicleId: z.string().optional().or(z.literal("")),
  driverId: z.string().optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]),
})

type RouteFormData = z.infer<typeof routeSchema>

interface RouteFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  route?: any
  onSuccess: () => void
}

export function RouteFormDialog({
  open,
  onOpenChange,
  route,
  onSuccess,
}: RouteFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [staff, setStaff] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [stops, setStops] = useState<string[]>([])
  const [newStop, setNewStop] = useState("")
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<RouteFormData>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      status: "active",
    },
  })

  useEffect(() => {
    if (open) {
      setLoadingData(true)
      api
        .get("/staff?limit=100")
        .then((res) => setStaff(res.data.staff || []))
        .catch(() => setStaff([]))
        .finally(() => setLoadingData(false))
    }
  }, [open])

  useEffect(() => {
    if (open) {
      if (route) {
        const routeStops = route.stops && Array.isArray(route.stops) ? route.stops : []
        setStops(routeStops)
        reset({
          name: route.name || "",
          routeNumber: route.routeNumber || "",
          startPoint: route.startPoint || "",
          endPoint: route.endPoint || "",
          stops: routeStops,
          distance: route.distance ? String(route.distance) : "",
          fare: route.fare ? String(route.fare) : "",
          vehicleId: route.vehicleId || "",
          driverId: route.driverId || "",
          status: route.status || "active",
        })
      } else {
        setStops([])
        reset({
          name: "",
          routeNumber: "",
          startPoint: "",
          endPoint: "",
          stops: [],
          distance: "",
          fare: "",
          vehicleId: "",
          driverId: "",
          status: "active",
        })
      }
      setNewStop("")
      setError(null)
    } else {
      reset()
      setStops([])
      setNewStop("")
      setError(null)
    }
  }, [open, route, reset])

  const addStop = () => {
    if (newStop.trim()) {
      const updatedStops = [...stops, newStop.trim()]
      setStops(updatedStops)
      setValue("stops", updatedStops)
      setNewStop("")
    }
  }

  const removeStop = (index: number) => {
    const updatedStops = stops.filter((_, i) => i !== index)
    setStops(updatedStops)
    setValue("stops", updatedStops)
  }

  const onSubmit = async (data: RouteFormData) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      const cleanedData: any = {
        name: data.name.trim(),
        routeNumber: data.routeNumber.trim(),
        startPoint: data.startPoint.trim(),
        endPoint: data.endPoint.trim(),
        stops: stops.length > 0 ? stops : undefined,
        distance: data.distance ? parseFloat(data.distance) : undefined,
        fare: data.fare ? parseFloat(data.fare) : undefined,
        vehicleId: data.vehicleId || undefined,
        driverId: data.driverId || undefined,
        status: data.status,
      }

      if (route) {
        await api.patch(`/transport/routes/${route.id}`, cleanedData)
        toast({
          variant: "success",
          title: "Route Updated",
          description: "Route has been updated successfully.",
        })
      } else {
        await api.post("/transport/routes", cleanedData)
        toast({
          variant: "success",
          title: "Route Created",
          description: "Route has been created successfully.",
        })
      }
      
      reset()
      setStops([])
      setNewStop("")
      setError(null)
      onOpenChange(false)
      setTimeout(() => {
        onSuccess()
      }, 100)
    } catch (error: any) {
      console.error("Error saving route:", error)
      let errorMessage = "Failed to save route. Please try again."
      
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
        title: route ? "Update Failed" : "Creation Failed",
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{route ? "Edit Route" : "Add New Route"}</DialogTitle>
          <DialogDescription>
            {route ? "Update route information." : "Fill in the details to add a new transport route."}
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
              <div className="space-y-2">
                <Label htmlFor="name">
                  Route Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="e.g., North Route, South Route"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="routeNumber">
                  Route Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="routeNumber"
                  {...register("routeNumber")}
                  placeholder="e.g., R001, R002"
                />
                {errors.routeNumber && (
                  <p className="text-sm text-destructive">{errors.routeNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="startPoint">
                  Start Point <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="startPoint"
                  {...register("startPoint")}
                  placeholder="Enter start point"
                />
                {errors.startPoint && (
                  <p className="text-sm text-destructive">{errors.startPoint.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endPoint">
                  End Point <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="endPoint"
                  {...register("endPoint")}
                  placeholder="Enter end point"
                />
                {errors.endPoint && (
                  <p className="text-sm text-destructive">{errors.endPoint.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="distance">Distance (km) (Optional)</Label>
                <Input
                  id="distance"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register("distance")}
                  placeholder="Enter distance in km"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fare">Fare (Optional)</Label>
                <Input
                  id="fare"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register("fare")}
                  placeholder="Enter fare amount"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="driverId">Driver (Optional)</Label>
                <Select
                  value={watch("driverId") || "all"}
                  onValueChange={(value) => setValue("driverId", value === "all" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">No Driver</SelectItem>
                    {staff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} ({s.employeeId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">
                  Status <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch("status") || "active"}
                  onValueChange={(value) => setValue("status", value as "active" | "inactive")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-destructive">{errors.status.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="stops">Stops (Optional)</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newStop}
                      onChange={(e) => setNewStop(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addStop()
                        }
                      }}
                      placeholder="Enter stop location and press Enter"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addStop}
                      disabled={!newStop.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {stops.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {stops.map((stop, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {stop}
                          <button
                            type="button"
                            onClick={() => removeStop(index)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
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
              {route ? "Update Route" : "Create Route"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

