type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function Card({ children, className = "" }: Props) {
  return (
    <div
      className={`rounded-3xl p-6 ${className}`}
      style={{
        background: "#161111",
        border: "1px solid rgba(200,160,120,0.12)",
      }}
    >
      {children}
    </div>
  );
}