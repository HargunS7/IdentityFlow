import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* -------------------------------------------------------------------------- */
/*                                  Card                                      */
/* -------------------------------------------------------------------------- */

export function Card({
  children,
  className = "",
  as: Tag = "div",
  padded = true,
  interactive = false,
}) {
  return (
    <Tag
      className={[
        "rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl",
        "shadow-[0_12px_40px_rgba(0,0,0,0.25)]",
        padded ? "p-6" : "",
        interactive
          ? "transition hover:border-white/20 hover:bg-white/[0.07]"
          : "",
        className,
      ].join(" ")}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ title, subtitle, right, eyebrow }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        {eyebrow && (
          <div className="text-[11px] uppercase tracking-[0.14em] text-white/50">
            {eyebrow}
          </div>
        )}
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-white/60">{subtitle}</p>
        )}
      </div>
      {right}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Button                                      */
/* -------------------------------------------------------------------------- */

const buttonVariants = {
  primary:
    "bg-white text-black hover:bg-white/90 shadow-[0_6px_24px_rgba(255,255,255,0.18)]",
  secondary:
    "bg-white/10 hover:bg-white/15 border border-white/10 text-white",
  ghost:
    "bg-transparent hover:bg-white/5 border border-white/10 text-white/80",
  danger:
    "bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-200",
  subtle:
    "bg-transparent hover:bg-white/5 text-white/70 border border-transparent",
};

const buttonSizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-sm",
};

export const Button = React.forwardRef(function Button(
  {
    children,
    className = "",
    variant = "primary",
    size = "md",
    leftIcon,
    rightIcon,
    loading = false,
    disabled,
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition",
        "focus:outline-none focus:ring-2 focus:ring-white/20",
        "active:scale-[0.98]",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      ].join(" ")}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {!loading && leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
});

/* -------------------------------------------------------------------------- */
/*                              Input / Field                                 */
/* -------------------------------------------------------------------------- */

export function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      {label && (
        <div className="text-xs uppercase tracking-wider text-white/60 mb-2">
          {label}
        </div>
      )}
      {children}
      {hint && !error && (
        <div className="mt-1.5 text-xs text-white/50">{hint}</div>
      )}
      {error && (
        <div className="mt-1.5 text-xs text-red-300">{error}</div>
      )}
    </label>
  );
}

export const Input = React.forwardRef(function Input(
  { className = "", ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={[
        "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white",
        "placeholder:text-white/40 outline-none transition",
        "focus:border-white/25 focus:bg-white/[0.07] focus:ring-2 focus:ring-white/10",
        className,
      ].join(" ")}
      {...props}
    />
  );
});

export const Select = React.forwardRef(function Select(
  { className = "", children, ...props },
  ref
) {
  return (
    <select
      ref={ref}
      className={[
        "w-full rounded-2xl border border-white/10 bg-[#0b0f19]/70 px-4 py-3 text-sm text-white",
        "outline-none transition appearance-none",
        "focus:border-white/25 focus:ring-2 focus:ring-white/10",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </select>
  );
});

/* -------------------------------------------------------------------------- */
/*                                Badge                                       */
/* -------------------------------------------------------------------------- */

const badgeVariants = {
  neutral: "bg-white/10 border-white/10 text-white/80",
  good: "bg-emerald-500/15 border-emerald-500/30 text-emerald-200",
  warn: "bg-amber-500/15 border-amber-500/30 text-amber-200",
  bad: "bg-red-500/15 border-red-500/30 text-red-200",
  info: "bg-sky-500/15 border-sky-500/30 text-sky-200",
};

export function Badge({ children, variant = "neutral", className = "" }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        badgeVariants[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export function Chip({ children, className = "" }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white/85",
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Skeleton                                    */
/* -------------------------------------------------------------------------- */

export function Skeleton({ className = "", style }) {
  return (
    <div
      className={[
        "animate-pulse rounded-xl bg-white/10",
        className,
      ].join(" ")}
      style={style}
    />
  );
}

export function SkeletonRow({ className = "" }) {
  return (
    <div
      className={[
        "rounded-2xl border border-white/10 bg-white/[0.04] p-4 flex items-center justify-between gap-3",
        className,
      ].join(" ")}
    >
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-1/5" />
      </div>
      <Skeleton className="h-7 w-20" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Spinner                                     */
/* -------------------------------------------------------------------------- */

export function Spinner({ size = "md", className = "" }) {
  const dim =
    size === "sm" ? "h-4 w-4 border-2" :
    size === "lg" ? "h-10 w-10 border-2" :
    "h-6 w-6 border-2";
  return (
    <span
      aria-label="Loading"
      className={[
        "inline-block rounded-full border-white/20 border-t-white animate-spin",
        dim,
        className,
      ].join(" ")}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                                Empty state                                 */
/* -------------------------------------------------------------------------- */

export function EmptyState({ title, subtitle, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-8 text-center">
      <div className="mx-auto h-10 w-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50">
        ·
      </div>
      <div className="mt-3 text-sm font-semibold text-white">{title}</div>
      {subtitle && (
        <div className="mt-1 text-sm text-white/60 max-w-md mx-auto">
          {subtitle}
        </div>
      )}
      {action && <div className="mt-4 inline-block">{action}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Page header                                   */
/* -------------------------------------------------------------------------- */

export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        {eyebrow && (
          <div className="text-[11px] uppercase tracking-[0.14em] text-white/50">
            {eyebrow}
          </div>
        )}
        <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-sm md:text-base text-white/60">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Breadcrumbs                                   */
/* -------------------------------------------------------------------------- */

export function Breadcrumbs({ items = [] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-white/50">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${it.label}-${i}`} className="flex items-center gap-1.5">
              {it.to && !isLast ? (
                <a
                  href={it.to}
                  className="hover:text-white/80 transition"
                  onClick={(e) => {
                    if (it.onClick) {
                      e.preventDefault();
                      it.onClick();
                    }
                  }}
                >
                  {it.label}
                </a>
              ) : (
                <span className={isLast ? "text-white/80" : ""}>
                  {it.label}
                </span>
              )}
              {!isLast && <span className="text-white/30">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Modal                                       */
/* -------------------------------------------------------------------------- */

export function Modal({ open, onClose, title, children, maxWidth = "max-w-md" }) {
  // Lock scroll while modal is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className={[
              "relative w-full rounded-3xl border border-white/10 bg-[#0b0f19]/90",
              "backdrop-blur-xl shadow-[0_30px_90px_rgba(0,0,0,0.55)] p-6",
              maxWidth,
            ].join(" ")}
          >
            {title && (
              <h3 id="modal-title" className="text-lg font-semibold text-white">
                {title}
              </h3>
            )}
            <div className={title ? "mt-3" : ""}>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger", // "danger" | "primary"
  loading = false,
}) {
  return (
    <Modal open={open} onClose={loading ? undefined : onClose} title={title}>
      {description && (
        <p className="text-sm text-white/70 leading-relaxed">{description}</p>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === "danger" ? "danger" : "primary"}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Stat card                                    */
/* -------------------------------------------------------------------------- */

export function Stat({ label, value, hint, loading = false, accent }) {
  return (
    <Card padded className="!p-5">
      <div className="text-[11px] uppercase tracking-[0.14em] text-white/50">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <motion.div
            key={value}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={[
              "text-3xl font-semibold tracking-tight",
              accent === "good" ? "text-emerald-300" :
              accent === "warn" ? "text-amber-300" :
              accent === "bad" ? "text-red-300" :
              "text-white",
            ].join(" ")}
          >
            {value ?? "—"}
          </motion.div>
        )}
      </div>
      {hint && (
        <div className="mt-1 text-xs text-white/50">{hint}</div>
      )}
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Mono code                                   */
/* -------------------------------------------------------------------------- */

export function Mono({ children }) {
  return (
    <span className="font-mono text-xs text-white/80 break-all">{children}</span>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Brand mark                                   */
/* -------------------------------------------------------------------------- */

// Keyhole-on-gradient mark — matches the favicon (public/identityflow.svg).
export function BrandMark({ className = "h-9 w-9" }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={`${className} shrink-0 drop-shadow-[0_4px_18px_rgba(127,127,255,0.35)]`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="brandmark-g"
          x1="0"
          y1="0"
          x2="64"
          y2="64"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#818cf8" />
          <stop offset="0.5" stopColor="#e879f9" />
          <stop offset="1" stopColor="#fb7185" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#brandmark-g)" />
      <circle cx="32" cy="27" r="8" fill="#0b0f19" />
      <path d="M28 33 h8 l-2.5 13 h-3 z" fill="#0b0f19" />
    </svg>
  );
}
