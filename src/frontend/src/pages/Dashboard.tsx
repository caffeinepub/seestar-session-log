import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, PlusCircle, Star, Target, Telescope } from "lucide-react";
import { motion } from "motion/react";
import type { ObservingSession } from "../backend.d";
import StarRating from "../components/StarRating";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetSessions, useGetStats } from "../hooks/useQueries";

function formatDate(ts: bigint) {
  return new Date(Number(ts) * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const TARGET_TYPE_COLORS: Record<string, string> = {
  Galaxy: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Nebula: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  Star: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Planet: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Cluster: "bg-green-500/20 text-green-300 border-green-500/30",
  default: "bg-secondary text-muted-foreground border-border",
};

function typeBadgeClass(type: string) {
  return TARGET_TYPE_COLORS[type] || TARGET_TYPE_COLORS.default;
}

export default function Dashboard() {
  const { identity, login } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: sessions, isLoading: sessionsLoading } = useGetSessions();

  if (!identity) {
    return (
      <div className="flex items-center justify-center min-h-full p-8">
        <div className="text-center space-y-4">
          <Telescope className="w-12 h-12 text-primary mx-auto opacity-60" />
          <h2 className="font-display font-bold text-xl">
            Welcome to SeeStar Logger
          </h2>
          <p className="text-muted-foreground text-sm">
            Sign in to log and view your observing sessions.
          </p>
          <Button
            onClick={login}
            className="bg-primary text-primary-foreground"
            data-ocid="dashboard.login.button"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const recent = sessions
    ? [...sessions]
        .sort(
          (a, b) => Number(b.dateTime.timestamp) - Number(a.dateTime.timestamp),
        )
        .slice(0, 5)
    : [];

  const statCards = [
    {
      label: "Total Sessions",
      value: statsLoading ? null : Number(stats?.totalSessions ?? 0),
      icon: Telescope,
      color: "text-primary",
    },
    {
      label: "Unique Targets",
      value: statsLoading ? null : Number(stats?.uniqueTargets ?? 0),
      icon: Target,
      color: "text-accent",
    },
    {
      label: "Avg. Rating",
      value: statsLoading ? null : (stats?.averageRating ?? 0).toFixed(1),
      icon: Star,
      color: "text-gold",
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Your observing overview
          </p>
        </div>
        <Button
          asChild
          className="bg-primary text-primary-foreground hover:opacity-90 glow-blue gap-2"
          data-ocid="dashboard.new_session.button"
        >
          <Link to="/sessions/new">
            <PlusCircle className="w-4 h-4" />
            New Session
          </Link>
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {statCards.map(({ label, value, icon: Icon, color }, i) => (
          <Card
            key={label}
            className="bg-card border-border card-glow"
            data-ocid={`dashboard.stat.card.${i + 1}`}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    {label}
                  </p>
                  {value === null ? (
                    <Skeleton
                      className="h-8 w-16 mt-1"
                      data-ocid={`dashboard.stat.loading_state.${i + 1}`}
                    />
                  ) : (
                    <p
                      className={`text-3xl font-display font-bold mt-1 ${color}`}
                    >
                      {value}
                    </p>
                  )}
                </div>
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-card border-border card-glow">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="font-display text-base">
              Recent Sessions
            </CardTitle>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="gap-1 text-primary text-xs"
              data-ocid="dashboard.sessions.link"
            >
              <Link to="/sessions">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {sessionsLoading ? (
              <div
                className="px-6 pb-6 space-y-3"
                data-ocid="dashboard.sessions.loading_state"
              >
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <div
                className="text-center py-12 text-muted-foreground"
                data-ocid="dashboard.sessions.empty_state"
              >
                <Telescope className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No sessions yet. Start logging!</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recent.map((session: ObservingSession, idx) => (
                  <RecentSessionRow
                    key={session.id}
                    session={session}
                    idx={idx}
                    onNavigate={() =>
                      navigate({ to: `/sessions/${session.id}` })
                    }
                    typeBadgeClass={typeBadgeClass}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function RecentSessionRow({
  session,
  idx,
  onNavigate,
  typeBadgeClass,
  formatDate,
}: {
  session: ObservingSession;
  idx: number;
  onNavigate: () => void;
  typeBadgeClass: (t: string) => string;
  formatDate: (ts: bigint) => string;
}) {
  return (
    <button
      type="button"
      className="w-full px-6 py-4 flex items-center justify-between hover:bg-secondary/50 cursor-pointer transition-colors text-left"
      onClick={onNavigate}
      data-ocid={`dashboard.sessions.item.${idx + 1}`}
    >
      <div className="min-w-0">
        <p className="font-medium text-sm truncate">{session.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">
            {formatDate(session.dateTime.timestamp)}
          </span>
          <Badge
            variant="outline"
            className={`text-xs px-1.5 py-0 ${typeBadgeClass(session.targetType)}`}
          >
            {session.targetType}
          </Badge>
        </div>
      </div>
      <StarRating value={Number(session.rating.value)} readonly size="sm" />
    </button>
  );
}
