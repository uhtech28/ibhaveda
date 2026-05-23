"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Check, ClipboardCheck, AlertCircle } from "lucide-react";

interface FieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "number";
  required?: boolean;
}

interface SelfReportToolProps {
  prompt: string;
  fields: FieldDef[];
  onSubmit: (content: {
    values: Record<string, string | number>;
    confirmed: boolean;
    timestamp: number;
  }) => void;
  initialContent?: {
    values: Record<string, string | number>;
    confirmed: boolean;
    timestamp: number;
  };
  isSubmitting?: boolean;
}

export function SelfReportTool({
  prompt,
  fields,
  onSubmit,
  initialContent,
  isSubmitting,
}: SelfReportToolProps) {
  const [values, setValues] = useState<Record<string, string | number>>(
    initialContent?.values || {},
  );
  const [confirmed, setConfirmed] = useState(
    initialContent?.confirmed || false,
  );

  const handleChange = (key: string, value: string | number) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    const allFilled = fields.every((f) => {
      const val = values[f.key];
      if (f.required === false) return true;
      return val !== undefined && val !== "";
    });

    if (!allFilled || !confirmed) return;

    onSubmit({
      values,
      confirmed,
      timestamp: Date.now(),
    });
  };

  const allFieldsFilled = fields.every((f) => {
    const val = values[f.key];
    if (f.required === false) return true;
    return val !== undefined && val !== "";
  });

  const canSubmit = allFieldsFilled && confirmed;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" />
          <CardTitle>Self-Report Form</CardTitle>
        </div>
        <CardDescription>{prompt}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Form Fields */}
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>
                {field.label}
                {field.required !== false && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </Label>
              {field.type === "textarea" ? (
                <Textarea
                  id={field.key}
                  placeholder={`Enter ${field.label.toLowerCase()}...`}
                  value={(values[field.key] as string) || ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="min-h-[100px] resize-y"
                />
              ) : (
                <Input
                  id={field.key}
                  type={field.type === "number" ? "number" : "text"}
                  placeholder={`Enter ${field.label.toLowerCase()}...`}
                  value={(values[field.key] as string | number) || ""}
                  onChange={(e) =>
                    handleChange(
                      field.key,
                      field.type === "number"
                        ? Number(e.target.value)
                        : e.target.value,
                    )
                  }
                />
              )}
            </div>
          ))}
        </div>

        {/* Confirmation Checkbox */}
        <div
          className={`p-4 border-2 rounded-lg transition-colors ${
            confirmed
              ? "border-primary bg-primary/5"
              : allFieldsFilled
                ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20"
                : "border-border bg-muted/30"
          }`}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <div className="relative flex items-center justify-center mt-0.5">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="w-5 h-5 rounded border-2 border-muted-foreground checked:border-primary checked:bg-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
                disabled={!allFieldsFilled}
              />
              {confirmed && (
                <Check className="absolute h-4 w-4 text-primary-foreground pointer-events-none" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">
                I confirm this information is accurate and complete
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Please review all fields before submitting. This confirmation is
                required to proceed.
              </div>
            </div>
          </label>
        </div>

        {/* Validation Messages */}
        {!allFieldsFilled && (
          <div className="flex items-start gap-2 p-3 border border-amber-500 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
            <div className="text-sm">
              <div className="font-medium text-amber-900 dark:text-amber-200">
                Please complete all required fields
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Fields marked with * are required before you can confirm and
                submit.
              </div>
            </div>
          </div>
        )}

        {allFieldsFilled && !confirmed && (
          <div className="flex items-start gap-2 p-3 border border-blue-500 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-500 mt-0.5 shrink-0" />
            <div className="text-sm">
              <div className="font-medium text-blue-900 dark:text-blue-200">
                One more step!
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Please check the confirmation box above to verify your
                information is accurate.
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="flex items-center justify-between text-sm border-t pt-3">
          <div className="text-muted-foreground">
            {allFieldsFilled ? (
              <span className="text-green-600 dark:text-green-400 font-medium">
                ✓ All fields completed
              </span>
            ) : (
              <span>
                {
                  fields.filter((f) => {
                    const val = values[f.key];
                    return val !== undefined && val !== "";
                  }).length
                }{" "}
                of {fields.length} fields filled
              </span>
            )}
          </div>
          <div className="text-muted-foreground">
            {confirmed ? (
              <span className="text-primary font-medium">✓ Confirmed</span>
            ) : (
              <span>Not confirmed</span>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Submit Report
            </>
          )}
        </Button>

        {!canSubmit && !isSubmitting && (
          <p className="text-xs text-center text-muted-foreground">
            Complete all required fields and confirm to submit
          </p>
        )}
      </CardContent>
    </Card>
  );
}
