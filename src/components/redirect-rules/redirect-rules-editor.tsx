'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Loader2,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Clock,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Power,
  PowerOff,
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
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

import {
  createRedirectRule,
  updateRedirectRule,
  deleteRedirectRule,
} from '@/app/(dashboard)/qr-codes/redirect-rules-actions';
import type { RedirectRule, ConditionType } from '@/types';
import type { EffectiveTier } from '@/lib/billing/gates';
import Link from 'next/link';
import { Crown } from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CONDITION_TYPE_LABELS: Record<ConditionType, string> = {
  device: 'Geraetetyp',
  os: 'Betriebssystem',
  browser: 'Browser',
  country: 'Land',
  time_range: 'Uhrzeit',
  day_of_week: 'Wochentag',
};

const CONDITION_TYPE_ICONS: Record<ConditionType, React.ComponentType<{ className?: string }>> = {
  device: Smartphone,
  os: Monitor,
  browser: Globe,
  country: Globe,
  time_range: Clock,
  day_of_week: CalendarDays,
};

const DEVICE_OPTIONS = [
  { value: 'mobile', label: 'Mobil' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'desktop', label: 'Desktop' },
];

const OS_OPTIONS = [
  { value: 'iOS', label: 'iOS' },
  { value: 'Android', label: 'Android' },
  { value: 'Windows', label: 'Windows' },
  { value: 'macOS', label: 'macOS' },
  { value: 'Linux', label: 'Linux' },
];

const BROWSER_OPTIONS = [
  { value: 'Chrome', label: 'Chrome' },
  { value: 'Safari', label: 'Safari' },
  { value: 'Firefox', label: 'Firefox' },
  { value: 'Edge', label: 'Edge' },
  { value: 'Samsung Browser', label: 'Samsung Browser' },
];

const COUNTRY_OPTIONS = [
  { value: 'DE', label: 'Deutschland' },
  { value: 'AT', label: 'Oesterreich' },
  { value: 'CH', label: 'Schweiz' },
  { value: 'US', label: 'USA' },
  { value: 'GB', label: 'Grossbritannien' },
  { value: 'FR', label: 'Frankreich' },
  { value: 'IT', label: 'Italien' },
  { value: 'ES', label: 'Spanien' },
  { value: 'NL', label: 'Niederlande' },
  { value: 'PL', label: 'Polen' },
];

const DAY_OPTIONS = [
  { value: 1, label: 'Mo' },
  { value: 2, label: 'Di' },
  { value: 3, label: 'Mi' },
  { value: 4, label: 'Do' },
  { value: 5, label: 'Fr' },
  { value: 6, label: 'Sa' },
  { value: 0, label: 'So' },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RedirectRulesEditorProps {
  rules: RedirectRule[];
  qrCodeId?: string;
  shortLinkId?: string;
  userTier?: EffectiveTier;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RedirectRulesEditor({ rules: initialRules, qrCodeId, shortLinkId, userTier }: RedirectRulesEditorProps) {
  const isPro = userTier === 'pro';
  const [rules, setRules] = useState(initialRules);
  const [showAdd, setShowAdd] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!isPro) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bedingte Weiterleitungen</CardTitle>
          <CardDescription>
            Leite Besucher je nach Geraet, Land oder Uhrzeit zu verschiedenen Zielen weiter.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-lg border border-dashed p-4">
            <Crown className="h-5 w-5 text-amber-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Pro-Feature</p>
              <p className="text-xs text-muted-foreground">
                Bedingte Weiterleitungen sind nur mit dem Pro-Abo verfuegbar.
              </p>
            </div>
            <Button size="sm" variant="outline" render={<Link href="/pricing?reason=conditional_redirects" />}>
              Upgrade
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  function handleCreated(rule: RedirectRule) {
    setRules((prev) => [rule, ...prev].sort((a, b) => b.priority - a.priority));
    setShowAdd(false);
  }

  function handleUpdated(updated: RedirectRule) {
    setRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  function handleDeleted(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }

  function handleToggle(rule: RedirectRule) {
    startTransition(async () => {
      const res = await updateRedirectRule(rule.id, { active: !rule.active });
      if (res.success) {
        handleUpdated({ ...rule, active: !rule.active });
        toast.success(rule.active ? 'Regel deaktiviert' : 'Regel aktiviert');
      } else {
        toast.error(res.error || 'Fehler');
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Bedingte Weiterleitungen</CardTitle>
          <CardDescription>
            Leite Besucher je nach Geraet, Land oder Uhrzeit zu verschiedenen Zielen weiter.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdd(!showAdd)}
        >
          {showAdd ? (
            <>
              <ChevronUp className="mr-1.5 h-3.5 w-3.5" />
              Abbrechen
            </>
          ) : (
            <>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Regel
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {showAdd && (
          <AddRuleForm
            qrCodeId={qrCodeId}
            shortLinkId={shortLinkId}
            nextPriority={rules.length > 0 ? Math.max(...rules.map((r) => r.priority)) + 1 : 0}
            onCreated={handleCreated}
            onCancel={() => setShowAdd(false)}
          />
        )}

        {rules.length === 0 && !showAdd && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Keine Regeln vorhanden. Alle Besucher werden zum Standard-Ziel weitergeleitet.
          </p>
        )}

        {rules.map((rule) => (
          <RuleRow
            key={rule.id}
            rule={rule}
            onToggle={() => handleToggle(rule)}
            onDeleted={() => handleDeleted(rule.id)}
            isPending={isPending}
          />
        ))}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Rule Row
// ---------------------------------------------------------------------------

function RuleRow({
  rule,
  onToggle,
  onDeleted,
  isPending,
}: {
  rule: RedirectRule;
  onToggle: () => void;
  onDeleted: () => void;
  isPending: boolean;
}) {
  const [isDeleting, startDelete] = useTransition();
  const Icon = CONDITION_TYPE_ICONS[rule.condition_type] || Globe;

  function handleDelete() {
    startDelete(async () => {
      const res = await deleteRedirectRule(rule.id);
      if (res.success) {
        onDeleted();
        toast.success('Regel geloescht');
      } else {
        toast.error(res.error || 'Fehler beim Loeschen');
      }
    });
  }

  return (
    <div className={`flex items-center gap-3 rounded-lg border p-3 ${!rule.active ? 'opacity-50' : ''}`}>
      <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground cursor-grab" />

      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {rule.label || CONDITION_TYPE_LABELS[rule.condition_type]}
          </span>
          <span className="text-xs text-muted-foreground">
            Prio {rule.priority}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {formatConditionValue(rule)} &rarr; {rule.target_url}
        </p>
      </div>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onToggle}
        disabled={isPending}
        title={rule.active ? 'Deaktivieren' : 'Aktivieren'}
      >
        {rule.active ? (
          <Power className="h-3.5 w-3.5 text-green-600" />
        ) : (
          <PowerOff className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </Button>

      <ConfirmDialog
        trigger={
          <Button variant="ghost" size="icon-sm" disabled={isDeleting}>
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            )}
          </Button>
        }
        title="Regel loeschen?"
        description="Diese bedingte Weiterleitung wird unwiderruflich geloescht."
        confirmLabel="Loeschen"
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add Rule Form
// ---------------------------------------------------------------------------

function AddRuleForm({
  qrCodeId,
  shortLinkId,
  nextPriority,
  onCreated,
  onCancel,
}: {
  qrCodeId?: string;
  shortLinkId?: string;
  nextPriority: number;
  onCreated: (rule: RedirectRule) => void;
  onCancel: () => void;
}) {
  const [conditionType, setConditionType] = useState<ConditionType>('device');
  const [targetUrl, setTargetUrl] = useState('');
  const [label, setLabel] = useState('');
  const [isPending, startTransition] = useTransition();

  // Condition-specific state
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [selectedOs, setSelectedOs] = useState<string[]>([]);
  const [selectedBrowsers, setSelectedBrowsers] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [timeFrom, setTimeFrom] = useState('08:00');
  const [timeTo, setTimeTo] = useState('18:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);

  function buildConditionValue(): Record<string, unknown> {
    switch (conditionType) {
      case 'device': return { devices: selectedDevices };
      case 'os': return { os: selectedOs };
      case 'browser': return { browsers: selectedBrowsers };
      case 'country': return { countries: selectedCountries };
      case 'time_range': return { from: timeFrom, to: timeTo, timezone: 'Europe/Berlin' };
      case 'day_of_week': return { days: selectedDays, timezone: 'Europe/Berlin' };
    }
  }

  function isValid(): boolean {
    if (!targetUrl) return false;
    switch (conditionType) {
      case 'device': return selectedDevices.length > 0;
      case 'os': return selectedOs.length > 0;
      case 'browser': return selectedBrowsers.length > 0;
      case 'country': return selectedCountries.length > 0;
      case 'time_range': return !!timeFrom && !!timeTo;
      case 'day_of_week': return selectedDays.length > 0;
    }
  }

  function handleSubmit() {
    startTransition(async () => {
      const conditionValue = buildConditionValue();
      const res = await createRedirectRule({
        qr_code_id: qrCodeId,
        short_link_id: shortLinkId,
        condition_type: conditionType,
        condition_value: conditionValue,
        target_url: targetUrl,
        label: label || undefined,
        priority: nextPriority,
      });

      if (res.success) {
        toast.success('Regel erstellt');
        // Optimistic: create a fake rule for immediate UI update
        onCreated({
          id: crypto.randomUUID(),
          qr_code_id: qrCodeId || null,
          short_link_id: shortLinkId || null,
          condition_type: conditionType,
          condition_value: conditionValue,
          target_url: targetUrl,
          label: label || null,
          priority: nextPriority,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else {
        toast.error(res.error || 'Fehler beim Erstellen');
      }
    });
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Bedingung</Label>
          <Select value={conditionType} onValueChange={(v) => setConditionType(v as ConditionType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(CONDITION_TYPE_LABELS) as ConditionType[]).map((ct) => (
                <SelectItem key={ct} value={ct}>
                  {CONDITION_TYPE_LABELS[ct]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Bezeichnung (optional)</Label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="z.B. Mobile-Nutzer"
          />
        </div>
      </div>

      {/* Condition value inputs */}
      <ConditionValueInput
        type={conditionType}
        selectedDevices={selectedDevices}
        setSelectedDevices={setSelectedDevices}
        selectedOs={selectedOs}
        setSelectedOs={setSelectedOs}
        selectedBrowsers={selectedBrowsers}
        setSelectedBrowsers={setSelectedBrowsers}
        selectedCountries={selectedCountries}
        setSelectedCountries={setSelectedCountries}
        timeFrom={timeFrom}
        setTimeFrom={setTimeFrom}
        timeTo={timeTo}
        setTimeTo={setTimeTo}
        selectedDays={selectedDays}
        setSelectedDays={setSelectedDays}
      />

      <div className="space-y-1.5">
        <Label className="text-xs">Ziel-URL</Label>
        <Input
          type="url"
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          placeholder="https://beispiel.de/mobile"
        />
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={isPending || !isValid()}
        >
          {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          Regel erstellen
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Condition value inputs
// ---------------------------------------------------------------------------

function ConditionValueInput({
  type,
  selectedDevices, setSelectedDevices,
  selectedOs, setSelectedOs,
  selectedBrowsers, setSelectedBrowsers,
  selectedCountries, setSelectedCountries,
  timeFrom, setTimeFrom,
  timeTo, setTimeTo,
  selectedDays, setSelectedDays,
}: {
  type: ConditionType;
  selectedDevices: string[]; setSelectedDevices: (v: string[]) => void;
  selectedOs: string[]; setSelectedOs: (v: string[]) => void;
  selectedBrowsers: string[]; setSelectedBrowsers: (v: string[]) => void;
  selectedCountries: string[]; setSelectedCountries: (v: string[]) => void;
  timeFrom: string; setTimeFrom: (v: string) => void;
  timeTo: string; setTimeTo: (v: string) => void;
  selectedDays: number[]; setSelectedDays: (v: number[]) => void;
}) {
  switch (type) {
    case 'device':
      return <MultiToggle options={DEVICE_OPTIONS} selected={selectedDevices} onChange={setSelectedDevices} />;
    case 'os':
      return <MultiToggle options={OS_OPTIONS} selected={selectedOs} onChange={setSelectedOs} />;
    case 'browser':
      return <MultiToggle options={BROWSER_OPTIONS} selected={selectedBrowsers} onChange={setSelectedBrowsers} />;
    case 'country':
      return <MultiToggle options={COUNTRY_OPTIONS} selected={selectedCountries} onChange={setSelectedCountries} />;
    case 'time_range':
      return (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Von</Label>
            <Input type="time" value={timeFrom} onChange={(e) => setTimeFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Bis</Label>
            <Input type="time" value={timeTo} onChange={(e) => setTimeTo(e.target.value)} />
          </div>
          <p className="col-span-2 text-xs text-muted-foreground">Zeitzone: Europe/Berlin (MEZ/MESZ)</p>
        </div>
      );
    case 'day_of_week':
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">Wochentage</Label>
          <div className="flex flex-wrap gap-1.5">
            {DAY_OPTIONS.map((day) => (
              <Button
                key={day.value}
                type="button"
                size="sm"
                variant={selectedDays.includes(day.value) ? 'default' : 'outline'}
                className="h-8 w-10 px-0"
                onClick={() => {
                  setSelectedDays(
                    selectedDays.includes(day.value)
                      ? selectedDays.filter((d) => d !== day.value)
                      : [...selectedDays, day.value],
                  );
                }}
              >
                {day.label}
              </Button>
            ))}
          </div>
        </div>
      );
  }
}

function MultiToggle({
  options,
  selected,
  onChange,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">Werte (mehrere moeglich)</Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <Button
            key={opt.value}
            type="button"
            size="sm"
            variant={selected.includes(opt.value) ? 'default' : 'outline'}
            className="h-8"
            onClick={() => {
              onChange(
                selected.includes(opt.value)
                  ? selected.filter((v) => v !== opt.value)
                  : [...selected, opt.value],
              );
            }}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatConditionValue(rule: RedirectRule): string {
  const val = rule.condition_value;
  switch (rule.condition_type) {
    case 'device': {
      const devices = val.devices as string[] | undefined;
      return devices?.join(', ') || '-';
    }
    case 'os': {
      const os = val.os as string[] | undefined;
      return os?.join(', ') || '-';
    }
    case 'browser': {
      const browsers = val.browsers as string[] | undefined;
      return browsers?.join(', ') || '-';
    }
    case 'country': {
      const countries = val.countries as string[] | undefined;
      return countries?.join(', ') || '-';
    }
    case 'time_range': {
      return `${val.from || '?'} – ${val.to || '?'}`;
    }
    case 'day_of_week': {
      const days = val.days as number[] | undefined;
      const dayLabels = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
      return days?.map((d) => dayLabels[d]).join(', ') || '-';
    }
    default:
      return '-';
  }
}
