"use client";

import { useEffect, useState } from "react";

export default function Countdown({
  targetDate,
}: {
  targetDate: string;
}) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    function updateCountdown() {
      const target = new Date(targetDate).getTime();
      const now = Date.now();

      const diff = Math.max(0, target - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) /
          (1000 * 60 * 60)
      );

      const minutes = Math.floor(
        (diff % (1000 * 60 * 60)) /
          (1000 * 60)
      );

      const seconds = Math.floor(
        (diff % (1000 * 60)) /
          1000
      );

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
      });
    }

    updateCountdown();

    const interval = setInterval(
      updateCountdown,
      1000
    );

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="grid grid-cols-4 gap-3">
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
        <p className="text-3xl font-black">{timeLeft.days}</p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-danvers-muted">
          Days
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
        <p className="text-3xl font-black">{timeLeft.hours}</p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-danvers-muted">
          Hours
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
        <p className="text-3xl font-black">{timeLeft.minutes}</p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-danvers-muted">
          Minutes
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
        <p className="text-3xl font-black">{timeLeft.seconds}</p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-danvers-muted">
          Seconds
        </p>
      </div>
    </div>
  );
}