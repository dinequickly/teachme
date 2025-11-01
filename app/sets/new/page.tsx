"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Flashcard {
  id: string;
  term: string;
  definition: string;
}

export default function NewStudySetPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([
    { id: crypto.randomUUID(), term: "", definition: "" },
    { id: crypto.randomUUID(), term: "", definition: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addFlashcard = () => {
    setFlashcards([...flashcards, { id: crypto.randomUUID(), term: "", definition: "" }]);
  };

  const removeFlashcard = (id: string) => {
    if (flashcards.length <= 2) {
      toast.error("Minimum 2 flashcards required");
      return;
    }
    setFlashcards(flashcards.filter((card) => card.id !== id));
  };

  const updateFlashcard = (id: string, field: "term" | "definition", value: string) => {
    setFlashcards(
      flashcards.map((card) => (card.id === id ? { ...card, [field]: value } : card))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to create a study set");
      return;
    }

    // Validation
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (flashcards.length < 2) {
      toast.error("At least 2 flashcards are required");
      return;
    }

    const validFlashcards = flashcards.filter(
      (card) => card.term.trim() && card.definition.trim()
    );

    if (validFlashcards.length < 2) {
      toast.error("At least 2 complete flashcards are required (both term and definition)");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      
      // Generate a unique ID for the study set
      const studySetId = crypto.randomUUID();

      // Insert study set
      const { error: studySetError } = await supabase.from("StudySet").insert({
        id: studySetId,
        userId: user.id,
        title: title.trim(),
        description: description.trim() || null,
        type: "Default",
        visibility: "Public",
        wordLanguage: "en",
        definitionLanguage: "en",
        created: true,
        createdAt: new Date().toISOString(),
        savedAt: new Date().toISOString(),
      });

      if (studySetError) {
        console.error("Error creating study set:", studySetError);
        throw studySetError;
      }

      // Insert flashcards with rank ordering
      const termsToInsert = validFlashcards.map((card, index) => ({
        id: crypto.randomUUID(),
        studySetId: studySetId,
        word: card.term.trim(),
        definition: card.definition.trim(),
        rank: index + 1,
        ephemeral: false,
      }));

      const { error: termsError } = await supabase.from("Term").insert(termsToInsert);

      if (termsError) {
        console.error("Error creating flashcards:", termsError);
        throw termsError;
      }

      toast.success("Study set created successfully!");
      router.push(`/sets/${studySetId}`);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to create study set");
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <p className="text-xl mb-4">You must be logged in to create a study set</p>
        <Button asChild>
          <Link href="/login">Login</Link>
        </Button>
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

        <Card>
          <CardHeader>
            <CardTitle>Create New Study Set</CardTitle>
            <CardDescription>
              Add a title, description, and at least 2 flashcards to create your study set
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Spanish Vocabulary"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="e.g., Basic Spanish words and phrases"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Flashcards */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>
                    Flashcards <span className="text-red-500">* (minimum 2)</span>
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addFlashcard}
                    disabled={isSubmitting}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Card
                  </Button>
                </div>

                <div className="space-y-4">
                  {flashcards.map((card, index) => (
                    <Card key={card.id} className="relative">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1 space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor={`term-${card.id}`}>Term</Label>
                              <Input
                                id={`term-${card.id}`}
                                placeholder="e.g., Hola"
                                value={card.term}
                                onChange={(e) =>
                                  updateFlashcard(card.id, "term", e.target.value)
                                }
                                disabled={isSubmitting}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`definition-${card.id}`}>Definition</Label>
                              <Input
                                id={`definition-${card.id}`}
                                placeholder="e.g., Hello"
                                value={card.definition}
                                onChange={(e) =>
                                  updateFlashcard(card.id, "definition", e.target.value)
                                }
                                disabled={isSubmitting}
                                required
                              />
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFlashcard(card.id)}
                            disabled={isSubmitting || flashcards.length <= 2}
                            className="flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Study Set"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

