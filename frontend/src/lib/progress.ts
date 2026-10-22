// Literal classes so Tailwind generates them: a bar filled in 5 % steps, no inline style.
const FILL = ['w-0', 'w-[5%]', 'w-[10%]', 'w-[15%]', 'w-[20%]', 'w-[25%]', 'w-[30%]', 'w-[35%]', 'w-[40%]', 'w-[45%]', 'w-[50%]',
  'w-[55%]', 'w-[60%]', 'w-[65%]', 'w-[70%]', 'w-[75%]', 'w-[80%]', 'w-[85%]', 'w-[90%]', 'w-[95%]', 'w-full'];
export const fillClass = (ratio: number) => FILL[Math.round(Math.min(1, Math.max(0, ratio)) * 20)];
