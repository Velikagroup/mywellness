export default function QuizQuestionHeader({ title, subtitle }) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {title}
      </h2>
      <p className="text-gray-500 text-sm">
        {subtitle}
      </p>
    </div>
  );
}