type StatCardProps = {
  title: string;
  value: string;
  subtext: string;
  pillText: string;
  pillVariant?: "black" | "black" | "black";
  valueClassName?: string;
};

export default function StatCard({
  title,
  value,
  subtext,
  pillText,
  pillVariant = "black",
  valueClassName = "",
}: StatCardProps) {
  const pillStyles =
    pillVariant === "black"
      ? "bg-black-100 text-black-700"
      : pillVariant === "black"
      ? "bg-black-100 text-black-700"
      : "bg-black-100 text-black-700";

  return (
    <div className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-black text-sm">{title}</p>
          <h2 className={`text-3xl font-bold mt-2 text-black ${valueClassName}`}>
            {value}
          </h2>
        </div>

        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${pillStyles}`}>
          {pillText}
        </span>
      </div>

     <p className="text-black text-sm mt-4">{subtext}</p>
    </div>
  );
}