"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

const templates = [
  { id: "TEMPLATE_1", name: "Minimalist", preview: "/previews/template1.png" },
  { id: "TEMPLATE_2", name: "Professional", preview: "/previews/template2.png" },
];

interface InvoiceTemplateSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function InvoiceTemplateSelector({ value, onChange }: InvoiceTemplateSelectorProps) {
  return (
    <div className="space-y-4">
      <Label>Invoice Template</Label>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {templates.map((template) => (
          <Label
            key={template.id}
            htmlFor={template.id}
            className={cn(
              "relative cursor-pointer rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground flex-col",
              { "border-primary": value === template.id }
            )}
          >
            <RadioGroupItem value={template.id} id={template.id} className="absolute top-4 right-4" />
            <Card className="w-full overflow-hidden border-0">
              <CardContent className="p-0">
                <img
                  src={template.preview}
                  alt={`${template.name} template preview`}
                  className="w-full h-auto object-cover"
                />
              </CardContent>
            </Card>
            <p className="text-sm font-medium text-center mt-2">{template.name}</p>
          </Label>
        ))}
      </RadioGroup>
    </div>
  );
}
