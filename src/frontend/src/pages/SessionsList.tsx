import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate } from "@tanstack/react-router";
import { MapPin, PlusCircle, Search, Telescope } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { ObservingSession } from "../backend.d";
import StarRating from "../components/StarRating";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetSessions } from "../hooks/useQueries";

function formatDate(ts: bigint) {
  return new Date(Number(ts) * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const TYPE_COLORS: Record<string, string> = {
  Galaxy: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Nebula: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  Star: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Planet: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Cluster: "bg-green-500/20 text-green-300 border-green-500/30",
  default: "bg-secondary text-muted-foreground border-border",
};

export default function SessionsList() {
  const { identity, login } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: sessions, isLoading } = useGetSessions();
  const [search, setSearch] = useState("");

  if (!identity) {
    return (
      <div className="flex items-center justify-center min-h-full p-8">
        <div className="text-center space-y-4">
          <Telescope className="w-12 h-12 text-primary mx-auto opacity-60" />
          <p className="text-muted-foreground text-sm">
            Sign in to view your sessions.
          </p>
          <Button
            onClick={login}
            className="bg-primary text-primary-foreground"
            data-ocid="sessions.login.button"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const sorted = sessions
    ? [...sessions].sort(
        (a, b) => Number(b.dateTime.timestamp) - Number(a.dateTime.timestamp),
      )
    : [];

  const filtered = sorted.filter(
    (s) =>
      !search ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.targetName.toLowerCase().includes(search.toLowerCase()) ||
      s.location.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-display font-bold text-2xl">Sessions</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {sorted.length} observing session{sorted.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          asChild
          className="bg-primary text-primary-foreground hover:opacity-90 glow-blue gap-2"
          data-ocid="sessions.new_session.button"
        >
          <Link to="/sessions/new">
            <PlusCircle className="w-4 h-4" />
            New
          </Link>
        </Button>
      </motion.div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search sessions, targets, locations…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-card border-border"
          data-ocid="sessions.search_input"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3" data-ocid="sessions.loading_state">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card
          className="bg-card border-border"
          data-ocid="sessions.empty_state"
        >
          <CardContent className="text-center py-16">
            <Telescope className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" />
            <p className="text-muted-foreground">
              {search
                ? "No sessions match your search."
                : "No sessions yet. Log your first observation!"}
            </p>
            {!search && (
              <Button
                asChild
                className="mt-4 bg-primary text-primary-foreground"
                data-ocid="sessions.empty.new_session.button"
              >
                <Link to="/sessions/new">Log First Session</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((session: ObservingSession, idx) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <Card
                className="bg-card border-border hover:border-primary/30 transition-all cursor-pointer card-glow hover:glow-blue"
                onClick={() => navigate({ to: `/sessions/${session.id}` })}
                data-ocid={`sessions.item.${idx + 1}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-sm truncate">
                          {session.title}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`text-xs px-1.5 py-0 ${TYPE_COLORS[session.targetType] || TYPE_COLORS.default}`}
                        >
                          {session.targetType}
                        </Badge>
                      </div>
                      <p className="text-xs text-primary mt-0.5">
                        {session.targetName}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span>{formatDate(session.dateTime.timestamp)}</span>
                        {session.location.name && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {session.location.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <StarRating
                        value={Number(session.rating.value)}
                        readonly
                        size="sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
