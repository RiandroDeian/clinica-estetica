type Props = React.InputHTMLAttributes<HTMLInputElement>;

export default function Input(props: Props) {
  return (
    <input
      {...props}
      className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
      style={{
        background: "#161111",
        border: "1px solid rgba(200,160,120,0.15)",
        color: "#e8d5c0",
      }}
    />
  );
}