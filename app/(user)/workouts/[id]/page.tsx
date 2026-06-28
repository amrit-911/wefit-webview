"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

/** The workout detail/active flow has been removed.
 *  Everything lives on /workouts. Redirect there. */
export default function WorkoutDetailRedirect() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    router.replace("/workouts");
  }, [router, params]);

  return null;
}
