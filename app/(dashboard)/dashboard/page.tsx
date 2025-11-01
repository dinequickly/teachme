import { Button } from "@/components/ui/button";
import { createClient } from "@/supabase/server";
import { Home, Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { StudySetsList } from "@/components/study-sets-list";

export default function DashboardPage() {
  return (
    <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-gray-600 text-3xl mb-4">
            You&#39;re logged into your dashboard.
          </p>
          <Suspense
            fallback={
              <p className="text-gray-600 text-md mb-4">Loading user infos...</p>
            }>
            <UserData />
          </Suspense>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              My Study Sets
            </h2>
            <Button asChild>
              <Link href="/sets/new" className="inline-flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Create New
              </Link>
            </Button>
          </div>
          <StudySetsList />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
          <Button asChild>
            <Link href="/" className="inline-flex items-center">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

async function UserData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userData = user?.user_metadata;

  return (
    <div className="max-w-xl w-full mx-auto space-y-5">
      <p className="text-gray-600 text-2xl mb-10">
        Hello {userData?.full_name}
      </p>
      <div className="flex items-center justify-between">
        <p className="text-gray-600 font-mono p-0.5 rounded bg-slate-300">
          {userData?.email}
        </p>
        <p className="text-gray-600 font-mono p-0.5 rounded bg-slate-300">
          {userData?.email_verified ? "Verified" : "Unverified"}
        </p>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-gray-600 font-mono p-0.5 rounded bg-slate-300">
          {userData?.phone}
        </p>
        <p className="text-gray-600 font-mono p-0.5 rounded bg-slate-300">
          {userData?.phone_verified ? "Verified" : "Unverified"}
        </p>
      </div>
    </div>
  );
}
