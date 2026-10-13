// Área de texto con etiqueta visible y contador de caracteres
export default function AreaTexto({ id, etiqueta, value, maxLength, ...props }) {
  const cerca = maxLength && value.length > maxLength * 0.9;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-dark-700 dark:text-white/70">{etiqueta}</label>
      <textarea id={id} value={value} maxLength={maxLength} {...props}
        className="w-full rounded-2xl px-4 py-3 text-[15px] leading-relaxed outline-none resize-none transition-all border-[1.5px]
                   bg-[#F6F2F0] border-[#E3DCD8] text-dark-900 placeholder:text-gray-500
                   focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/15
                   dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-white/30 dark:focus:bg-white/10" />
      {maxLength && (
        <span className={`text-xs text-right ${cerca ? 'text-primary-700 font-semibold' : 'text-gray-500 dark:text-white/40'}`}>
          {value.length}/{maxLength}
        </span>
      )}
    </div>
  );
}
