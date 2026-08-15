/* Short one-shot canvas burst. No npm dependency. */
function burstConfetti(canvas) {
  if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const width = (canvas.width = canvas.clientWidth);
  const height = (canvas.height = canvas.clientHeight);
  const colors = ["#0D7A6F", "#14A394", "#1B2430", "#C5CCD1", "#0A635A"];
  const pieces = [];
  for (let i = 0; i < 70; i += 1) {
    pieces.push({
      x: width * 0.5 + (Math.random() - 0.5) * 36,
      y: height * 0.28,
      vx: (Math.random() - 0.5) * 6.5,
      vy: -2.2 - Math.random() * 5.5,
      w: 3 + Math.random() * 3,
      h: 2 + Math.random() * 2,
      color: colors[(Math.random() * colors.length) | 0],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.28,
    });
  }

  const started = performance.now();
  const duration = 1000;

  function frame(now) {
    const t = (now - started) / duration;
    ctx.clearRect(0, 0, width, height);
    if (t >= 1) {
      return;
    }

    for (const piece of pieces) {
      piece.vy += 0.16;
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.rot += piece.vr;
      ctx.save();
      ctx.globalAlpha = 1 - t;
      ctx.translate(piece.x, piece.y);
      ctx.rotate(piece.rot);
      ctx.fillStyle = piece.color;
      ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
      ctx.restore();
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
