"use client";

import { useClientFetch } from "@/hooks/use-client-fetch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface StudySet {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  userId: string;
}

interface Term {
  studySetId: string;
}

export function StudySetsList() {
  const { user, loading } = useAuth();

  const { data: studySets, isLoading: setsLoading, error: setsError } = useClientFetch<StudySet>(
    "study-sets",
    "StudySet",
    {
      cache: 0,
      enabled: !loading,
      filters: (query) => (user ? query.eq("userId", user.id) : query),
      extraKey: user?.id ?? "all",
    }
  );

  const { data: terms, isLoading: termsLoading } = useClientFetch<Term>(
    "terms",
    "Term",
    {
      cache: 0,
      enabled: !loading,
      extraKey: user?.id ?? "all",
    }
  );

  if (loading || setsLoading || termsLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (setsError) {
    return (
      <div className="text-center p-12">
        <p className="text-red-600">Error loading study sets: {setsError.message}</p>
      </div>
    );
  }

  if (!studySets || studySets.length === 0) {
    return (
      <div className="text-center p-12">
        <p className="text-gray-600 text-lg">No study sets found. Create your first study set!</p>
      </div>
    );
  }

  const termCounts = new Map<string, number>();
  terms?.forEach((term) => {
    termCounts.set(term.studySetId, (termCounts.get(term.studySetId) || 0) + 1);
  });

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {studySets.map((set) => (
        <Link key={set.id} href={`/sets/${set.id}`}>
          <Card className="h-full cursor-pointer transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">{set.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {set.description || "No description"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Flashcards:</span>
                  <span>{termCounts.get(set.id) || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Created:</span>
                  <span>{new Date(set.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
