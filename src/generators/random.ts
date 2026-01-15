export function random(width: number, height: number) {
  return Array
    .from({ length: (width * height) * 0.2 }, () => ({

      x: Math.floor(Math.random() * width),
      y: Math.floor(Math.random() * height)
    })
    );

}
