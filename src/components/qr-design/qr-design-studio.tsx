'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Palette,
  Download,
  ChevronDown,
  ChevronUp,
  ImagePlus,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DotType = 'square' | 'dots' | 'rounded' | 'extra-rounded' | 'classy' | 'classy-rounded';
type CornerSquareType = 'square' | 'dot' | 'extra-rounded';
type CornerDotType = 'square' | 'dot';

interface DesignConfig {
  fgColor: string;
  bgColor: string;
  dotType: DotType;
  cornerSquareType: CornerSquareType;
  cornerDotType: CornerDotType;
  logoDataUrl: string | null;
}

const DOT_TYPE_LABELS: Record<DotType, string> = {
  square: 'Quadrat',
  dots: 'Punkte',
  rounded: 'Abgerundet',
  'extra-rounded': 'Stark abgerundet',
  classy: 'Klassisch',
  'classy-rounded': 'Klassisch rund',
};

const CORNER_SQUARE_LABELS: Record<CornerSquareType, string> = {
  square: 'Quadrat',
  dot: 'Punkt',
  'extra-rounded': 'Abgerundet',
};

const CORNER_DOT_LABELS: Record<CornerDotType, string> = {
  square: 'Quadrat',
  dot: 'Punkt',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface QrDesignStudioProps {
  redirectUrl: string;
  shortCode: string;
  initialFgColor?: string;
  initialBgColor?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QrDesignStudio({
  redirectUrl,
  shortCode,
  initialFgColor = '#000000',
  initialBgColor = '#FFFFFF',
}: QrDesignStudioProps) {
  const [expanded, setExpanded] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const qrInstanceRef = useRef<unknown>(null);

  const [config, setConfig] = useState<DesignConfig>({
    fgColor: initialFgColor,
    bgColor: initialBgColor,
    dotType: 'square',
    cornerSquareType: 'square',
    cornerDotType: 'square',
    logoDataUrl: null,
  });

  const renderQr = useCallback(async () => {
    if (!canvasRef.current || !expanded) return;

    const QRCodeStyling = (await import('qr-code-styling')).default;

    const options: Record<string, unknown> = {
      width: 280,
      height: 280,
      data: redirectUrl,
      margin: 8,
      dotsOptions: {
        color: config.fgColor,
        type: config.dotType,
      },
      backgroundOptions: {
        color: config.bgColor,
      },
      cornersSquareOptions: {
        color: config.fgColor,
        type: config.cornerSquareType,
      },
      cornersDotOptions: {
        color: config.fgColor,
        type: config.cornerDotType,
      },
      qrOptions: {
        errorCorrectionLevel: 'M',
      },
    };

    if (config.logoDataUrl) {
      options.image = config.logoDataUrl;
      options.imageOptions = {
        crossOrigin: 'anonymous',
        margin: 4,
        imageSize: 0.3,
      };
    }

    // Clear previous QR by removing all child nodes safely
    while (canvasRef.current.firstChild) {
      canvasRef.current.removeChild(canvasRef.current.firstChild);
    }

    const qr = new QRCodeStyling(options);
    qr.append(canvasRef.current);
    qrInstanceRef.current = qr;
  }, [redirectUrl, config, expanded]);

  useEffect(() => {
    renderQr();
  }, [renderQr]);

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 512_000) {
      return; // Max 500KB
    }
    const reader = new FileReader();
    reader.onload = () => {
      setConfig((prev) => ({ ...prev, logoDataUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  async function handleDownloadPng() {
    const qr = qrInstanceRef.current as { download?: (opts: Record<string, string>) => Promise<void> } | null;
    if (qr?.download) {
      await qr.download({ name: `qr-${shortCode}`, extension: 'png' });
    }
  }

  async function handleDownloadSvg() {
    const qr = qrInstanceRef.current as { download?: (opts: Record<string, string>) => Promise<void> } | null;
    if (qr?.download) {
      await qr.download({ name: `qr-${shortCode}`, extension: 'svg' });
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            QR-Design-Studio
          </CardTitle>
          <CardDescription>
            Passe das Design deines QR-Codes an — Punkte, Ecken, Farben, Logo.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
          {expanded ? (
            <><ChevronUp className="mr-1.5 h-3.5 w-3.5" />Schliessen</>
          ) : (
            <><ChevronDown className="mr-1.5 h-3.5 w-3.5" />Oeffnen</>
          )}
        </Button>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[280px,1fr]">
            {/* Preview */}
            <div className="flex flex-col items-center gap-3">
              <div
                ref={canvasRef}
                className="rounded-lg border bg-white p-2"
                style={{ width: 296, height: 296 }}
              />
              <div className="flex gap-2 w-full">
                <Button variant="outline" size="sm" className="flex-1" onClick={handleDownloadPng}>
                  <Download className="mr-1.5 h-3.5 w-3.5" />PNG
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={handleDownloadSvg}>
                  <Download className="mr-1.5 h-3.5 w-3.5" />SVG
                </Button>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-3">
              {/* Colors */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Vordergrund</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.fgColor}
                      onChange={(e) => setConfig((p) => ({ ...p, fgColor: e.target.value }))}
                      className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent p-0.5"
                    />
                    <Input
                      value={config.fgColor}
                      onChange={(e) => setConfig((p) => ({ ...p, fgColor: e.target.value }))}
                      className="font-mono text-xs uppercase"
                      maxLength={7}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Hintergrund</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.bgColor}
                      onChange={(e) => setConfig((p) => ({ ...p, bgColor: e.target.value }))}
                      className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent p-0.5"
                    />
                    <Input
                      value={config.bgColor}
                      onChange={(e) => setConfig((p) => ({ ...p, bgColor: e.target.value }))}
                      className="font-mono text-xs uppercase"
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>

              {/* Dot style */}
              <div className="space-y-1">
                <Label className="text-xs">Punkt-Stil</Label>
                <Select value={config.dotType} onValueChange={(v) => setConfig((p) => ({ ...p, dotType: v as DotType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(DOT_TYPE_LABELS) as DotType[]).map((dt) => (
                      <SelectItem key={dt} value={dt}>{DOT_TYPE_LABELS[dt]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Corner styles */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Eck-Rahmen</Label>
                  <Select value={config.cornerSquareType} onValueChange={(v) => setConfig((p) => ({ ...p, cornerSquareType: v as CornerSquareType }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(CORNER_SQUARE_LABELS) as CornerSquareType[]).map((ct) => (
                        <SelectItem key={ct} value={ct}>{CORNER_SQUARE_LABELS[ct]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Eck-Punkt</Label>
                  <Select value={config.cornerDotType} onValueChange={(v) => setConfig((p) => ({ ...p, cornerDotType: v as CornerDotType }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(CORNER_DOT_LABELS) as CornerDotType[]).map((ct) => (
                        <SelectItem key={ct} value={ct}>{CORNER_DOT_LABELS[ct]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Logo */}
              <div className="space-y-1">
                <Label className="text-xs">Logo (max. 500 KB)</Label>
                {config.logoDataUrl ? (
                  <div className="flex items-center gap-2">
                    <img src={config.logoDataUrl} alt="Logo" className="h-10 w-10 rounded border object-contain" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfig((p) => ({ ...p, logoDataUrl: null }))}
                    >
                      <X className="mr-1 h-3.5 w-3.5" />Entfernen
                    </Button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed p-3 hover:bg-muted/50">
                    <ImagePlus className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Logo hochladen</span>
                    <input type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden" onChange={handleLogoUpload} />
                  </label>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
