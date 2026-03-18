import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Principal } from "@icp-sdk/core/principal";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  AlignLeft,
  ArrowLeft,
  Eye,
  Loader2,
  Save,
  Star,
  Telescope,
  Thermometer,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ObservingSession } from "../backend.d";
import StarRating from "../components/StarRating";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateSession,
  useGetSession,
  useUpdateSession,
} from "../hooks/useQueries";

const TARGET_TYPES = [
  "Star",
  "Double Star",
  "Galaxy",
  "Nebula",
  "Cluster",
  "Planet",
  "Moon",
  "Comet",
  "Other",
];

function toLocalDateTimeInput(ts: bigint): string {
  if (!ts) return "";
  const d = new Date(Number(ts) * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDateTimeInput(val: string): bigint {
  if (!val) return BigInt(Math.floor(Date.now() / 1000));
  return BigInt(Math.floor(new Date(val).getTime() / 1000));
}

const DEFAULT_FORM = {
  title: "",
  dateTimeStr: "",
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  locationName: "",
  targetName: "",
  targetType: "Galaxy",
  duration: "",
  gain: "",
  filter: "",
  stackingFrames: "",
  seeing: 3,
  transparency: 3,
  bortleClass: 5,
  temperature: "",
  humidity: "",
  windSpeed: "",
  notes: "",
  review: "",
  rating: 0,
};

type FormState = typeof DEFAULT_FORM;

export default function SessionForm() {
  const params = useParams({ strict: false }) as { id?: string };
  const isEdit = !!params.id && params.id !== "new";
  const sessionId = isEdit ? Number.parseInt(params.id!) : 0;
  const navigate = useNavigate();
  const { identity, login } = useInternetIdentity();

  const { data: existingSession, isLoading: sessionLoading } =
    useGetSession(sessionId);
  const createMutation = useCreateSession();
  const updateMutation = useUpdateSession();

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  useEffect(() => {
    if (isEdit && existingSession) {
      setForm({
        title: existingSession.title,
        dateTimeStr: toLocalDateTimeInput(existingSession.dateTime.timestamp),
        timeZone: existingSession.dateTime.timeZone,
        locationName: existingSession.location.name,
        targetName: existingSession.targetName,
        targetType: existingSession.targetType,
        duration: String(existingSession.exposureDetails.duration),
        gain: String(existingSession.exposureDetails.gain),
        filter: existingSession.exposureDetails.filter,
        stackingFrames: String(existingSession.exposureDetails.stackingFrames),
        seeing: Number(existingSession.conditions.seeing),
        transparency: Number(existingSession.conditions.transparency),
        bortleClass: Number(existingSession.conditions.bortleClass),
        temperature: String(existingSession.conditions.temperature),
        humidity: String(existingSession.conditions.humidity),
        windSpeed: String(existingSession.conditions.windSpeed),
        notes: existingSession.notes,
        review: existingSession.rating.review ?? "",
        rating: Number(existingSession.rating.value),
      });
    }
  }, [isEdit, existingSession]);

  const set = (key: keyof FormState, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.targetName.trim()) {
      toast.error("Title and Target Name are required");
      return;
    }

    const session: ObservingSession = {
      id: isEdit ? sessionId : 0,
      title: form.title,
      dateTime: {
        timestamp: fromDateTimeInput(form.dateTimeStr),
        timeZone: form.timeZone,
      },
      location: { name: form.locationName },
      targetName: form.targetName,
      targetType: form.targetType,
      exposureDetails: {
        duration: Number.parseFloat(form.duration) || 0,
        gain: BigInt(Number.parseInt(form.gain) || 0),
        filter: form.filter,
        units: "seconds",
        stackingFrames: BigInt(Number.parseInt(form.stackingFrames) || 0),
      },
      conditions: {
        seeing: BigInt(form.seeing),
        transparency: BigInt(form.transparency),
        bortleClass: BigInt(form.bortleClass),
        temperature: Number.parseFloat(form.temperature) || 0,
        humidity: BigInt(Number.parseInt(form.humidity) || 0),
        windSpeed: Number.parseFloat(form.windSpeed) || 0,
      },
      rating: {
        value: BigInt(form.rating),
        review: form.review || undefined,
      },
      notes: form.notes,
      createdAt: isEdit ? (existingSession?.createdAt ?? 0n) : 0n,
      updatedAt: 0n,
      createdBy: Principal.anonymous(),
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: sessionId, session });
        toast.success("Session updated!");
        navigate({ to: `/sessions/${sessionId}` });
      } else {
        const newId = await createMutation.mutateAsync(session);
        toast.success("Session logged!");
        navigate({ to: `/sessions/${newId}` });
      }
    } catch {
      toast.error("Failed to save session");
    }
  }

  if (!identity) {
    return (
      <div className="flex items-center justify-center min-h-full p-8">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground text-sm">
            Sign in to log sessions.
          </p>
          <Button
            onClick={login}
            className="bg-primary text-primary-foreground"
            data-ocid="session_form.login.button"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (isEdit && sessionLoading) {
    return (
      <div
        className="p-6 max-w-3xl mx-auto space-y-4"
        data-ocid="session_form.loading_state"
      >
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 max-w-3xl mx-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            asChild
            type="button"
            variant="ghost"
            size="icon"
            data-ocid="session_form.back.button"
          >
            <Link
              to={isEdit ? "/sessions/$id" : "/sessions"}
              params={isEdit ? { id: String(sessionId) } : {}}
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <h1 className="font-display font-bold text-xl">
            {isEdit ? "Edit Session" : "Log New Session"}
          </h1>
        </div>

        {/* General */}
        <Card className="bg-card border-border card-glow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-display uppercase tracking-wide text-muted-foreground">
              General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g., Andromeda Galaxy in Bortle 4 skies"
                className="bg-secondary border-border"
                data-ocid="session_form.title.input"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="dateTime">Date & Time</Label>
                <Input
                  id="dateTime"
                  type="datetime-local"
                  value={form.dateTimeStr}
                  onChange={(e) => set("dateTimeStr", e.target.value)}
                  className="bg-secondary border-border"
                  data-ocid="session_form.datetime.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={form.locationName}
                  onChange={(e) => set("locationName", e.target.value)}
                  placeholder="e.g., Cherry Springs State Park"
                  className="bg-secondary border-border"
                  data-ocid="session_form.location.input"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Target */}
        <Card className="bg-card border-border card-glow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-display uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <Telescope className="w-3.5 h-3.5" /> Target
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="targetName">
                  Target Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="targetName"
                  value={form.targetName}
                  onChange={(e) => set("targetName", e.target.value)}
                  placeholder="e.g., M31, NGC 891"
                  className="bg-secondary border-border"
                  data-ocid="session_form.target_name.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="targetType">Target Type</Label>
                <Select
                  value={form.targetType}
                  onValueChange={(v) => set("targetType", v)}
                >
                  <SelectTrigger
                    className="bg-secondary border-border"
                    data-ocid="session_form.target_type.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {TARGET_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SeeStar Settings */}
        <Card className="bg-card border-border card-glow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-display uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <Telescope className="w-3.5 h-3.5" /> SeeStar Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="duration">Exposure (s)</Label>
              <Input
                id="duration"
                type="number"
                min="0"
                value={form.duration}
                onChange={(e) => set("duration", e.target.value)}
                placeholder="10"
                className="bg-secondary border-border"
                data-ocid="session_form.duration.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gain">Gain</Label>
              <Input
                id="gain"
                type="number"
                min="0"
                value={form.gain}
                onChange={(e) => set("gain", e.target.value)}
                placeholder="80"
                className="bg-secondary border-border"
                data-ocid="session_form.gain.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="filter">Filter</Label>
              <Input
                id="filter"
                value={form.filter}
                onChange={(e) => set("filter", e.target.value)}
                placeholder="Dual-band"
                className="bg-secondary border-border"
                data-ocid="session_form.filter.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stackingFrames">Stacking Frames</Label>
              <Input
                id="stackingFrames"
                type="number"
                min="0"
                value={form.stackingFrames}
                onChange={(e) => set("stackingFrames", e.target.value)}
                placeholder="120"
                className="bg-secondary border-border"
                data-ocid="session_form.stacking_frames.input"
              />
            </div>
          </CardContent>
        </Card>

        {/* Sky Conditions */}
        <Card className="bg-card border-border card-glow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-display uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <Eye className="w-3.5 h-3.5" /> Sky Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Seeing</Label>
                <span className="text-sm text-primary font-medium">
                  {form.seeing}/5
                </span>
              </div>
              <Slider
                min={1}
                max={5}
                step={1}
                value={[form.seeing]}
                onValueChange={([v]) => set("seeing", v)}
                className="w-full"
                data-ocid="session_form.seeing.input"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Transparency</Label>
                <span className="text-sm text-primary font-medium">
                  {form.transparency}/5
                </span>
              </div>
              <Slider
                min={1}
                max={5}
                step={1}
                value={[form.transparency]}
                onValueChange={([v]) => set("transparency", v)}
                data-ocid="session_form.transparency.input"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Bortle Class</Label>
                <span className="text-sm text-primary font-medium">
                  {form.bortleClass}/9
                </span>
              </div>
              <Slider
                min={1}
                max={9}
                step={1}
                value={[form.bortleClass]}
                onValueChange={([v]) => set("bortleClass", v)}
                data-ocid="session_form.bortle_class.input"
              />
            </div>
          </CardContent>
        </Card>

        {/* Weather */}
        <Card className="bg-card border-border card-glow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-display uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <Thermometer className="w-3.5 h-3.5" /> Weather
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="temperature">Temperature (°C)</Label>
              <Input
                id="temperature"
                type="number"
                value={form.temperature}
                onChange={(e) => set("temperature", e.target.value)}
                placeholder="12"
                className="bg-secondary border-border"
                data-ocid="session_form.temperature.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="humidity">Humidity (%)</Label>
              <Input
                id="humidity"
                type="number"
                min="0"
                max="100"
                value={form.humidity}
                onChange={(e) => set("humidity", e.target.value)}
                placeholder="65"
                className="bg-secondary border-border"
                data-ocid="session_form.humidity.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="windSpeed">Wind Speed (km/h)</Label>
              <Input
                id="windSpeed"
                type="number"
                min="0"
                value={form.windSpeed}
                onChange={(e) => set("windSpeed", e.target.value)}
                placeholder="8"
                className="bg-secondary border-border"
                data-ocid="session_form.wind_speed.input"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes & Rating */}
        <Card className="bg-card border-border card-glow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-display uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <AlignLeft className="w-3.5 h-3.5" /> Notes & Rating
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="notes">Observation Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Describe your observation — what you saw, any challenges, special moments…"
                rows={4}
                className="bg-secondary border-border resize-none"
                data-ocid="session_form.notes.textarea"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="review">Review</Label>
              <Textarea
                id="review"
                value={form.review}
                onChange={(e) => set("review", e.target.value)}
                placeholder="Your overall impression of the session…"
                rows={2}
                className="bg-secondary border-border resize-none"
                data-ocid="session_form.review.textarea"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-gold" /> Rating
              </Label>
              <StarRating
                value={form.rating}
                onChange={(v) => set("rating", v)}
                size="lg"
              />
              <p className="text-xs text-muted-foreground">
                Click a star to rate this session
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3 justify-end pb-6">
          <Button
            type="button"
            variant="outline"
            asChild
            className="border-border"
            data-ocid="session_form.cancel.button"
          >
            <Link
              to={isEdit ? "/sessions/$id" : "/sessions"}
              params={isEdit ? { id: String(sessionId) } : {}}
            >
              Cancel
            </Link>
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-primary text-primary-foreground hover:opacity-90 gap-2 glow-blue"
            data-ocid="session_form.submit.button"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isPending ? "Saving…" : isEdit ? "Update Session" : "Log Session"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
