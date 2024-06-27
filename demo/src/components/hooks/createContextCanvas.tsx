// Copyright (c) Meta Platforms, Inc. and affiliates.
// All rights reserved.

// This source code is licensed under the license found in the
// LICENSE file in the root directory of this source tree.
import { createContext } from "react";
import { modelInputProps } from "../helpers/Interfaces";

interface contextProps {
  clicks: [
    clicks: modelInputProps[] | null,
    setClicks: (e: modelInputProps[] | null) => void
  ];
  image: [
    image: HTMLImageElement | null,
    setImage: (e: HTMLImageElement | null) => void
  ];
  maskCanvas: [ // Changed from maskImg to maskCanvas
    maskCanvas: HTMLCanvasElement | null, // Changed type to HTMLCanvasElement
    setMaskCanvas: (e: HTMLCanvasElement | null) => void // Changed method name to setMaskCanvas
  ];
}

const AppContextCanvas = createContext<contextProps | null>(null);

export default AppContextCanvas;
