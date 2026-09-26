"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function ContactControls() {
  return (
    <div className="mb-6 space-y-6">
      <div className="space-y-2">
        <Label htmlFor="company-size">Company size</Label>
        <Select
          items={[
            { value: "1-10", label: "1–10 employees" },
            { value: "11-50", label: "11–50 employees" },
            { value: "51-200", label: "51–200 employees" },
            { value: "201-500", label: "201–500 employees" },
            { value: "500+", label: "500+ employees" },
          ]}
        >
          <SelectTrigger id="company-size">
            <SelectValue placeholder="Select team size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1-10">1–10 employees</SelectItem>
            <SelectItem value="11-50">11–50 employees</SelectItem>
            <SelectItem value="51-200">51–200 employees</SelectItem>
            <SelectItem value="201-500">201–500 employees</SelectItem>
            <SelectItem value="500+">500+ employees</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="interest">I&apos;m interested in</Label>
        <Select
          items={[
            { value: "demo", label: "Product demo" },
            { value: "pricing", label: "Custom pricing" },
            { value: "migration", label: "Migration support" },
            { value: "partnership", label: "Partnership" },
            { value: "other", label: "Something else" },
          ]}
        >
          <SelectTrigger id="interest">
            <SelectValue placeholder="Select topic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="demo">Product demo</SelectItem>
            <SelectItem value="pricing">Custom pricing</SelectItem>
            <SelectItem value="migration">Migration support</SelectItem>
            <SelectItem value="partnership">Partnership</SelectItem>
            <SelectItem value="other">Something else</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="newsletter" />
        <Label htmlFor="newsletter" className="text-sm font-normal">
          Send me product updates and tips
        </Label>
      </div>
    </div>
  );
}
