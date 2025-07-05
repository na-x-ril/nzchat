"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Wifi, Info, Upload } from "lucide-react"
import type { Id } from "@/convex/_generated/dataModel"

interface ConnectionSpeedDialogProps {
  isOpen: boolean
  onClose: () => void
  userId: Id<"users">
}

const speedOptions = [
  { value: 1, label: "Slow (1-5 Mbps)", description: "Basic broadband", maxFile: "~10 MB" },
  { value: 10, label: "Medium (5-25 Mbps)", description: "Standard broadband", maxFile: "~150 MB" },
  { value: 50, label: "Fast (25-100 Mbps)", description: "High-speed broadband", maxFile: "~750 MB" },
  { value: 100, label: "Very Fast (100+ Mbps)", description: "Fiber/Premium", maxFile: "~1.5 GB" },
]

export function ConnectionSpeedDialog({ isOpen, onClose, userId }: ConnectionSpeedDialogProps) {
  const { toast } = useToast()
  const [selectedSpeed, setSelectedSpeed] = useState<number>(10)
  const [neverShowAgain, setNeverShowAgain] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const updateConnectionSpeed = useMutation(api.users.updateConnectionSpeed)

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await updateConnectionSpeed({
        userId,
        connectionSpeed: selectedSpeed,
        showSpeedDialog: !neverShowAgain,
      })

      toast({
        title: "Settings Saved!",
        description: "Your connection speed preference has been saved.",
      })

      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = async () => {
    if (neverShowAgain) {
      setIsLoading(true)
      try {
        await updateConnectionSpeed({
          userId,
          showSpeedDialog: false,
        })
      } catch (error) {
        // Silent fail for skip
      } finally {
        setIsLoading(false)
      }
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-blue-600" />
            Connection Speed Setup
          </DialogTitle>
          <DialogDescription>
            Help us optimize your file upload experience by telling us about your internet connection speed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Why do we ask this?</p>
                <p>
                  File uploads have a 2-minute timeout. We'll warn you if a file might be too large for your connection
                  speed to avoid failed uploads.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-medium">Select your typical internet speed:</Label>
            <RadioGroup value={selectedSpeed.toString()} onValueChange={(value) => setSelectedSpeed(Number(value))}>
              {speedOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value={option.value.toString()} id={`speed-${option.value}`} />
                  <div className="flex-1">
                    <Label htmlFor={`speed-${option.value}`} className="cursor-pointer">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-gray-600">{option.description}</div>
                      <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <Upload className="w-3 h-3" />
                        Safe upload limit: {option.maxFile}
                      </div>
                    </Label>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="never-show" checked={neverShowAgain} onCheckedChange={(checked) => setNeverShowAgain(!!checked)} />
            <Label htmlFor="never-show" className="text-sm text-gray-600">
              Never show this dialog again (you can change this in settings)
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleSkip} disabled={isLoading}>
              Skip for Now
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
