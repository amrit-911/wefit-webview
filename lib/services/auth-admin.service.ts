export async function updateAuthEmail(uid: string, email: string): Promise<void> {
  const res = await fetch("/api/admin/auth/update-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, email }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to update authentication email.");
  }
}
