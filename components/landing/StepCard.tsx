interface StepCardProps {
  number: string;
  title: string;
  description: string;
}

export function StepCard({ number, title, description }: StepCardProps) {
  return (
    <div className="relative pl-8">
      <div className="absolute left-0 top-0 w-6 h-6 gradient-indigo-purple-fuchsia rounded-full flex items-center justify-center text-white text-sm font-bold">
        {number}
      </div>
      <h4 className="text-lg font-semibold text-white mb-1">{title}</h4>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}
