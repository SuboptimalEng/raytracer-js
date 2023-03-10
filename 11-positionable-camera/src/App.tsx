import { useEffect } from "react";
import { Camera } from "./packages/Camera";
import { Dielectric } from "./packages/Dielectric";
import { HittableList } from "./packages/HittableList";
import { Lambertian } from "./packages/Lambertian";
import { Metal } from "./packages/Metal";
import { Ray } from "./packages/Ray";
import { Sphere } from "./packages/Sphere";
import { Vec3, vadd, vscale, clamp, vmul } from "./packages/Vec3";

const rayColorPerPixelFn = (
  pixelColor: Vec3,
  samplesPerPixel: number
): Vec3 => {
  let r = pixelColor.x;
  let g = pixelColor.y;
  let b = pixelColor.z;

  const scale = 1.0 / samplesPerPixel;
  // r *= scale;
  // g *= scale;
  // b *= scale;

  // gamma correction
  r = Math.sqrt(r * scale);
  g = Math.sqrt(g * scale);
  b = Math.sqrt(b * scale);

  return new Vec3(
    clamp(0, 0.99, r) * 255,
    clamp(0, 0.99, g) * 255,
    clamp(0, 0.99, b) * 255
  );
};

const rayColor = (r: Ray, world: HittableList, depth: number): Vec3 => {
  const white = new Vec3(1.0, 1.0, 1.0);
  const skyBlue = new Vec3(0.5, 0.7, 1.0);

  if (depth <= 0) {
    return new Vec3(0.0, 0.0, 0.0);
  }

  if (world.hit(r, 0.001, Infinity)) {
    let scattered: Ray = new Ray(new Vec3(0, 0, 0), new Vec3(0, 0, 0));
    let attenuation: Vec3 = new Vec3(0, 0, 0);
    if (world.hr.material.scatter(r, world.hr, attenuation, scattered)) {
      return vmul(rayColor(scattered, world, depth - 1), attenuation);
    }

    return new Vec3(0.0, 0.0, 0.0);
  }

  const unitDirection = r.unitVector();
  const t = 0.5 * (unitDirection.y + 1.0);
  return vadd(vscale(white, 1.0 - t), vscale(skyBlue, t));
};

function App() {
  // canvas
  const aspectRatio = 16.0 / 9.0;
  const canvasWidth = 400;
  const canvasHeight = Math.floor(canvasWidth / aspectRatio);
  const pixelSize = 1;
  const samplesPerPixel = 25;
  const maxDepth = 10;

  const cam: Camera = new Camera(90, aspectRatio);
  const world: HittableList = new HittableList();

  const radius = Math.cos(Math.PI / 4.0);
  const materialLeft = new Lambertian(new Vec3(0.0, 0.0, 1.0));
  const materialRight = new Lambertian(new Vec3(1.0, 0.0, 0.0));

  world.objects.push(
    new Sphere(new Vec3(-radius, 0, -1), radius, materialLeft)
  );
  world.objects.push(
    new Sphere(new Vec3(radius, 0, -1), radius, materialRight)
  );

  // const materialGround = new Lambertian(new Vec3(0.8, 0.8, 0.0));
  // const materialCenter = new Lambertian(new Vec3(0.1, 0.2, 0.5));
  // const materialLeft = new Dielectric(1.5);
  // const materialRight = new Metal(new Vec3(0.8, 0.6, 0.2), 0.0);
  // world.objects.push(
  //   new Sphere(new Vec3(0, -100.5, -1), 100.0, materialGround)
  // );
  // world.objects.push(new Sphere(new Vec3(0, 0, -1), 0.5, materialCenter));
  // world.objects.push(new Sphere(new Vec3(-1, 0, -1), 0.5, materialLeft));
  // world.objects.push(new Sphere(new Vec3(-1, 0, -1), -0.4, materialLeft));
  // world.objects.push(new Sphere(new Vec3(1, 0, -1), 0.5, materialRight));

  const drawImage = (ctx: CanvasRenderingContext2D) => {
    for (let j = canvasHeight - 1; j > 0; j -= pixelSize) {
      for (let i = 0; i < canvasWidth; i += pixelSize) {
        // antialiasing via the sampling method
        let color = new Vec3(0.0, 0.0, 0.0);
        for (let s = 0; s < samplesPerPixel; s++) {
          const u: number = (i + Math.random() * 0.1) / (canvasWidth - 1);
          const v: number = (j + Math.random() * 0.1) / (canvasHeight - 1);
          const r: Ray = cam.getRay(u, v);
          color = vadd(color, rayColor(r, world, maxDepth));
        }
        color = rayColorPerPixelFn(color, samplesPerPixel);

        ctx.fillStyle = `rgba(${color.x}, ${color.y}, ${color.z}, 1)`;
        // note: paints down as j increases in height, this is done for ease of use
        ctx.fillRect(i, canvasHeight - j, pixelSize, pixelSize);
      }
    }
  };

  useEffect(() => {
    const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

    drawImage(ctx);
  }, []);

  return (
    <div className="App">
      <canvas id="myCanvas" width={canvasWidth} height={canvasHeight}></canvas>
    </div>
  );
}

export default App;
