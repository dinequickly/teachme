"use client";

import { useState } from "react";
import { useClientFetch } from "@/hooks/use-client-fetch";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Loader2, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { useParams } from "next/navigation";

interface StudySet {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}

interface Term {
  id: string;
  word: string;
  definition: string;
  rank: number;
  studySetId: string;
}

export default function StudySetPage() {
  const params = useParams();
  const setId = params.id as string;
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const { data: studySets, isLoading: setsLoading, error: setsError } = useClientFetch<StudySet>(
    `study-set-${setId}`,
    "StudySet",
    undefined,
    (query) => query.eq("id", setId)
  );

  const { data: terms, isLoading: termsLoading } = useClientFetch<Term>(
    `terms-${setId}`,
    "Term",
    undefined,
    (query) => query.eq("studySetId", setId).order("rank", { ascending: true })
  );

  const studySet = studySets?.[0];
  const currentTerm = terms?.[currentCardIndex];

  const handleNext = () => {
    if (terms && currentCardIndex < terms.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  if (setsLoading || termsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (setsError || !studySet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <p className="text-red-600 text-xl mb-4">Study set not found</p>
        <Button asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  if (!terms || terms.length === 0) {
    return (
      <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <Button asChild variant="outline" className="mb-6">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              {studySet.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
              {studySet.description || "No description"}
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">No flashcards in this study set yet.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <Button asChild variant="outline" className="mb-6">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            {studySet.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {studySet.description || "No description"}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6 text-center">
          <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {currentCardIndex + 1} / {terms.length}
          </span>
        </div>

        {/* Flashcard */}
        <div className="mb-8">
          <Card
            className="min-h-[400px] cursor-pointer transition-all duration-300 hover:shadow-xl"
            onClick={handleFlip}
          >
            <CardContent className="flex items-center justify-center min-h-[400px] p-8">
              <div className="text-center space-y-4 w-full">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {isFlipped ? "Definition" : "Term"}
                </div>
                <div className="text-3xl font-bold text-gray-800 dark:text-gray-200 break-words">
                  {isFlipped ? currentTerm?.definition : currentTerm?.word}
                </div>
                <div className="mt-8 text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                  <RotateCw className="h-4 w-4" />
                  Click to flip
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePrevious}
            disabled={currentCardIndex === 0}
            className="flex-1"
          >
            <ChevronLeft className="mr-2 h-5 w-5" />
            Previous
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={handleFlip}
            className="flex-1"
          >
            <RotateCw className="mr-2 h-5 w-5" />
            Flip Card
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={handleNext}
            disabled={currentCardIndex === terms.length - 1}
            className="flex-1"
          >
            Next
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="mt-8">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentCardIndex + 1) / terms.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

