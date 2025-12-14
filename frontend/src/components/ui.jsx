export function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.04)] ${className}`}>
      {children}
    </div>
  );
}

export function Button({ children, className = "", variant = "primary", ...props }) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white/20";
  const styles =
    variant === "primary"
      ? "bg-white text-black hover:bg-white/90"
      : variant === "ghost"
      ? "bg-white/5 hover:bg-white/10 border border-white/10"
      : "bg-red-500/80 hover:bg-red-500 text-white";

  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-white/20 ${className}`}
      {...props}
    />
  );
}

export function Label({ children }) {
  return <div className="text-sm font-medium text-white/70 mb-1">{children}</div>;
}
