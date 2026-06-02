type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "success";
};

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: Props) {
  const variants = {
    primary: {
      background: "#c8a078",
      color: "#0a0707",
    },
    secondary: {
      background: "#1a1414",
      color: "#e8d5c0",
    },
    danger: {
      background: "rgba(232,122,122,0.15)",
      color: "#e87a7a",
    },
    success: {
      background: "rgba(122,232,160,0.15)",
      color: "#7ae8a0",
    },
  };

  return (
    <button
      {...props}
      className={`px-4 py-3 rounded-2xl text-sm font-semibold transition hover:scale-105 ${className}`}
      style={{
        ...variants[variant],
        border: "1px solid rgba(200,160,120,0.15)",
      }}
    >
      {children}
    </button>
  );
}