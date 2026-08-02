export default function StarRating({ value, onChange, size = "md", readonly = false }: { value: number; onChange?: (v: number) => void; size?: "sm" | "md" | "lg"; readonly?: boolean }) {
  const s = size === "sm" ? "text-sm" : size === "lg" ? "text-2xl" : "text-lg";
  return (
    <div className={`flex gap-0.5 ${s}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" disabled={readonly} onClick={() => onChange?.(star)} className={`${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition ${star <= value ? "text-yellow-400" : "text-gray-300"}`}>
          {star <= value ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}
