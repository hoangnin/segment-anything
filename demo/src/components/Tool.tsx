import React, { useContext, useEffect, useRef, useState } from "react";
import * as THREE from 'three'; // Import Three.js library
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'; // Import OrbitControls
import AppContextCanvas from "./hooks/createContextCanvas";
import { ToolProps } from "./helpers/Interfaces";
import * as _ from "underscore";

const Tool: React.FC<ToolProps> = ({ handleMouseMove }: ToolProps) => {
  const {
    image: [image],
    maskCanvas: [maskCanvas, setMaskCanvas],
  } = useContext(AppContextCanvas)!;
  console.log("image", image);
  console.log("maskCanvas", maskCanvas);

  const [shouldFitToWidth, setShouldFitToWidth] = useState<boolean>(true);
  const bodyEl = document.body;

  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  // const imgRef = useRef<HTMLImageElement>(null); // Reference for the img element

  let scene: THREE.Scene | undefined,
    camera: THREE.PerspectiveCamera | undefined,
    renderer: THREE.WebGLRenderer | undefined,
    sphereMesh: THREE.Mesh | undefined,
    texture: THREE.Texture | undefined;
  let manualControl = false;
  let longitude = 0;
  let latitude = 0;
  let savedX = 0,
    savedY = 0,
    savedLongitude = 0,
    savedLatitude = 0;
  let raycaster = new THREE.Raycaster();
  let mouse = new THREE.Vector2();

  useEffect(() => {
    // Three.js initialization
    initThree();
    fitToPage();
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === bodyEl) {
          fitToPage();
        }
      }
    });
    resizeObserver.observe(bodyEl);
    return () => {
      resizeObserver.unobserve(bodyEl);
    };
  }, [image]);

  useEffect(() => {
    if (image && imageCanvasRef.current) {
      const canvas = imageCanvasRef.current;
      const ctx = canvas.getContext("2d");
      canvas.width = image.width;
      canvas.height = image.height;
      if (ctx) {
        ctx.drawImage(image, 0, 0, image.width, image.height);
      }
    }
  }, [image]);

  useEffect(() => {
    if (maskCanvas && maskCanvasRef.current) {
      const canvas = maskCanvasRef.current;
      const ctx = canvas.getContext("2d");
      canvas.width = maskCanvas.width;
      canvas.height = maskCanvas.height;
      if (ctx) {
        ctx.drawImage(maskCanvas, 0, 0, maskCanvas.width, maskCanvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        console
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] > 0) {
            data[i] = 255; // Red
            data[i + 1] = 0; // Green
            data[i + 2] = 0; // Blue
          }
        }

        ctx.putImageData(imageData, 0, 0);

        // const url = canvas.toDataURL();
        // if (imgRef.current) {
        //   imgRef.current.src = url;
        // }
      }
    }
  }, [maskCanvas]);

  const fitToPage = () => {
    if (!image) return;
    const imageAspectRatio = image.width / image.height;
    const screenAspectRatio = window.innerWidth / window.innerHeight;
    setShouldFitToWidth(imageAspectRatio > screenAspectRatio);
  };

  const initThree = () => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(0, 0, 0);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const sphereGeometry = new THREE.SphereGeometry(500, 60, 40);
    sphereGeometry.scale(-0.6, 0.6, 0.6);

    const textureLoader = new THREE.TextureLoader();
    
    texture = textureLoader.load('http://localhost:8080/assets/data/room.jpg', () => {
      const sphereMaterial = new THREE.MeshBasicMaterial({ map: texture });
      sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
      if (scene && sphereMesh) {
        scene.add(sphereMesh);
      }
    });
  

    const controls = new OrbitControls(camera!, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.rotateSpeed = 0.35;

    document.addEventListener("mousedown", onDocumentMouseDown, false);
    document.addEventListener("mousemove", onDocumentMouseMove, false);
    document.addEventListener("mouseup", onDocumentMouseUp, false);
    window.addEventListener("resize", onWindowResize, false);
    document.addEventListener("dblclick", onDocumentClick, false);

    animate();
  };

  const animate = () => {
    requestAnimationFrame(animate);
    // if (!manualControl) {
    //   longitude += 0.1;
    // }
    latitude = Math.max(-85, Math.min(85, latitude));

    if (camera && scene && sphereMesh) {
      const target = new THREE.Vector3(
        500 * Math.sin(THREE.MathUtils.degToRad(90 - latitude)) * Math.cos(THREE.MathUtils.degToRad(longitude)),
        500 * Math.cos(THREE.MathUtils.degToRad(90 - latitude)),
        500 * Math.sin(THREE.MathUtils.degToRad(90 - latitude)) * Math.sin(THREE.MathUtils.degToRad(longitude))
      );
      camera.lookAt(target);
    }

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  };

  const onDocumentMouseDown = (event: MouseEvent) => {
    event.preventDefault();
    manualControl = true;
    savedX = event.clientX;
    savedY = event.clientY;
    savedLongitude = longitude;
    savedLatitude = latitude;
  };

  const onDocumentMouseMove = (event: MouseEvent) => {
    if (manualControl) {
      longitude = (savedX - event.clientX) * 0.1 + savedLongitude;
      latitude = (event.clientY - savedY) * 0.1 + savedLatitude;
    }
  };

  const onDocumentMouseUp = () => {
    manualControl = false;
  };

  const onWindowResize = () => {
    if (camera) {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    }
    if (renderer) {
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
  };

  const onDocumentClick = (event: MouseEvent) => {
    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    if (camera) {
      raycaster.setFromCamera(mouse, camera);
    }

    if (sphereMesh) {
      const intersects = raycaster.intersectObject(sphereMesh);

      if (intersects.length > 0 && intersects[0].uv !== undefined) {
        const uv = intersects[0].uv;

        if (texture) {
          const x = Math.floor(uv.x * texture.image.width);
          const y = Math.floor(uv.y * texture.image.height);

          const canvas = document.createElement('canvas');
          canvas.width = texture.image.width;
          canvas.height = texture.image.height;
          const context = canvas.getContext('2d');

          if (context) {
            context.drawImage(texture.image, 0, 0);

            context.fillStyle = "rgba(255, 0, 0, 0.5)";
            context.fillRect(x - 10, y - 10, 20, 20);

            texture.image.src = canvas.toDataURL();
            texture.needsUpdate = true;
          }
        }
      }
    }
  };

  return (
    <>
      {image && (
        <canvas
          ref={imageCanvasRef}
          onMouseMove={handleMouseMove}
          className={`${shouldFitToWidth ? "w-full" : "h-full"}`}
        ></canvas>
      )}
      {maskCanvas && (
        <>
          <canvas
            ref={maskCanvasRef}
            className={`${shouldFitToWidth ? "w-full" : "h-full"} absolute opacity-40 pointer-events-none`}
          ></canvas>
          {/* <img
            ref={imgRef}
            className={`${shouldFitToWidth ? "w-full" : "h-full"} absolute opacity-40 pointer-events-none`}
          /> */}
        </>
      )}
    </>
  );
};

export default Tool;
