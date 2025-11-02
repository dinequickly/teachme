"use client";

import { useAuth } from "@/lib/auth-context"; // ✅ Fixed: Correct import path
import { useClientFetch } from "@/hooks/use-client-fetch";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface ExampleData {
  id: string;
  // Add your data type fields here
}

export default function DashboardExample() {
  const { user, loading } = useAuth(); // ✅ Uses the existing auth context
  const router = useRouter();

  // ✅ Fixed: useClientFetch signature is (key, table, cache?, filters?)
  // Only fetch if user is authenticated
  const { data, isLoading, error } = useClientFetch<ExampleData>(
    "dashboard-data", // Query key
    "your_table_name", // Replace with your actual table name
    0, // Cache time (0 = always refetch)
    (query) => {
      // Only run query if user exists
      if (!user) {
        return query.limit(0); // Return empty query if no user
      }
      // Add your filters here
      return query; // Or add filters like: query.eq("userId", user.id)
    }
  );

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Show loading state
  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  // Show redirect message if no user
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Error loading data: {error.message}</p>
        </div>
      </div>
    );
  }

  // Render dashboard content
  return (
    <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">
          Welcome to your Dashboard
        </h1>
        
        {/* Render your data here */}
        {data && data.length > 0 ? (
          <div className="space-y-4">
            {data.map((item) => (
              <div key={item.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                <pre className="text-sm">{JSON.stringify(item, null, 2)}</pre>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8">
            <p className="text-gray-600 dark:text-gray-400">No data found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

