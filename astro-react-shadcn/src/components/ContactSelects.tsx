import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function ContactSelects() {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="company-size">Company size</Label>
        <Select>
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
        <Select>
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
    </>
  );
}
