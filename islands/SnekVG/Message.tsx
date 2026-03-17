interface MessageProps {
  text: string;
  subtext?: string;
}

function Message({ text, subtext }: MessageProps) {
  return (
    <div class="absolute bg-slate bg-opacity-60 inset-0 flex items-center justify-center">
      <div class="flex flex-col items-center gap-2 text-center px-4">
        <span class="font-bold text-2xl text-offwhite">{text}</span>
        {subtext && <span class="text-sm text-offwhite opacity-75">{subtext}</span>}
      </div>
    </div>
  )
}

export default Message;
