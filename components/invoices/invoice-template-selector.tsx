"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const templates = [
  { id: "TEMPLATE_1", name: "Minimalist", preview: "/api/business/template-preview?template=TEMPLATE_1" },
  { id: "TEMPLATE_2", name: "Professional", preview: "/api/business/template-preview?template=TEMPLATE_2" },
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
        <TooltipProvider>
          {templates.map((template) => (
            <div key={template.id} className="relative flex flex-col space-y-2 group">
              <Label
                htmlFor={template.id}
                className={cn(
                  "relative cursor-pointer rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground flex-col h-full",
                  { "border-primary": value === template.id }
                )}
              >
                <div className="flex items-center justify-between mb-3 w-full">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value={template.id} id={template.id} />
                    <span className="text-sm font-medium">{template.name}</span>
                  </div>
                  
                  {/* Prevent click inside label from bubbling if possible, but actually we will position button absolute to hover above cleanly */}
                </div>

                <Card className="w-full overflow-hidden border-0 bg-transparent flex-1 flex flex-col items-center">
                  <CardContent className="p-0 w-full h-[350px] relative pointer-events-none rounded-md overflow-hidden bg-gray-50/50">
                    <iframe 
                      src={`${template.preview}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                      className="w-full h-full border-0 absolute top-0 left-0"
                      scrolling="no"
                      style={{ overflow: 'hidden' }}
                      title={`${template.name} Preview`}
                    />
                  </CardContent>
                </Card>
              </Label>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-sm z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(template.preview, "_blank");
                    }}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View full preview</p>
                </TooltipContent>
              </Tooltip>

            </div>
          ))}
        </TooltipProvider>
      </RadioGroup>
    </div>
  );
}
