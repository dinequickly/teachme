"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, User, Bell, Moon, Sun, Languages } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/supabase/client";

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    if (user) {
      const metadata = user.user_metadata || {};
      setFullName(metadata.full_name || "");
      setEmail(user.email || "");
      setPhone(metadata.phone || "");

      const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
      if (savedTheme) setTheme(savedTheme);

      const savedNotifications = localStorage.getItem("notifications");
      if (savedNotifications !== null) setNotifications(savedNotifications === "true");

      const savedLanguage = localStorage.getItem("language");
      if (savedLanguage) setLanguage(savedLanguage);
    }
  }, [user]);

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (newTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }

    toast.success("Theme updated");
  };

  const handleNotificationsChange = (enabled: boolean) => {
    setNotifications(enabled);
    localStorage.setItem("notifications", enabled.toString());
    toast.success(enabled ? "Notifications enabled" : "Notifications disabled");
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
    toast.success("Language preference updated");
  };

  const cycleLanguage = () => {
    const options = ["en", "es", "fr"];
    const currentIndex = options.indexOf(language);
    const nextLanguage = options[(currentIndex + 1) % options.length];
    handleLanguageChange(nextLanguage);
  };

  const handleProfileUpdate = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user) {
      toast.error("You must be logged in to update your profile");
      return;
    }

    setIsSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          phone: phone,
        },
      });

      if (error) throw error;

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <p className="mb-4 text-xl">You must be logged in to access settings</p>
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
              <p className="text-xs uppercase tracking-wide text-rose-500">Account</p>
              <p className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
                {fullName || "Unnamed learner"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{email || "—"}</p>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950/40">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Theme</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {theme === "system" ? "Match system" : theme === "dark" ? "Dark theme" : "Light theme"}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleThemeChange(theme === "dark" ? "light" : "dark")}
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun className="mr-2 h-4 w-4" />
                        Use light mode
                      </>
                    ) : (
                      <>
                        <Moon className="mr-2 h-4 w-4" />
                        Use dark mode
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950/40">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Notifications
                </p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {notifications ? "Reminders enabled" : "Reminders disabled"}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleNotificationsChange(!notifications)}
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    {notifications ? "Disable" : "Enable"}
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950/40">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Study language
                </p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {language === "en" ? "English" : language === "es" ? "Español" : "Français"}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={cycleLanguage}>
                    <Languages className="mr-2 h-4 w-4" />
                    Switch language
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Button asChild variant="ghost" className="justify-start px-2">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to dashboard
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="justify-start"
              onClick={() => toast.info("Need help? Contact support@teachme.app")}
            >
              Get support
            </Button>
          </div>
        </aside>

        <div className="flex flex-col rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/70 sm:p-8">
          <header className="flex flex-col gap-4 border-b border-gray-200 pb-6 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
            <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit px-2">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <div className="text-xs uppercase tracking-wide text-rose-500">Account preferences</div>
          </header>

          <div className="mb-8 mt-6 space-y-2">
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Account Settings</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Update your profile, manage preferences, and review account actions. Changes save instantly
              once confirmed.
            </p>
          </div>

          <div className="space-y-8">
            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="space-y-1 px-0">
                <div className="flex items-center gap-2 text-rose-500">
                  <User className="h-5 w-5" />
                  <CardTitle>Profile details</CardTitle>
                </div>
                <CardDescription>
                  Keep your learning account information up to date so collaborators can reach you.
                </CardDescription>
              </CardHeader>
              <CardContent className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950/40">
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      placeholder="Your full name"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Email updates require contacting support so we can maintain your Supabase access.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Your phone number"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Profile"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="space-y-1 px-0">
                <div className="flex items-center gap-2 text-rose-500">
                  <Moon className="h-5 w-5" />
                  <CardTitle>Personal preferences</CardTitle>
                </div>
                <CardDescription>
                  Tailor reminders, appearance, and language to how you study best.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950/40">
                <div className="space-y-3">
                  <Label>Theme</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={theme === "light" ? "default" : "outline"}
                      onClick={() => handleThemeChange("light")}
                    >
                      <Sun className="mr-2 h-4 w-4" />
                      Light
                    </Button>
                    <Button
                      type="button"
                      variant={theme === "dark" ? "default" : "outline"}
                      onClick={() => handleThemeChange("dark")}
                    >
                      <Moon className="mr-2 h-4 w-4" />
                      Dark
                    </Button>
                    <Button
                      type="button"
                      variant={theme === "system" ? "default" : "outline"}
                      onClick={() => handleThemeChange("system")}
                    >
                      System
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-0.5">
                      <Label>Notifications</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Toggle study reminders and product updates.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant={notifications ? "default" : "outline"}
                      onClick={() => handleNotificationsChange(!notifications)}
                    >
                      <Bell className="mr-2 h-4 w-4" />
                      {notifications ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Language</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={language === "en" ? "default" : "outline"}
                      onClick={() => handleLanguageChange("en")}
                    >
                      <Languages className="mr-2 h-4 w-4" />
                      English
                    </Button>
                    <Button
                      type="button"
                      variant={language === "es" ? "default" : "outline"}
                      onClick={() => handleLanguageChange("es")}
                    >
                      <Languages className="mr-2 h-4 w-4" />
                      Español
                    </Button>
                    <Button
                      type="button"
                      variant={language === "fr" ? "default" : "outline"}
                      onClick={() => handleLanguageChange("fr")}
                    >
                      <Languages className="mr-2 h-4 w-4" />
                      Français
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="space-y-1 px-0">
                <CardTitle>Account actions</CardTitle>
                <CardDescription>Export study data or review destructive actions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950/40">
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => toast.info("Export feature coming soon!")}
                >
                  Export data
                  <span className="text-xs uppercase tracking-wide text-gray-400">Soon</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-between text-red-600 hover:text-red-700"
                  onClick={() => {
                    if (
                      confirm(
                        "Are you sure you want to delete your account? This action cannot be undone."
                      )
                    ) {
                      toast.info("Account deletion feature coming soon!");
                    }
                  }}
                >
                  Delete account
                  <span className="text-xs uppercase tracking-wide text-red-400">High risk</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

