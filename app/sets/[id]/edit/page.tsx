"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/supabase/client";
import { useClientFetch } from "@/hooks/use-client-fetch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, ArrowLeft, Image as ImageIcon, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface StudySet {
  id: string;
  title: string;
  description: string;
  userId: string;
}

interface Term {
  id: string;
  word: string;
  definition: string;
  rank: number;
  studySetId: string;
}

interface Flashcard {
  id: string;
  term: string;
  definition: string;
  imageUrl: string;
  dbId?: string; // Original database ID for updates
}

// Helper functions to encode/decode image URLs in definition
const encodeImageUrl = (definition: string, imageUrl: string): string => {
  if (!imageUrl) return definition;
  return `__IMG__:${imageUrl}__DEF__:${definition}`;
};

const decodeImageUrl = (definition: string): { imageUrl: string; text: string } => {
  const match = definition.match(/^__IMG__:(.+?)__DEF__:(.+)$/);
  if (match) {
    return { imageUrl: match[1], text: match[2] };
  }
  return { imageUrl: "", text: definition };
};

export default function EditStudySetPage() {
  const router = useRouter();
  const params = useParams();
  const setId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch existing study set and terms
  const { data: studySets } = useClientFetch<StudySet>(
    `study-set-edit-${setId}`,
    "StudySet",
    0,
    (query) => query.eq("id", setId)
  );

  const { data: terms } = useClientFetch<Term>(
    `terms-edit-${setId}`,
    "Term",
    0,
    (query) => query.eq("studySetId", setId).order("rank", { ascending: true })
  );

  useEffect(() => {
    if (studySets?.[0] && terms) {
      const studySet = studySets[0];
      
      // Check if user owns this study set
      if (studySet.userId !== user?.id) {
        toast.error("You don't have permission to edit this study set");
        router.push(`/sets/${setId}`);
        return;
      }

      setTitle(studySet.title);
      setDescription(studySet.description || "");
      
      // Decode flashcards from database, extracting image URLs
      const decodedFlashcards: Flashcard[] = terms.map((term) => {
        const decoded = decodeImageUrl(term.definition);
        return {
          id: crypto.randomUUID(),
          term: term.word,
          definition: decoded.text,
          imageUrl: decoded.imageUrl,
          dbId: term.id,
        };
      });

      // Ensure at least 2 cards
      while (decodedFlashcards.length < 2) {
        decodedFlashcards.push({
          id: crypto.randomUUID(),
          term: "",
          definition: "",
          imageUrl: "",
        });
      }

      setFlashcards(decodedFlashcards);
      setIsLoading(false);
    }
  }, [studySets, terms, user, setId, router]);

  const addFlashcard = () => {
    setFlashcards([...flashcards, { id: crypto.randomUUID(), term: "", definition: "", imageUrl: "" }]);
  };

  const removeFlashcard = (id: string) => {
    if (flashcards.length <= 2) {
      toast.error("Minimum 2 flashcards required");
      return;
    }
    setFlashcards(flashcards.filter((card) => card.id !== id));
  };

  const updateFlashcard = (id: string, field: "term" | "definition" | "imageUrl", value: string) => {
    setFlashcards(
      flashcards.map((card) => (card.id === id ? { ...card, [field]: value } : card))
    );
  };

  const removeImage = (id: string) => {
    updateFlashcard(id, "imageUrl", "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to edit a study set");
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
      
      // Update study set
      const { error: studySetError } = await supabase
        .from("StudySet")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          savedAt: new Date().toISOString(),
        })
        .eq("id", setId);

      if (studySetError) {
        console.error("Error updating study set:", studySetError);
        throw studySetError;
      }

      // Get existing term IDs to preserve
      const existingTermIds = validFlashcards
        .filter((card) => card.dbId)
        .map((card) => card.dbId!);

      // Delete removed terms
      if (existingTermIds.length > 0) {
        const { data: existingTerms } = await supabase
          .from("Term")
          .select("id")
          .eq("studySetId", setId);

        const termsToDelete = existingTerms
          ?.filter((term) => !existingTermIds.includes(term.id))
          .map((term) => term.id) || [];

        if (termsToDelete.length > 0) {
          await supabase.from("Term").delete().in("id", termsToDelete);
        }
      } else {
        // No existing terms, delete all
        await supabase.from("Term").delete().eq("studySetId", setId);
      }

      // Update or insert flashcards
      const updatePromises = validFlashcards.map(async (card, index) => {
        const encodedDefinition = encodeImageUrl(card.definition.trim(), card.imageUrl.trim());
        
        if (card.dbId) {
          // Update existing term
          return supabase
            .from("Term")
            .update({
              word: card.term.trim(),
              definition: encodedDefinition,
              rank: index + 1,
            })
            .eq("id", card.dbId);
        } else {
          // Insert new term
          return supabase.from("Term").insert({
            id: crypto.randomUUID(),
            studySetId: setId,
            word: card.term.trim(),
            definition: encodedDefinition,
            rank: index + 1,
            ephemeral: false,
          });
        }
      });

      await Promise.all(updatePromises);

      toast.success("Study set updated successfully!");
      router.push(`/sets/${setId}`);
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update study set");
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <p className="text-xl mb-4">You must be logged in to edit a study set</p>
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
          <Link href={`/sets/${setId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Study Set
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Edit Study Set</CardTitle>
            <CardDescription>
              Update the title, description, and flashcards for your study set
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
                            <div className="space-y-2">
                              <Label htmlFor={`image-${card.id}`}>
                                Image URL (optional)
                              </Label>
                              <div className="flex gap-2">
                                <Input
                                  id={`image-${card.id}`}
                                  placeholder="https://example.com/image.jpg"
                                  value={card.imageUrl}
                                  onChange={(e) =>
                                    updateFlashcard(card.id, "imageUrl", e.target.value)
                                  }
                                  disabled={isSubmitting}
                                  type="url"
                                />
                                {card.imageUrl && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeImage(card.id)}
                                    disabled={isSubmitting}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              {card.imageUrl && (
                                <div className="mt-2 relative">
                                  <img
                                    src={card.imageUrl}
                                    alt="Flashcard preview"
                                    className="max-w-full h-32 object-contain rounded border"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                </div>
                              )}
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
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
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

