const LoadingSpinner = ({ size = 'md', text = '' }) => {
  const sizes = { sm: 'w-6 h-6', md: 'w-10 h-10', lg: 'w-16 h-16' };
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className={`${sizes[size]} border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin`} />
      {text && <p className="text-surface-500 text-sm font-medium animate-pulse-soft">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
