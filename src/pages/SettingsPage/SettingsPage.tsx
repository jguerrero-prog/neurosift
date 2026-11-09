import { useState } from "react";
import { SettingsView, type ApiKeys } from "./SettingsView";

const readKeys = (): ApiKeys => ({
  dandiApiKey: localStorage.getItem("dandiApiKey") || "",
  dandiStagingApiKey: localStorage.getItem("dandiStagingApiKey") || "",
  emberApiKey: localStorage.getItem("emberApiKey") || "",
});

/** Keeps the API keys in this browser's localStorage, saving each as it's typed. */
export default function SettingsPage() {
  const [keys, setKeys] = useState(readKeys);
  const [showReload, setShowReload] = useState(false);
  const onChange = (key: keyof ApiKeys, value: string) => {
    localStorage.setItem(key, value);
    setKeys((current) => ({ ...current, [key]: value }));
    setShowReload(true);
  };
  return (
    <SettingsView
      keys={keys}
      onChange={onChange}
      showReload={showReload}
      onReload={() => window.location.reload()}
    />
  );
}
