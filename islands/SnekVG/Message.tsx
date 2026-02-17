interface MessageProps {
  text: string;
}

function Message({ text }: MessageProps) {
  return (
    <div class="absolute bg-slate bg-opacity-60 inset-0 flex items-center justify-center">
      <span class="font-bold text-2xl text-offwhite">{text}</span>
    </div>
  )
}

export default Message;