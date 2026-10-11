"use client";

import React, { ReactNode } from "react";
import { Web3Provider } from "@/context/Web3Context";

export default function Providers({ children }: { children: ReactNode }) {
  return <Web3Provider>{children}</Web3Provider>;
}
