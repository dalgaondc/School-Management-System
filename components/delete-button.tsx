"use client";

export function DeleteButton({
  action,
  id,
  message,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  message: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-md px-2 py-1 text-sm text-red-600 hover:bg-red-50"
      >
        Delete
      </button>
    </form>
  );
}
