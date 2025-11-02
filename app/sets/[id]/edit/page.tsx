"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, ArrowLeft, Image as ImageIcon, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClientFetch } from "@/hooks/use-client-fetch";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/supabase/client";

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
  dbId?: string;
}

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
  const [isImportMode, setIsImportMode] = useState(false);
  const [importText, setImportText] = useState("");
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const { data: studySets } = useClientFetch<StudySet>(
    `study-set-edit-${setId}`,
    "StudySet",
    {
      cache: 0,
      enabled: Boolean(setId) && Boolean(user),
      filters: (query) => query.eq("id", setId),
      extraKey: setId,
    }
  );

  const { data: terms } = useClientFetch<Term>(
    `terms-edit-${setId}`,
    "Term",
    {
      cache: 0,
      enabled: Boolean(setId) && Boolean(user),
      filters: (query) => query.eq("studySetId", setId).order("rank", { ascending: true }),
      extraKey: setId,
    }
  );

  useEffect(() => {
    if (studySets && studySets.length === 0) {
      setIsLoading(false);
      toast.error("Study set not found");
      router.push("/dashboard");
    }
  }, [studySets, router]);

  useEffect(() => {
    if (!studySets?.[0] || !terms) return;

    const studySet = studySets[0];

    if (studySet.userId !== user?.id) {
      toast.error("You don't have permission to edit this study set");
      router.push(`/sets/${setId}`);
      return;
    }

    setTitle(studySet.title);
    setDescription(studySet.description || "");

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
  }, [studySets, terms, user, setId, router]);

  const addFlashcard = () => {
    setFlashcards((prev) => [
      ...prev,
      { id: crypto.randomUUID(), term: "", definition: "", imageUrl: "" },
    ]);
  };

  const removeFlashcard = (id: string) => {
    if (flashcards.length <= 2) {
      toast.error("Minimum 2 flashcards required");
      return;
    }
    setFlashcards((prev) => prev.filter((card) => card.id !== id));
  };

  const updateFlashcard = (id: string, field: "term" | "definition" | "imageUrl", value: string) => {
    setFlashcards((prev) =>
      prev.map((card) => (card.id === id ? { ...card, [field]: value } : card))
    );
  };

  const removeImage = (id: string) => {
    updateFlashcard(id, "imageUrl", "");
    const input = fileInputRefs.current[id];
    if (input) {
      input.value = "";
    }
  };

  const handleImageUpload = (cardId: string, file: File | null) => {
    if (!file) return;

    const maxSizeInMb = 2;
    if (file.size > maxSizeInMb * 1024 * 1024) {
      toast.error(`Image is too large. Please choose a file under ${maxSizeInMb}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateFlashcard(cardId, "imageUrl", reader.result as string);
      toast.success("Image attached to flashcard");
    };
    reader.onerror = () => {
      toast.error("Unable to read the selected image");
    };
    reader.readAsDataURL(file);
  };

  const parseImportLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return null;

    const delimiters = ["|", "\t", " - ", " – ", "::", ";"];
    let parts: string[] = [trimmed];

    for (const delimiter of delimiters) {
      if (trimmed.includes(delimiter)) {
        parts = trimmed.split(delimiter).map((segment) => segment.trim()).filter(Boolean);
        break;
      }
    }

    if (parts.length < 2) return null;

    const [term, definition, imageUrl] = parts;
    return {
      term,
      definition,
      imageUrl: imageUrl || "",
    };
  };

  const handleImportFlashcards = () => {
    const importedCards = importText
      .split("\n")
      .map((line) => parseImportLine(line))
      .filter((value): value is { term: string; definition: string; imageUrl: string } => Boolean(value));

    if (importedCards.length === 0) {
      toast.error("Nothing to import. Use the format Term | Definition | Image URL (optional).");
      return;
    }

    setFlashcards((prev) => {
      const existing = prev.filter(
        (card) => card.term.trim() || card.definition.trim() || card.dbId
      );

      const merged: Flashcard[] = [
        ...existing,
        ...importedCards.map((card) => ({
          id: crypto.randomUUID(),
          term: card.term,
          definition: card.definition,
          imageUrl: card.imageUrl,
        })),
      ];

      while (merged.length < 2) {
        merged.push({
          id: crypto.randomUUID(),
          term: "",
          definition: "",
          imageUrl: "",
        });
      }

      return merged;
    });

    setImportText("");
    setIsImportMode(false);
    toast.success("Flashcards imported");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user) {
      toast.error("You must be logged in to edit a study set");
      return;
    }

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

      const { error: studySetError } = await supabase
        .from("StudySet")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          savedAt: new Date().toISOString(),
        })
        .eq("id", setId);

      if (studySetError) {
        throw studySetError;
      }

      const existingTermIds = validFlashcards
        .filter((card) => card.dbId)
        .map((card) => card.dbId!);

      if (existingTermIds.length > 0) {
        const { data: existingTerms } = await supabase
          .from("Term")
          .select("id")
          .eq("studySetId", setId);

        const termsToDelete =
          existingTerms?.filter((term) => !existingTermIds.includes(term.id)).map((term) => term.id) ||
          [];

        if (termsToDelete.length > 0) {
          await supabase.from("Term").delete().in("id", termsToDelete);
        }
      } else {
        await supabase.from("Term").delete().eq("studySetId", setId);
      }

      const updatePromises = validFlashcards.map((card, index) => {
        const encodedDefinition = encodeImageUrl(card.definition.trim(), card.imageUrl.trim());

        if (card.dbId) {
          return supabase
            .from("Term")
            .update({
              word: card.term.trim(),
              definition: encodedDefinition,
              rank: index + 1,
            })
            .eq("id", card.dbId);
        }

        return supabase.from("Term").insert({
          id: crypto.randomUUID(),
          studySetId: setId,
          word: card.term.trim(),
          definition: encodedDefinition,
          rank: index + 1,
          ephemeral: false,
        });
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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <p className="mb-4 text-xl">You must be logged in to edit a study set</p>
        <Button asChild>
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100/60 p-2 dark:bg-gray-950">
      <div className="mx-auto grid min-h-[calc(100vh-1rem)] w-full max-w-6xl grid-cols-1 gap-6 rounded-3xl border border-gray-200 bg-white/70 shadow-sm backdrop-blur md:p-6 lg:grid-cols-[260px_1fr] dark:border-gray-800 dark:bg-gray-900/80">
        <aside className="hidden flex-col justify-between rounded-2xl border border-dashed border-gray-200 bg-white/70 p-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/80 dark:text-gray-300 lg:flex">
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-rose-500">Control Center</p>
              <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">Study Set Tools</p>
            </div>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/settings">
                <ArrowLeft className="mr-2 h-4 w-4 rotate-180" />
                Open Settings
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
              onClick={() => toast.info("Coming soon: printable study guides.")}
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              Export Deck
            </Button>
            <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
              Keep this drawer open for quick actions while you refine every card in the set.
            </p>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-rose-500">Preview</p>
            <div className="h-40 w-full rounded-xl border border-dashed border-gray-300 bg-gray-100 dark:border-gray-700 dark:bg-gray-800" />
          </div>
        </aside>

        <div className="flex flex-col rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/70 sm:p-8">
          <header className="flex flex-col gap-4 border-b border-gray-200 pb-6 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="sm" className="-ml-2 px-2">
                <Link href="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
                <Link href={`/sets/${setId}`}>View Study Set</Link>
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => toast.info("AI assistant coming soon")}
              className="self-start"
            >
              AI Popout
            </Button>
          </header>

          <div className="mb-8 mt-6 space-y-2">
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Edit Study Set</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Fine tune the content, add supporting visuals, or import a batch of new cards in one go.
              Keep at least two cards to save your changes.
            </p>
          </div>

          <Card className="border-0 shadow-none">
            <CardContent className="p-0">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-6 rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950/40">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="title">
                        Title <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="title"
                        placeholder="e.g., Spanish Vocabulary"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        placeholder="e.g., Basic Spanish words and phrases"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <Label>
                          Flashcards <span className="text-red-500">* (minimum 2)</span>
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Add as many cards as you need. Each card supports optional images for richer context.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant={isImportMode ? "default" : "outline"}
                          size="sm"
                          onClick={() => setIsImportMode((state) => !state)}
                          disabled={isSubmitting}
                        >
                          Import
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addFlashcard}
                          disabled={isSubmitting}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Card
                        </Button>
                      </div>
                    </div>

                    {isImportMode && (
                      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/60">
                        <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-200">Bulk import</p>
                        <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
                          Paste one flashcard per line using
                          {" "}
                          <span className="font-semibold">Term | Definition | Image URL</span>.
                          The image field is optional.
                        </p>
                        <textarea
                          value={importText}
                          onChange={(event) => setImportText(event.target.value)}
                          placeholder={"Hola | Hello | https://example.com/hola.png\nAdiós | Goodbye"}
                          className="min-h-[140px] w-full rounded-lg border border-gray-300 bg-white p-3 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-300 dark:border-gray-700 dark:bg-gray-950"
                          disabled={isSubmitting}
                        />
                        <div className="mt-3 flex flex-wrap justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setImportText("");
                              setIsImportMode(false);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleImportFlashcards}
                            disabled={isSubmitting}
                          >
                            Apply Import
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {flashcards.map((card, index) => (
                        <div
                          key={card.id}
                          className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950/40"
                        >
                          <div className="flex flex-col gap-4 md:flex-row">
                            <div className="flex items-start gap-3 md:w-24">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                {index + 1}
                              </div>
                            </div>
                            <div className="flex-1 space-y-4">
                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                  <Label htmlFor={`term-${card.id}`}>Term</Label>
                                  <Input
                                    id={`term-${card.id}`}
                                    placeholder="e.g., Hola"
                                    value={card.term}
                                    onChange={(event) =>
                                      updateFlashcard(card.id, "term", event.target.value)
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
                                    onChange={(event) =>
                                      updateFlashcard(card.id, "definition", event.target.value)
                                    }
                                    disabled={isSubmitting}
                                    required
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`image-${card.id}`}>
                                  Image <span className="text-xs text-gray-400">(optional)</span>
                                </Label>
                                <div className="flex flex-col gap-3 md:flex-row">
                                  <div className="flex flex-1 items-center gap-2">
                                    <Input
                                      id={`image-${card.id}`}
                                      placeholder="Paste an image URL or upload below"
                                      value={card.imageUrl}
                                      onChange={(event) =>
                                        updateFlashcard(card.id, "imageUrl", event.target.value)
                                      }
                                      disabled={isSubmitting}
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
                                  <div className="flex gap-2">
                                    <input
                                      ref={(element) => {
                                        fileInputRefs.current[card.id] = element;
                                      }}
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(event) => {
                                        handleImageUpload(card.id, event.currentTarget.files?.[0] ?? null);
                                        event.currentTarget.value = "";
                                      }}
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => fileInputRefs.current[card.id]?.click()}
                                      disabled={isSubmitting}
                                      className="whitespace-nowrap"
                                    >
                                      <ImageIcon className="mr-2 h-4 w-4" />
                                      Upload
                                    </Button>
                                  </div>
                                </div>
                                {card.imageUrl && (
                                  <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                                    <img
                                      src={card.imageUrl}
                                      alt="Flashcard visual"
                                      className="h-44 w-full object-cover"
                                      onError={(event) => {
                                        event.currentTarget.style.display = "none";
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-start justify-end md:w-16">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeFlashcard(card.id)}
                                disabled={isSubmitting || flashcards.length <= 2}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-end gap-3 border-t border-gray-200 pt-6 text-sm sm:flex-row sm:justify-between dark:border-gray-800">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => toast.info("AI builder coming soon")}
                    >
                      Build with AI
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => router.back()}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  </div>
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
    </div>
  );
}
