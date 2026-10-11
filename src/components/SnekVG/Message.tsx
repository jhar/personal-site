interface MessageProps {
  text: string;
  subtext?: string;
}

function Message({ text, subtext }: MessageProps) {
  return (
    <div className="absolute bg-slate/60 inset-0 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-center px-4">
        <span className="font-bold text-2xl text-offwhite">{text}</span>
        {subtext && <span className="text-sm text-offwhite opacity-75">{subtext}</span>}
      </div>
    </div>
  )
}

export default Message;
