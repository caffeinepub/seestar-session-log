import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  Edit,
  Eye,
  MapPin,
  Telescope,
  Thermometer,
  Trash2,
  Wind,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import StarRating from "../components/StarRating";
import { useDeleteSession, useGetSession } from "../hooks/useQueries";

function formatDate(ts: bigint) {
  return new Date(Number(ts) * 1000).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

export default function SessionDetail() {
  const { id } = useParams({ from: "/sessions/$id" });
  const navigate = useNavigate();
  const sessionId = Number.parseInt(id);
  const { data: session, isLoading } = useGetSession(sessionId);
  const deleteMutation = useDeleteSession();

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(sessionId);
      toast.success("Session deleted");
      navigate({ to: "/sessions" });
    } catch {
      toast.error("Failed to delete session");
    }
  }

  if (isLoading) {
    return (
      <div
        className="p-6 max-w-3xl mx-auto space-y-4"
        data-ocid="session_detail.loading_state"
      >
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!session) {
    return (
      <div
        className="p-6 text-center text-muted-foreground"
        data-ocid="session_detail.error_state"
      >
        <p>Session not found.</p>
        <Button
          asChild
          variant="ghost"
          className="mt-4"
          data-ocid="session_detail.back.button"
        >
          <Link to="/sessions">Back to Sessions</Link>
        </Button>
      </div>
    );
  }

  const TYPE_COLORS: Record<string, string> = {
    Galaxy: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    Nebula: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    Star: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    Planet: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    Cluster: "bg-green-500/20 text-green-300 border-green-500/30",
    default: "bg-secondary text-muted-foreground border-border",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 max-w-3xl mx-auto space-y-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="shrink-0"
            data-ocid="session_detail.back.button"
          >
            <Link to="/sessions">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-display font-bold text-xl">{session.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className={`text-xs ${TYPE_COLORS[session.targetType] || TYPE_COLORS.default}`}
              >
                {session.targetType}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {session.targetName}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="gap-2 border-border"
            data-ocid="session_detail.edit.button"
          >
            <Link to="/sessions/$id/edit" params={{ id: String(session.id) }}>
              <Edit className="w-3.5 h-3.5" /> Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                data-ocid="session_detail.delete.button"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent
              className="bg-card border-border"
              data-ocid="session_detail.delete.dialog"
            >
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Session?</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  This will permanently delete "{session.title}". This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  className="border-border"
                  data-ocid="session_detail.delete.cancel_button"
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground"
                  data-ocid="session_detail.delete.confirm_button"
                >
                  {deleteMutation.isPending ? "Deleting…" : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Overview card */}
      <Card className="bg-card border-border card-glow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display uppercase tracking-wide text-muted-foreground">
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <InfoRow
            label="Date & Time"
            value={formatDate(session.dateTime.timestamp)}
          />
          <InfoRow label="Time Zone" value={session.dateTime.timeZone || "—"} />
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Location
            </span>
            <span className="text-sm font-medium">
              {session.location.name || "—"}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-xs text-muted-foreground">Rating</span>
            <StarRating
              value={Number(session.rating.value)}
              readonly
              size="sm"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Exposure Details */}
        <Card className="bg-card border-border card-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-display uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <Telescope className="w-4 h-4" /> SeeStar Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow
              label="Exposure"
              value={`${session.exposureDetails.duration}s`}
            />
            <InfoRow
              label="Gain"
              value={String(session.exposureDetails.gain)}
            />
            <InfoRow
              label="Filter"
              value={session.exposureDetails.filter || "None"}
            />
            <InfoRow
              label="Stacking Frames"
              value={String(session.exposureDetails.stackingFrames)}
            />
          </CardContent>
        </Card>

        {/* Sky Conditions */}
        <Card className="bg-card border-border card-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-display uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <Eye className="w-4 h-4" /> Sky Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow label="Seeing" value={`${session.conditions.seeing}/5`} />
            <InfoRow
              label="Transparency"
              value={`${session.conditions.transparency}/5`}
            />
            <InfoRow
              label="Bortle Class"
              value={`${session.conditions.bortleClass}/9`}
            />
          </CardContent>
        </Card>

        {/* Weather */}
        <Card className="bg-card border-border card-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-display uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <Thermometer className="w-4 h-4" /> Weather
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow
              label="Temperature"
              value={`${session.conditions.temperature}°C`}
            />
            <InfoRow
              label="Humidity"
              value={`${session.conditions.humidity}%`}
            />
            <InfoRow
              label="Wind Speed"
              value={`${session.conditions.windSpeed} km/h`}
            />
          </CardContent>
        </Card>

        {/* Notes */}
        {session.notes && (
          <Card className="bg-card border-border card-glow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display uppercase tracking-wide text-muted-foreground">
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {session.notes}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Review */}
        {session.rating.review && (
          <Card className="bg-card border-border card-glow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display uppercase tracking-wide text-muted-foreground">
                Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {session.rating.review}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
}
