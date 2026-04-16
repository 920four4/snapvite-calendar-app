import { Suspense } from "react";
import { isEmailDeliveryConfigured } from "@/config/brand";
import HomeClient from "./HomeClient";

export default function HomePage() {
  return (
    <Suspense>
      <HomeClient emailEnabled={isEmailDeliveryConfigured} />
    </Suspense>
  );
}
